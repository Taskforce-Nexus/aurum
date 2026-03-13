'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import type { Message } from '@/lib/types'

type VoiceStatus = 'idle' | 'listening' | 'user_speaking' | 'processing' | 'speaking'

interface VoiceModePanelProps {
  projectId: string
  conversationId?: string
  onExit: () => void
  onNewMessage?: (role: string, content: string) => void
  messages?: Message[]
}

// ── Orbe animado ────────────────────────────────────────────────────────────
function VoiceOrb({ status }: { status: VoiceStatus }) {
  const colors: Record<VoiceStatus, string> = {
    idle:          'border-[#1E2A4A] bg-[#0D1535]',
    listening:     'border-[#B8860B] bg-[#0D1535]',
    user_speaking: 'border-green-500 bg-[#0D1535]',
    processing:    'border-[#B8860B] bg-[#0D1535]',
    speaking:      'border-[#007BFF] bg-[#0D1535]',
  }
  const pulse: Record<VoiceStatus, string> = {
    idle:          '',
    listening:     'animate-pulse',
    user_speaking: 'animate-bounce',
    processing:    'animate-spin',
    speaking:      'animate-pulse',
  }
  return (
    <div className={`w-32 h-32 rounded-full border-4 flex items-center justify-center mb-6 transition-colors duration-300 ${colors[status]} ${pulse[status]}`}>
      <span className={`text-5xl font-bold transition-colors duration-300 ${
        status === 'user_speaking' ? 'text-green-500' :
        status === 'speaking' ? 'text-[#007BFF]' :
        'text-[#B8860B]'
      }`}>N</span>
    </div>
  )
}

