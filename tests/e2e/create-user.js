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
    // Update password to ensure it's correct
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

createTestUser()
