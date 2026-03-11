/**
 * One-shot IndexNow batch submission for newly-added communes × services URLs.
 * Targets the ~11,794 pages marked "noindex" in Search Console.
 *
 * Submits directly to Bing + Yandex IndexNow endpoints (api.indexnow.org has rate limits).
 * Max 10,000 per request → split into batches with 5s delay.
 *
 * Usage: node scripts/indexnow-batch.mjs
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

const env = readFileSync('.env.local', 'utf8')
const get = k => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim()
const sb = createClient(get('NEXT_PUBLIC_SUPABASE_URL'), get('SUPABASE_SERVICE_ROLE_KEY'))

const SITE_URL = 'https://servicesartisans.fr'
const INDEXNOW_KEY = '55e191c6b56d89e07bbf8fcba3552fcd'

const ALL_SERVICES = [
  'plombier','electricien','serrurier','chauffagiste','peintre-en-batiment',
  'menuisier','carreleur','couvreur','macon','jardinier','vitrier','climaticien',
  'cuisiniste','solier','nettoyage','terrassier','charpentier','zingueur',
  'etancheiste','facadier','platrier','metallier','ferronnier','poseur-de-parquet',
  'miroitier','storiste','salle-de-bain','architecte-interieur','decorateur',
  'domoticien','pompe-a-chaleur','panneaux-solaires','isolation-thermique',
  'renovation-energetique','borne-recharge','ramoneur','paysagiste','pisciniste',
  'alarme-securite','antenniste','ascensoriste','diagnostiqueur','geometre',
  'desinsectisation','deratisation','demenageur',
]

const sleep = ms => new Promise(r => setTimeout(r, ms))

// ---------------------------------------------------------------------------
// 1. Fetch newly-added communes (< 5000 hab = not in original france.ts)
// ---------------------------------------------------------------------------
console.log('Fetching newly-added communes...')
const newCommunes = []
let offset = 0
while (true) {
  const { data } = await sb
    .from('communes')
    .select('slug')
    .lt('population', 5000)
    .eq('is_active', true)
    .range(offset, offset + 999)
  if (!data || data.length === 0) break
  newCommunes.push(...data.map(c => c.slug))
  offset += data.length
  if (data.length < 1000) break
}
console.log(`New communes: ${newCommunes.length.toLocaleString('fr-FR')}`)
console.log(`Services: ${ALL_SERVICES.length}`)

// ---------------------------------------------------------------------------
// 2. Build URLs — focus on top services first (most Search Console exposure)
// ---------------------------------------------------------------------------
const topServices = ALL_SERVICES.slice(0, 5) // plombier, electricien, serrurier, chauffagiste, peintre
const urls = []
for (const service of topServices) {
  for (const commune of newCommunes) {
    urls.push(`${SITE_URL}/services/${service}/${commune}`)
  }
}
console.log(`Total URLs: ${urls.length.toLocaleString('fr-FR')} (${topServices.length} services × ${newCommunes.length.toLocaleString('fr-FR')} communes)`)

// ---------------------------------------------------------------------------
// 3. Submit to Bing + Yandex in batches of 10K
// ---------------------------------------------------------------------------
const BATCH_SIZE = 10000
const totalBatches = Math.ceil(urls.length / BATCH_SIZE)
console.log(`Batches: ${totalBatches}\n`)

const endpoints = [
  { name: 'Bing', url: 'https://www.bing.com/indexnow' },
  { name: 'Yandex', url: 'https://yandex.com/indexnow' },
]

let totalSuccess = 0

for (let i = 0; i < urls.length; i += BATCH_SIZE) {
  const batch = urls.slice(i, i + BATCH_SIZE)
  const batchNum = Math.floor(i / BATCH_SIZE) + 1

  const payload = {
    host: 'servicesartisans.fr',
    key: INDEXNOW_KEY,
    keyLocation: `${SITE_URL}/${INDEXNOW_KEY}.txt`,
    urlList: batch,
  }

  const results = await Promise.all(
    endpoints.map(async (ep) => {
      try {
        const res = await fetch(ep.url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json; charset=utf-8' },
          body: JSON.stringify(payload),
        })
        return { name: ep.name, status: res.status }
      } catch (err) {
        return { name: ep.name, status: 'ERR', error: err.message }
      }
    })
  )

  const statuses = results.map(r => `${r.name}:${r.status}`).join(', ')
  const allOk = results.every(r => r.status === 200 || r.status === 202)
  if (allOk) totalSuccess += batch.length

  console.log(`  Batch ${batchNum}/${totalBatches}: ${batch.length.toLocaleString('fr-FR')} URLs → ${statuses}${allOk ? ' ✓' : ''}`)

  // 5s delay between batches
  if (i + BATCH_SIZE < urls.length) await sleep(5000)
}

console.log(`\n=== IndexNow Complete ===`)
console.log(`  Submitted: ${urls.length.toLocaleString('fr-FR')} URLs`)
console.log(`  Successful: ${totalSuccess.toLocaleString('fr-FR')}`)
console.log(`  Services: ${topServices.join(', ')}`)
console.log(`  Communes: ${newCommunes.length.toLocaleString('fr-FR')}`)
console.log(`\nBing et Yandex vont re-crawler ces pages.`)
console.log(`Google re-crawlera via les sitemaps dans les prochains jours.`)
