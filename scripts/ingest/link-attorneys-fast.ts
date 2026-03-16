/**
 * Fast Attorney → City Linking (optimized, multi-agent compatible)
 *
 * Strategy: Pre-load ALL lookups in memory, then batch-update.
 * - citySlug|stateAbbr → location_id  (32K entries)
 * - zipCode → location_id             (33K entries)
 * No individual DB queries per attorney = 100x faster.
 *
 * Supports splitting work across agents via --offset and --chunk flags.
 *
 * Usage:
 *   npx tsx scripts/ingest/link-attorneys-fast.ts [--dry-run]
 *   npx tsx scripts/ingest/link-attorneys-fast.ts --offset 0 --chunk 100000
 *   npx tsx scripts/ingest/link-attorneys-fast.ts --offset 100000 --chunk 100000
 *
 * Safe: Only updates attorneys where location_id IS NULL (preserves existing links).
 */

import { createClient } from '@supabase/supabase-js'

const PAGE = 1000
const UPDATE_BATCH = 200

const args = process.argv.slice(2)
const DRY_RUN = args.includes('--dry-run')
const OFFSET = (() => {
  const idx = args.indexOf('--offset')
  return idx !== -1 ? parseInt(args[idx + 1], 10) : 0
})()
const CHUNK = (() => {
  const idx = args.indexOf('--chunk')
  return idx !== -1 ? parseInt(args[idx + 1], 10) : Infinity
})()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

