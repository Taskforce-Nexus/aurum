import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { callClaude } from '@/lib/claude'
import { NEXO_SEED_SYSTEM } from '@/lib/prompts'
import type { Message } from '@/lib/types'

const GITHUB_API = 'https://api.github.com'

const FOUNDER_BRIEF_SYSTEM = `Eres un asistente que extrae información estructurada de conversaciones.
Genera un Resumen del Fundador en español con este formato exacto:

## Resumen del Fundador

**Idea:** [una oración]
**Problema:** [el problema que resuelve]
**Cliente objetivo:** [quién es]
**Experiencia del founder:** [background relevante]
**Recursos disponibles:** [tiempo, equipo, capital]
**Visión a 12 meses:** [qué quiere lograr]
**Restricciones clave:** [limitaciones importantes]

Sé concreto y directo. Sin texto adicional fuera del formato.`

const EXTRACTION_SYSTEM = `Eres un extractor de información de ventures. Analiza la conversación y determina si hay información nueva y significativa sobre el venture del founder que justifique actualizar un documento.

Responde ÚNICAMENTE con JSON válido, sin texto adicional:
{
  "should_update": boolean,
  "document": "founder_brief" | "value_proposition" | null,
  "content": "contenido completo en markdown" | null,
  "commit_message": "mensaje descriptivo del commit" | null
}

Reglas:
- should_update = true solo si hay información nueva y concreta (no mensajes genéricos de saludo o apertura)
- founder_brief: captura problema, experiencia del founder, recursos disponibles, visión, restricciones
- value_proposition: captura cliente objetivo, dolor, solución propuesta — solo si hay info suficiente
- content: documento markdown completo con toda la info extraída de la conversación hasta ahora
- commit_message: descriptivo en inglés, ej: "update: founder background captured", "update: problem definition refined"
- Si no hay info nueva sustancial, responde { "should_update": false, "document": null, "content": null, "commit_message": null }`

const DOC_PATHS: Record<string, string> = {
  founder_brief: 'venture_outputs/founder_brief.md',
  value_proposition: 'venture_outputs/value_proposition.md',
}

