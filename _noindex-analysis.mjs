import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const SUPABASE_URL = 'https://umjmbdbwcsxrvfqktiui.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVtam1iZGJ3Y3N4cnZmcWt0aXVpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTY2NjQ1OCwiZXhwIjoyMDg1MjQyNDU4fQ.6hXdR5jfhCl1AA5052k3YrBmI-UMhu36mxV2IPvYxjc';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Load INSEE resolver
const communeDataRaw = JSON.parse(fs.readFileSync(path.resolve('src/lib/data/insee-communes.json'), 'utf-8'));
const communes = communeDataRaw;

function _normalize(t) {
  return t.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
}

let _reverseMap = null;
function getReverseMap() {
  if (_reverseMap) return _reverseMap;
  _reverseMap = new Map();
  for (const [code, info] of Object.entries(communes)) {
    const key = _normalize(info.n);
    const existing = _reverseMap.get(key);
    if (existing) existing.push(code);
    else _reverseMap.set(key, [code]);
  }
  return _reverseMap;
}

function getInseeCodesForCity(cityName) {
  return getReverseMap().get(_normalize(cityName)) || [];
}

function getCityValues(cityName) {
  const codes = getInseeCodesForCity(cityName);
  const normalized = _normalize(cityName);
  const arrCodes = [];
  if (normalized === 'paris') for (let i = 75101; i <= 75120; i++) arrCodes.push(String(i));
  else if (normalized === 'marseille') for (let i = 13201; i <= 13216; i++) arrCodes.push(String(i));
  else if (normalized === 'lyon') for (let i = 69381; i <= 69389; i++) arrCodes.push(String(i));
  return [cityName, ...codes, ...arrCodes];
}

const SMALL_CITIES = [
  { name: 'Foix', slug: 'foix', dept: '09' },
  { name: 'Mende', slug: 'mende', dept: '48' },
  { name: 'Privas', slug: 'privas', dept: '07' },
  { name: 'Gueret', slug: 'gueret', dept: '23' },
  { name: 'Tulle', slug: 'tulle', dept: '19' },
  { name: 'Aurillac', slug: 'aurillac', dept: '15' },
  { name: 'Vesoul', slug: 'vesoul', dept: '70' },
  { name: 'Bar-le-Duc', slug: 'bar-le-duc', dept: '55' },
  { name: 'Cahors', slug: 'cahors', dept: '46' },
  { name: 'Auch', slug: 'auch', dept: '32' },
  { name: 'Laon', slug: 'laon', dept: '02' },
  { name: 'Chaumont', slug: 'chaumont', dept: '52' },
  { name: 'Digne-les-Bains', slug: 'digne-les-bains', dept: '04' },
  { name: 'Gap', slug: 'gap', dept: '05' },
  { name: 'Lons-le-Saunier', slug: 'lons-le-saunier', dept: '39' },
  { name: 'Nevers', slug: 'nevers', dept: '58' },
  { name: 'Mont-de-Marsan', slug: 'mont-de-marsan', dept: '40' },
  { name: 'Mamoudzou', slug: 'mamoudzou', dept: '976' },
  { name: 'Cayenne', slug: 'cayenne', dept: '973' },
  { name: 'Pointe-a-Pitre', slug: 'pointe-a-pitre', dept: '971' },
];

const SERVICES = [
  { slug: 'plombier', specialty: 'Plombier' },
  { slug: 'electricien', specialty: 'Electricien' },
  { slug: 'serrurier', specialty: 'Serrurier' },
  { slug: 'couvreur', specialty: 'Couvreur' },
  { slug: 'climaticien', specialty: 'Climaticien' },
];

