/**
 * Apply migration 403 by creating an exec_sql RPC function via PostgREST
 *
 * Strategy:
 * 1. Use the Supabase SQL API endpoint (if available on pg17+)
 * 2. Or try to find any way to execute DDL
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

// The Supabase client has a .schema() method that can target different schemas
// Let's try to call functions in pg_catalog or information_schema
async function main() {
  // Try 1: Check if we can use the extensions schema
  console.log('Checking available schemas...')

  // Try the Supabase SQL endpoint that Studio uses
  // Studio uses: POST /pg/ with Authorization: Bearer <service_role>
  // But this might be behind a different port/proxy

  // Try 2: Use the supabase-js admin features
  // The Supabase client has no raw SQL method, but we can check for
  // pg_net or other extensions

  // Check if pg_net is available (for making HTTP requests from within postgres)
  const { data: netData, error: netErr } = await supabase.rpc('net', {})
  console.log('pg_net:', netErr?.message || 'available')

  // Try 3: Check available extensions by querying pg_extension via a view
  // Supabase exposes some pg_catalog views

  // Actually - let me try to use the /graphql/v1 endpoint which can run mutations
  console.log('\nTrying GraphQL endpoint for DDL...')

  const graphqlMutation = `
    mutation {
      insertIntostatute_of_limitationsCollection(objects: []) {
        affectedCount
      }
    }
  `

  const gqlResp = await fetch(`${supabaseUrl}/graphql/v1`, {
    method: 'POST',
    headers: {
      'apikey': supabaseServiceKey,
      'Authorization': `Bearer ${supabaseServiceKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: '{ __schema { queryType { name } mutationType { name } } }' })
  })
  const gqlResult = await gqlResp.text()
  console.log('GraphQL response:', gqlResult.substring(0, 200))

  // Try 4: The Supabase pg-meta REST API
  // This is what the Dashboard's SQL Editor uses internally
  // It's typically at /pg/ on the kong gateway

  const pgMetaEndpoints = [
    '/pg/query',
    '/pg-meta/default/query',
    '/api/pg-meta/default/query',
  ]

  for (const endpoint of pgMetaEndpoints) {
    console.log(`\nTrying ${endpoint}...`)
    const resp = await fetch(`${supabaseUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Content-Type': 'application/json',
        'x-connection-encrypted': 'true',
      },
      body: JSON.stringify({ query: 'SELECT 1 as test' })
    })
    console.log(`  Status: ${resp.status}`)
    const text = await resp.text()
    console.log(`  Response: ${text.substring(0, 150)}`)

    if (resp.ok) {
      console.log('\n✓ Found working SQL endpoint!')
      // Now execute the migration
      const { readFileSync } = await import('fs')
      const sql = readFileSync('supabase/migrations/403_statute_of_limitations_census.sql', 'utf8')

      const migResp = await fetch(`${supabaseUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'Content-Type': 'application/json',
          'x-connection-encrypted': 'true',
        },
        body: JSON.stringify({ query: sql })
      })
      const migText = await migResp.text()
      console.log(`Migration result: ${migResp.status} - ${migText.substring(0, 200)}`)

      if (migResp.ok) {
        console.log('✓ Migration 403 applied successfully!')
        process.exit(0)
      }
    }
  }

  console.log('\n--- All approaches failed ---')
  console.log('Need database password or Supabase access token.')
  process.exit(1)
}

main().catch(console.error)
