const path = require('path')
require('../node_modules/dotenv').config({ path: path.resolve(__dirname, '../.env.local') })
const { createClient } = require('@supabase/supabase-js')

// Extra: check phase vs type columns
async function checkColumns() {
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
  const { data, error } = await sb.from('conversations').select('id, phase, type, status').limit(4)
  console.log('\n=== PHASE vs TYPE COLUMN CHECK ===')
  console.log('error:', error?.message ?? 'none')
  data?.forEach(c => console.log(JSON.stringify(c)))
}
checkColumns()

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function check() {
  // 1. Listar TODAS las conversations
  const { data: convs, error } = await supabase
    .from('conversations')
    .select('id, project_id, type, status, updated_at')
    .order('updated_at', { ascending: false })
    .limit(10)

  console.log('=== CONVERSATIONS ===')
  console.log('Error:', error)
  console.log('Count:', convs?.length)
  convs?.forEach(c => {
    console.log(`  ID: ${c.id} | project: ${c.project_id} | type: ${c.type} | status: ${c.status} | updated: ${c.updated_at}`)
  })

  // 2. Para cada conversación, mostrar cuántos mensajes tiene
  if (convs) {
    for (const c of convs) {
      const { data: full } = await supabase
        .from('conversations')
        .select('messages')
        .eq('id', c.id)
        .single()

      const msgs = full?.messages || []
      console.log(`  → ${c.id}: ${msgs.length} mensajes`)
      if (msgs.length > 0) {
        console.log(`    Primer msg: ${JSON.stringify(msgs[0]).substring(0, 100)}...`)
        console.log(`    Último msg: ${JSON.stringify(msgs[msgs.length - 1]).substring(0, 100)}...`)
      }
    }
  }

  // 3. Verificar si hay DUPLICADOS por proyecto
  const { data: projects } = await supabase
    .from('projects')
    .select('id, name')

  for (const p of projects || []) {
    const { data: pConvs } = await supabase
      .from('conversations')
      .select('id')
      .eq('project_id', p.id)
      .eq('type', 'semilla')

    if (pConvs && pConvs.length > 1) {
      console.log(`\n⚠️ PROYECTO ${p.name} tiene ${pConvs.length} conversaciones semilla (DUPLICADAS)`)
    }
  }
}

check()
