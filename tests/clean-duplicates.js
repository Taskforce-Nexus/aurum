const path = require('path')
require('../node_modules/dotenv').config({ path: path.resolve(__dirname, '../.env.local') })
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function cleanDuplicates() {
  const { data: projects } = await supabase.from('projects').select('id, name')

  for (const p of projects || []) {
    const { data: convs } = await supabase
      .from('conversations')
      .select('id, messages, updated_at')
      .eq('project_id', p.id)
      .eq('type', 'semilla')
      .order('updated_at', { ascending: false })

    if (convs && convs.length > 1) {
      // Keep first (most recent by updated_at), delete the rest
      const toDelete = convs.slice(1).map(c => c.id)
      console.log(`Cleaning ${p.name}: keeping ${convs[0].id} (${convs[0].messages?.length ?? 0} msgs), deleting ${toDelete.length} duplicates`)

      for (const id of toDelete) {
        const { error } = await supabase.from('conversations').delete().eq('id', id)
        if (error) console.log(`  ERROR deleting ${id}:`, error.message)
        else console.log(`  Deleted ${id}`)
      }
    } else {
      console.log(`${p.name}: ${convs?.length ?? 0} semilla conversations — no cleanup needed`)
    }
  }

  console.log('\nDone.')
}

cleanDuplicates()
