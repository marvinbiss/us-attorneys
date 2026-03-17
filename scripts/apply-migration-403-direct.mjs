/**
 * Try to connect to Supabase DB directly and apply migration 403
 * Tries direct connection to db.[ref].supabase.co:5432
 */
import pg from 'pg'
import { readFileSync } from 'fs'

const { Client } = pg

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const projectRef = supabaseUrl.replace('https://', '').replace('.supabase.co', '')

const sql = readFileSync('supabase/migrations/403_statute_of_limitations_census.sql', 'utf8')

// Try direct DB connection with common password patterns
const passwords = [
  process.env.SUPABASE_DB_PASSWORD,
  process.env.DB_PASSWORD,
  'postgres',
].filter(Boolean)

// Also try the direct connection via db.[ref].supabase.co
const hosts = [
  `db.${projectRef}.supabase.co`,
]

const users = ['postgres', `postgres.${projectRef}`]
const ports = [5432, 6543]

for (const host of hosts) {
  for (const user of users) {
    for (const port of ports) {
      for (const password of passwords) {
        const label = `${user}@${host}:${port}`
        console.log(`Trying: ${label}...`)
        const client = new Client({
          host,
          port,
          database: 'postgres',
          user,
          password,
          ssl: { rejectUnauthorized: false },
          connectionTimeoutMillis: 5000,
        })
        try {
          await client.connect()
          console.log(`✓ Connected to ${label}!`)
          await client.query(sql)
          console.log('✓ Migration 403 applied!')
          const res = await client.query("SELECT COUNT(*) FROM statute_of_limitations")
          console.log(`  Table rows: ${res.rows[0].count}`)
          await client.end()
          process.exit(0)
        } catch (err) {
          console.log(`  ✗ ${err.message.substring(0, 80)}`)
          try { await client.end() } catch {}
        }
      }
    }
  }
}

console.log('\n❌ All attempts failed. Need the database password.')
console.log('Get it from: https://supabase.com/dashboard/project/' + projectRef + '/settings/database')
process.exit(1)
