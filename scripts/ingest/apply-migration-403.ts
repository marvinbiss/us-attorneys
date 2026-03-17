/**
 * Apply Migration 403: Statute of Limitations + Census Data
 *
 * Usage:
 *   export $(grep -v '^#' .env.local | xargs)
 *
 *   # Option 1: Set DB password
 *   export SUPABASE_DB_PASSWORD="your-db-password"
 *   npx tsx scripts/ingest/apply-migration-403.ts
 *
 *   # Option 2: Set full DATABASE_URL
 *   export DATABASE_URL="postgresql://postgres.[ref]:password@host:port/postgres"
 *   npx tsx scripts/ingest/apply-migration-403.ts
 *
 *   # Option 3: No DB credentials — prints instructions for manual apply
 */
import { Pool } from 'pg'
import * as fs from 'fs'
import * as path from 'path'
import { createClient } from '@supabase/supabase-js'

const PROJECT_REF = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace('https://', '').replace('.supabase.co', '')

function getMigrationSQL(): string {
  return fs.readFileSync(
    path.join(__dirname, '../../supabase/migrations/403_statute_of_limitations_census.sql'),
    'utf-8'
  )
}

async function verifyViaREST(): Promise<{ solExists: boolean; censusExists: boolean }> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  // Check statute_of_limitations table
  const { error: solErr } = await supabase
    .from('statute_of_limitations')
    .select('id')
    .limit(1)
  const solExists = !solErr || !solErr.message.includes('Could not find')

  // Check census_data column
  const { error: censusErr } = await supabase
    .from('locations_us')
    .select('census_data')
    .limit(1)
  const censusExists = !censusErr || !censusErr.message.includes('does not exist')

  return { solExists, censusExists }
}

async function applyViaPg(): Promise<boolean> {
  const dbPassword = process.env.SUPABASE_DB_PASSWORD
  const databaseUrl = process.env.DATABASE_URL

  const connectionStrings: string[] = []

  if (databaseUrl) {
    connectionStrings.push(databaseUrl)
  }

  if (dbPassword && PROJECT_REF) {
    // Try multiple regions for the pooler
    for (const region of ['us-east-1', 'us-west-1', 'eu-west-1', 'eu-central-1']) {
      connectionStrings.push(
        `postgresql://postgres.${PROJECT_REF}:${dbPassword}@aws-0-${region}.pooler.supabase.com:6543/postgres`
      )
    }
    // Direct connection
    connectionStrings.push(
      `postgresql://postgres:${dbPassword}@db.${PROJECT_REF}.supabase.co:5432/postgres`
    )
  }

  if (connectionStrings.length === 0) {
    return false
  }

  const migrationSQL = getMigrationSQL()

  for (const connStr of connectionStrings) {
    const label = connStr.includes('pooler')
      ? connStr.match(/aws-0-([\w-]+)/)?.[1] || 'pooler'
      : connStr.includes('db.') ? 'direct' : 'custom'

    console.log(`Trying ${label} connection...`)

    const pool = new Pool({
      connectionString: connStr,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 10000,
    })

    try {
      const client = await pool.connect()
      console.log(`Connected via ${label}!`)

      await client.query(migrationSQL)
      console.log('Migration 403 applied successfully!')

      // Verify via pg
      const solCheck = await client.query(
        "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'statute_of_limitations'"
      )
      console.log(`  statute_of_limitations table: ${Number(solCheck.rows[0].count) > 0 ? 'EXISTS' : 'MISSING'}`)

      const censusCheck = await client.query(
        "SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'locations_us' AND column_name = 'census_data'"
      )
      console.log(`  census_data column: ${Number(censusCheck.rows[0].count) > 0 ? 'EXISTS' : 'MISSING'}`)

      client.release()
      await pool.end()
      return true
    } catch (err: any) {
      const msg = err.message?.substring(0, 120) || 'unknown error'
      console.log(`  Failed: ${msg}`)
      await pool.end().catch(() => {})
    }
  }

  return false
}

async function main() {
  console.log('=== Migration 403: Statute of Limitations + Census Data ===')
  console.log(`Project: ${PROJECT_REF}`)
  console.log()

  // Step 1: Check if already applied
  console.log('Checking current state via REST API...')
  const { solExists, censusExists } = await verifyViaREST()
  console.log(`  statute_of_limitations table: ${solExists ? 'EXISTS' : 'MISSING'}`)
  console.log(`  census_data column: ${censusExists ? 'EXISTS' : 'MISSING'}`)

  if (solExists && censusExists) {
    console.log('\nMigration 403 already applied! Nothing to do.')
    return
  }

  // Step 2: Try to apply via pg
  console.log('\nAttempting to apply migration via Postgres...')
  const success = await applyViaPg()

  if (success) {
    // Double-check via REST
    console.log('\nVerifying via REST API...')
    const verify = await verifyViaREST()
    console.log(`  statute_of_limitations: ${verify.solExists ? 'OK' : 'FAILED'}`)
    console.log(`  census_data: ${verify.censusExists ? 'OK' : 'FAILED'}`)
    return
  }

  // Step 3: Fallback instructions
  console.log('\n========================================')
  console.log('MANUAL APPLICATION REQUIRED')
  console.log('========================================')
  console.log()
  console.log('No DB credentials found. Set one of:')
  console.log('  export SUPABASE_DB_PASSWORD="your-db-password"')
  console.log('  export DATABASE_URL="postgresql://postgres.[ref]:pass@host:port/postgres"')
  console.log()
  console.log('OR apply manually via Supabase Dashboard SQL editor:')
  console.log(`  https://supabase.com/dashboard/project/${PROJECT_REF}/sql/new`)
  console.log()
  console.log('SQL to paste:')
  console.log('─'.repeat(60))
  console.log(getMigrationSQL())
  console.log('─'.repeat(60))
  process.exit(1)
}

main().catch(console.error)
