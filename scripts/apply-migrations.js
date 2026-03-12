#!/usr/bin/env node
// Apply Reason schema migrations via Supabase Management API
// Requires: SUPABASE_ACCESS_TOKEN env var (personal access token from app.supabase.com/account/tokens)
// Usage: SUPABASE_ACCESS_TOKEN=sbp_xxx node scripts/apply-migrations.js

const fs = require('fs');
const path = require('path');

const PROJECT_REF = 'qzzuqvmxxweiygypofcq';
const ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN;

if (!ACCESS_TOKEN) {
  console.error('ERROR: Set SUPABASE_ACCESS_TOKEN environment variable');
  console.error('Get your token at: https://app.supabase.com/account/tokens');
  process.exit(1);
}

const migrations = [
  '005_reason_schema.sql',
  '006_seed_catalogs.sql',
];

async function runMigration(filename) {
  const sql = fs.readFileSync(
    path.join(__dirname, '..', 'supabase', 'migrations', filename),
    'utf8'
  );

  console.log(`\nApplying ${filename}...`);

  const res = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: sql }),
  });

  const body = await res.text();

  if (!res.ok) {
    console.error(`FAILED (${res.status}):`, body);
    return false;
  }

  console.log(`OK — ${filename}`);
  return true;
}

async function main() {
  for (const migration of migrations) {
    const ok = await runMigration(migration);
    if (!ok) {
      console.error('\nMigration failed. Fix the error and retry.');
      process.exit(1);
    }
  }
  console.log('\nAll migrations applied successfully.');
}

main().catch(err => {
  console.error('Unexpected error:', err.message);
  process.exit(1);
});
