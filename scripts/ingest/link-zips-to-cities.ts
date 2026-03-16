/**
 * Link ZIP codes to their nearest city in locations_us
 *
 * Prerequisite: Run cities.ts and zip-codes.ts first.
 *
 * Strategy: For each ZIP code, find the closest city in the same state
 * using lat/lng distance (Haversine). Updates zip_codes.location_id.
 *
 * Usage: npx tsx scripts/ingest/link-zips-to-cities.ts [--dry-run]
 */

import { createClient } from '@supabase/supabase-js'

const BATCH_SIZE = 500
const args = process.argv.slice(2)
const DRY_RUN = args.includes('--dry-run')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

// Haversine distance in km
function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

interface City {
  id: string
  slug: string
  state_id: string
  latitude: number
  longitude: number
}

interface ZipCode {
  id: string
  code: string
  state_id: string
  latitude: number
  longitude: number
  location_id: string | null
}

async function main() {
  console.log('=== Link ZIP Codes to Cities ===')
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN' : 'LIVE'}`)
  console.log()

  // 1. Load all cities grouped by state
  console.log('Loading cities from locations_us...')
  const citiesByState = new Map<string, City[]>()
  let cityOffset = 0
  const PAGE = 1000

  while (true) {
    const { data: cities } = await supabase
      .from('locations_us')
      .select('id, slug, state_id, latitude, longitude')
      .not('latitude', 'is', null)
      .not('longitude', 'is', null)
      .range(cityOffset, cityOffset + PAGE - 1)

    if (!cities?.length) break

    cities.forEach((c: City) => {
      const existing = citiesByState.get(c.state_id) || []
      existing.push(c)
      citiesByState.set(c.state_id, existing)
    })

    cityOffset += PAGE
    if (cities.length < PAGE) break
  }

  const totalCities = Array.from(citiesByState.values()).reduce((s, arr) => s + arr.length, 0)
  console.log(`Loaded ${totalCities.toLocaleString()} cities across ${citiesByState.size} states`)

  if (totalCities === 0) {
    console.error('No cities found. Run cities.ts first.')
    process.exit(1)
  }

  // 2. Load all ZIP codes
  console.log('Loading ZIP codes...')
  const allZips: ZipCode[] = []
  let zipOffset = 0

  while (true) {
    const { data: zips } = await supabase
      .from('zip_codes')
      .select('id, code, state_id, latitude, longitude, location_id')
      .not('latitude', 'is', null)
      .not('longitude', 'is', null)
      .range(zipOffset, zipOffset + PAGE - 1)

    if (!zips?.length) break
    allZips.push(...(zips as ZipCode[]))
    zipOffset += PAGE
    if (zips.length < PAGE) break
  }

  console.log(`Loaded ${allZips.length.toLocaleString()} ZIP codes`)

  // Filter to unlinked ZIPs only (unless dry-run, show all)
  const unlinked = DRY_RUN ? allZips : allZips.filter(z => !z.location_id)
  console.log(`Unlinked ZIPs to process: ${unlinked.length.toLocaleString()}`)

  if (unlinked.length === 0) {
    console.log('All ZIP codes already linked. Nothing to do.')
    return
  }

  // 3. Find nearest city for each ZIP
  console.log('\nMatching ZIP codes to nearest city...')
  let matched = 0
  let noMatch = 0
  const updates: { id: string; location_id: string }[] = []

  for (const zip of unlinked) {
    const stateCities = citiesByState.get(zip.state_id)
    if (!stateCities?.length) {
      noMatch++
      continue
    }

    // Find nearest city by Haversine distance
    let nearest: City | null = null
    let nearestDist = Infinity

    for (const city of stateCities) {
      const dist = haversine(zip.latitude, zip.longitude, city.latitude, city.longitude)
      if (dist < nearestDist) {
        nearestDist = dist
        nearest = city
      }
    }

    // Max 80km — if the nearest city is further, don't link (rural/remote area)
    if (nearest && nearestDist <= 80) {
      updates.push({ id: zip.id, location_id: nearest.id })
      matched++
    } else {
      noMatch++
    }
  }

  console.log(`Matched: ${matched.toLocaleString()}`)
  console.log(`No match (>80km from any city): ${noMatch.toLocaleString()}`)

  if (DRY_RUN) {
    console.log('\n--- DRY RUN: first 10 matches ---')
    for (let i = 0; i < Math.min(10, updates.length); i++) {
      const u = updates[i]
      const zip = allZips.find(z => z.id === u.id)
      console.log(`  ZIP ${zip?.code} → location ${u.location_id}`)
    }
    console.log('\nDry run complete.')
    return
  }

  // 4. Batch update
  console.log(`\nUpdating ${updates.length.toLocaleString()} ZIP codes...`)
  let updated = 0
  let errors = 0

  for (let i = 0; i < updates.length; i += BATCH_SIZE) {
    const batch = updates.slice(i, i + BATCH_SIZE)

    // Supabase doesn't support batch update by different IDs easily,
    // so we use individual updates grouped by location_id
    const byLocation = new Map<string, string[]>()
    batch.forEach(u => {
      const existing = byLocation.get(u.location_id) || []
      existing.push(u.id)
      byLocation.set(u.location_id, existing)
    })

    for (const [locationId, zipIds] of byLocation) {
      const { error } = await supabase
        .from('zip_codes')
        .update({ location_id: locationId })
        .in('id', zipIds)

      if (error) {
        errors += zipIds.length
      } else {
        updated += zipIds.length
      }
    }

    if ((i / BATCH_SIZE) % 10 === 0 || i + BATCH_SIZE >= updates.length) {
      const pct = Math.min(100, Math.round(((i + batch.length) / updates.length) * 100))
      process.stdout.write(`  ${pct}% — ${updated.toLocaleString()} updated\r`)
    }
  }

  console.log('\n')
  console.log('=== LINKING COMPLETE ===')
  console.log(`Updated: ${updated.toLocaleString()}`)
  console.log(`Errors:  ${errors}`)

  // Verify
  const { count: linkedCount } = await supabase
    .from('zip_codes')
    .select('*', { count: 'exact', head: true })
    .not('location_id', 'is', null)

  console.log(`\nZIP codes with city link: ${linkedCount?.toLocaleString() || 'unknown'} / ${allZips.length.toLocaleString()}`)
}

main().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
