/**
 * Apply migration 403 using psql (PostgreSQL 13 or 18 found on this machine)
 * Requires SUPABASE_DB_PASSWORD environment variable
 *
 * Usage:
 *   export $(grep -v '^#' .env.local | xargs)
 *   SUPABASE_DB_PASSWORD=your-db-password node scripts/apply-migration-403-psql.mjs
 */

import { execSync } from 'child_process'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const dbPassword = process.env.SUPABASE_DB_PASSWORD

if (!supabaseUrl) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL')
  process.exit(1)
}

if (!dbPassword) {
  console.error('Missing SUPABASE_DB_PASSWORD')
  console.error('Get it from: Supabase Dashboard > Settings > Database > Connection string')
  console.error('Then run: SUPABASE_DB_PASSWORD=your-password node scripts/apply-migration-403-psql.mjs')
  process.exit(1)
}

const projectRef = supabaseUrl.replace('https://', '').replace('.supabase.co', '')

// Try psql paths
const psqlPaths = [
  'C:/Program Files/PostgreSQL/18/bin/psql.exe',
  'C:/Program Files/PostgreSQL/13/bin/psql.exe',
]

let psqlPath = null
for (const p of psqlPaths) {
  try {
    execSync(`"${p}" --version`, { encoding: 'utf8', stdio: 'pipe' })
    psqlPath = p
    break
  } catch {}
}

if (!psqlPath) {
  console.error('psql not found')
  process.exit(1)
}

console.log(`Using psql: ${psqlPath}`)
console.log(`Project: ${projectRef}`)

// Connection string for Supabase pooler (session mode, port 5432)
// Format: postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres
const regions = ['us-east-1', 'us-east-2', 'us-west-1', 'us-west-2', 'eu-west-1', 'eu-central-1']

for (const region of regions) {
  const connStr = `postgresql://postgres.${projectRef}:${encodeURIComponent(dbPassword)}@aws-0-${region}.pooler.supabase.com:5432/postgres?sslmode=require`
  console.log(`\nTrying ${region}...`)

  try {
    const result = execSync(
      `"${psqlPath}" "${connStr}" -f supabase/migrations/403_statute_of_limitations_census.sql`,
      { encoding: 'utf8', timeout: 30000, stdio: ['pipe', 'pipe', 'pipe'] }
    )
    console.log('Migration applied successfully!')
    console.log(result)
    process.exit(0)
  } catch (err) {
    console.log(`Failed: ${err.stderr?.substring(0, 100) || err.message?.substring(0, 100)}`)
  }
}

// Also try direct connection
const directStr = `postgresql://postgres:${encodeURIComponent(dbPassword)}@db.${projectRef}.supabase.co:5432/postgres?sslmode=require`
console.log('\nTrying direct connection...')
try {
  const result = execSync(
    `"${psqlPath}" "${directStr}" -f supabase/migrations/403_statute_of_limitations_census.sql`,
    { encoding: 'utf8', timeout: 30000, stdio: ['pipe', 'pipe', 'pipe'] }
  )
  console.log('Migration applied successfully!')
  console.log(result)
  process.exit(0)
} catch (err) {
  console.log(`Failed: ${err.stderr?.substring(0, 100) || err.message?.substring(0, 100)}`)
}

console.log('\nAll connection methods failed. Please check your DB password.')
process.exit(1)
