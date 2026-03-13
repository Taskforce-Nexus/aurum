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
  onSemillaComplete?: (founderBrief: string) => void
}

// Each TTS chunk carries both the decoded audio and its stripped text
type TTSChunk = { buffer: AudioBuffer; text: string }

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

function getSupportedMimeType(): string {
  const candidates = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus']
  for (const type of candidates) {
    if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(type)) return type
  }
  return 'audio/webm'
}

// Interrupt threshold — amplitude check during TTS to detect founder speaking
const INTERRUPT_THRESHOLD = 20

// Sentence streaming: flush buffer when ≥ this length AND ends in boundary
const MIN_SENTENCE_CHARS = 80
const SENTENCE_END_RE = /[.!?\n]$/

// Text reveal interval (ms)
const REVEAL_INTERVAL_MS = 50

// Deepgram WS keepalive interval (ms)
const DG_KEEPALIVE_MS = 8000

export default function VoiceModePanel({ projectId, conversationId, messages, onMessagesUpdate, onExit, onSemillaComplete }: Props) {
  const [voiceState, setVoiceState] = useState<VoiceState>('paused')
  const [transcript, setTranscript] = useState('')
  const [nexoText, setNexoText] = useState('')
  const [permissionDenied, setPermissionDenied] = useState(false)

  const voiceStateRef = useRef<VoiceState>('paused')
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animFrameRef = useRef<number | null>(null)
  const barsRef = useRef<number[]>(Array(24).fill(0.1))
  const messagesRef = useRef(messages)

  // Audio pipeline
  const streamRef = useRef<MediaStream | null>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)

  // Deepgram WebSocket
  const dgSocketRef = useRef<WebSocket | null>(null)
  const keepaliveRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const vadFrameRef = useRef<number | null>(null)

  // TTS queue — stores {buffer, text} pairs
  const currentSourceRef = useRef<AudioBufferSourceNode | null>(null)
  const audioQueueRef = useRef<TTSChunk[]>([])
  const isPlayingQueueRef = useRef(false)
  const pendingTTSCountRef = useRef(0)
  const streamDoneRef = useRef(false)

  // Turn ID — prevents stale TTS from corrupting counters after interrupt
  const currentTurnIdRef = useRef(0)

  // Text reveal state
  const nexoDisplayedRef = useRef('')
  const revealIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  function setVS(state: VoiceState) {
    voiceStateRef.current = state
    setVoiceState(state)
  }

  useEffect(() => { messagesRef.current = messages }, [messages])

  // ─── Canvas animation ─────────────────────────────────────────────────────
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

  // ─── VAD helpers (interrupt detection only) ───────────────────────────────
  function getRMS(analyser: AnalyserNode): number {
    const data = new Uint8Array(analyser.fftSize)
    analyser.getByteTimeDomainData(data)
    let sum = 0
    for (let i = 0; i < data.length; i++) {
      const n = data[i] - 128
      sum += n * n
    }
    return Math.sqrt(sum / data.length)
  }

  // ─── Mic pause/resume — pauses MediaRecorder during TTS (prevents echo) ──
  function muteMic() {
    if (mediaRecorderRef.current?.state === 'recording') {
      try { mediaRecorderRef.current.pause() } catch { /* ignore */ }
    }
  }
  function unmuteMic() {
    if (mediaRecorderRef.current?.state === 'paused') {
      try { mediaRecorderRef.current.resume() } catch { /* ignore */ }
    }
  }

  // ─── Centralized reset — called on interrupt, error, and new turn ──────────
  function resetVoiceState() {
    if (revealIntervalRef.current) {
      clearInterval(revealIntervalRef.current)
      revealIntervalRef.current = null
    }
    try { currentSourceRef.current?.stop() } catch { /* ignore */ }
    currentSourceRef.current = null
    audioQueueRef.current = []
    isPlayingQueueRef.current = false
    currentTurnIdRef.current = Date.now()
    pendingTTSCountRef.current = 0
    streamDoneRef.current = false
    nexoDisplayedRef.current = ''
    unmuteMic()
  }

  // ─── VAD loop (interrupt detection only — speech detection via Deepgram) ──
  function startVADLoop() {
    if (vadFrameRef.current) cancelAnimationFrame(vadFrameRef.current)

    function loop() {
      vadFrameRef.current = requestAnimationFrame(loop)
      const analyser = analyserRef.current
      if (!analyser) return

      if (voiceStateRef.current === 'speaking') {
        const rms = getRMS(analyser)
        if (rms > INTERRUPT_THRESHOLD) {
          resetVoiceState()
          setVS('listening')
        }
      }
    }

    loop()
  }

  // ─── TTS queue ────────────────────────────────────────────────────────────
  function checkQueueDone() {
    if (
      streamDoneRef.current &&
      pendingTTSCountRef.current === 0 &&
      audioQueueRef.current.length === 0 &&
      !isPlayingQueueRef.current
    ) {
      if (voiceStateRef.current === 'speaking') {
        setNexoText(nexoDisplayedRef.current)
        setTimeout(() => {
          unmuteMic()
          if (voiceStateRef.current === 'speaking') setVS('listening')
        }, 100)
      }
    }
  }

  function playNextInQueue() {
    if (revealIntervalRef.current) {
      clearInterval(revealIntervalRef.current)
      revealIntervalRef.current = null
    }

    const audioCtx = audioCtxRef.current
    if (!audioCtx || audioQueueRef.current.length === 0 || voiceStateRef.current !== 'speaking') {
      isPlayingQueueRef.current = false
      checkQueueDone()
      return
    }

    isPlayingQueueRef.current = true
    const chunk = audioQueueRef.current.shift()!
    const source = audioCtx.createBufferSource()
    source.buffer = chunk.buffer
    source.connect(audioCtx.destination)
    currentSourceRef.current = source

    source.onended = () => {
      nexoDisplayedRef.current += chunk.text
      setNexoText(nexoDisplayedRef.current)
      if (revealIntervalRef.current) {
        clearInterval(revealIntervalRef.current)
        revealIntervalRef.current = null
      }
      isPlayingQueueRef.current = false
      if (voiceStateRef.current === 'speaking') {
        playNextInQueue()
      } else {
        checkQueueDone()
      }
    }

    muteMic()
    source.start(0)

    const totalChars = chunk.text.length
    const durationMs = Math.max(chunk.buffer.duration * 1000, 100)
    const audioDrivenCharsPerTick = Math.max(1, Math.ceil(totalChars / (durationMs / REVEAL_INTERVAL_MS)))
    const minTicksCharsPerTick = Math.max(1, Math.ceil(totalChars / 5))
    const charsPerTick = audioDrivenCharsPerTick > minTicksCharsPerTick
      ? minTicksCharsPerTick
      : audioDrivenCharsPerTick
    let revealed = 0

    setTimeout(() => {
      if (voiceStateRef.current !== 'speaking') return
      revealIntervalRef.current = setInterval(() => {
        revealed = Math.min(revealed + charsPerTick, totalChars)
        setNexoText(nexoDisplayedRef.current + chunk.text.slice(0, revealed))
        if (revealed >= totalChars) {
          clearInterval(revealIntervalRef.current!)
          revealIntervalRef.current = null
        }
      }, REVEAL_INTERVAL_MS)
    }, 100)
  }

  async function addToTTSQueue(text: string) {
    const turnId = currentTurnIdRef.current
    if (!text.trim() || voiceStateRef.current !== 'speaking') return
    const audioCtx = audioCtxRef.current
    if (!audioCtx) return

    const stripped = stripMarkdown(text)
    if (!stripped.trim()) return

    pendingTTSCountRef.current++
    try {
      const res = await fetch('/api/voice/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: stripped }),
      })
      if (turnId !== currentTurnIdRef.current) return
      if (!res.ok || voiceStateRef.current !== 'speaking') return

      const arrayBuffer = await res.arrayBuffer()
      if (turnId !== currentTurnIdRef.current || voiceStateRef.current !== 'speaking') return

      const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer)
      if (turnId !== currentTurnIdRef.current || voiceStateRef.current !== 'speaking') return

      audioQueueRef.current.push({ buffer: audioBuffer, text: stripped })
      if (!isPlayingQueueRef.current) playNextInQueue()
    } catch {
      // ignore TTS errors
    } finally {
      if (turnId === currentTurnIdRef.current) {
        pendingTTSCountRef.current--
        checkQueueDone()
      }
    }
  }

  // ─── Chat streaming → TTS pipeline ───────────────────────────────────────
  async function processMessage(text: string) {
    setTranscript('')
    setNexoText('')

    const userMsg: Message = { role: 'user', content: text }
    const newMessages = [...messagesRef.current, userMsg]
    onMessagesUpdate(newMessages)

    currentTurnIdRef.current = Date.now()
    pendingTTSCountRef.current = 0
    audioQueueRef.current = []
    resetVoiceState()

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          conversationId,
          messages: newMessages,
          phase: 'semilla',
          voiceMode: true,
          stream: true,
        }),
      })

      if (!res.ok || !res.body) { setVS('listening'); return }

      const contentType = res.headers.get('content-type') ?? ''

      if (contentType.includes('text/event-stream')) {
        setVS('speaking')
        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        let sentenceBuffer = ''
        let fullText = ''

        // eslint-disable-next-line no-constant-condition
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const lines = decoder.decode(value).split('\n')
          for (const line of lines) {
            if (!line.startsWith('data: ')) continue
            const payload = line.slice(6).trim()
            if (payload === '[DONE]') {
              if (sentenceBuffer.trim()) {
                void addToTTSQueue(sentenceBuffer)
                sentenceBuffer = ''
              }
              streamDoneRef.current = true
              checkQueueDone()
              const assistantMsg: Message = { role: 'assistant', content: fullText, author: 'Nexo' }
              onMessagesUpdate([...newMessages, assistantMsg])
              continue
            }
            try {
              const parsed = JSON.parse(payload) as { token?: string; conversationId?: string; type?: string; founder_brief?: string }
              if (parsed.type === 'semilla_complete' && parsed.founder_brief) {
                onSemillaComplete?.(parsed.founder_brief)
              } else if (parsed.token) {
                fullText += parsed.token
                sentenceBuffer += parsed.token

                if (
                  sentenceBuffer.length >= MIN_SENTENCE_CHARS &&
                  SENTENCE_END_RE.test(sentenceBuffer.trimEnd())
                ) {
                  void addToTTSQueue(sentenceBuffer)
                  sentenceBuffer = ''
                }
              }
            } catch { /* ignore malformed SSE */ }
          }
        }
      } else {
        const data = await res.json()
        if (data.message) {
          const assistantMsg: Message = { role: 'assistant', content: data.message, author: 'Nexo' }
          onMessagesUpdate([...newMessages, assistantMsg])
          setVS('speaking')
          streamDoneRef.current = true
          void addToTTSQueue(data.message)
        } else {
          setVS('listening')
        }
      }
    } catch {
      resetVoiceState()
      setVS('listening')
    }
  }

  // ─── Deepgram WebSocket ───────────────────────────────────────────────────
  function openDGWebSocket(tempKey: string) {
    const url = [
      'wss://api.deepgram.com/v1/listen',
      '?model=nova-3',
      '&language=es-419',
      '&smart_format=true',
      '&punctuate=true',
      '&interim_results=true',
      '&endpointing=500',
      '&utterance_end_ms=1000',
    ].join('')

    const ws = new WebSocket(url, ['token', tempKey])
    dgSocketRef.current = ws

    ws.onopen = () => {
      keepaliveRef.current = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'KeepAlive' }))
        }
      }, DG_KEEPALIVE_MS)
    }

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data as string) as {
          type: string
          channel?: { alternatives?: Array<{ transcript: string }> }
          speech_final?: boolean
        }
        if (data.type === 'Results') {
          const transcript = data.channel?.alternatives?.[0]?.transcript?.trim() ?? ''
          if (data.speech_final && transcript) {
            const state = voiceStateRef.current
            if (state === 'listening' || state === 'processing') {
              setTranscript(transcript)
              void processMessage(transcript)
            }
          }
        }
      } catch { /* ignore parse errors */ }
    }

    ws.onerror = (err) => {
      console.error('[DG WebSocket] error:', err)
    }

    ws.onclose = () => {
      if (keepaliveRef.current) {
        clearInterval(keepaliveRef.current)
        keepaliveRef.current = null
      }
      // Auto-reconnect if session still active
      if (voiceStateRef.current !== 'paused') {
        setTimeout(() => void reconnectDGWebSocket(), 2000)
      }
    }
  }

  async function reconnectDGWebSocket() {
    try {
      const res = await fetch('/api/voice/stt-token')
      if (!res.ok) return
      const { key } = await res.json() as { key: string }
      openDGWebSocket(key)
      // Restart recorder if needed
      const recorder = mediaRecorderRef.current
      if (recorder && recorder.state === 'inactive' && streamRef.current) {
        startContinuousRecorder()
      }
    } catch (err) {
      console.error('[DG WebSocket] reconnect failed:', err)
    }
  }

  // ─── Continuous MediaRecorder — sends 250ms chunks to Deepgram WS ────────
  function startContinuousRecorder() {
    const stream = streamRef.current
    if (!stream) return

    const mimeType = getSupportedMimeType()
    const recorder = new MediaRecorder(stream, { mimeType })

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0 && dgSocketRef.current?.readyState === WebSocket.OPEN) {
        dgSocketRef.current.send(e.data)
      }
    }

    recorder.start(250) // timeslice — fires ondataavailable every 250ms
    mediaRecorderRef.current = recorder
  }

  // ─── Init / cleanup ───────────────────────────────────────────────────────
  async function initAudio() {
    stopAll()
    if (!navigator.mediaDevices?.getUserMedia) {
      setPermissionDenied(true); setVS('paused'); return
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      // AudioContext for VAD interrupt detection and visualization
      const audioCtx = new AudioContext()
      audioCtxRef.current = audioCtx
      if (audioCtx.state === 'suspended') await audioCtx.resume()

      const micSource = audioCtx.createMediaStreamSource(stream)
      const analyser = audioCtx.createAnalyser()
      analyser.fftSize = 1024
      micSource.connect(analyser)
      analyserRef.current = analyser

      // Fetch Deepgram temporary key
      const tokenRes = await fetch('/api/voice/stt-token')
      if (!tokenRes.ok) throw new Error('Failed to get Deepgram token')
      const { key } = await tokenRes.json() as { key: string }

      // Open Deepgram WebSocket and start streaming
      openDGWebSocket(key)
      startContinuousRecorder()

      setPermissionDenied(false)
      setVS('listening')
      startVADLoop()
    } catch (err) {
      console.error('[VoiceMode] init error:', err)
      setPermissionDenied(true); setVS('paused')
    }
  }

  function stopAll() {
    if (vadFrameRef.current) { cancelAnimationFrame(vadFrameRef.current); vadFrameRef.current = null }
    if (keepaliveRef.current) { clearInterval(keepaliveRef.current); keepaliveRef.current = null }
    if (dgSocketRef.current) {
      try {
        if (dgSocketRef.current.readyState === WebSocket.OPEN) {
          dgSocketRef.current.send(JSON.stringify({ type: 'CloseStream' }))
          dgSocketRef.current.close()
        }
      } catch { /* ignore */ }
      dgSocketRef.current = null
    }
    if (mediaRecorderRef.current?.state !== 'inactive') {
      try { mediaRecorderRef.current?.stop() } catch { /* ignore */ }
    }
    resetVoiceState()
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
    audioCtxRef.current?.close().catch(() => null)
    audioCtxRef.current = null
    analyserRef.current = null
  }

  useEffect(() => {
    void initAudio()
    return () => stopAll()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleExit() { stopAll(); onExit() }

  function handleInterrupt() {
    resetVoiceState()
    setVS('listening')
  }

  const stateLabel: Record<VoiceState, string> = {
    listening: 'Escuchando',
    processing: 'Procesando',
    speaking: 'Hablando',
    paused: 'En pausa',
  }

  return (
    <main className="flex-1 flex flex-col overflow-hidden relative bg-[#0F0F11]">
      <div className="absolute top-4 right-4 z-10">
        <button type="button" onClick={handleExit}
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
        <div className="relative flex items-center justify-center w-32 h-32">
          <div className={`absolute -inset-5 rounded-full border-2 ${
            voiceState === 'processing'
              ? 'border-transparent border-t-[#5a5b60] animate-spin'
              : voiceState === 'speaking'
              ? 'border-[#C9A84C]/50 animate-pulse'
              : voiceState === 'paused'
              ? 'border-[#2a2b30]'
              : 'border-[#C9A84C]/30 animate-pulse'
          }`} />
          <div className={`absolute -inset-2 rounded-full border ${
            voiceState === 'speaking'
              ? 'border-[#C9A84C]/70 animate-pulse'
              : voiceState === 'listening'
              ? 'border-[#C9A84C]/40'
              : 'border-[#2a2b30]'
          }`} />
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

        {/* Visual interrupt button */}
        {voiceState === 'speaking' && (
          <button
            type="button"
            onClick={handleInterrupt}
            className="flex items-center gap-2.5 text-xs text-[#6b6d75] hover:text-[#C9A84C] transition-colors"
            aria-label="Interrumpir a Nexo"
          >
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#C9A84C] opacity-50" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-[#C9A84C]/70" />
            </span>
            Interrumpir
          </button>
        )}

        {/* Resume button */}
        {voiceState === 'paused' && (
          <div className="flex flex-col items-center gap-2">
            {permissionDenied && (
              <p className="text-xs text-[#6b6d75]">Activa el micrófono en tu navegador</p>
            )}
            <button type="button" onClick={() => void initAudio()}
              className="bg-[#C9A84C] hover:bg-[#b8963f] text-[#0F0F11] font-semibold px-6 py-2.5 rounded-lg text-sm transition-colors">
              Reanudar escucha
            </button>
          </div>
        )}

        {/* Nexo response — text reveals progressively synchronized with audio */}
        {nexoText && (
          <div className="max-w-2xl text-center text-[#e0e0e5] text-sm leading-7 bg-[#1A1B1E] border border-[#2a2b30] rounded-2xl px-6 py-4 mt-2">
            {nexoText}
            {voiceState === 'speaking' && (
              <span className="inline-block w-0.5 h-4 bg-[#C9A84C] ml-0.5 animate-pulse align-middle" />
            )}
          </div>
        )}
      </div>
    </main>
  )
}
