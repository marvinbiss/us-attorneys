import { createClient } from '@supabase/supabase-js'
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { autoRefreshToken: false, persistSession: false } })

async function main() {
  const { data } = await s.from('courthouses').select('*').eq('is_active', true).limit(1)
  if (data?.[0]) {
    console.log('Courthouse columns:', Object.keys(data[0]).join(', '))
    console.log('Sample:', JSON.stringify(data[0], null, 2))
  } else {
    console.log('No courthouse data')
  }

  const { data: loc } = await s.from('locations_us').select('*').limit(1)
  if (loc?.[0]) {
    console.log('\nlocations_us columns:', Object.keys(loc[0]).join(', '))
  }
}
main().catch(e => { console.error(e); process.exit(1) })
