'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import type { Message } from '@/lib/types'

type VoiceStatus = 'idle' | 'listening' | 'user_speaking' | 'waiting' | 'processing' | 'speaking'

interface VoiceModePanelProps {
  projectId: string
  conversationId?: string
  onExit: () => void
  onNewMessage?: (role: string, content: string) => void
  messages?: Message[]
}

// VAD constants
const SPEECH_THRESHOLD  = 25
const SILENCE_THRESHOLD = 10
const WAITING_DELAY     = 800              // ms → entrar a estado "waiting"
const COMMIT_DELAY      = 2500             // ms total → cortar y procesar
const RING_DURATION     = COMMIT_DELAY - WAITING_DELAY  // 1700ms

const VOICES = [
  { id: '948196a7-fe02-417b-9b6d-c45ee0803565', label: 'Manuel' },
  { id: '3a35daa1-ba81-451c-9b21-59332e9db2f3', label: 'Alejandro' },
  { id: '7c1ecd2d-1c83-4d5d-a25c-b3820a274a2e', label: 'Jeronimo' },
]

const SPEEDS = [
  { value: 0.9,  label: '0.9×' },
  { value: 1.0,  label: '1.0×' },
  { value: 1.15, label: '1.15×' },
  { value: 1.3,  label: '1.3×' },
]

// ── Anillo de progreso SVG ────────────────────────────────────────────────────
function ProgressRing({ active }: { active: boolean }) {
  const r = 58
  const circumference = 2 * Math.PI * r
  return (
    <svg
      className="absolute inset-0 w-full h-full -rotate-90"
      viewBox="0 0 128 128"
      aria-hidden="true"
    >
      <circle
        cx={64} cy={64} r={r}
        fill="none"
        stroke="rgba(184,134,11,0.5)"
        strokeWidth={3}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={active ? 0 : circumference}
        className={active ? 'voice-ring-fill' : 'voice-ring-reset'}
      />
    </svg>
  )
}

// ── Orbe animado ─────────────────────────────────────────────────────────────
function VoiceOrb({ status }: { status: VoiceStatus }) {
  const [ringActive, setRingActive] = useState(false)

  useEffect(() => {
    if (status === 'waiting') {
      const id = setTimeout(() => setRingActive(true), 20)
      return () => clearTimeout(id)
    }
    setRingActive(false)
  }, [status])

  const borderColor: Record<VoiceStatus, string> = {
    idle:          'border-[#1E2A4A]',
    listening:     'border-[#B8860B]',
    user_speaking: 'border-green-500',
    waiting:       'border-[#B8860B]',
    processing:    'border-[#B8860B]',
    speaking:      'border-[#007BFF]',
  }

  const animation: Record<VoiceStatus, string> = {
    idle:          '',
    listening:     'animate-pulse',
    user_speaking: 'animate-bounce',
    waiting:       '[animation:pulse_1.5s_ease-in-out_infinite]',
    processing:    'animate-spin',
    speaking:      'animate-pulse',
  }

  const textColor =
    status === 'user_speaking' ? 'text-green-500' :
    status === 'speaking'      ? 'text-[#007BFF]' :
    'text-[#B8860B]'

  return (
    <div className="relative w-32 h-32 mb-6">
      {status === 'waiting' && <ProgressRing active={ringActive} />}
      <div className={`w-full h-full rounded-full border-4 flex items-center justify-center transition-colors duration-300 bg-[#0D1535] ${borderColor[status]} ${animation[status]}`}>
        <span className={`text-5xl font-bold transition-colors duration-300 ${textColor}`}>N</span>
      </div>
    </div>
  )
}