async function incrementalGitHubSync(
  projectId: string,
  repo: string,
  messages: Message[],
  nexoResponse: string,
  token: string,
): Promise<void> {
  try {
    // Build conversation context for extraction (last 10 messages + current response)
    const context = [...messages.slice(-10), { role: 'assistant' as const, content: nexoResponse }]
    const contextText = context.map(m => `${m.role === 'user' ? 'Founder' : 'Nexo'}: ${m.content}`).join('\n\n')

    const extractionResponse = await callClaude(
      EXTRACTION_SYSTEM,
      [{ role: 'user', content: contextText }],
      512,
      'claude-haiku-4-5-20251001'
    )

    const extracted = JSON.parse(extractionResponse)
    if (!extracted.should_update || !extracted.document || !extracted.content) return

    const path = DOC_PATHS[extracted.document]
    if (!path) return

    // Override the generic message with the descriptive one from extraction
    const fullPath = `venture_outputs/${projectId}/${path.split('/').pop()}`
    const shaRes = await fetch(`${GITHUB_API}/repos/${repo}/contents/${fullPath}`, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json' },
    })
    const body: Record<string, string> = {
      message: extracted.commit_message ?? `update: ${extracted.document}`,
      content: Buffer.from(extracted.content).toString('base64'),
    }
    if (shaRes.ok) {
      const data = await shaRes.json()
      if (typeof data.sha === 'string') body.sha = data.sha
    }
    await fetch(`${GITHUB_API}/repos/${repo}/contents/${fullPath}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })
  } catch (err) {
    // Non-blocking — log but don't affect chat response
    console.error('[incremental-github-sync]', err)
  }
}

export async function POST(req: NextRequest) {
  try {
    const { projectId, conversationId, messages, voiceMode, stream: streamMode } = await req.json()
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    // Verify project ownership and get github_repo
    const { data: project } = await supabase
      .from('projects')
      .select('id, github_repo')
      .eq('id', projectId)
      .eq('user_id', user.id)
      .single()
    if (!project) return NextResponse.json({ error: 'Proyecto no encontrado' }, { status: 404 })

    const systemPrompt = NEXO_SEED_SYSTEM

    // Build message history for Claude (exclude last empty if initial)
    const claudeMessages: Array<{ role: 'user' | 'assistant'; content: string }> =
      messages.length === 0
        ? [{ role: 'user', content: 'Inicia la sesión semilla.' }]
        : messages.map((m: Message) => ({ role: m.role, content: m.content }))

    // ── Streaming path for voice mode ────────────────────────────────────────
    if (voiceMode && streamMode) {
      const admin = createAdminClient()
      // Resolve conversationId before streaming so we can send it to client
      let activeConvId: string | undefined = conversationId
      if (!activeConvId) {
        const { data: existing } = await admin
          .from('conversations').select('id')
          .eq('project_id', projectId).eq('type', 'semilla').maybeSingle()
        if (existing) {
          activeConvId = existing.id
        } else {
          const { data: newConv } = await admin
            .from('conversations')
            .insert({ project_id: projectId, type: 'semilla', phase: 'semilla', messages })
            .select('id').single()
          if (newConv) activeConvId = newConv.id
        }
      }

      const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
      const encoder = new TextEncoder()
      let fullResponse = ''

      const readable = new ReadableStream({
        async start(controller) {
          try {
            const anthropicStream = anthropic.messages.stream({
              model: 'claude-haiku-4-5-20251001',
              max_tokens: 512,
              system: systemPrompt,
              messages: claudeMessages,
            })
            for await (const chunk of anthropicStream) {
              if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
                const token = chunk.delta.text
                fullResponse += token
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ token })}\n\n`))
              }
            }
          } catch (err) {
            console.error('[chat-stream] LLM error:', err)
          }

          // Check for Semilla completion before sending DONE
          const councilMatchStream = fullResponse.match(/\[CONSEJO:([^\]]+)\]/)
          if (councilMatchStream) {
            try {
              const briefContext = [
                ...messages,
                { role: 'assistant' as const, content: fullResponse },
              ].map(m => `${m.role === 'user' ? 'Fundador' : 'Nexo'}: ${m.content}`).join('\n\n')
              const founderBrief = await callClaude(
                FOUNDER_BRIEF_SYSTEM,
                [{ role: 'user', content: briefContext }],
                512,
                'claude-haiku-4-5-20251001'
              )
              await admin.from('projects').update({ founder_brief: founderBrief }).eq('id', projectId)
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'semilla_complete', founder_brief: founderBrief })}\n\n`))
            } catch (e) {
              console.error('[chat-stream] founder-brief error:', e)
            }
          }

          // Send meta then close
          if (activeConvId) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ conversationId: activeConvId })}\n\n`))
          }
          controller.enqueue(encoder.encode('data: [DONE]\n\n'))
          controller.close()

          // DB save after stream completes (server-side, non-blocking for client)
          try {
            const response = fullResponse.replace(/\[CONSEJO:[^\]]+\]\s*/g, '').trim()
            const updatedMessages: Message[] = [
              ...messages,
              { role: 'assistant' as const, content: response, author: 'Nexo' },
            ]
            if (activeConvId) {
              await admin.from('conversations')
                .update({ messages: updatedMessages, updated_at: new Date().toISOString() })
                .eq('id', activeConvId)
            }
            await admin.from('projects')
              .update({ last_active_at: new Date().toISOString() })
              .eq('id', projectId)
          } catch (e) {
            console.error('[chat-stream] DB save error:', e)
          }
        },
      })

      return new Response(readable, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        },
      })
    }
    // ── End streaming path ────────────────────────────────────────────────────

    const rawResponse = await callClaude(
      systemPrompt,
      claudeMessages,
      voiceMode ? 512 : 2048,
      voiceMode ? 'claude-haiku-4-5-20251001' : undefined
    )

    // Parse [CONSEJO:...] signal from response
    const councilMatch = rawResponse.match(/\[CONSEJO:([^\]]+)\]/)
    const selectedCouncil = councilMatch ? councilMatch[1].split(',').map(s => s.trim()) : null
    const response = rawResponse.replace(/\[CONSEJO:[^\]]+\]\s*/g, '').trim()

    // Save messages to DB
    const updatedMessages: Message[] = [
      ...messages,
      { role: 'assistant' as const, content: response, author: 'Nexo' }
    ]

    // Build conversation update payload
    const convUpdate: Record<string, unknown> = {
      messages: updatedMessages,
      updated_at: new Date().toISOString(),
    }
    if (selectedCouncil) {
      convUpdate.extracted_docs = { council: selectedCouncil }
      convUpdate.phase = 'value_proposition'
    }

    const adminNS = createAdminClient()
    let activeConversationId = conversationId
    if (activeConversationId) {
      await adminNS.from('conversations')
        .update(convUpdate)
        .eq('id', activeConversationId)
    } else {
      // Create conversation if it doesn't exist (fallback for missing conversationId)
      const { data: existing } = await adminNS
        .from('conversations')
        .select('id')
        .eq('project_id', projectId)
        .eq('type', 'semilla')
        .maybeSingle()
      if (existing) {
        activeConversationId = existing.id
        await adminNS.from('conversations')
          .update(convUpdate)
          .eq('id', activeConversationId)
      } else {
        const { data: newConv } = await adminNS.from('conversations').insert({
          project_id: projectId,
          type: 'semilla',
          phase: selectedCouncil ? 'value_proposition' : 'semilla',
          messages: updatedMessages,
          ...(selectedCouncil ? { extracted_docs: { council: selectedCouncil } } : {}),
        }).select('id').single()
        if (newConv) activeConversationId = newConv.id
      }
    }

    // Update project last_active_at
    await adminNS.from('projects')
      .update({ last_active_at: new Date().toISOString() })
      .eq('id', projectId)

    // Generate Resumen del Fundador when Semilla ends
    let founderBrief: string | null = null
    if (selectedCouncil) {
      try {
        const briefContext = updatedMessages
          .map(m => `${m.role === 'user' ? 'Fundador' : 'Nexo'}: ${m.content}`)
          .join('\n\n')
        founderBrief = await callClaude(
          FOUNDER_BRIEF_SYSTEM,
          [{ role: 'user', content: briefContext }],
          512,
          'claude-haiku-4-5-20251001'
        )
        await adminNS.from('projects').update({ founder_brief: founderBrief }).eq('id', projectId)
      } catch (err) {
        console.error('[founder-brief]', err)
      }
    }

    // Incremental GitHub sync — fire and forget, non-blocking
    if (project.github_repo && !voiceMode && messages.length > 0) {
      const { data: integration } = await supabase
        .from('user_integrations')
        .select('access_token')
        .eq('user_id', user.id)
        .eq('provider', 'github')
        .single()
      if (integration?.access_token) {
        void incrementalGitHubSync(projectId, project.github_repo, messages, response, integration.access_token)
      }
    }

    return NextResponse.json({
      message: response,
      conversationId: activeConversationId,
      ...(selectedCouncil ? { council: selectedCouncil, phase: 'value_proposition' } : {}),
      ...(founderBrief ? { semilla_complete: true, founder_brief: founderBrief } : {}),
    })
  } catch (err) {
    console.error('Chat API error:', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
