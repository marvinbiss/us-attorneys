import { Pool } from 'pg'
import * as dotenv from 'dotenv'
import * as path from 'path'
dotenv.config({ path: path.join(__dirname, '..', '.env.local') })

const PG_URL = process.env.SUPABASE_DB_URL || 'postgresql://postgres:BEB6LnGlT6U9bkTe@db.umjmbdbwcsxrvfqktiui.supabase.co:5432/postgres'

async function main() {
  const db = new Pool({ connectionString: PG_URL, ssl: { rejectUnauthorized: false } })
  const r = await db.query(`
    SELECT address_department as dept, COUNT(*) as cnt
    FROM providers
    WHERE is_active = true AND phone IS NULL AND address_city IS NOT NULL AND name IS NOT NULL AND LENGTH(name) >= 3
    GROUP BY address_department
    ORDER BY cnt DESC
  `)
  let total = 0
  const depts: { dept: string; cnt: number }[] = []
  for (const row of r.rows) {
    depts.push({ dept: row.dept, cnt: parseInt(row.cnt) })
    total += parseInt(row.cnt)
  }

  // Partition into 10 balanced buckets using greedy algorithm
  const NUM_AGENTS = 10
  const buckets: { depts: string[]; total: number }[] = Array.from({ length: NUM_AGENTS }, () => ({ depts: [], total: 0 }))

  // Sort by count DESC, then greedily assign to smallest bucket
  depts.sort((a, b) => b.cnt - a.cnt)
  for (const d of depts) {
    if (!d.dept) continue
    const smallest = buckets.reduce((min, b, i) => b.total < buckets[min].total ? i : min, 0)
    buckets[smallest].depts.push(d.dept)
    buckets[smallest].total += d.cnt
  }

  console.log(`Total providers sans phone: ${total}`)
  console.log(`\nPartitionnement en ${NUM_AGENTS} agents:\n`)
  for (let i = 0; i < NUM_AGENTS; i++) {
    const b = buckets[i]
    console.log(`AGENT_${i + 1}_DEPTS="${b.depts.join(',')}"  # ${b.total} providers`)
  }

  // Generate launch script
  console.log(`\n# Launch commands:`)
  for (let i = 0; i < NUM_AGENTS; i++) {
    const b = buckets[i]
    console.log(`npx tsx scripts/scrape-domination.ts --workers 12 --resume --agent-id ${i + 1} --depts ${b.depts.join(',')} --skip-pj --skip-societe`)
  }

  await db.end()
}
main()
