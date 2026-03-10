const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.local') });

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  for (const prefix of ['01','02','03','04','05','08','09']) {
    let total = 0;
    while (true) {
      const { data } = await sb.from('providers')
        .select('id')
        .eq('is_active', true)
        .like('phone', prefix + '%')
        .limit(500);
      if (!data || data.length === 0) break;
      const ids = data.map(d => d.id);
      const { error } = await sb.from('providers')
        .update({ phone: null })
        .in('id', ids);
      if (error) { console.log('Err:', error.message); break; }
      total += ids.length;
      process.stdout.write('  ' + prefix + ': ' + total + '\r');
    }
    console.log('Prefix ' + prefix + ': ' + total + ' nettoyes');
  }
  const { count } = await sb.from('providers').select('id', { count: 'exact', head: true }).not('phone', 'is', null).eq('is_active', true);
  console.log('\nPhones restants:', count, '(tous portables 06/07)');
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
