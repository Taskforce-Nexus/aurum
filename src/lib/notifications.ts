import { createClient } from '@supabase/supabase-js'

type NotificationType =
  | 'documento_generado'
  | 'sesion_completada'
  | 'saldo_bajo'
  | 'miembro_unido'
  | 'pago_procesado'
  | 'factura_disponible'
  | 'consejero_disponible'

export async function createNotification({
  userId,
  projectId,
  type,
  title,
}: {
  userId: string
  projectId?: string
  type: NotificationType
  title: string
}) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  await supabase.from('notifications').insert({
    user_id: userId,
    project_id: projectId || null,
    type,
    title,
    is_read: false,
  })
}
