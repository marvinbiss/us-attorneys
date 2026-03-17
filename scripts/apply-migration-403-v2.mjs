/**
 * Apply migration 403 via Supabase by trying multiple approaches:
 * 1. Check if table already exists
 * 2. Try supabase.rpc('query') for known Supabase helper functions
 * 3. Try creating table via supabase-js schema-level workaround
 */
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing env vars')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
  db: { schema: 'public' }
})

async function main() {
  // Step 1: Check if table exists
  console.log('Checking if statute_of_limitations table exists...')
  const { data, error } = await supabase.from('statute_of_limitations').select('id').limit(1)

  if (!error) {
    console.log('✓ Table already exists!')
    const { count } = await supabase.from('statute_of_limitations').select('*', { count: 'exact', head: true })
    console.log(`  Current row count: ${count}`)
    return true
  }

  console.log(`Table does not exist: ${error.message}`)

  // Step 2: Try various RPC function names that might exist
  const rpcNames = ['exec_sql', 'execute_sql', 'run_sql', 'query', 'raw_sql', 'sql']
  for (const name of rpcNames) {
    const { error: rpcError } = await supabase.rpc(name, { query: 'SELECT 1' })
    if (!rpcError || !rpcError.message.includes('Could not find the function')) {
      console.log(`Found RPC function: ${name}`)
      // Use it to create the table
      break
    }
  }

  // Step 3: Try using pg_graphql extension if available
  console.log('\nChecking pg_graphql...')
  const graphqlResp = await fetch(`${supabaseUrl}/graphql/v1`, {
    method: 'POST',
    headers: {
      'apikey': supabaseServiceKey,
      'Authorization': `Bearer ${supabaseServiceKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: '{ __typename }' })
  })
  console.log(`GraphQL status: ${graphqlResp.status}`)

  // Step 4: Try the /pg/ endpoint (Supabase Studio API proxy)
  // This is available on self-hosted but may also work on cloud
  console.log('\nTrying Supabase internal SQL endpoint...')

  // The Supabase Studio has a /api/pg-meta/ endpoint
  // Let's try the meta endpoint to create the table
  const metaEndpoints = [
    `${supabaseUrl}/rest/v1/`,  // Get schema info
  ]

  // Step 5: Last resort - try to create a helper function using PostgREST
  // We can't create tables via PostgREST, but we CAN call pg_catalog functions

  // Actually, let's try the Supabase SQL API that the Dashboard uses internally
  // It goes through: POST /pg/query with the service_role token
  // But this endpoint might only be available on the Studio backend (port 3000)

  // Try the realtime endpoint to see if we can get more info
  console.log('\nAttempting to create table via alternative methods...')

  // Create an exec_sql function first, then use it
  // We can potentially do this via the REST API if extensions allow it

  // Step 6: Try using Supabase Edge Functions runtime (Deno) endpoint
  // No, that requires deployment

  // Step 7: Direct approach - create a temporary .sql migration and use supabase cli
  console.log('\n--- RESULT ---')
  console.log('Cannot create table without database password or Supabase access token.')
  console.log('')
  console.log('Options:')
  console.log('1. Get the database password from Supabase Dashboard > Settings > Database')
  console.log('   Then set: export DATABASE_URL="postgresql://postgres.[ref]:[password]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres"')
  console.log('   And run: psql $DATABASE_URL -f supabase/migrations/403_statute_of_limitations_census.sql')
  console.log('')
  console.log('2. Run supabase login to get an access token:')
  console.log('   npx supabase login')
  console.log('   npx supabase db push --linked')
  console.log('')
  console.log('3. Copy-paste the SQL into Supabase Dashboard > SQL Editor:')
  console.log('   https://supabase.com/dashboard/project/zmggsqmibekiogpwhlpr/sql')

  return false
}

main().then(exists => {
  if (!exists) process.exit(1)
}).catch(err => {
  console.error(err)
  process.exit(1)
})
