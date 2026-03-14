import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://qzzuqvmxxweiygypofcq.supabase.co'
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF6enVxdm14eHdlaXlneXBvZmNxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjM0NjYxMywiZXhwIjoyMDg3OTIyNjEzfQ.Ab7dVRAxHfB-Sae1ZTR-c2ik6CNlcp0-SO3UbW51CeE'

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const TEST_USER_ID = '76a85396-f668-42f7-bc86-a1cd40bf0884'

export async function seedTestData(): Promise<string> {
  // Clean up previous run
  const { data: existing } = await supabase
    .from('projects')
    .select('id')
    .eq('user_id', TEST_USER_ID)
    .eq('name', 'FinTrack')
    .maybeSingle()

  if (existing) {
    await supabase.from('projects').delete().eq('id', existing.id)
  }

  // 1. Crear proyecto
  const { data: project, error: projErr } = await supabase
    .from('projects')
    .insert({
      name: 'FinTrack',
      description: 'App de finanzas personales para millennials en LATAM',
      user_id: TEST_USER_ID,
      owner_id: TEST_USER_ID,
      entry_level: 'raw_idea',
      purpose: 'Validar modelo de negocio y definir estrategia de crecimiento',
      current_phase: 'Semilla',
      seed_completed: true,
      founder_brief: 'FinTrack es una app de finanzas personales dirigida a millennials en LATAM. El founder tiene experiencia en fintech. Visión: ser la app #1 de finanzas para jóvenes en México y Colombia.',
      last_active_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (projErr || !project) throw new Error(`Project seed failed: ${projErr?.message}`)
  const projectId = project.id

  // 2. Crear council
  const { data: council, error: councilErr } = await supabase
    .from('councils')
    .insert({ project_id: projectId, status: 'activo' })
    .select()
    .single()

  if (councilErr || !council) throw new Error(`Council seed failed: ${councilErr?.message}`)

  // 3. Asignar advisors nativos
  const { data: advisors } = await supabase
    .from('advisors')
    .select('id')
    .eq('is_native', true)
    .limit(7)

  const levels = ['lidera', 'lidera', 'apoya', 'apoya', 'observa', 'observa', 'observa']
  if (advisors) {
    for (let i = 0; i < advisors.length; i++) {
      await supabase.from('council_advisors').insert({
        council_id: council.id,
        advisor_id: advisors[i].id,
        level: levels[i] ?? 'observa',
        participation_pct: 0.15,
      })
    }
  }

  // 4. Asignar cofounders nativos
  const { data: cofounders } = await supabase
    .from('cofounders')
    .select('id, role')
    .eq('is_native', true)
    .limit(4)

  if (cofounders) {
    for (const cof of cofounders) {
      await supabase.from('council_cofounders').insert({
        council_id: council.id,
        cofounder_id: cof.id,
        role: cof.role,
      })
    }
  }

  // 5. Crear project_documents con contenido
  const { data: specs } = await supabase
    .from('document_specs')
    .select('id, name')
    .limit(4)

  if (specs) {
    for (const spec of specs) {
      await supabase.from('project_documents').insert({
        project_id: projectId,
        spec_id: spec.id,
        name: spec.name,
        status: 'aprobado',
        content_json: {
          sections: [
            {
              section_name: 'Resumen ejecutivo',
              content: `Sección generada para ${spec.name} durante la Sesión de Consejo de FinTrack.`,
              key_points: ['CAC objetivo $12 USD', 'LTV mínimo $80 USD', 'Retención mes 1 > 60%'],
            },
            {
              section_name: 'Análisis de mercado',
              content: 'Mercado TAM estimado en $2.4B USD para LATAM. SAM enfocado en México y Colombia = $420M.',
              key_points: ['TAM $2.4B LATAM', 'SAM $420M MX+CO', '18M usuarios potenciales'],
            },
          ],
        },
        generated_at: new Date().toISOString(),
        approved_at: new Date().toISOString(),
      })
    }
  }

  // 6. Crear session completada
  await supabase.from('sessions').insert({
    project_id: projectId,
    status: 'completada',
    mode: 'normal',
    current_document_index: 4,
    current_question_index: 0,
    total_documents: 4,
    completed_at: new Date().toISOString(),
  })

  // 7. Crear consultation con historial
  await supabase.from('consultations').insert({
    project_id: projectId,
    title: 'Ajuste de pricing post-validación',
    messages: [
      {
        role: 'user',
        content: '¿Cómo ajusto el pricing si mi CAC subió 30%?',
        timestamp: new Date().toISOString(),
      },
      {
        role: 'advisor',
        advisor_name: 'Estratega de Negocio',
        content: 'Con un CAC 30% mayor tienes dos caminos: subir precio o mejorar retención para compensar con LTV.',
        timestamp: new Date().toISOString(),
      },
    ],
    status: 'activa',
  })

  return projectId
}