async function main() {
  console.log('='.repeat(80));
  console.log('NOINDEX ANALYSIS: Pages that would STILL be noindex after getCityValues fix');
  console.log('='.repeat(80));

  // 1. Communes with provider_count = 0
  console.log('\n\n--- 1. /villes/ pages: communes with provider_count = 0 ---');

  const { data: emptyCommunes, error: e1 } = await supabase
    .from('communes')
    .select('slug, name, code_postal, departement_code, provider_count')
    .eq('provider_count', 0)
    .limit(10);

  if (e1) {
    console.log('Error:', e1.message);
  } else {
    const { count: totalEmpty } = await supabase
      .from('communes')
      .select('*', { count: 'exact', head: true })
      .eq('provider_count', 0);

    const { count: totalCommunes } = await supabase
      .from('communes')
      .select('*', { count: 'exact', head: true });

    console.log('Total communes in DB: ' + totalCommunes);
    console.log('Total communes with 0 providers: ' + totalEmpty);
    console.log('\n10 example /villes/ pages that would be noindex:');
    for (const c of (emptyCommunes || [])) {
      console.log('  /villes/' + c.slug + ' -> ' + c.name + ' (' + c.departement_code + ') - ' + c.provider_count + ' providers');
    }
  }

  // 2. /services/[service]/[ville] with specific combos
  console.log('\n\n--- 2. /services/[service]/[ville]: service+city combos with 0 providers ---');

  const testCities = ['Foix', 'Mende', 'Privas', 'Mamoudzou', 'Cayenne'];
  for (const cityName of testCities) {
    const vals = getCityValues(cityName);
    console.log('\n  ' + cityName + ' -> getCityValues: [' + vals.join(', ') + ']');
    for (const svc of SERVICES) {
      const { count } = await supabase
        .from('providers')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true)
        .eq('specialty', svc.specialty)
        .in('address_city', vals);

      const slug = _normalize(cityName).replace(/\s+/g, '-');
      if (count === 0) {
        console.log('    X /services/' + svc.slug + '/' + slug + ' -> 0 providers (noindex)');
      } else {
        console.log('    OK /services/' + svc.slug + '/' + slug + ' -> ' + count + ' providers');
      }
    }
  }

  // 3. /tarifs/, /devis/, /urgence/, /avis/ AFTER fix
  console.log('\n\n--- 3. /tarifs/, /devis/, /urgence/, /avis/ pages AFTER fix ---');
  console.log('Testing with getCityValues .in() query (the fixed version):\n');

  const noProviderCities = [];
  const hasProviderCities = [];

  for (const city of SMALL_CITIES) {
    const vals = getCityValues(city.name);
    const { count } = await supabase
      .from('providers')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)
      .in('address_city', vals);

    if (count === 0) {
      noProviderCities.push({ ...city, count, cityValues: vals });
    } else {
      hasProviderCities.push({ ...city, count, cityValues: vals });
    }
  }

  console.log('Cities with 0 active providers (ALL page types would be noindex):');
  for (const c of noProviderCities) {
    console.log('  ' + c.name + ' (dept ' + c.dept + ') -> 0 providers');
    console.log('    getCityValues: [' + c.cityValues.join(', ') + ']');
    const prefixes = ['/tarifs', '/devis', '/urgence', '/avis'];
    for (const prefix of prefixes) {
      console.log('    X ' + prefix + '/plombier/' + c.slug + ' -> noindex');
    }
  }

  console.log('\nCities WITH active providers (pages would be INDEXED after fix):');
  for (const c of hasProviderCities) {
    console.log('  OK ' + c.name + ' (dept ' + c.dept + ') -> ' + c.count + ' providers via .in()');
  }

  // 4. Providers per department
  console.log('\n\n--- 4. Provider count per department ---');

  const deptCodes = [
    '01','02','03','04','05','06','07','08','09','10',
    '11','12','13','14','15','16','17','18','19','2A','2B',
    '21','22','23','24','25','26','27','28','29','30',
    '31','32','33','34','35','36','37','38','39','40',
    '41','42','43','44','45','46','47','48','49','50',
    '51','52','53','54','55','56','57','58','59','60',
    '61','62','63','64','65','66','67','68','69','70',
    '71','72','73','74','75','76','77','78','79','80',
    '81','82','83','84','85','86','87','88','89','90',
    '91','92','93','94','95',
    '971','972','973','974','976'
  ];

  const deptResults = [];
  for (const dept of deptCodes) {
    const { count } = await supabase
      .from('providers')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)
      .eq('address_department', dept);
    deptResults.push({ dept, count: count || 0 });
  }
  deptResults.sort((a, b) => a.count - b.count);

  console.log('\n25 departments with FEWEST active providers:');
  for (const d of deptResults.slice(0, 25)) {
    console.log('  Dept ' + d.dept + ': ' + d.count + ' active providers');
  }

  const totalProviders = deptResults.reduce((s, d) => s + d.count, 0);
  const zeroDepts = deptResults.filter(d => d.count === 0);
  console.log('\nTotal active providers: ' + totalProviders);
  console.log('Departments with 0 providers: ' + zeroDepts.length + ' -> ' + zeroDepts.map(d => d.dept).join(', '));

  // 5. Scale estimate
  console.log('\n\n--- 5. Scale estimate ---');
  const totalVilles = 2280;
  const totalServices = 46;
  const zeroRatio = noProviderCities.length / SMALL_CITIES.length;

  console.log('Sample: ' + noProviderCities.length + '/' + SMALL_CITIES.length + ' tested prefectures have 0 providers (' + (zeroRatio * 100).toFixed(0) + '%)');
  console.log('These are small prefectures (worst case). Larger cities typically have providers.');
  console.log('\nPer zero-provider city, noindex pages across route types:');
  console.log('  5 route types x ' + totalServices + ' services = ' + (5 * totalServices) + ' pages per city');

  console.log('\n=== END OF ANALYSIS ===');
}

main().catch(console.error);
