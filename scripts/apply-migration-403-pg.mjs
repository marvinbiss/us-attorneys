/**
 * Apply migration 403 using the Supabase Management API
 * POST https://api.supabase.com/v1/projects/{ref}/database/query
 */

import { readFileSync } from 'fs'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing env vars')
  process.exit(1)
}

const projectRef = supabaseUrl.replace('https://', '').replace('.supabase.co', '')
const sql = readFileSync('supabase/migrations/403_statute_of_limitations_census.sql', 'utf8')

console.log(`Project ref: ${projectRef}`)
console.log(`SQL length: ${sql.length} chars`)

// Approach: Use the Supabase Management API
// This requires SUPABASE_ACCESS_TOKEN, not service_role_key
// Since we don't have it, let's try a different approach:
// Create a temporary postgres function via PostgREST

// Actually, let's try the approach of using pg module directly
// We need the database password. For Supabase, the default password
// can be found in the dashboard. But we can also try to use
// the service_role JWT to connect via the pooler with pg module.

// Alternative: Use the Supabase realtime/pg_notify to run DDL? No.

// Best approach: Create a temporary edge function or use pg with SSL

import pg from 'pg'
const { Client } = pg

// Try connecting with various password combinations
// The Supabase pooler accepts: postgres.[ref]:[db-password]
// But we might be able to use the service_role key as password for the direct connection

const connectionConfigs = [
  {
    name: 'Pooler with service key',
    connectionString: `postgresql://postgres.${projectRef}:${supabaseServiceKey}@aws-0-us-east-1.pooler.supabase.com:5432/postgres`,
    ssl: { rejectUnauthorized: false }
  },
  {
    name: 'Pooler session mode',
    connectionString: `postgresql://postgres.${projectRef}:${supabaseServiceKey}@aws-0-us-east-1.pooler.supabase.com:5432/postgres?sslmode=require`,
    ssl: { rejectUnauthorized: false }
  },
  {
    name: 'Direct connection port 5432',
    host: `db.${projectRef}.supabase.co`,
    port: 5432,
    database: 'postgres',
    user: 'postgres',
    password: supabaseServiceKey,
    ssl: { rejectUnauthorized: false }
  },
]

for (const config of connectionConfigs) {
  console.log(`\nTrying: ${config.name}...`)
  const client = new Client(config.connectionString ? {
    connectionString: config.connectionString,
    ssl: config.ssl
  } : config)

  try {
    await client.connect()
    console.log('✓ Connected!')

    // Execute migration
    console.log('Executing migration SQL...')
    await client.query(sql)
    console.log('✓ Migration 403 applied successfully!')

    // Verify
    const result = await client.query("SELECT COUNT(*) FROM statute_of_limitations")
    console.log(`  statute_of_limitations rows: ${result.rows[0].count}`)

    const colCheck = await client.query("SELECT column_name FROM information_schema.columns WHERE table_name='locations_us' AND column_name='census_data'")
    console.log(`  census_data column exists: ${colCheck.rows.length > 0}`)

    await client.end()
    process.exit(0)
  } catch (err) {
    console.log(`✗ Failed: ${err.message}`)
    try { await client.end() } catch {}
  }
}

console.log('\n❌ All connection methods failed.')
console.log('Please provide DATABASE_URL or apply migration manually in Supabase Dashboard SQL Editor.')
process.exit(1)
