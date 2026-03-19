import { createAdminClient } from '@/lib/supabase/admin'

export async function getUserPlan(userId: string): Promise<string> {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('subscriptions')
    .select('plan, status')
    .eq('user_id', userId)
    .eq('status', 'activa')
    .single()
  return data?.plan || 'free'
}