// ── Panel principal ───────────────────────────────────────────────────────────
export default function VoiceModePanel({
  projectId,
  conversationId,
  onExit,
  onNewMessage,
  messages = [],
}: VoiceModePanelProps) {
  const [status, setStatus]             = useState<VoiceStatus>('idle')
  const [transcript, setTranscript]     = useState('')
  const [nexoResponse, setNexoResponse] = useState('')
  const [showSettings, setShowSettings] = useState(false)
  const [voiceId, setVoiceId]           = useState(VOICES[0].id)
  const [speed, setSpeed]               = useState(1.15)

  const statusRef          = useRef<VoiceStatus>('idle')
  const streamRef          = useRef<MediaStream | null>(null)
  const audioCtxRef        = useRef<AudioContext | null>(null)
  const sourceNodeRef      = useRef<AudioBufferSourceNode | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const commitTimeoutRef   = useRef<ReturnType<typeof setTimeout> | null>(null)
  const messagesRef        = useRef<Message[]>(messages)
  const voiceIdRef         = useRef(voiceId)
  const speedRef           = useRef(speed)

  useEffect(() => { statusRef.current = status }, [status])
  useEffect(() => { messagesRef.current = messages }, [messages])
  useEffect(() => { voiceIdRef.current = voiceId }, [voiceId])
  useEffect(() => { speedRef.current = speed }, [speed])

  const setStatusSync = useCallback((s: VoiceStatus) => {
    statusRef.current = s
    setStatus(s)
  }, [])

  // ── Pipeline de audio: STT → Chat → TTS ──────────────────────────────────
  const processAudio = useCallback(async (blob: Blob) => {
    abortControllerRef.current?.abort()
    const controller = new AbortController()
    abortControllerRef.current = controller

    try {
      // STT
      const formData = new FormData()
      formData.append('audio', blob, 'recording.webm')
      const sttRes  = await fetch('/api/voice/stt', { method: 'POST', body: formData, signal: controller.signal })
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
      const chatRes = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, conversationId, messages: updatedMessages, voiceMode: true }),
        signal: controller.signal,
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
        body: JSON.stringify({ text: nexoText, voiceId: voiceIdRef.current, speed: speedRef.current }),
        signal: controller.signal,
      })

      if (!ttsRes.ok) {
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
      sourceNodeRef.current = source
      source.buffer = decoded
      source.connect(ctx.destination)
      source.onended = () => {
        sourceNodeRef.current = null
        streamRef.current?.getAudioTracks().forEach(t => { t.enabled = true })
        setStatusSync('listening')
        setTranscript('')
        setNexoResponse('')
      }
      source.start()

    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') return
      console.error('[VoiceMode] pipeline error:', err)
      streamRef.current?.getAudioTracks().forEach(t => { t.enabled = true })
      setStatusSync('listening')
    }
  }, [projectId, conversationId, onNewMessage, setStatusSync])

  // ── VAD loop — arranca al montar ─────────────────────────────────────────
  useEffect(() => {
    let cancelled    = false
    let mediaRecorder: MediaRecorder | null = null
    let chunks: Blob[] = []
    let isSpeaking   = false
    let silenceStart: number | null = null
    let rafId:       number

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

      const audioCtx = new AudioContext()
      audioCtxRef.current = audioCtx
      const src      = audioCtx.createMediaStreamSource(stream)
      const analyser = audioCtx.createAnalyser()
      analyser.fftSize = 512
      src.connect(analyser)

      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
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

        analyser.getByteFrequencyData(dataArray)
        const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length
        const s = statusRef.current

        // ── 1. Interrupción: usuario habla mientras Nexo habla ───────────────
        if (avg > SPEECH_THRESHOLD && s === 'speaking') {
          abortControllerRef.current?.abort()
          try { sourceNodeRef.current?.stop() } catch { /* ignore */ }
          sourceNodeRef.current = null
          streamRef.current?.getAudioTracks().forEach(t => { t.enabled = true })
          if (commitTimeoutRef.current) { clearTimeout(commitTimeoutRef.current); commitTimeoutRef.current = null }
          isSpeaking = true
          chunks = []
          silenceStart = null
          mediaRecorder = newRecorder()
          mediaRecorder.start(250)
          setStatusSync('user_speaking')
          return
        }

        // ── 2. Sin detección durante procesamiento ───────────────────────────
        if (s === 'processing') return

        // ── 3. Usuario empieza o reanuda el habla ────────────────────────────
        if (avg > SPEECH_THRESHOLD && (s === 'listening' || s === 'waiting')) {
          if (s === 'waiting' && commitTimeoutRef.current) {
            clearTimeout(commitTimeoutRef.current)
            commitTimeoutRef.current = null
          }
          if (!isSpeaking) {
            isSpeaking = true
            chunks = []
            mediaRecorder = newRecorder()
            mediaRecorder.start(250)
          }
          silenceStart = null
          setStatusSync('user_speaking')
        }

        // ── 4. Detección de silencio mientras habla ──────────────────────────
        if (isSpeaking && s === 'user_speaking') {
          if (avg < SILENCE_THRESHOLD) {
            if (silenceStart === null) silenceStart = Date.now()
            const elapsed = Date.now() - silenceStart
            // Fase 2: entrar a "waiting" después de WAITING_DELAY
            if (elapsed >= WAITING_DELAY && !commitTimeoutRef.current) {
              setStatusSync('waiting')
              commitTimeoutRef.current = setTimeout(() => {
                commitTimeoutRef.current = null
                if (isSpeaking && mediaRecorder?.state === 'recording') {
                  isSpeaking = false
                  silenceStart = null
                  mediaRecorder.stop()
                }
              }, RING_DURATION)
            }
          } else {
            // Usuario sigue hablando — resetear silencio
            silenceStart = null
          }
        }
      }

      setStatusSync('listening')
      checkAudio()
    }

    void start()

    return () => {
      cancelled = true
      if (commitTimeoutRef.current) clearTimeout(commitTimeoutRef.current)
      cancelAnimationFrame(rafId)
      try { mediaRecorder?.stop() } catch { /* ignore */ }
      streamRef.current?.getTracks().forEach(t => t.stop())
      streamRef.current = null
      audioCtxRef.current?.close().catch(() => null)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Render ────────────────────────────────────────────────────────────────
  const statusText: Record<VoiceStatus, string> = {
    idle:          'Conectando micrófono...',
    listening:     'Te escucho...',
    user_speaking: 'Escuchando...',
    waiting:       '...',
    processing:    'Pensando...',
    speaking:      'Nexo:',
  }

  return (
    <main className="flex-1 flex flex-col items-center justify-center bg-[#0A1128] relative">

      {/* Salir */}
      <button
        type="button"
        onClick={onExit}
        className="absolute top-4 right-4 px-3 py-1.5 text-sm text-[#8892A4] border border-[#1E2A4A] rounded-lg hover:bg-[#0D1535] transition-colors"
      >
        Salir del modo voz
      </button>

      {/* Engranaje de configuración */}
      <div className="absolute top-4 left-4">
        <button
          type="button"
          onClick={() => setShowSettings(v => !v)}
          className="p-2 text-[#8892A4] hover:text-white transition-colors"
          title="Configuración de voz"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3"/>
            <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
          </svg>
        </button>

        {showSettings && (
          <div className="absolute top-10 left-0 bg-[#0D1535] border border-[#1E2A4A] rounded-lg p-4 w-52 z-10 space-y-3 shadow-xl">
            <div>
              <p className="text-xs text-[#8892A4] uppercase tracking-wider mb-1.5">Voz</p>
              {VOICES.map(v => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setVoiceId(v.id)}
                  className={`w-full text-left text-xs px-2 py-1.5 rounded transition-colors ${
                    voiceId === v.id
                      ? 'bg-[#B8860B]/20 text-[#B8860B]'
                      : 'text-[#8892A4] hover:text-white'
                  }`}
                >
                  {v.label}
                </button>
              ))}
            </div>
            <div>
              <p className="text-xs text-[#8892A4] uppercase tracking-wider mb-1.5">Velocidad</p>
              <div className="flex gap-1 flex-wrap">
                {SPEEDS.map(sp => (
                  <button
                    key={sp.value}
                    type="button"
                    onClick={() => setSpeed(sp.value)}
                    className={`text-xs px-2 py-1 rounded transition-colors ${
                      speed === sp.value
                        ? 'bg-[#B8860B]/20 text-[#B8860B] border border-[#B8860B]/30'
                        : 'text-[#8892A4] border border-[#1E2A4A] hover:text-white'
                    }`}
                  >
                    {sp.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <VoiceOrb status={status} />

      <span className="text-sm text-[#8892A4] mb-6">{statusText[status]}</span>

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
