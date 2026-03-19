import { createClient } from '@supabase/supabase-js'
import { createNotification } from '@/lib/notifications'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Costos aproximados por operación (USD) — margen sobre costo Anthropic
const OPERATION_COSTS: Record<string, number> = {
  compose:              0.15,
  compose_edit:         0.08,
  session_question:     0.10,
  session_resolve:      0.12,
  generate_specialist:  0.05,
  generate_persona:     0.05,
  seed_chat:            0.03,
  brief_generation:     0.08,
  consultation_message: 0.08,
}

export async function trackUsage(
  userId: string,
  projectId: string | null,
  operation: string,
  tokensUsed?: number
): Promise<{ cost: number; remaining: number }> {
  const cost = OPERATION_COSTS[operation] ?? 0.05

  await supabase.from('token_usages').insert({
    user_id: userId,
    project_id: projectId ?? null,
    activity: operation,
    tokens_used: tokensUsed ?? 0,
    cost_usd: cost,
  })

  const { data: balance } = await supabase
    .from('token_balances')
    .select('balance_usd')
    .eq('user_id', userId)
    .single()

  const current = (balance?.balance_usd as number) ?? 0
  const newBalance = Math.max(0, current - cost)

  if (balance) {
    await supabase
      .from('token_balances')
      .update({ balance_usd: newBalance })
      .eq('user_id', userId)
  }

  // Notify when balance drops below $5
  if (newBalance < 5 && current >= 5) {
    try {
      await createNotification({
        userId,
        type: 'saldo_bajo',
        title: 'Tu saldo es menor a $5 — recarga para continuar usando Reason',
      })
    } catch (e) { console.error('[notify] saldo_bajo:', e) }
  }

  return { cost, remaining: newBalance }
}

export async function checkBalance(userId: string): Promise<{ canProceed: boolean; balance: number }> {
  const { data: balance } = await supabase
    .from('token_balances')
    .select('balance_usd')
    .eq('user_id', userId)
    .single()

  const current = (balance?.balance_usd as number) ?? 0
  return { canProceed: current > 0, balance: current }
}