async function main() {
  const agentLabel = CHUNK < Infinity ? `[offset=${OFFSET}, chunk=${CHUNK}]` : '[ALL]'
  console.log(`=== Fast Attorney → City Linking ${agentLabel} ===`)
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN' : 'LIVE'}`)
  console.log()

  // ========================================================================
  // PHASE 1: Pre-load all lookups into memory
  // ========================================================================

  // 1a. Load states
  const { data: states } = await supabase.from('states').select('id, abbreviation')
  if (!states?.length) { console.error('No states.'); process.exit(1) }

  const stateIdToAbbr = new Map(states.map(s => [s.id, s.abbreviation]))
  const stateAbbrToId = new Map(states.map(s => [s.abbreviation, s.id]))
  console.log(`States: ${states.length}`)

  // 1b. Load ALL cities → build "slug|ABBR" → location_id
  console.log('Loading cities into memory...')
  const cityMap = new Map<string, string>() // "slug|ABBR" → location_id
  let cityOffset = 0

  while (true) {
    const { data: cities } = await supabase
      .from('locations_us')
      .select('id, slug, state_id')
      .range(cityOffset, cityOffset + PAGE - 1)

    if (!cities?.length) break
    cities.forEach(c => {
      const abbr = stateIdToAbbr.get(c.state_id)
      if (abbr) cityMap.set(`${c.slug}|${abbr}`, c.id)
    })
    cityOffset += PAGE
    if (cities.length < PAGE) break
  }
  console.log(`City lookup: ${cityMap.size.toLocaleString()} entries`)

  // 1c. Load ALL zip_codes → build "code" → location_id
  console.log('Loading ZIP→city mappings into memory...')
  const zipMap = new Map<string, string>() // "00601" → location_id
  let zipOffset = 0

  while (true) {
    const { data: zips } = await supabase
      .from('zip_codes')
      .select('code, location_id')
      .not('location_id', 'is', null)
      .range(zipOffset, zipOffset + PAGE - 1)

    if (!zips?.length) break
    zips.forEach(z => {
      if (z.location_id) zipMap.set(z.code, z.location_id)
    })
    zipOffset += PAGE
    if (zips.length < PAGE) break
  }
  console.log(`ZIP lookup: ${zipMap.size.toLocaleString()} entries`)

  // ========================================================================
  // PHASE 2: Process attorneys (location_id IS NULL only)
  // ========================================================================

  console.log('\nProcessing attorneys...')
  let processed = 0
  let matchedByCity = 0
  let matchedByZip = 0
  let noMatch = 0
  let updated = 0
  let errors = 0
  let dbOffset = OFFSET

  while (processed < CHUNK) {
    const { data: attorneys } = await supabase
      .from('attorneys')
      .select('id, address_city, address_state, address_zip, state_id')
      .is('location_id', null)
      .range(dbOffset, dbOffset + PAGE - 1)

    if (!attorneys?.length) break

    // In-memory matching — zero DB queries
    const updates: { id: string; location_id: string; state_id?: string }[] = []

    for (const a of attorneys) {
      let locationId: string | null = null

      // Strategy 1: city slug + state abbreviation (fast, exact)
      if (a.address_city && a.address_state) {
        const key = `${slugify(a.address_city)}|${a.address_state}`
        locationId = cityMap.get(key) || null
        if (locationId) matchedByCity++
      }

      // Strategy 2: ZIP code → pre-linked location (fast, from memory)
      if (!locationId && a.address_zip) {
        const zip = a.address_zip.padStart(5, '0')
        locationId = zipMap.get(zip) || null
        if (locationId) matchedByZip++
      }

      if (locationId) {
        const update: typeof updates[0] = { id: a.id, location_id: locationId }
        // Also set state_id if missing
        if (!a.state_id && a.address_state) {
          const sid = stateAbbrToId.get(a.address_state)
          if (sid) update.state_id = sid
        }
        updates.push(update)
      } else {
        noMatch++
      }
    }

    processed += attorneys.length

    // Batch write updates
    if (!DRY_RUN && updates.length > 0) {
      // Group by location_id for efficient batch updates
      const byLocation = new Map<string, string[]>()
      const stateUpdates = new Map<string, string>() // attorney_id → state_id

      updates.forEach(u => {
        const ids = byLocation.get(u.location_id) || []
        ids.push(u.id)
        byLocation.set(u.location_id, ids)
        if (u.state_id) stateUpdates.set(u.id, u.state_id)
      })

      for (const [locationId, ids] of byLocation) {
        // Split into sub-batches for Supabase .in() limit
        for (let i = 0; i < ids.length; i += UPDATE_BATCH) {
          const subBatch = ids.slice(i, i + UPDATE_BATCH)
          const { error } = await supabase
            .from('attorneys')
            .update({ location_id: locationId })
            .in('id', subBatch)

          if (error) {
            errors += subBatch.length
          } else {
            updated += subBatch.length
          }
        }
      }

      // Update state_id separately for those that need it
      if (stateUpdates.size > 0) {
        const byState = new Map<string, string[]>()
        stateUpdates.forEach((stateId, attId) => {
          const ids = byState.get(stateId) || []
          ids.push(attId)
          byState.set(stateId, ids)
        })

        for (const [stateId, ids] of byState) {
          for (let i = 0; i < ids.length; i += UPDATE_BATCH) {
            await supabase
              .from('attorneys')
              .update({ state_id: stateId })
              .in('id', ids.slice(i, i + UPDATE_BATCH))
          }
        }
      }
    }

    const total = matchedByCity + matchedByZip + noMatch
    const pct = total > 0 ? Math.round((matchedByCity + matchedByZip) / total * 100) : 0
    process.stdout.write(
      `  ${processed.toLocaleString()} processed — ${(matchedByCity + matchedByZip).toLocaleString()} matched (${pct}%) | city: ${matchedByCity.toLocaleString()}, zip: ${matchedByZip.toLocaleString()}\r`
    )

    // Important: don't increment dbOffset — we always query location_id IS NULL
    // As we update them, the next query automatically gets the next unlinked batch
    if (attorneys.length < PAGE) break
  }

  console.log('\n')

  if (DRY_RUN) {
    console.log('--- DRY RUN ---')
    console.log(`Would match: ${(matchedByCity + matchedByZip).toLocaleString()}`)
    console.log(`  By city: ${matchedByCity.toLocaleString()}`)
    console.log(`  By ZIP:  ${matchedByZip.toLocaleString()}`)
    console.log(`No match:  ${noMatch.toLocaleString()}`)
    return
  }

  console.log(`=== LINKING COMPLETE ${agentLabel} ===`)
  console.log(`Processed: ${processed.toLocaleString()}`)
  console.log(`Matched:   ${(matchedByCity + matchedByZip).toLocaleString()}`)
  console.log(`  By city: ${matchedByCity.toLocaleString()}`)
  console.log(`  By ZIP:  ${matchedByZip.toLocaleString()}`)
  console.log(`No match:  ${noMatch.toLocaleString()}`)
  console.log(`Updated:   ${updated.toLocaleString()}`)
  console.log(`Errors:    ${errors}`)

  const { count: linked } = await supabase
    .from('attorneys')
    .select('*', { count: 'exact', head: true })
    .not('location_id', 'is', null)

  const { count: total } = await supabase
    .from('attorneys')
    .select('*', { count: 'exact', head: true })

  console.log(`\nAttorneys linked: ${linked?.toLocaleString() || '?'} / ${total?.toLocaleString() || '?'}`)
}

main().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
