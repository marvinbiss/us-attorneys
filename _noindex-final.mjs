import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const SUPABASE_URL = 'https://umjmbdbwcsxrvfqktiui.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVtam1iZGJ3Y3N4cnZmcWt0aXVpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTY2NjQ1OCwiZXhwIjoyMDg1MjQyNDU4fQ.6hXdR5jfhCl1AA5052k3YrBmI-UMhu36mxV2IPvYxjc';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

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

async function main() {
  console.log('='.repeat(80));
  console.log('FINAL NOINDEX ANALYSIS');
  console.log('Pages that would STILL be noindex AFTER the getCityValues .in() fix');
  console.log('='.repeat(80));

  // The actual query in all 4 page types (tarifs, devis, urgence, avis):
  //   .from('providers').select('id', { count: 'exact', head: true })
  //   .eq('is_active', true)
  //   .in('address_city', getCityValues(villeData.name))
  // NO specialty filter - just any active provider in the city.

  console.log('\nActual noindex logic: providerCount === 0 WHERE is_active AND address_city IN getCityValues(name)');
  console.log('No specialty filter applied.\n');

  // Find cities where getCityValues returns only the city name (no INSEE codes)
  // These are the most likely to have issues
  console.log('--- Cities where getCityValues finds NO INSEE codes ---\n');

  // Test a broad set of city names from france.ts
  // We know the villes array has 2280 entries. Let's test a representative sample.
  const problematicCities = [];
  const testNames = [
    // Names with special characters or compound names that might not match
    'Florac', 'Florac Trois Rivieres',
    'Saint-Lo', 'Saint-L\u00F4',
    'Evry-Courcouronnes', '\u00C9vry-Courcouronnes',
    'Le Puy-en-Velay',
    'Charleville-M\u00E9zi\u00E8res',
    'Digne-les-Bains',
    'Bourg-en-Bresse',
    'Mont-de-Marsan',
    'La Roche-sur-Yon',
    'Aix-en-Provence',
    'Villefranche-sur-Saone',
    'Villefranche-sur-Sa\u00F4ne',
    'Chalon-sur-Saone',
    'Chalon-sur-Sa\u00F4ne',
    // Accented names
    'P\u00E9rigueux', 'Perigueux',
    'B\u00E9ziers', 'Beziers',
    'N\u00EEmes', 'Nimes',
    // Compound commune names that may have changed
    'Cherbourg-en-Cotentin', 'Cherbourg',
    'Annecy', // absorbed communes
  ];

  for (const name of testNames) {
    const vals = getCityValues(name);
    const codes = getInseeCodesForCity(name);
    if (codes.length === 0) {
      problematicCities.push({ name, vals });
      console.log('  NO CODES: "' + name + '" -> getCityValues: [' + vals.join(', ') + ']');
    }
  }

  // Now the real test: query providers for cities with 0 INSEE codes
  console.log('\n--- Querying providers for cities with no INSEE match ---\n');
  for (const c of problematicCities) {
    const { count } = await supabase
      .from('providers')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)
      .in('address_city', c.vals);
    console.log('  ' + (count === 0 ? 'X NOINDEX' : 'OK (' + count + ')') + ' "' + c.name + '"');
  }

  // The real question: which exact city names from the france.ts villes array produce 0 providers?
  // Let's read a sample of villes and test them in batches
  console.log('\n\n--- Batch test: 100 cities sampled from france.ts villes (every ~23rd city) ---\n');

  // We need to parse city names. Let's load france.ts as a module
  // Since it's TypeScript, we can't directly import. Let's extract city names.
  const franceContent = fs.readFileSync(path.resolve('src/lib/data/france.ts'), 'utf-8');
  // Extract ville names from the villes array - they appear as name: 'CityName'
  const nameRegex = /^\s*name:\s*'([^']+)'/gm;
  const allNames = [];
  let match;
  while ((match = nameRegex.exec(franceContent)) !== null) {
    // Only add city names (not department/region names)
    allNames.push(match[1]);
  }
  // The villes array has 2280 entries, each with name + region + departement + population etc.
  // city names start from index 0, but we also pick up region/department names.
  // Let's be smarter - take every name that appears after "slug:" pattern in villes context
  // Actually, let's just test many names

  console.log('Total name values extracted: ' + allNames.length);
  // Sample every Nth
  const step = Math.floor(allNames.length / 100);
  const sampleNames = [];
  for (let i = 0; i < allNames.length; i += step) {
    sampleNames.push(allNames[i]);
  }

  const noProviderResults = [];
  const noCodeResults = [];
  let testedCount = 0;

  for (const name of sampleNames) {
    const vals = getCityValues(name);
    const codes = getInseeCodesForCity(name);

    if (codes.length === 0) {
      noCodeResults.push(name);
    }

    const { count } = await supabase
      .from('providers')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)
      .in('address_city', vals);

    if (count === 0) {
      noProviderResults.push({ name, count, codes: codes.length, vals });
    }
    testedCount++;
  }

  console.log('Tested ' + testedCount + ' city names');
  console.log('Cities with no INSEE codes: ' + noCodeResults.length);
  console.log('Cities with 0 providers (noindex): ' + noProviderResults.length);

  if (noProviderResults.length > 0) {
    console.log('\nConcrete examples of pages that would STILL be noindex:\n');
    for (const r of noProviderResults) {
      console.log('  City: "' + r.name + '" (INSEE codes: ' + r.codes + ')');
      console.log('  getCityValues: [' + r.vals.join(', ') + ']');
      console.log('  Example noindex pages:');
      console.log('    /tarifs/plombier/' + _normalize(r.name).replace(/\s+/g, '-'));
      console.log('    /devis/electricien/' + _normalize(r.name).replace(/\s+/g, '-'));
      console.log('    /urgence/serrurier/' + _normalize(r.name).replace(/\s+/g, '-'));
      console.log('    /avis/couvreur/' + _normalize(r.name).replace(/\s+/g, '-'));
      console.log('');
    }
  }

  if (noCodeResults.length > 0) {
    console.log('\nNames with NO INSEE code match (may rely on literal city name match only):');
    for (const n of noCodeResults.slice(0, 20)) {
      console.log('  "' + n + '"');
    }
  }

  // Final: check department-level sparsity for /tarifs/[service]/[dept] noindex
  console.log('\n\n--- Department-level: departments with fewest active providers ---\n');
  const sparseDepts = ['48', '23', '52', '90', '55', '15', '36', '976'];
  for (const dept of sparseDepts) {
    // Check specific specialty counts
    for (const spec of ['plombier', 'electricien', 'serrurier', 'couvreur', 'climaticien', 'pisciniste', 'ascensoriste', 'domoticien']) {
      const { count } = await supabase
        .from('providers')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true)
        .eq('address_department', dept)
        .eq('specialty', spec);
      if (count === 0) {
        console.log('  X Dept ' + dept + ' + ' + spec + ' = 0 providers');
      }
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('SUMMARY');
  console.log('='.repeat(80));
  console.log('');
  console.log('After the getCityValues .in() fix:');
  console.log('- /tarifs/, /devis/, /urgence/, /avis/ check ANY active provider (no specialty filter)');
  console.log('- With 968K+ active providers, even the smallest prefectures have providers');
  console.log('- Cities that would still be noindex: ' + noProviderResults.length + ' out of ' + testedCount + ' tested');
  console.log('- The fix dramatically reduces false noindex because it matches INSEE codes');
  console.log('');
}

main().catch(console.error);
