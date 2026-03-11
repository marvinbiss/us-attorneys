/**
 * Enrich communes with geo.api.gouv.fr data:
 * code_postal, population, latitude, longitude, departement_name, region_name
 *
 * Uses code_insee lookup (most reliable).
 * Batches of 50 parallel API requests with 100ms delay between batches.
 * Updates DB one-by-one via .update().eq('code_insee', ...) to avoid NOT NULL issues.
 *
 * Usage: node scripts/enrich-communes.mjs
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------
const env = readFileSync('.env.local', 'utf8')
const get = k => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim()
const sb = createClient(get('NEXT_PUBLIC_SUPABASE_URL'), get('SUPABASE_SERVICE_ROLE_KEY'))

const BATCH_SIZE = 50
const DELAY_MS = 100
const DB_PARALLEL = 20 // parallel DB updates

const sleep = ms => new Promise(r => setTimeout(r, ms))

// ---------------------------------------------------------------------------
// 1. Fetch communes needing enrichment
// ---------------------------------------------------------------------------
console.log('Fetching communes with code_postal IS NULL...')
const toEnrich = []
let offset = 0
while (true) {
  const { data, error } = await sb
    .from('communes')
    .select('code_insee, name, slug')
    .is('code_postal', null)
    .range(offset, offset + 999)
  if (error) { console.error('DB fetch error:', error.message); break }
  if (!data || data.length === 0) break
  toEnrich.push(...data)
  offset += data.length
  if (data.length < 1000) break
}
console.log(`Communes to enrich: ${toEnrich.length}`)

// ---------------------------------------------------------------------------
// 2. Fetch from geo.api.gouv.fr by code_insee
// ---------------------------------------------------------------------------
let enriched = 0
let failed = 0
let apiErrors = 0
const updates = [] // { code_insee, patch }

async function fetchCommune(commune) {
  const url = `https://geo.api.gouv.fr/communes/${commune.code_insee}?fields=nom,codesPostaux,population,centre,departement,region`
  try {
    const res = await fetch(url)
    if (res.status === 404) { failed++; return }
    if (!res.ok) { apiErrors++; return }
    const data = await res.json()
    const patch = {}

    if (data.codesPostaux && data.codesPostaux.length > 0) {
      patch.code_postal = data.codesPostaux[0]
    }
    if (data.population != null) {
      patch.population = data.population
    }
    if (data.centre && data.centre.coordinates) {
      patch.longitude = data.centre.coordinates[0]
      patch.latitude = data.centre.coordinates[1]
    }
    if (data.departement && data.departement.nom) {
      patch.departement_name = data.departement.nom
    }
    if (data.region && data.region.nom) {
      patch.region_name = data.region.nom
    }

    if (Object.keys(patch).length > 0) {
      updates.push({ code_insee: commune.code_insee, patch })
      enriched++
    }
  } catch {
    apiErrors++
  }
}

// Process API calls in batches of 50
const startTime = Date.now()
for (let i = 0; i < toEnrich.length; i += BATCH_SIZE) {
  const batch = toEnrich.slice(i, i + BATCH_SIZE)
  await Promise.all(batch.map(c => fetchCommune(c)))

  if (i % 500 === 0 || i + BATCH_SIZE >= toEnrich.length) {
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(0)
    const pct = ((i + batch.length) / toEnrich.length * 100).toFixed(1)
    process.stdout.write(`  API: ${i + batch.length}/${toEnrich.length} (${pct}%) — ${enriched} enriched, ${failed} 404, ${apiErrors} errors — ${elapsed}s\r`)
  }

  await sleep(DELAY_MS)
}

console.log(`\n\nAPI complete: ${enriched} enriched, ${failed} not found, ${apiErrors} errors`)

// ---------------------------------------------------------------------------
// 3. Update Supabase via .update().eq() — parallel batches of 20
// ---------------------------------------------------------------------------
console.log(`\nUpdating ${updates.length} communes in Supabase...`)
let dbUpdated = 0
let dbErrors = 0
const dbStart = Date.now()

for (let i = 0; i < updates.length; i += DB_PARALLEL) {
  const batch = updates.slice(i, i + DB_PARALLEL)
  const results = await Promise.all(
    batch.map(u =>
      sb.from('communes').update(u.patch).eq('code_insee', u.code_insee)
    )
  )

  for (const r of results) {
    if (r.error) {
      dbErrors++
      if (dbErrors <= 3) console.error('  DB error:', r.error.message)
    } else {
      dbUpdated++
    }
  }

  if (i % 1000 === 0) {
    const elapsed = ((Date.now() - dbStart) / 1000).toFixed(0)
    process.stdout.write(`  DB: ${dbUpdated}/${updates.length} updated — ${elapsed}s\r`)
  }
}

console.log(`\nDB complete: ${dbUpdated} updated, ${dbErrors} errors`)

// ---------------------------------------------------------------------------
// 4. Final stats
// ---------------------------------------------------------------------------
console.log('\n=== FINAL STATS ===')

const queries = [
  ['Total communes', sb.from('communes').select('*', { count: 'exact', head: true })],
  ['With code_postal', sb.from('communes').select('*', { count: 'exact', head: true }).not('code_postal', 'is', null)],
  ['With population > 0', sb.from('communes').select('*', { count: 'exact', head: true }).gt('population', 0)],
  ['With latitude', sb.from('communes').select('*', { count: 'exact', head: true }).not('latitude', 'is', null)],
  ['With departement_name', sb.from('communes').select('*', { count: 'exact', head: true }).not('departement_name', 'is', null)],
  ['Still missing code_postal', sb.from('communes').select('*', { count: 'exact', head: true }).is('code_postal', null)],
]

for (const [label, query] of queries) {
  const { count } = await query
  console.log(`  ${label}: ${count}`)
}
