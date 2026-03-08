'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import type { Message } from '@/lib/types'

type VoiceState = 'listening' | 'processing' | 'speaking' | 'paused'

interface Props {
  projectId: string
  conversationId: string | undefined
  messages: Message[]
  onMessagesUpdate: (msgs: Message[]) => void
  onExit: () => void
}

function stripMarkdown(text: string): string {
  return text
    .replace(/#{1,6}\s+/g, '')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/^[-*+]\s+/gm, '')
    .replace(/\d+\.\s+/g, '')
    .replace(/\n{2,}/g, '. ')
    .replace(/\n/g, ' ')
    .trim()
}

export default function VoiceModePanel({ projectId, conversationId, messages, onMessagesUpdate, onExit }: Props) {
  const [voiceState, setVoiceState] = useState<VoiceState>('listening')
  const [transcript, setTranscript] = useState('')
  const [nexoText, setNexoText] = useState('')
  const [supported, setSupported] = useState(true)
  const [permissionDenied, setPermissionDenied] = useState(false)

  const voiceStateRef = useRef<VoiceState>('listening')
  const canvasRef = useRef<HTMLCanvasElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const animFrameRef = useRef<number | null>(null)
  const barsRef = useRef<number[]>(Array(24).fill(0.1))
  const messagesRef = useRef(messages)

  function setVS(state: VoiceState) {
    voiceStateRef.current = state
    setVoiceState(state)
  }

  useEffect(() => { messagesRef.current = messages }, [messages])

  // Canvas animation — reads only from refs, stable reference
  const drawBars = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const W = canvas.width
    const H = canvas.height
    const bars = barsRef.current
    const state = voiceStateRef.current

    ctx.clearRect(0, 0, W, H)
    bars.forEach((val, i) => {
      let target: number
      if (state === 'listening') {
        target = Math.random() * 0.75 + 0.1
      } else if (state === 'speaking') {
        target = Math.abs(Math.sin(Date.now() / 150 + i * 0.4)) * 0.7 + 0.1
      } else {
        target = 0.08
      }
      bars[i] = val + (target - val) * 0.18
    })

    const numBars = bars.length
    const barW = Math.floor(W / numBars) - 2
    const opacity = state === 'processing' ? 0.2 : 0.75
    bars.forEach((val, i) => {
      const h = Math.max(val * H, 2)
      const x = i * (W / numBars) + 1
      const y = (H - h) / 2
      ctx.fillStyle = `rgba(201,168,76,${opacity})`
      ctx.fillRect(x, y, barW, h)
    })
    animFrameRef.current = requestAnimationFrame(drawBars)
  }, [])

  useEffect(() => {
    animFrameRef.current = requestAnimationFrame(drawBars)
    return () => { if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current) }
  }, [drawBars])

  function startListening() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechAPI) { setSupported(false); return }

    if (timeoutRef.current) clearTimeout(timeoutRef.current)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recognition: any = new SpeechAPI()
    recognition.lang = 'es-ES'
    recognition.continuous = true
    recognition.interimResults = true

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      timeoutRef.current = setTimeout(() => { recognition.stop(); setVS('paused') }, 30000)

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const results: any[] = Array.from(event.results)
      const last = results[results.length - 1]
      setTranscript(last[0].transcript)

      if (last.isFinal) {
        const text = last[0].transcript
        recognition.stop()
        setVS('processing')
        processMessage(text)
      }
    }

    recognition.onend = () => {
      if (voiceStateRef.current === 'listening') {
        try { recognition.start() } catch { /* browser may throttle */ }
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onerror = (e: any) => {
      if (e.error !== 'aborted') setVS('paused')
    }

    recognitionRef.current = recognition
    setVS('listening')
    timeoutRef.current = setTimeout(() => { recognition.stop(); setVS('paused') }, 30000)
    try { recognition.start() } catch { setVS('paused') }
  }

  async function processMessage(text: string) {
    setTranscript('')
    const userMsg: Message = { role: 'user', content: text }
    const newMessages = [...messagesRef.current, userMsg]
    onMessagesUpdate(newMessages)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, conversationId, messages: newMessages, phase: 'semilla', voiceMode: true }),
      })
      const data = await res.json()
      if (data.message) {
        const assistantMsg: Message = { role: 'assistant', content: data.message, author: 'Nexo' }
        onMessagesUpdate([...newMessages, assistantMsg])
        setNexoText(data.message)
        speakResponse(data.message)
      } else {
        setVS('listening'); startListening()
      }
    } catch {
      setVS('listening'); startListening()
    }
  }

  function speakResponse(text: string) {
    if (!window.speechSynthesis) { setVS('listening'); startListening(); return }
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(stripMarkdown(text))
    utterance.lang = 'es-ES'
    utterance.rate = 0.92
    utterance.pitch = 1.0
    const voices = window.speechSynthesis.getVoices()
    const esVoice = voices.find(v => v.lang.startsWith('es'))
    if (esVoice) utterance.voice = esVoice
    utterance.onstart = () => setVS('speaking')
    utterance.onend = () => { setVS('listening'); startListening() }
    utterance.onerror = () => { setVS('listening'); startListening() }
    setVS('speaking')
    window.speechSynthesis.speak(utterance)
  }

  async function requestPermissionAndStart() {
    if (!navigator.mediaDevices?.getUserMedia) { startListening(); return }
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true })
      setPermissionDenied(false)
      startListening()
    } catch {
      setPermissionDenied(true)
      setVS('paused')
    }
  }

  useEffect(() => {
    void requestPermissionAndStart()
    return () => {
      recognitionRef.current?.stop()
      window.speechSynthesis?.cancel()
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleExit() {
    recognitionRef.current?.stop()
    window.speechSynthesis?.cancel()
    onExit()
  }

  const stateLabel: Record<VoiceState, string> = {
    listening: 'Escuchando',
    processing: 'Procesando',
    speaking: 'Hablando',
    paused: 'En pausa',
  }

  if (!supported) {
    return (
      <main className="flex-1 flex flex-col items-center justify-center bg-[#0F0F11]">
        <p className="text-[#6b6d75] text-sm">Modo voz disponible en Chrome</p>
        <button onClick={onExit} className="mt-4 text-sm text-[#C9A84C] hover:underline">Volver al chat</button>
      </main>
    )
  }

  return (
    <main className="flex-1 flex flex-col overflow-hidden relative bg-[#0F0F11]">
      <div className="absolute top-4 right-4 z-10">
        <button onClick={handleExit}
          className="text-sm text-[#6b6d75] border border-[#2a2b30] px-3 py-1.5 rounded-lg hover:text-white hover:border-[#3a3b40] transition-colors">
          Salir del modo voz
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center gap-6 px-8">
        {/* User transcript */}
        <p className="text-sm text-[#6b6d75] text-center max-w-lg min-h-5 italic">
          {transcript || '\u00A0'}
        </p>

        {/* Avatar with rings */}
        <div className="relative flex items-center justify-center" style={{ width: 128, height: 128 }}>
          {/* Outer ring */}
          <div className={`absolute rounded-full border-2 ${
            voiceState === 'processing'
              ? 'border-transparent border-t-[#5a5b60] animate-spin'
              : voiceState === 'speaking'
              ? 'border-[#C9A84C]/50 animate-pulse'
              : voiceState === 'paused'
              ? 'border-[#2a2b30]'
              : 'border-[#C9A84C]/30 animate-pulse'
          }`} style={{ inset: -20 }} />
          {/* Inner ring */}
          <div className={`absolute rounded-full border ${
            voiceState === 'speaking'
              ? 'border-[#C9A84C]/70 animate-pulse'
              : voiceState === 'listening'
              ? 'border-[#C9A84C]/40'
              : 'border-[#2a2b30]'
          }`} style={{ inset: -8 }} />
          {/* Avatar */}
          <div className={`w-32 h-32 rounded-full flex items-center justify-center text-4xl font-bold transition-colors ${
            voiceState === 'speaking'
              ? 'bg-[#C9A84C]/30 border-2 border-[#C9A84C]/60 text-[#C9A84C]'
              : 'bg-[#C9A84C]/15 border-2 border-[#C9A84C]/30 text-[#C9A84C]'
          }`}>
            N
          </div>
        </div>

        {/* State label */}
        <div className="flex items-center gap-2 text-sm text-[#6b6d75]">
          <div className={`w-2 h-2 rounded-full ${
            voiceState === 'listening' ? 'bg-green-400 animate-pulse' :
            voiceState === 'processing' ? 'bg-yellow-400 animate-pulse' :
            voiceState === 'speaking' ? 'bg-[#C9A84C] animate-pulse' :
            'bg-[#3a3b40]'
          }`} />
          {stateLabel[voiceState]}
        </div>

        {/* Canvas waveform */}
        <canvas ref={canvasRef} width={240} height={40}
          className={`rounded transition-opacity ${voiceState === 'paused' ? 'opacity-20' : 'opacity-60'}`} />

        {/* Resume button */}
        {voiceState === 'paused' && (
          <div className="flex flex-col items-center gap-2">
            {permissionDenied && (
              <p className="text-xs text-[#6b6d75]">Activa el micrófono en tu navegador</p>
            )}
            <button type="button" onClick={() => void requestPermissionAndStart()}
              className="bg-[#C9A84C] hover:bg-[#b8963f] text-[#0F0F11] font-semibold px-6 py-2.5 rounded-lg text-sm transition-colors">
              Reanudar escucha
            </button>
          </div>
        )}

        {/* Nexo response text */}
        {nexoText && (
          <div className="max-w-2xl text-center text-[#e0e0e5] text-sm leading-7 bg-[#1A1B1E] border border-[#2a2b30] rounded-2xl px-6 py-4 mt-2">
            {nexoText}
          </div>
        )}
      </div>
    </main>
  )
}
