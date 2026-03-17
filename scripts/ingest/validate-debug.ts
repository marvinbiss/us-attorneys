import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

async function debug() {
  // Check statute_of_limitations table
  const { data: solData, error: solErr } = await supabase.from('statute_of_limitations').select('*').limit(1)
  console.log('SOL table:', solErr ? 'ERROR: ' + solErr.message + ' (code: ' + solErr.code + ')' : 'OK, rows: ' + solData?.length)
  if (solData?.length) console.log('  Sample:', JSON.stringify(solData[0]))

  // Check census_data column on locations_us
  const { data: censusData, error: censusErr } = await supabase.from('locations_us').select('name, census_data').not('census_data', 'is', null).limit(1)
  console.log('Census data:', censusErr ? 'ERROR: ' + censusErr.message : 'rows with data: ' + censusData?.length)
  if (censusData?.length) console.log('  Sample:', JSON.stringify(censusData[0]))

  // Check courthouses detail
  const { data: courtSample, error: courtErr } = await supabase.from('courthouses').select('name, court_type, state_code, courtlistener_id, location_id, county_id').eq('is_active', true).limit(3)
  console.log('Court samples:', courtErr ? 'ERROR: ' + courtErr.message : JSON.stringify(courtSample, null, 2))

  // Check if courthouses have state coverage
  const { data: courtStates } = await supabase.from('courthouses').select('state_code').eq('is_active', true)
  const uniqueCourtStates = new Set(courtStates?.map(r => r.state_code))
  console.log('Court states covered:', uniqueCourtStates.size)
}

debug().catch(err => { console.error(err); process.exit(1) })
