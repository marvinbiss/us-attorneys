/**
 * Link Attorneys to their city in locations_us
 *
 * Prerequisite: Run cities.ts first.
 *
 * Strategy: Match attorneys to cities using address_city + address_state.
 * Falls back to ZIP code → city linkage.
 * Updates attorneys.location_id and attorneys.state_id.
 *
 * Usage: npx tsx scripts/ingest/link-attorneys-to-cities.ts [--dry-run]
 */

import { createClient } from '@supabase/supabase-js'

const BATCH_SIZE = 500
const PAGE = 1000
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

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

async function main() {
  console.log('=== Link Attorneys to Cities ===')
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN' : 'LIVE'}`)
  console.log()

  // 1. Load states
  const { data: states } = await supabase
    .from('states')
    .select('id, abbreviation')

  if (!states?.length) {
    console.error('No states in DB.')
    process.exit(1)
  }

  const stateByAbbr = new Map(states.map(s => [s.abbreviation, s.id]))
  console.log(`Loaded ${stateByAbbr.size} states`)

  // 2. Load all cities — build lookup: "city-slug|STATE" → location_id
  console.log('Loading cities...')
  const cityLookup = new Map<string, string>() // "slug|state_id" → id
  const cityBySlugState = new Map<string, string>() // "slug|ABBR" → id
  let cityOffset = 0

  while (true) {
    const { data: cities } = await supabase
      .from('locations_us')
      .select('id, slug, state_id, name')
      .range(cityOffset, cityOffset + PAGE - 1)

    if (!cities?.length) break

    cities.forEach(c => {
      cityLookup.set(`${c.slug}|${c.state_id}`, c.id)
      // Also map by state abbreviation for easy attorney matching
      const stateAbbr = states.find(s => s.id === c.state_id)?.abbreviation
      if (stateAbbr) {
        cityBySlugState.set(`${c.slug}|${stateAbbr}`, c.id)
      }
    })

    cityOffset += PAGE
    if (cities.length < PAGE) break
  }

  console.log(`Loaded ${cityLookup.size.toLocaleString()} cities`)

  if (cityLookup.size === 0) {
    console.error('No cities found. Run cities.ts first.')
    process.exit(1)
  }

  // 3. Load attorneys without location_id
  console.log('Loading attorneys...')
  let attorneyOffset = 0
  let totalAttorneys = 0
  let matched = 0
  let matchedByCity = 0
  let matchedByZip = 0
  let noMatch = 0
  let updated = 0
  let errors = 0

  while (true) {
    const { data: attorneys } = await supabase
      .from('attorneys')
      .select('id, address_city, address_state, address_zip, state_id, location_id')
      .is('location_id', null)
      .range(attorneyOffset, attorneyOffset + PAGE - 1)

    if (!attorneys?.length) break

    totalAttorneys += attorneys.length

    // Match each attorney to a city
    const updates: { id: string; location_id: string; state_id?: string }[] = []

    for (const a of attorneys) {
      let locationId: string | null = null

      // Strategy 1: Match by city name + state
      if (a.address_city && a.address_state) {
        const citySlug = slugify(a.address_city)
        locationId = cityBySlugState.get(`${citySlug}|${a.address_state}`) || null
        if (locationId) matchedByCity++
      }

      // Strategy 2: Fall back to ZIP code → location mapping
      if (!locationId && a.address_zip) {
        const { data: zipData } = await supabase
          .from('zip_codes')
          .select('location_id')
          .eq('code', a.address_zip.padStart(5, '0'))
          .not('location_id', 'is', null)
          .limit(1)
          .single()

        if (zipData?.location_id) {
          locationId = zipData.location_id
          matchedByZip++
        }
      }

      if (locationId) {
        matched++
        const update: { id: string; location_id: string; state_id?: string } = {
          id: a.id,
          location_id: locationId,
        }

        // Also set state_id if missing
        if (!a.state_id && a.address_state) {
          const stateId = stateByAbbr.get(a.address_state)
          if (stateId) update.state_id = stateId
        }

        updates.push(update)
      } else {
        noMatch++
      }
    }

    if (!DRY_RUN && updates.length > 0) {
      // Batch update
      for (let i = 0; i < updates.length; i += BATCH_SIZE) {
        const batch = updates.slice(i, i + BATCH_SIZE)

        for (const u of batch) {
          const updateData: Record<string, string> = { location_id: u.location_id }
          if (u.state_id) updateData.state_id = u.state_id

          const { error } = await supabase
            .from('attorneys')
            .update(updateData)
            .eq('id', u.id)

          if (error) {
            errors++
          } else {
            updated++
          }
        }
      }
    }

    process.stdout.write(
      `  Processed ${totalAttorneys.toLocaleString()} attorneys — ${matched.toLocaleString()} matched (${matchedByCity} by city, ${matchedByZip} by ZIP)\r`
    )

    attorneyOffset += PAGE
    if (attorneys.length < PAGE) break
  }

  console.log('\n')

  if (DRY_RUN) {
    console.log('--- DRY RUN ---')
    console.log(`Total attorneys without location: ${totalAttorneys.toLocaleString()}`)
    console.log(`Would match: ${matched.toLocaleString()}`)
    console.log(`  By city name: ${matchedByCity.toLocaleString()}`)
    console.log(`  By ZIP code:  ${matchedByZip.toLocaleString()}`)
    console.log(`No match: ${noMatch.toLocaleString()}`)
    console.log('\nDry run complete.')
    return
  }

  console.log('=== LINKING COMPLETE ===')
  console.log(`Attorneys processed: ${totalAttorneys.toLocaleString()}`)
  console.log(`Matched: ${matched.toLocaleString()}`)
  console.log(`  By city name: ${matchedByCity.toLocaleString()}`)
  console.log(`  By ZIP code:  ${matchedByZip.toLocaleString()}`)
  console.log(`No match: ${noMatch.toLocaleString()}`)
  console.log(`Updated: ${updated.toLocaleString()}`)
  console.log(`Errors:  ${errors}`)

  // Verify
  const { count: linkedCount } = await supabase
    .from('attorneys')
    .select('*', { count: 'exact', head: true })
    .not('location_id', 'is', null)

  const { count: totalCount } = await supabase
    .from('attorneys')
    .select('*', { count: 'exact', head: true })

  console.log(`\nAttorneys with city link: ${linkedCount?.toLocaleString() || '0'} / ${totalCount?.toLocaleString() || '0'}`)
}

main().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
