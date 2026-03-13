'use client'

import { useState, useRef, useCallback } from 'react'
import type { Message } from '@/lib/types'

interface VoiceModePanelProps {
  projectId: string
  conversationId?: string
  onExit: () => void
  onNewMessage?: (role: string, content: string) => void
  messages?: Message[]
}

export default function VoiceModePanel({
  projectId,
  conversationId,
  onExit,
  onNewMessage,
  messages = [],
}: VoiceModePanelProps) {
  const [status, setStatus] = useState<'idle' | 'listening' | 'processing' | 'speaking'>('idle')
  const [transcript, setTranscript] = useState('')
  const [nexoResponse, setNexoResponse] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const audioContextRef = useRef<AudioContext | null>(null)
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null)
  const messagesRef = useRef<Message[]>(messages)
  messagesRef.current = messages

  const startListening = useCallback(async () => {
    setErrorMsg('')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm'
      const mediaRecorder = new MediaRecorder(stream, { mimeType })
      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop())
        const audioBlob = new Blob(chunksRef.current, { type: mimeType })
        setStatus('processing')

        try {
          // STT — Deepgram via /api/voice/stt
          const formData = new FormData()
          formData.append('audio', audioBlob, 'recording.webm')
          const sttRes = await fetch('/api/voice/stt', { method: 'POST', body: formData })
          const sttData = await sttRes.json() as { transcript?: string; error?: string }
          const userText = sttData.transcript?.trim() ?? ''

          if (!userText) {
            setStatus('idle')
            return
          }

          setTranscript(userText)
          onNewMessage?.('user', userText)

          // Chat — /api/chat con historial completo + mensaje nuevo
          const updatedMessages: Message[] = [
            ...messagesRef.current,
            { role: 'user', content: userText },
          ]

          const chatRes = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              projectId,
              conversationId,
              messages: updatedMessages,
              voiceMode: true,
            }),
          })
          const chatData = await chatRes.json() as { message?: string; error?: string }
          const nexoText = chatData.message?.trim() ?? ''

          if (!nexoText) {
            setStatus('idle')
            return
          }

          setNexoResponse(nexoText)
          onNewMessage?.('assistant', nexoText)

          // TTS — Cartesia via /api/voice/tts
          setStatus('speaking')
          const ttsRes = await fetch('/api/voice/tts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: nexoText }),
          })

          if (!ttsRes.ok) {
            setStatus('idle')
            return
          }

          const audioBuffer = await ttsRes.arrayBuffer()
          if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
            audioContextRef.current = new AudioContext()
          }
          const ctx = audioContextRef.current
          if (ctx.state === 'suspended') await ctx.resume()

          const decoded = await ctx.decodeAudioData(audioBuffer)
          const source = ctx.createBufferSource()
          source.buffer = decoded
          source.connect(ctx.destination)
          sourceNodeRef.current = source

          source.onended = () => {
            setStatus('idle')
            setTranscript('')
            setNexoResponse('')
          }
          source.start()

        } catch (err) {
          console.error('[VoiceMode] pipeline error:', err)
          setErrorMsg('Error en el pipeline de voz. Intenta de nuevo.')
          setStatus('idle')
        }
      }

      mediaRecorder.start()
      setStatus('listening')

    } catch (err) {
      console.error('[VoiceMode] mic error:', err)
      setErrorMsg('No se pudo acceder al micrófono. Actívalo en el navegador.')
      setStatus('idle')
    }
  }, [projectId, conversationId, onNewMessage])

  const stopListening = useCallback(() => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop()
    }
  }, [])

  const stopSpeaking = useCallback(() => {
    try {
      sourceNodeRef.current?.stop()
    } catch { /* already stopped */ }
    sourceNodeRef.current = null
    setStatus('idle')
    setTranscript('')
    setNexoResponse('')
  }, [])

  const handleMainButton = () => {
    if (status === 'idle') void startListening()
    else if (status === 'listening') stopListening()
    else if (status === 'speaking') stopSpeaking()
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

      {/* Avatar Nexo */}
      <div className={`w-32 h-32 rounded-full border-4 ${
        status === 'speaking' ? 'border-[#007BFF] animate-pulse' : 'border-[#B8860B]'
      } bg-[#0D1535] flex items-center justify-center mb-6 transition-colors`}>
        <span className="text-5xl font-bold text-[#B8860B]">N</span>
      </div>

      {/* Status */}
      <div className="flex items-center gap-2 mb-6">
        <div className={`w-2 h-2 rounded-full transition-colors ${
          status === 'listening' ? 'bg-green-500 animate-pulse' :
          status === 'processing' ? 'bg-[#B8860B] animate-pulse' :
          status === 'speaking' ? 'bg-[#007BFF] animate-pulse' :
          'bg-[#8892A4]'
        }`} />
        <span className="text-sm text-[#8892A4]">
          {status === 'listening' ? 'Escuchando...' :
           status === 'processing' ? 'Procesando...' :
           status === 'speaking' ? 'Nexo habla...' :
           'Listo para escuchar'}
        </span>
      </div>

      {/* Error */}
      {errorMsg && (
        <p className="text-xs text-red-400 mb-4 max-w-xs text-center">{errorMsg}</p>
      )}

      {/* Transcript del usuario */}
      {transcript && (
        <div className="max-w-lg px-5 py-3 bg-[#0D1535] border border-[#1E2A4A] rounded-lg mb-3">
          <p className="text-xs text-[#8892A4] mb-1">Tú:</p>
          <p className="text-sm text-[#F8F8F8]">{transcript}</p>
        </div>
      )}

      {/* Respuesta de Nexo */}
      {nexoResponse && (
        <div className="max-w-lg px-5 py-3 bg-[#0D1535] border border-[#B8860B]/30 rounded-lg mb-6">
          <p className="text-xs text-[#B8860B] mb-1">Nexo:</p>
          <p className="text-sm text-[#F8F8F8]">{nexoResponse}</p>
        </div>
      )}

      {/* Botón principal */}
      <button
        type="button"
        onClick={handleMainButton}
        disabled={status === 'processing'}
        className={`w-16 h-16 rounded-full flex items-center justify-center transition-colors ${
          status === 'listening' ? 'bg-red-600 hover:bg-red-700' :
          status === 'speaking' ? 'bg-[#007BFF] hover:bg-[#0066DD]' :
          status === 'processing' ? 'bg-[#8892A4] cursor-wait' :
          'bg-[#B8860B] hover:bg-[#9A7209]'
        }`}
      >
        {status === 'listening' ? (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
            <rect x="6" y="6" width="12" height="12" rx="2" />
          </svg>
        ) : status === 'speaking' ? (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
            <rect x="4" y="4" width="6" height="16" rx="1" />
            <rect x="14" y="4" width="6" height="16" rx="1" />
          </svg>
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
            <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
            <line x1="12" y1="19" x2="12" y2="23"/>
            <line x1="8" y1="23" x2="16" y2="23"/>
          </svg>
        )}
      </button>

      <p className="text-xs text-[#8892A4] mt-3">
        {status === 'listening' ? 'Toca para detener' :
         status === 'speaking' ? 'Toca para interrumpir' :
         status === 'processing' ? 'Procesando...' :
         'Toca para hablar'}
      </p>
    </main>
  )
}