// ── Panel principal ─────────────────────────────────────────────────────────
export default function VoiceModePanel({
  projectId,
  conversationId,
  onExit,
  onNewMessage,
  messages = [],
}: VoiceModePanelProps) {
  const [status, setStatus] = useState<VoiceStatus>('idle')
  const [transcript, setTranscript] = useState('')
  const [nexoResponse, setNexoResponse] = useState('')

  const statusRef     = useRef<VoiceStatus>('idle')
  const streamRef     = useRef<MediaStream | null>(null)
  const audioCtxRef   = useRef<AudioContext | null>(null)
  const messagesRef   = useRef<Message[]>(messages)

  useEffect(() => { statusRef.current = status }, [status])
  useEffect(() => { messagesRef.current = messages }, [messages])

  const setStatusSync = (s: VoiceStatus) => {
    statusRef.current = s
    setStatus(s)
  }

  // ── Procesar audio grabado ────────────────────────────────────────────────
  const processAudio = useCallback(async (blob: Blob) => {
    try {
      // STT
      const formData = new FormData()
      formData.append('audio', blob, 'recording.webm')
      const sttRes  = await fetch('/api/voice/stt', { method: 'POST', body: formData })
      const sttData = await sttRes.json() as { transcript?: string }
      const userText = sttData.transcript?.trim() ?? ''

      setTranscript(userText)

      if (!userText) {
        setStatusSync('listening')
        return
      }

      onNewMessage?.('user', userText)

      // Chat
      const updatedMessages: Message[] = [
        ...messagesRef.current,
        { role: 'user', content: userText },
      ]
      const chatRes  = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          conversationId,
          messages: updatedMessages,
          voiceMode: true,
        }),
      })
      const chatData = await chatRes.json() as { message?: string }
      const nexoText = chatData.message?.trim() ?? ''

      if (!nexoText) {
        setStatusSync('listening')
        return
      }

      setNexoResponse(nexoText)
      onNewMessage?.('assistant', nexoText)

      // TTS — mutear mic mientras Nexo habla
      streamRef.current?.getAudioTracks().forEach(t => { t.enabled = false })
      setStatusSync('speaking')

      const ttsRes = await fetch('/api/voice/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: nexoText }),
      })

      if (!ttsRes.ok) {
        // Sin audio pero respuesta visible — volver a escuchar
        streamRef.current?.getAudioTracks().forEach(t => { t.enabled = true })
        setStatusSync('listening')
        return
      }

      const audioBuffer = await ttsRes.arrayBuffer()
      if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
        audioCtxRef.current = new AudioContext()
      }
      const ctx = audioCtxRef.current
      if (ctx.state === 'suspended') await ctx.resume()

      const decoded = await ctx.decodeAudioData(audioBuffer)
      const source  = ctx.createBufferSource()
      source.buffer = decoded
      source.connect(ctx.destination)
      source.onended = () => {
        streamRef.current?.getAudioTracks().forEach(t => { t.enabled = true })
        setStatusSync('listening')
        setTranscript('')
        setNexoResponse('')
      }
      source.start()

    } catch (err) {
      console.error('[VoiceMode] pipeline error:', err)
      streamRef.current?.getAudioTracks().forEach(t => { t.enabled = true })
      setStatusSync('listening')
    }
  }, [projectId, conversationId, onNewMessage])

  // ── VAD loop — arranca al montar ─────────────────────────────────────────
  useEffect(() => {
    const SPEECH_THRESHOLD  = 20
    const SILENCE_THRESHOLD = 12
    const SILENCE_DURATION  = 600

    let cancelled      = false
    let mediaRecorder: MediaRecorder | null = null
    let chunks: Blob[] = []
    let isSpeaking     = false
    let silenceTimer:  ReturnType<typeof setTimeout> | null = null
    let rafId:         number

    async function start() {
      let stream: MediaStream
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      } catch {
        setStatusSync('idle')
        return
      }
      if (cancelled) { stream.getTracks().forEach(t => t.stop()); return }

      streamRef.current = stream

      const audioCtx  = new AudioContext()
      audioCtxRef.current = audioCtx
      const source    = audioCtx.createMediaStreamSource(stream)
      const analyser  = audioCtx.createAnalyser()
      analyser.fftSize = 512
      source.connect(analyser)

      const mimeType  = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus' : 'audio/webm'

      function newRecorder() {
        const mr = new MediaRecorder(stream, { mimeType })
        mr.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data) }
        mr.onstop = async () => {
          if (cancelled) return
          const blob = new Blob(chunks, { type: mimeType })
          chunks = []
          if (blob.size < 500) { setStatusSync('listening'); return }
          setStatusSync('processing')
          await processAudio(blob)
        }
        return mr
      }

      mediaRecorder = newRecorder()

      const dataArray = new Uint8Array(analyser.frequencyBinCount)

      function checkAudio() {
        if (cancelled) return
        rafId = requestAnimationFrame(checkAudio)

        // No detectar voz mientras Nexo habla o procesa
        const s = statusRef.current
        if (s === 'processing' || s === 'speaking') return

        analyser.getByteFrequencyData(dataArray)
        const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length

        if (avg > SPEECH_THRESHOLD && !isSpeaking && s === 'listening') {
          isSpeaking = true
          setStatusSync('user_speaking')
          chunks = []
          mediaRecorder = newRecorder()
          mediaRecorder.start(250)
          if (silenceTimer) { clearTimeout(silenceTimer); silenceTimer = null }
        }

        if (isSpeaking) {
          if (avg < SILENCE_THRESHOLD) {
            if (!silenceTimer) {
              silenceTimer = setTimeout(() => {
                silenceTimer = null
                if (isSpeaking && mediaRecorder?.state === 'recording') {
                  isSpeaking = false
                  mediaRecorder.stop()
                }
              }, SILENCE_DURATION)
            }
          } else {
            if (silenceTimer) { clearTimeout(silenceTimer); silenceTimer = null }
          }
        }
      }

      setStatusSync('listening')
      checkAudio()
    }

    void start()

    return () => {
      cancelled = true
      if (silenceTimer) clearTimeout(silenceTimer)
      cancelAnimationFrame(rafId)
      try { mediaRecorder?.stop() } catch { /* ignore */ }
      streamRef.current?.getTracks().forEach(t => t.stop())
      streamRef.current = null
      audioCtxRef.current?.close().catch(() => null)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <main className="flex-1 flex flex-col items-center justify-center bg-[#0A1128] relative">
      <button
        type="button"
        onClick={onExit}
        className="absolute top-4 right-4 px-3 py-1.5 text-sm text-[#8892A4] border border-[#1E2A4A] rounded-lg hover:bg-[#0D1535] transition-colors"
      >
        Salir del modo voz
      </button>

      <VoiceOrb status={status} />

      <span className="text-sm text-[#8892A4] mb-6">
        {status === 'listening'     ? 'Te escucho...'         :
         status === 'user_speaking' ? 'Escuchando...'         :
         status === 'processing'    ? 'Pensando...'           :
         status === 'speaking'      ? 'Nexo:'                 :
                                      'Conectando micrófono...'}
      </span>

      {transcript && (
        <div className="max-w-lg px-6 py-3 bg-[#0D1535] border border-[#1E2A4A] rounded-lg mb-3">
          <p className="text-sm text-[#F8F8F8] italic">&ldquo;{transcript}&rdquo;</p>
        </div>
      )}

      {nexoResponse && (
        <div className="max-w-lg px-6 py-3 bg-[#0D1535] border border-[#B8860B]/30 rounded-lg">
          <p className="text-sm text-[#F8F8F8]">{nexoResponse}</p>
        </div>
      )}
    </main>
  )
}
