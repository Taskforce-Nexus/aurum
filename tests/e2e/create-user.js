const { createClient } = require('@supabase/supabase-js')

const SUPABASE_URL = 'https://qzzuqvmxxweiygypofcq.supabase.co'
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF6enVxdm14eHdlaXlneXBvZmNxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjM0NjYxMywiZXhwIjoyMDg3OTIyNjEzfQ.Ab7dVRAxHfB-Sae1ZTR-c2ik6CNlcp0-SO3UbW51CeE'
const TEST_USER_ID = '76a85396-f668-42f7-bc86-a1cd40bf0884'

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

async function createTestUser() {
  // Check if user already exists
  const { data: listData } = await supabase.auth.admin.listUsers()
  const existing = listData?.users?.find(u => u.email === 'e2e@reason.test')

  if (existing) {
    console.log('User already exists:', existing.id)
    const { error: updateErr } = await supabase.auth.admin.updateUserById(existing.id, {
      password: 'E2eReason2026x',
      email_confirm: true,
    })
    if (updateErr) console.error('Update error:', updateErr)
    else console.log('Password reset OK')
    return
  }

  // Create auth user with specific ID
  const { data, error } = await supabase.auth.admin.createUser({
    id: TEST_USER_ID,
    email: 'e2e@reason.test',
    password: 'E2eReason2026x',
    email_confirm: true,
  })

  if (error) {
    console.error('Create error:', error.message)
    return
  }

  const userId = data.user.id
  console.log('User created:', userId)

  // Create profile
  const { error: profileErr } = await supabase.from('profiles').upsert({
    id: userId,
    name: 'E2E Test User',
    email: 'e2e@reason.test',
  })
  if (profileErr) console.error('Profile error:', profileErr.message)

  // Create token balance
  const { error: balanceErr } = await supabase.from('token_balances').upsert({
    user_id: userId,
    balance_usd: 10,
  })
  if (balanceErr) console.error('Balance error:', balanceErr.message)

  console.log('Setup complete — user ready for E2E tests')
}

async function setupSessionTest() {
  const userId = TEST_USER_ID

  // Clean up existing TestCo project
  const { data: existing } = await supabase
    .from('projects')
    .select('id')
    .eq('user_id', userId)
    .eq('name', 'TestCo')
    .maybeSingle()

  if (existing) {
    await supabase.from('projects').delete().eq('id', existing.id)
    console.log('Cleaned up existing TestCo project')
  }

  // 1. Create project in sesion_consejo phase
  const { data: project, error: projErr } = await supabase.from('projects').insert({
    name: 'TestCo',
    description: 'Plataforma de gestión para PyMEs',
    user_id: userId,
    owner_id: userId,
    entry_level: 'raw_idea',
    purpose: 'Validar modelo de negocio y diseñar estrategia de crecimiento',
    current_phase: 'sesion_consejo',
    seed_completed: true,
    founder_brief: 'TestCo es una plataforma SaaS de gestión integral para PyMEs en LATAM. El founder tiene 5 años de experiencia en software empresarial. Equipo de 4 personas. Presupuesto de $30k USD. Mercado objetivo: PyMEs con 10-50 empleados en México y Colombia.',
    last_active_at: new Date().toISOString(),
  }).select().single()

  if (projErr || !project) {
    console.error('Project create error:', projErr?.message)
    return null
  }
  const projectId = project.id
  console.log('TestCo project created:', projectId)

  // 2. Create council
  const { data: council, error: councilErr } = await supabase.from('councils').insert({
    project_id: projectId,
    status: 'activo',
  }).select().single()

  if (councilErr || !council) {
    console.error('Council error:', councilErr?.message)
    return null
  }

  // 3. Assign native advisors
  const { data: advisors } = await supabase.from('advisors')
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
        participation_pct: 0.14,
      })
    }
    console.log(`Assigned ${advisors.length} advisors`)
  }

  // 4. Assign native cofounders
  const { data: cofounders } = await supabase.from('cofounders')
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
    console.log(`Assigned ${cofounders.length} cofounders`)
  }

  // 5. Create documents in pendiente status
  const { data: specs } = await supabase.from('document_specs')
    .select('*')
    .eq('icp', 'founder')

  if (specs) {
    for (const spec of specs) {
      await supabase.from('project_documents').insert({
        project_id: projectId,
        spec_id: spec.id,
        name: spec.name,
        status: 'pendiente',
        content_json: null,
      })
    }
    console.log(`Created ${specs.length} pending documents`)
  }

  console.log('TestCo session test setup complete:', projectId)
  return projectId
}

async function fixFinTrackDocuments() {
  // Ensure FinTrack has approved documents with content_json sections (for Export test)
  const { data: fintrack } = await supabase
    .from('projects')
    .select('id')
    .eq('user_id', TEST_USER_ID)
    .eq('name', 'FinTrack')
    .maybeSingle()

  if (!fintrack) {
    console.log('FinTrack not found — skipping document fix')
    return
  }

  const { data: docs } = await supabase
    .from('project_documents')
    .select('id, name')
    .eq('project_id', fintrack.id)

  if (!docs?.length) {
    console.log('No FinTrack documents found')
    return
  }

  for (const doc of docs) {
    await supabase.from('project_documents').update({
      status: 'aprobado',
      content_json: {
        sections: [
          {
            section_name: 'Resumen ejecutivo',
            content: `Sección de ${doc.name} para FinTrack — app de finanzas para millennials LATAM.`,
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
    }).eq('id', doc.id)
  }
  console.log(`Fixed ${docs.length} FinTrack documents → status: aprobado + content_json`)
}

async function fixFinTrackPhase() {
  // Ensure FinTrack has current_phase: 'completado' so Consultoría Activa is unlocked
  const { data: fintrack } = await supabase
    .from('projects')
    .select('id, current_phase')
    .eq('user_id', TEST_USER_ID)
    .eq('name', 'FinTrack')
    .maybeSingle()

  if (!fintrack) {
    console.log('FinTrack not found — skipping phase fix')
    return
  }

  if (fintrack.current_phase === 'completado') {
    console.log('FinTrack already completado — no fix needed')
    return
  }

  const { error } = await supabase
    .from('projects')
    .update({ current_phase: 'completado' })
    .eq('id', fintrack.id)

  if (error) console.error('Phase fix error:', error.message)
  else console.log('FinTrack phase updated → completado')
}

async function main() {
  await createTestUser()
  await fixFinTrackDocuments()
  await fixFinTrackPhase()
  await setupSessionTest()
}

main()
