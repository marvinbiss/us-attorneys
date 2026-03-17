/**
 * Apply migration 403 via Supabase's rpc('exec_sql') or direct REST.
 * Uses fetch to the PostgREST /rpc endpoint with service_role key.
 */
import { readFileSync } from 'fs'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing env vars')
  process.exit(1)
}

const sql = readFileSync('supabase/migrations/403_statute_of_limitations_census.sql', 'utf8')

// Split into individual statements and execute them one by one
const statements = sql
  .split(';')
  .map(s => s.trim())
  .filter(s => s.length > 0 && !s.startsWith('--'))

console.log(`Found ${statements.length} SQL statements to execute`)

// Use the Supabase Management API or direct postgres
// Actually, let's use the supabase-js .rpc() with a helper function
// OR we can use the REST API directly

// Try using fetch to execute raw SQL via the pg_net extension or exec_sql RPC
// The simplest: use the Supabase client to check if table exists first

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

async function main() {
  // First check if table already exists by trying to query it
  const { data, error } = await supabase
    .from('statute_of_limitations')
    .select('id')
    .limit(1)

  if (!error) {
    console.log('✓ Table statute_of_limitations already exists')
    console.log(`  Current rows: querying count...`)

    const { count } = await supabase
      .from('statute_of_limitations')
      .select('*', { count: 'exact', head: true })

    console.log(`  Current row count: ${count}`)

    // Check if census_data column exists on locations_us
    const { data: locData, error: locError } = await supabase
      .from('locations_us')
      .select('census_data')
      .limit(1)

    if (!locError) {
      console.log('✓ Column census_data already exists on locations_us')
    } else {
      console.log('⚠ census_data column may not exist yet:', locError.message)
      console.log('  Will need to apply that part of migration manually')
    }

    console.log('\nMigration 403 appears to be already applied.')
    return
  }

  // Table doesn't exist - we need to apply migration
  console.log('Table does not exist. Attempting to apply migration...')
  console.log('Error was:', error.message)

  // Try executing SQL via the REST endpoint
  // Supabase exposes a /rest/v1/rpc endpoint. We need a function to execute SQL.
  // Alternative: use the Management API

  const projectRef = supabaseUrl.replace('https://', '').replace('.supabase.co', '')
  console.log(`Project ref: ${projectRef}`)

  // Try the Management API
  // POST https://api.supabase.com/v1/projects/{ref}/database/query
  // This requires a Supabase access token, not service_role key

  // Alternative: Execute each statement via PostgREST RPC if we have an exec_sql function
  // Let's try to use the pg_graphql or just report that psql is needed

  console.log('\n❌ Cannot apply migration automatically without psql or Supabase CLI.')
  console.log('Please apply the migration manually:')
  console.log('  Option 1: Go to Supabase Dashboard > SQL Editor and paste the migration SQL')
  console.log('  Option 2: Install psql and run: psql $DATABASE_URL -f supabase/migrations/403_statute_of_limitations_census.sql')
  console.log('\nAlternatively, trying via Management API...')

  // Try the Supabase Management API with the service role key
  // Actually, let's try the /rest/v1/ endpoint to create via raw POST
  // This won't work for DDL...

  // Last resort: try fetch to the SQL endpoint
  const sqlEndpoint = `${supabaseUrl}/rest/v1/rpc/`

  // Check if there's an exec_sql function
  const execResp = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'apikey': supabaseServiceKey,
      'Authorization': `Bearer ${supabaseServiceKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: statements[0] + ';' })
  })

  if (execResp.ok) {
    console.log('Found exec_sql RPC function! Executing migration...')
    for (let i = 0; i < statements.length; i++) {
      const resp = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: statements[i] + ';' })
      })
      if (resp.ok) {
        console.log(`  ✓ Statement ${i + 1}/${statements.length} executed`)
      } else {
        const text = await resp.text()
        console.log(`  ⚠ Statement ${i + 1}: ${text}`)
      }
    }
  } else {
    const text = await execResp.text()
    console.log('No exec_sql function available:', text)
    console.log('\n⚠ Please apply migration 403 manually via Supabase Dashboard SQL Editor.')
    process.exit(1)
  }
}

main().catch(console.error)
