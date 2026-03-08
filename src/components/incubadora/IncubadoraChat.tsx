'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import ReactMarkdown from 'react-markdown'
import { createClient } from '@/lib/supabase/client'
import VoiceModePanel from './VoiceModePanel'
import NexoModal from './NexoModal'
import type { Project, Conversation, Message } from '@/lib/types'

interface UploadedFile {
  name: string
  size: string
  content: string
}

interface Props {
  project: Project
  conversation: Conversation | null
  userEmail: string
}

const TOPICS = [
  'Descripción del problema',
  'Perfil del fundador',
  'Recursos disponibles',
]

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function IncubadoraChat({ project, conversation, userEmail }: Props) {
  const [messages, setMessages] = useState<Message[]>(conversation?.messages ?? [])
  const [activeConversationId, setActiveConversationId] = useState<string | undefined>(conversation?.id)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [pendingContext, setPendingContext] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const [voiceUnavailable, setVoiceUnavailable] = useState(false)
  const [voiceErrorMsg, setVoiceErrorMsg] = useState('')
  const [voiceMode, setVoiceMode] = useState(false)
  const [nexoModalOpen, setNexoModalOpen] = useState(false)
  const [extractState, setExtractState] = useState<'idle' | 'running' | 'done'>('idle')
  const [extractProgress, setExtractProgress] = useState(0) // 0–5
  const [extractedRepo, setExtractedRepo] = useState<string | null>(null)
  const [assignedCouncil, setAssignedCouncil] = useState<string[]>(
    (conversation?.extracted_docs as Record<string, string[]> | null)?.council ?? []
  )
  const [currentPhase, setCurrentPhase] = useState(conversation?.phase ?? 'semilla')
  const bottomRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null)
  const keepListeningRef = useRef(false)
  const supabase = createClient()

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (messages.length === 0) sendInitialMessage()
  }, [])

  const userMsgCount = messages.filter(m => m.role === 'user').length
  const coveredTopics = TOPICS.map((_, i) => i < Math.floor(userMsgCount / 2))

  async function runExtract() {
    if (extractState !== 'idle') return
    setExtractState('running')
    setExtractProgress(0)

    // Animate progress while waiting (each wave ~8s estimated)
    const stages = [
      'Propuesta de valor…',
      'Modelo de negocio…',
      'Recorrido del cliente…',
      'Identidad de marca…',
      'Plan de negocio…',
    ]
    let step = 0
    const interval = setInterval(() => {
      step = Math.min(step + 1, stages.length - 1)
      setExtractProgress(step)
    }, 7000)

    try {
      const res = await fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: project.id, conversationId: activeConversationId }),
      })
      const data = await res.json()
      clearInterval(interval)
      setExtractProgress(5)
      setExtractState('done')
      if (data.repo) setExtractedRepo(data.repo)
    } catch {
      clearInterval(interval)
      setExtractState('idle')
    }
  }

  async function sendInitialMessage() {
    setLoading(true)
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: project.id,
          conversationId: activeConversationId,
          messages: [],
          phase: 'semilla',
        }),
      })
      const data = await res.json()
      if (data.message) {
        setMessages([{ role: 'assistant', content: data.message, author: 'Nexo' }])
      }
      if (data.conversationId && !activeConversationId) {
        setActiveConversationId(data.conversationId)
      }
    } catch {}
    setLoading(false)
  }

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim() || loading) return

    const userMessage: Message = { role: 'user', content: input.trim() }
    const newMessages = [...messages, userMessage]
    setMessages(newMessages)
    setInput('')
    setLoading(true)

    const apiMessages = pendingContext
      ? newMessages.map((m, i) =>
          i === newMessages.length - 1 && m.role === 'user'
            ? { ...m, content: `[Contexto de archivo cargado]\n${pendingContext}\n\n[Mensaje del fundador]\n${m.content}` }
            : m
        )
      : newMessages

    if (pendingContext) setPendingContext('')

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: project.id,
          conversationId: activeConversationId,
          messages: apiMessages,
          phase: 'semilla',
        }),
      })
      const data = await res.json()
      if (data.message) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.message, author: 'Nexo' }])
      }
      if (data.conversationId && !activeConversationId) {
        setActiveConversationId(data.conversationId)
      }
      if (data.council) {
        setAssignedCouncil(data.council)
      }
      if (data.phase) {
        setCurrentPhase(data.phase)
      }
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Error al conectar con Nexo. Intenta de nuevo.', author: 'Nexo' }])
    }
    setLoading(false)
  }

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    let content = ''
    if (file.name.endsWith('.md') || file.name.endsWith('.txt')) {
      content = await file.text()
    } else if (file.name.endsWith('.pdf')) {
      content = `[PDF cargado: ${file.name} — texto no extraíble en browser]`
    }

    const path = `${project.id}/${file.name}`
    const { error } = await supabase.storage.from('project-files').upload(path, file, { upsert: true })
    if (error) console.error('[upload]', error.message)

    setUploadedFiles(prev => [...prev, { name: file.name, size: formatBytes(file.size), content }])
    if (content) setPendingContext(prev => prev ? `${prev}\n\n${content}` : content)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function toggleVoice() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognitionAPI) {
      setVoiceUnavailable(true)
      setTimeout(() => setVoiceUnavailable(false), 3000)
      return
    }
    if (isRecording) {
      keepListeningRef.current = false
      recognitionRef.current?.stop()
      setIsRecording(false)
      return
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      setVoiceErrorMsg('Voz requiere Chrome en localhost o HTTPS')
      setVoiceUnavailable(true)
      setTimeout(() => setVoiceUnavailable(false), 5000)
      return
    }
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true })
    } catch {
      setVoiceErrorMsg('Activa el micrófono: Chrome → candado URL → Micrófono → Permitir')
      setVoiceUnavailable(true)
      setTimeout(() => setVoiceUnavailable(false), 5000)
      return
    }
    const recognition = new SpeechRecognitionAPI()
    recognition.lang = 'es-ES'
    recognition.continuous = true
    recognition.interimResults = true
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = async (event: any) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const results: any[] = Array.from(event.results)
      const last = results[results.length - 1]
      const raw = last[0].transcript as string
      setInput(raw)
      if (last.isFinal) {
        keepListeningRef.current = false
        recognition.stop()
        try {
          const res = await fetch('/api/voice/correct', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: raw }),
          })
          const data = await res.json()
          if (data.corrected) setInput(data.corrected)
        } catch { /* keep raw */ }
      }
    }
    recognition.onend = () => {
      if (keepListeningRef.current) {
        // Chrome auto-stopped on silence — restart
        try { recognition.start() } catch { keepListeningRef.current = false; setIsRecording(false) }
      } else {
        setIsRecording(false)
      }
    }
    recognition.onerror = () => { keepListeningRef.current = false; setIsRecording(false) }
    recognitionRef.current = recognition
    keepListeningRef.current = true
    recognition.start()
    setIsRecording(true)
  }

  return (
    <div className="min-h-screen bg-[#0F0F11] flex flex-col">
      {/* Header */}
      <header className="border-b border-[#2a2b30] px-6 py-3 flex items-center justify-between shrink-0">
        <Link href={`/project/${project.id}`} className="text-base font-bold tracking-widest text-[#C9A84C] hover:opacity-80 transition-opacity">
          AURUM
        </Link>
        <div className="flex items-center gap-3 text-sm text-[#6b6d75]">
          <span>{project.name} — {currentPhase === 'value_proposition' ? 'Propuesta de Valor' : 'Fase Semilla'}</span>
          <span className="text-[#2a2b30]">|</span>
          <span>Fase {currentPhase === 'value_proposition' ? 2 : 1} de 13</span>
          <span className="flex items-center gap-1.5 text-xs bg-green-500/20 text-green-400 border border-green-500/30 px-2.5 py-0.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 shrink-0" />
            En curso
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => currentPhase === 'semilla' ? setNexoModalOpen(true) : setVoiceMode(true)}
            className="flex items-center gap-1.5 text-sm border border-[#2a2b30] text-[#6b6d75] hover:text-white hover:border-[#3a3b40] px-3 py-1.5 rounded-lg transition-colors"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"/>
              <path d="M19 10v2a7 7 0 01-14 0v-2M12 19v4M8 23h8"/>
            </svg>
            {currentPhase === 'semilla' ? 'Hablar con Nexo' : 'Modo voz'}
          </button>
          <Link href={`/project/${project.id}`}
            className="text-sm text-[#6b6d75] border border-[#2a2b30] px-3 py-1.5 rounded-lg hover:text-white hover:border-[#3a3b40] transition-colors">
            Salir
          </Link>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar */}
        <aside className="w-72 border-r border-[#2a2b30] p-5 flex flex-col gap-5 overflow-y-auto shrink-0">
          <div>
            <h2 className="font-semibold text-sm mb-0.5">Sesión Semilla</h2>
            <p className="text-xs text-[#6b6d75]">1:1 con Nexo Constructivo</p>
          </div>

          <div>
            <p className="text-xs text-[#C9A84C] uppercase tracking-wider font-medium mb-2">Objetivo de Hoy</p>
            <p className="text-xs text-[#9a9ba5] leading-relaxed">
              Entender tu idea al 100%: experiencia, recursos y visión. Al final generamos tu Resumen del Fundador.
            </p>
          </div>

          {/* Proyecto activo */}
          <div className="bg-[#1A1B1E] border border-[#2a2b30] rounded-lg p-3">
            <p className="text-xs text-[#6b6d75] uppercase tracking-wider mb-1">Proyecto Activo</p>
            <p className="font-semibold text-sm">{project.name}</p>
            <span className="inline-flex items-center gap-1.5 text-xs text-[#6b6d75] bg-[#2a2b30] px-2 py-0.5 rounded-full mt-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-400 shrink-0" />
              {project.entry_level === 'raw_idea' ? 'Idea cruda' : project.entry_level}
            </span>
          </div>

          {/* Artefactos cargados */}
          <div>
            <p className="text-xs text-[#6b6d75] uppercase tracking-wider mb-2">Artefactos Cargados</p>
            {uploadedFiles.length > 0 && (
              <div className="space-y-1.5 mb-2">
                {uploadedFiles.map((f, i) => (
                  <div key={i} className="bg-[#1A1B1E] border border-[#2a2b30] rounded-lg px-3 py-2">
                    <p className="text-xs text-white font-medium truncate">{f.name}</p>
                    <div className="flex items-center justify-between mt-0.5">
                      <span className="text-xs text-[#6b6d75]">{f.size}</span>
                      <span className="text-xs text-green-400">Cargado</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <input ref={fileInputRef} type="file" accept=".md,.txt,.pdf" className="hidden" onChange={handleFileSelect} aria-label="Cargar archivo" title="Cargar archivo" />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full text-xs text-[#6b6d75] border border-dashed border-[#2a2b30] rounded-lg px-3 py-2 hover:border-[#C9A84C]/50 hover:text-[#C9A84C] transition-colors"
            >
              + Cargar archivo
            </button>
          </div>

          {/* Progreso de extracción */}
          <div>
            <p className="text-xs text-[#6b6d75] uppercase tracking-wider mb-2">Progreso de Extracción</p>
            <div className="space-y-2">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-[#9a9ba5]">Contexto del fundador</span>
                  <span className="text-[#C9A84C]">{Math.min(userMsgCount * 10, 100)}%</span>
                </div>
                <progress value={Math.min(userMsgCount * 10, 100)} max={100}
                  className="w-full h-1 appearance-none [&::-webkit-progress-bar]:bg-[#2a2b30] [&::-webkit-progress-bar]:rounded-full [&::-webkit-progress-value]:bg-[#C9A84C] [&::-webkit-progress-value]:rounded-full [&::-moz-progress-bar]:bg-[#C9A84C] [&::-moz-progress-bar]:rounded-full" />
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-[#9a9ba5]">Idea de producto</span>
                  <span className="text-[#6b6d75]">{Math.min(userMsgCount * 5, 100)}%</span>
                </div>
                <progress value={Math.min(userMsgCount * 5, 100)} max={100}
                  className="w-full h-1 appearance-none [&::-webkit-progress-bar]:bg-[#2a2b30] [&::-webkit-progress-bar]:rounded-full [&::-webkit-progress-value]:bg-[#C9A84C]/50 [&::-webkit-progress-value]:rounded-full [&::-moz-progress-bar]:bg-[#C9A84C]/50 [&::-moz-progress-bar]:rounded-full" />
              </div>
            </div>
          </div>

          {/* Temas */}
          <div>
            <p className="text-xs text-[#6b6d75] uppercase tracking-wider mb-2">Temas</p>
            <div className="space-y-2">
              {TOPICS.map((topic, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full shrink-0 ${
                    coveredTopics[i] ? 'bg-[#C9A84C]' : 'border border-[#3a3b40]'
                  }`} />
                  <span className={`text-xs ${coveredTopics[i] ? 'text-[#9a9ba5]' : 'text-[#6b6d75]'}`}>
                    {topic}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Consejo asignado */}
          {assignedCouncil.length > 0 && (
            <div>
              <p className="text-xs text-[#C9A84C] uppercase tracking-wider font-medium mb-2">Consejo Asignado</p>
              <div className="space-y-1.5">
                {assignedCouncil.map(role => {
                  const COUNCIL_LABELS: Record<string, string> = {
                    mercado: '📊 Investigación de Mercado',
                    ux: '🎨 Experto UX',
                    negocio: '📋 Analista de Negocio',
                    tecnico: '🔧 Líder Técnico',
                    estrategia: '🎯 Estratega de Negocio',
                    precios: '💰 Líder de Precios',
                    cliente: '👤 Voz del Cliente',
                    constructivo: '🛠️ Nexo Constructivo',
                    critico: '⚠️ Nexo Crítico',
                  }
                  return (
                    <div key={role} className="flex items-center gap-2 bg-[#1A1B1E] border border-[#2a2b30] rounded-lg px-3 py-2">
                      <span className="text-xs text-[#9a9ba5]">{COUNCIL_LABELS[role] ?? role}</span>
                    </div>
                  )
                })}
                <p className="text-xs text-[#3a3b40] mt-1">Listo para la siguiente fase</p>
              </div>
            </div>
          )}

          {/* Generar documentos AURUM */}
          {userMsgCount >= 5 && (
            <div>
              <p className="text-xs text-[#6b6d75] uppercase tracking-wider mb-2">Documentos AURUM</p>
              {extractState === 'idle' && (
                <button
                  type="button"
                  onClick={runExtract}
                  className="w-full bg-[#C9A84C] hover:bg-[#b8963f] text-[#0F0F11] font-semibold text-xs px-3 py-2.5 rounded-lg transition-colors"
                >
                  Generar documentos AURUM
                </button>
              )}
              {extractState === 'running' && (
                <div className="space-y-2">
                  {['Propuesta de valor', 'Modelo de negocio', 'Recorrido del cliente', 'Identidad de marca', 'Plan de negocio'].map((label, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full shrink-0 ${
                        i < extractProgress ? 'bg-[#C9A84C]' :
                        i === extractProgress ? 'bg-[#C9A84C] animate-pulse' :
                        'border border-[#3a3b40]'
                      }`} />
                      <span className={`text-xs ${i <= extractProgress ? 'text-[#9a9ba5]' : 'text-[#3a3b40]'}`}>
                        {label}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              {extractState === 'done' && (
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5 mb-2">
                    <span className="text-[#C9A84C] text-xs">✓</span>
                    <p className="text-xs text-[#C9A84C] font-medium">Documentos generados</p>
                  </div>
                  {extractedRepo && (
                    <a href={`https://github.com/${extractedRepo}`} target="_blank" rel="noopener noreferrer"
                      className="text-xs text-[#6b6d75] hover:text-[#C9A84C] transition-colors block truncate">
                      Ver en GitHub →
                    </a>
                  )}
                </div>
              )}
            </div>
          )}
        </aside>

        {/* Nexo modal — face-to-face session (phase: semilla only) */}
        {nexoModalOpen && (
          <NexoModal
            projectId={project.id}
            onClose={(transcriptMsgs) => {
              setNexoModalOpen(false)
              if (transcriptMsgs.length > 0) {
                setMessages(prev => [...prev, ...transcriptMsgs])
              }
            }}
          />
        )}

        {/* Voice mode */}
        {voiceMode && (
          <VoiceModePanel
            projectId={project.id}
            conversationId={activeConversationId}
            messages={messages}
            onMessagesUpdate={setMessages}
            onExit={() => setVoiceMode(false)}
          />
        )}

        {/* Chat area */}
        <main className={`flex-1 flex flex-col overflow-hidden ${voiceMode ? 'hidden' : ''}`}>
          <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6">
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-full bg-[#C9A84C]/20 border border-[#C9A84C]/30 flex items-center justify-center text-[#C9A84C] text-xs font-bold shrink-0 mt-1">
                    N
                  </div>
                )}
                <div className={`max-w-2xl rounded-2xl px-5 py-4 text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-[#1e3a5f] text-white rounded-tr-sm'
                    : 'bg-[#1A1B1E] border border-[#2a2b30] text-[#e0e0e5] rounded-tl-sm'
                }`}>
                  {msg.role === 'assistant' ? (
                    <ReactMarkdown components={{
                      h1: ({ children }) => <h1 className="text-[#C9A84C] font-bold text-lg mb-3 mt-1">{children}</h1>,
                      h2: ({ children }) => <h2 className="text-[#C9A84C] font-bold text-base mb-2 mt-1">{children}</h2>,
                      h3: ({ children }) => <h3 className="text-[#C9A84C] font-semibold mb-2 mt-1">{children}</h3>,
                      strong: ({ children }) => <strong className="text-white font-semibold">{children}</strong>,
                      p: ({ children }) => <p className="text-[#e0e0e5] leading-7 mb-3 last:mb-0">{children}</p>,
                      ul: ({ children }) => <div className="space-y-1.5 mb-3 pl-1">{children}</div>,
                      ol: ({ children }) => <div className="space-y-1.5 mb-3 pl-1">{children}</div>,
                      li: ({ children }) => <div className="text-[#e0e0e5] pl-3 relative before:content-['•'] before:absolute before:left-0 before:text-[#C9A84C]">{children}</div>,
                    }}>
                      {msg.content}
                    </ReactMarkdown>
                  ) : msg.content}
                </div>
                {msg.role === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-[#3a3b40] flex items-center justify-center text-xs font-bold shrink-0 mt-1">
                    {userEmail[0]?.toUpperCase()}
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-[#C9A84C]/20 border border-[#C9A84C]/30 flex items-center justify-center text-[#C9A84C] text-xs font-bold shrink-0">N</div>
                <div className="bg-[#1A1B1E] border border-[#2a2b30] rounded-2xl rounded-tl-sm px-5 py-4">
                  <div className="flex gap-1.5 items-center h-4">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#C9A84C] animate-bounce [animation-delay:0ms]" />
                    <div className="w-1.5 h-1.5 rounded-full bg-[#C9A84C] animate-bounce [animation-delay:150ms]" />
                    <div className="w-1.5 h-1.5 rounded-full bg-[#C9A84C] animate-bounce [animation-delay:300ms]" />
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input bar */}
          <div className="border-t border-[#2a2b30] px-8 py-4 shrink-0">
            {(pendingContext || voiceUnavailable) && (
              <div className="flex items-center gap-3 mb-2 px-1">
                {pendingContext && (
                  <>
                    <span className="text-xs text-[#C9A84C]">Contexto de archivo listo para enviar</span>
                    <button type="button" onClick={() => setPendingContext('')} className="text-xs text-[#6b6d75] hover:text-white transition-colors">✕</button>
                  </>
                )}
                {voiceUnavailable && (
                  <span className="text-xs text-[#6b6d75]">{voiceErrorMsg || 'Voz disponible en Chrome'}</span>
                )}
              </div>
            )}
            <form onSubmit={sendMessage} className="flex gap-3 items-end">
              <div className="flex-1 bg-[#1A1B1E] border border-[#2a2b30] rounded-xl px-4 py-3 flex items-center gap-3 focus-within:border-[#C9A84C]/50 transition-colors">
                <input
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder="Escribe tu respuesta o usa el micrófono..."
                  className="flex-1 bg-transparent text-sm text-white placeholder-[#3a3b40] focus:outline-none"
                  disabled={loading}
                />
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => fileInputRef.current?.click()} title="Adjuntar archivo"
                    className="text-[#3a3b40] hover:text-[#6b6d75] transition-colors p-1">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/>
                    </svg>
                  </button>
                  <button type="button" onClick={toggleVoice} title={isRecording ? 'Detener grabación' : 'Grabar voz'}
                    className={`transition-colors p-1 ${isRecording ? 'text-[#C9A84C]' : 'text-[#3a3b40] hover:text-[#6b6d75]'}`}>
                    {isRecording
                      ? <span className="w-3 h-3 rounded-full bg-[#C9A84C] animate-pulse inline-block" />
                      : (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"/>
                          <path d="M19 10v2a7 7 0 01-14 0v-2M12 19v4M8 23h8"/>
                        </svg>
                      )
                    }
                  </button>
                </div>
              </div>
              <button type="submit" title="Enviar mensaje" disabled={loading || !input.trim()}
                className="bg-[#C9A84C] hover:bg-[#b8963f] text-white p-3 rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/>
                </svg>
              </button>
            </form>
          </div>
        </main>
      </div>
    </div>
  )
}
