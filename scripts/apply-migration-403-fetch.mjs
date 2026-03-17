/**
 * Apply migration 403 via Supabase SQL API endpoints
 * Tries multiple undocumented/semi-documented endpoints
 */

import { readFileSync } from 'fs'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing env vars')
  process.exit(1)
}

const projectRef = supabaseUrl.replace('https://', '').replace('.supabase.co', '')
const sql = readFileSync('supabase/migrations/403_statute_of_limitations_census.sql', 'utf8')

console.log(`Trying to apply migration 403...`)

// Approach 1: Try the /pg/ endpoint (available on some Supabase versions)
const endpoints = [
  { name: 'pg/query', url: `${supabaseUrl}/pg/query`, body: { query: sql } },
  { name: 'rest/v1/rpc/exec', url: `${supabaseUrl}/rest/v1/rpc/exec`, body: { sql } },
  { name: 'database/query (mgmt)', url: `https://api.supabase.com/v1/projects/${projectRef}/database/query`, body: { query: sql } },
]

for (const ep of endpoints) {
  console.log(`\nTrying: ${ep.name}...`)
  try {
    const resp = await fetch(ep.url, {
      method: 'POST',
      headers: {
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(ep.body)
    })
    const text = await resp.text()
    console.log(`  Status: ${resp.status}`)
    console.log(`  Response: ${text.substring(0, 200)}`)
    if (resp.ok) {
      console.log('✓ Migration applied successfully!')
      process.exit(0)
    }
  } catch (err) {
    console.log(`  Error: ${err.message}`)
  }
}

// Approach 2: Use supabase-js to create the table via raw insert trick?
// No, that won't work for DDL.

// Approach 3: If we have PostgreSQL installed locally (psql in path)
import { execSync } from 'child_process'
try {
  // Check for psql in PostgreSQL installation
  const psqlPath = 'C:/Program Files/PostgreSQL/psqlODBC/bin/psql.exe'
  const result = execSync(`"${psqlPath}" --version 2>&1`, { encoding: 'utf8' })
  console.log(`\nFound psql: ${result}`)
} catch {
  // Try default path
  try {
    // Check multiple possible locations
    const paths = [
      'C:/Program Files/PostgreSQL/16/bin/psql.exe',
      'C:/Program Files/PostgreSQL/15/bin/psql.exe',
      'C:/Program Files/PostgreSQL/14/bin/psql.exe',
    ]
    for (const p of paths) {
      try {
        const r = execSync(`"${p}" --version 2>&1`, { encoding: 'utf8' })
        console.log(`\nFound psql at ${p}: ${r}`)
        break
      } catch {}
    }
  } catch {}
}

console.log('\n❌ Could not apply migration automatically.')
console.log('The database password is needed. Please either:')
console.log('  1. Add DATABASE_URL to .env.local')
console.log('  2. Run the SQL in Supabase Dashboard > SQL Editor')
console.log('  3. Run: npx supabase login && npx supabase db push')
process.exit(1)
