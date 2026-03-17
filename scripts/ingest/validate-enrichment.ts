import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

async function validate() {
  console.log('=== DATA ENRICHMENT VALIDATION ===')
  console.log(`Run time: ${new Date().toISOString()}\n`)
  let issues = 0

  // 1. STATUTE OF LIMITATIONS
  console.log('--- Statute of Limitations ---')

  const { count: solCount, error: solErr } = await supabase
    .from('statute_of_limitations')
    .select('*', { count: 'exact', head: true })

  if (solErr) {
    console.log(`  Table status: NOT FOUND (${solErr.code}) - agent may still be creating it`)
    issues++
  } else {
    console.log(`Total entries: ${solCount}`)

    // Check all 51 states are covered
    const { data: solStates } = await supabase
      .from('statute_of_limitations')
      .select('state_code')
    const uniqueStates = new Set(solStates?.map(r => r.state_code))
    console.log(`Unique states: ${uniqueStates.size} (expected: 51)`)
    if (uniqueStates.size < 51) { issues++; console.log('  WARNING: Missing states!') }

    // Check specialty coverage
    const { data: solSpecs } = await supabase
      .from('statute_of_limitations')
      .select('specialty_slug')
    const uniqueSpecs = new Set(solSpecs?.map(r => r.specialty_slug))
    console.log(`Unique specialties: ${uniqueSpecs.size} (expected: 75)`)

    // Check for NULL years
    const { count: nullYears } = await supabase
      .from('statute_of_limitations')
      .select('*', { count: 'exact', head: true })
      .is('years', null)
    if (nullYears && nullYears > 0) { issues++; console.log(`  WARNING: ${nullYears} entries with NULL years`) }

    // Sample data check - CA PI
    const { data: caPIcheck } = await supabase
      .from('statute_of_limitations')
      .select('years, discovery_rule, description')
      .eq('state_code', 'CA')
      .eq('specialty_slug', 'personal-injury')
      .single()
    if (caPIcheck) {
      console.log(`  CA personal-injury: ${caPIcheck.years} years, discovery: ${caPIcheck.discovery_rule}`)
      if (caPIcheck.years !== 2) { issues++; console.log('  ERROR: CA PI should be 2 years!') }
    }

    // Sample data check - NY med-mal
    const { data: nyMedMalCheck } = await supabase
      .from('statute_of_limitations')
      .select('years, discovery_rule')
      .eq('state_code', 'NY')
      .eq('specialty_slug', 'medical-malpractice')
      .single()
    if (nyMedMalCheck) {
      console.log(`  NY medical-malpractice: ${nyMedMalCheck.years} years, discovery: ${nyMedMalCheck.discovery_rule}`)
      if (nyMedMalCheck.years !== 2.5) { issues++; console.log('  ERROR: NY med-mal should be 2.5 years!') }
    }

    // Cross-reference: SOL specialties match DB specialties
    const { data: dbSpecs } = await supabase
      .from('specialties')
      .select('slug')
      .eq('is_active', true)
    const dbSpecSlugs = new Set(dbSpecs?.map(s => s.slug))
    const unmatchedSpecs = Array.from(uniqueSpecs).filter(s => !dbSpecSlugs.has(s))
    if (unmatchedSpecs.length > 0) {
      issues++
      console.log(`  WARNING: SOL has ${unmatchedSpecs.length} specialties not in DB: ${unmatchedSpecs.slice(0, 10).join(', ')}${unmatchedSpecs.length > 10 ? '...' : ''}`)
    } else if (uniqueSpecs.size > 0) {
      console.log(`  All SOL specialties match DB specialties`)
    }
  }

  // 2. CENSUS DATA
  console.log('\n--- Census Data ---')

  // Check if census_data column exists by trying to query it
  const { error: censusColErr } = await supabase
    .from('locations_us')
    .select('census_data')
    .limit(1)

  if (censusColErr) {
    console.log(`  census_data column: NOT FOUND - agent may still be adding it`)
    console.log(`  (Error: ${censusColErr.message})`)
    issues++
  } else {
    const { count: censusCount } = await supabase
      .from('locations_us')
      .select('*', { count: 'exact', head: true })
      .not('census_data', 'is', null)
    console.log(`Cities with census_data: ${censusCount}`)

    const { count: totalCities } = await supabase
      .from('locations_us')
      .select('*', { count: 'exact', head: true })
    console.log(`Total cities: ${totalCities}`)
    if (censusCount && totalCities) {
      console.log(`Coverage: ${((censusCount / totalCities) * 100).toFixed(1)}%`)
    }

    // Sample check - NYC
    const { data: nycCheck } = await supabase
      .from('locations_us')
      .select('name, census_data')
      .eq('slug', 'new-york')
      .limit(1)
    if (nycCheck?.[0]?.census_data) {
      const cd = nycCheck[0].census_data as any
      console.log(`  New York: pop=${cd.population}, income=$${cd.median_household_income}, age=${cd.median_age}`)
      if (cd.population && cd.population < 1000000) { issues++; console.log('  ERROR: NYC population too low!') }
    } else {
      console.log('  New York: no census data yet')
    }
  }

  // 3. COURTHOUSES
  console.log('\n--- Courthouses ---')

  const { count: totalCourts } = await supabase
    .from('courthouses')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true)
  console.log(`Total active courts: ${totalCourts}`)

  const { count: linkedCourts } = await supabase
    .from('courthouses')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true)
    .not('location_id', 'is', null)
  console.log(`Courts with location_id: ${linkedCourts}`)

  const { count: countyLinked } = await supabase
    .from('courthouses')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true)
    .not('county_id', 'is', null)
  console.log(`Courts with county_id: ${countyLinked}`)

  const { count: clLinked } = await supabase
    .from('courthouses')
    .select('*', { count: 'exact', head: true })
    .not('courtlistener_id', 'is', null)
  console.log(`Courts with courtlistener_id: ${clLinked}`)

  // State coverage
  const { data: courtStateData } = await supabase
    .from('courthouses')
    .select('address_state')
    .eq('is_active', true)
  if (courtStateData) {
    const courtStates = new Set(courtStateData.map(r => r.address_state).filter(Boolean))
    console.log(`States covered: ${courtStates.size}`)
  }

  // Court type distribution
  const { data: courtTypes } = await supabase
    .from('courthouses')
    .select('court_type')
    .eq('is_active', true)
  if (courtTypes) {
    const typeDist: Record<string, number> = {}
    courtTypes.forEach(r => { typeDist[r.court_type] = (typeDist[r.court_type] || 0) + 1 })
    console.log('\nCourt type distribution:')
    Object.entries(typeDist).sort((a, b) => b[1] - a[1]).forEach(([t, c]) => console.log(`  ${t}: ${c}`))
  }

  // Check for courts with no name
  const { count: noName } = await supabase
    .from('courthouses')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true)
    .is('name', null)
  if (noName && noName > 0) { issues++; console.log(`\n  WARNING: ${noName} courts with NULL name`) }

  // Check for duplicate slugs
  const { data: allSlugs } = await supabase
    .from('courthouses')
    .select('slug')
    .eq('is_active', true)
  if (allSlugs) {
    const slugCounts: Record<string, number> = {}
    allSlugs.forEach(r => { slugCounts[r.slug] = (slugCounts[r.slug] || 0) + 1 })
    const dupes = Object.entries(slugCounts).filter(([_, c]) => c > 1)
    if (dupes.length > 0) {
      issues++
      console.log(`\n  WARNING: ${dupes.length} duplicate slugs: ${dupes.slice(0, 5).map(([s, c]) => `${s}(${c})`).join(', ')}`)
    } else {
      console.log(`\n  No duplicate courthouse slugs`)
    }
  }

  // Check SCOTUS is correctly typed
  const { data: scotus } = await supabase
    .from('courthouses')
    .select('name, court_type, jurisdiction')
    .eq('courtlistener_id', 'scotus')
    .single()
  if (scotus) {
    console.log(`  SCOTUS: type=${scotus.court_type}, jurisdiction=${scotus.jurisdiction}`)
    if (scotus.court_type === 'federal_district') {
      console.log('  NOTE: SCOTUS typed as federal_district - may want to update to federal_supreme')
    }
  }

  // SUMMARY
  console.log('\n' + '='.repeat(50))
  console.log(`  VALIDATION ${issues === 0 ? 'PASSED' : `COMPLETED WITH ${issues} ISSUE(S)`}`)
  console.log('='.repeat(50))
}

validate().catch(err => {
  console.error('Validation error:', err)
  process.exit(1)
})
