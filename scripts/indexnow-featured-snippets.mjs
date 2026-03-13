/**
 * IndexNow batch submission for PriceTable Featured Snippet pages.
 * Submits service hub pages, top city pages, department pages, and region pages.
 *
 * Usage: node scripts/indexnow-featured-snippets.mjs
 */

import { readFileSync } from 'fs'

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

const TOP_CITIES = [
  'paris','marseille','lyon','toulouse','nice','nantes','strasbourg','montpellier',
  'bordeaux','lille','rennes','reims','le-havre','saint-etienne','toulon','grenoble',
  'dijon','angers','nimes','villeurbanne','clermont-ferrand','le-mans','aix-en-provence',
  'brest','tours','amiens','limoges','perpignan','metz','besancon','orleans','rouen',
  'mulhouse','caen','nancy','argenteuil','saint-denis','montreuil','avignon','poitiers',
  'versailles','nanterre','creteil','pau','colombes','vitry-sur-seine','aulnay-sous-bois',
  'courbevoie','asnieres-sur-seine','rueil-malmaison',
]

const REGIONS = [
  'ile-de-france','auvergne-rhone-alpes','nouvelle-aquitaine','occitanie',
  'hauts-de-france','grand-est','provence-alpes-cote-dazur','pays-de-la-loire',
  'normandie','bretagne','bourgogne-franche-comte','centre-val-de-loire',
  'corse','outre-mer','guadeloupe','martinique',
]

const DEPARTMENTS = [
  '01','02','03','04','05','06','07','08','09','10','11','12','13','14','15','16','17','18','19',
  '21','22','23','24','25','26','27','28','29','2a','2b','30','31','32','33','34','35','36','37',
  '38','39','40','41','42','43','44','45','46','47','48','49','50','51','52','53','54','55','56',
  '57','58','59','60','61','62','63','64','65','66','67','68','69','70','71','72','73','74','75',
  '76','77','78','79','80','81','82','83','84','85','86','87','88','89','90','91','92','93','94','95',
]

const sleep = ms => new Promise(r => setTimeout(r, ms))

// ---------------------------------------------------------------------------
// 1. Build all URLs
// ---------------------------------------------------------------------------
const urls = []

// Service hub pages: /services/{service} (46 URLs)
for (const s of ALL_SERVICES) {
  urls.push(`${SITE_URL}/services/${s}`)
}
console.log(`Service hubs: ${ALL_SERVICES.length}`)

// Service × top cities: /services/{service}/{city} (46 × 50 = 2,300 URLs)
for (const s of ALL_SERVICES) {
  for (const c of TOP_CITIES) {
    urls.push(`${SITE_URL}/services/${s}/${c}`)
  }
}
console.log(`Service × top cities: ${ALL_SERVICES.length * TOP_CITIES.length}`)

// Region × service: /regions/{region}/{service} (16 × 46 = 736 URLs)
for (const r of REGIONS) {
  for (const s of ALL_SERVICES) {
    urls.push(`${SITE_URL}/regions/${r}/${s}`)
  }
}
console.log(`Region × service: ${REGIONS.length * ALL_SERVICES.length}`)

// Department × service (top 5 services): /departements/{dept}/{service}
const TOP_SERVICES = ['plombier','electricien','serrurier','chauffagiste','couvreur']
for (const d of DEPARTMENTS) {
  for (const s of TOP_SERVICES) {
    urls.push(`${SITE_URL}/departements/${d}/${s}`)
  }
}
console.log(`Department × top services: ${DEPARTMENTS.length * TOP_SERVICES.length}`)

// Tarifs hub pages: /tarifs/{service} (46 URLs) — already have tables but re-ping
for (const s of ALL_SERVICES) {
  urls.push(`${SITE_URL}/tarifs/${s}`)
}
console.log(`Tarifs hubs: ${ALL_SERVICES.length}`)

console.log(`\nTotal URLs to submit: ${urls.length.toLocaleString('fr-FR')}`)

// ---------------------------------------------------------------------------
// 2. Submit to Bing + Yandex in batches of 10K
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
  const allOk = results.every(r => [200, 202, 204].includes(r.status))
  if (allOk) totalSuccess += batch.length

  console.log(`  Batch ${batchNum}/${totalBatches}: ${batch.length.toLocaleString('fr-FR')} URLs → ${statuses}${allOk ? ' ✓' : ''}`)

  if (i + BATCH_SIZE < urls.length) await sleep(5000)
}

console.log(`\n=== IndexNow Featured Snippets — Complete ===`)
console.log(`  Submitted: ${urls.length.toLocaleString('fr-FR')} URLs`)
console.log(`  Successful: ${totalSuccess.toLocaleString('fr-FR')}`)
console.log(`\nBing + Yandex vont re-crawler ces pages avec les nouveaux tableaux.`)
console.log(`Google suivra via les sitemaps dans les prochains jours.`)
