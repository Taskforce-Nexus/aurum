import { callClaude } from '@/lib/claude'
import { createAdminClient } from '@/lib/supabase/admin'
import { getUserPlan } from '@/lib/plan'

export const ARIA_SYSTEM_PROMPT = `Eres Aria, la asistente de soporte de Reason.

CONTEXTO DE REASON:
Reason es un sistema de razonamiento estratégico con consejo IA. Los usuarios crean proyectos, pasan por una Sesión Semilla con Nexo, arman un consejo de asesores IA, y ejecutan una Sesión de Consejo que produce documentos estratégicos exportables en PDF y PPTX.

PLANES:
- Free: 1 proyecto, 1 sesión/mes, 3 consejeros, modelo Haiku, $1 USD de saldo
- Core ($29/mes): 3 proyectos, 10 sesiones/mes, 7 consejeros, modelo Sonnet, $5 USD
- Pro ($79/mes): 10 proyectos, 50 sesiones/mes, 15 consejeros, Consultoría Activa
- Enterprise ($199/mes): ilimitado, modelo Opus para tareas core

FLUJO DEL PRODUCTO:
1. Registro → Dashboard
2. Crear proyecto → ProjectView
3. Semilla: conversación 1:1 con Nexo para extraer contexto
4. Entregables: Framework Engine compone los documentos a generar
5. Consejo: Nexo selecciona 3-7 advisors IA del marketplace
6. Cofounders: 1 constructivo + 1 crítico asignados
7. Especialistas y Buyer Personas generados por Claude
8. Sesión de Consejo: debate Nexo Dual por cada entregable
9. Export Center: descarga PDF y PPTX

DATOS DEL USUARIO:
Nombre: {user_name}
Email: {user_email}
Plan: {user_plan}
Saldo: $\{user_balance} USD
Proyectos: {project_count}
Última actividad: {last_active}

PROBLEMAS QUE PUEDES RESOLVER:
- Cómo funciona el producto (explicar flujo, pasos, funcionalidades)
- Dudas de planes y pricing (qué incluye cada plan, cómo hacer upgrade)
- Cómo exportar documentos (PDF, PPTX)
- Cómo editar consejeros o sus prompts
- Cómo subir archivos en Semilla
- Cómo personalizar a Nexo
- Cómo funciona el saldo y los tokens
- Cómo cancelar o cambiar suscripción
- Preguntas sobre la Sesión de Consejo (modos, fases, resoluciones)

PROBLEMAS QUE DEBES ESCALAR:
- Errores técnicos (pantalla blanca, error 500, crash)
- Cobros incorrectos o dobles
- Bugs confirmados
- Solicitudes de reembolso
- Eliminación de cuenta con datos específicos
- Problemas de acceso o autenticación persistentes

REGLAS:
- Responde en español, amable pero conciso
- Si puedes resolver con la información que tienes, hazlo directamente
- Si necesitas más contexto, pregunta UNA cosa específica
- Si no puedes resolver después de 2 intentos, di exactamente: "Voy a escalar esto a nuestro equipo. Un humano te contactará pronto."
- Nunca inventes funcionalidades que no existen
- Nunca des información financiera específica más allá de confirmar plan y saldo
- Nunca prometas timelines de resolución específicos
- Tu tono es profesional pero cálido — no robótico, no excesivamente casual`

/** Builds the Aria system prompt with user data substituted */
function buildAriaPrompt(data: {
  user_name: string
  user_email: string
  user_plan: string
  user_balance: string
  project_count: number
  last_active: string
}): string {
  return ARIA_SYSTEM_PROMPT
    .replace('{user_name}', data.user_name)
    .replace('{user_email}', data.user_email)
    .replace('{user_plan}', data.user_plan)
    .replace('{user_balance}', data.user_balance)
    .replace('{project_count}', String(data.project_count))
    .replace('{last_active}', data.last_active)
}

/**
 * Calls Aria for a given ticket and saves the response as a ticket_message.
 * Returns { content, escalated }
 */
export async function callAria(ticketId: string, userId: string): Promise<{ content: string; escalated: boolean }> {
  const admin = createAdminClient()

  // 1. Load ticket messages as conversation history
  const { data: messages } = await admin
    .from('ticket_messages')
    .select('sender_role, content, created_at')
    .eq('ticket_id', ticketId)
    .order('created_at', { ascending: true })

  // 2. Load user data
  const [
    { data: profile },
    { data: balance },
    { count: projectCount },
    { data: lastProject },
  ] = await Promise.all([
    admin.from('profiles').select('full_name, email').eq('id', userId).single(),
    admin.from('token_balances').select('balance_usd').eq('user_id', userId).single(),
    admin.from('projects').select('id', { count: 'exact', head: true }).eq('user_id', userId),
    admin.from('projects').select('last_active_at').eq('user_id', userId).order('last_active_at', { ascending: false }).limit(1).single(),
  ])

  const plan = await getUserPlan(userId)

  const systemPrompt = buildAriaPrompt({
    user_name: profile?.full_name ?? 'Usuario',
    user_email: profile?.email ?? '',
    user_plan: plan,
    user_balance: (balance?.balance_usd ?? 0).toFixed(2),
    project_count: projectCount ?? 0,
    last_active: lastProject?.last_active_at
      ? new Date(lastProject.last_active_at).toLocaleDateString('es')
      : 'Nunca',
  })

  // 3. Build conversation for Claude (only user messages — Aria responds)
  const claudeMessages = (messages ?? []).map(m => ({
    role: m.sender_role === 'user' ? 'user' : 'assistant',
    content: m.content as string,
  }))

  // If the last message is from Aria/admin, Claude would need a user message — guard
  if (claudeMessages.length === 0 || claudeMessages[claudeMessages.length - 1].role === 'assistant') {
    return { content: '', escalated: false }
  }

  // 4. Call Claude Haiku
  const response = await callClaude({
    system: systemPrompt,
    messages: claudeMessages,
    max_tokens: 1024,
    tier: 'fast',
  })

  // 5. Detect escalation
  const escalated = response.toLowerCase().includes('escalar')

  // 6. Save Aria response as ticket_message
  await admin.from('ticket_messages').insert({
    ticket_id: ticketId,
    sender_id: userId, // using user_id for sender tracking (aria messages use ticket owner's id)
    sender_role: 'aria',
    content: response,
  })

  // 7. Update ticket status if escalated
  if (escalated) {
    await admin
      .from('support_tickets')
      .update({ status: 'escalado', aria_resolved: false, updated_at: new Date().toISOString() })
      .eq('id', ticketId)
  } else {
    await admin
      .from('support_tickets')
      .update({ aria_resolved: true, updated_at: new Date().toISOString() })
      .eq('id', ticketId)
  }

  return { content: response, escalated }
}
