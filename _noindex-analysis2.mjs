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
  // First: what specialty values actually exist?
  console.log('=== PART A: Distinct specialty values in providers table ===\n');
  const { data: specialties } = await supabase
    .from('providers')
    .select('specialty')
    .eq('is_active', true)
    .limit(1000);

  const specCounts = {};
  for (const p of (specialties || [])) {
    const s = p.specialty || 'NULL';
    specCounts[s] = (specCounts[s] || 0) + 1;
  }
  const sorted = Object.entries(specCounts).sort((a, b) => b[1] - a[1]);
  console.log('Top 30 specialty values (from 1000-row sample):');
  for (const [s, c] of sorted.slice(0, 30)) {
    console.log('  "' + s + '" -> ' + c);
  }

  // Check a bigger sample - what does specialty look like for Foix?
  console.log('\n\n=== PART B: Providers in Foix area - what specialties? ===\n');
  const foixVals = getCityValues('Foix');
  console.log('getCityValues("Foix"):', foixVals);

  const { data: foixProviders } = await supabase
    .from('providers')
    .select('name, specialty, address_city')
    .eq('is_active', true)
    .in('address_city', foixVals)
    .limit(20);

  console.log('Sample providers in Foix:');
  for (const p of (foixProviders || [])) {
    console.log('  ' + p.name + ' | specialty: "' + p.specialty + '" | address_city: ' + p.address_city);
  }

  // Check what specialty values match "plombier" type services
  console.log('\n\n=== PART C: How do /tarifs/ /devis/ /urgence/ /avis/ pages determine noindex? ===\n');
  console.log('These pages check: providers WHERE is_active AND address_city IN getCityValues(ville)');
  console.log('They do NOT filter by specialty for the noindex check (just any provider in city).');
  console.log('So the relevant question is: are there cities with 0 providers AT ALL?\n');

  // Let's find cities from france.ts villes that truly have 0 providers
  // We need to read france.ts to get a broader sample
  // Let's test much smaller cities from the villes array
  const smallerCities = [
    'Limoux', 'Condom', 'Lodeve', 'Figeac', 'Millau',
    'Villefranche-de-Rouergue', 'Saint-Affrique', 'Decazeville',
    'Saint-Flour', 'Mauriac', 'Langogne', 'Florac',
    'Largentiere', 'Le Cheylard', 'Tournon-sur-Rhone',
    'Bourganeuf', 'Aubusson', 'La Souterraine',
    'Ussel', 'Bort-les-Orgues',
    'Saint-Jean-Pied-de-Port', 'Mauleon-Licharre',
    'Oloron-Sainte-Marie', 'Orthez',
    'Morteau', 'Pontarlier', 'Ornans',
    'Sarlat-la-Caneda', 'Riberac', 'Nontron',
    'Moissac', 'Castelsarrasin',
  ];

  console.log('Testing 31 small sub-prefecture cities with getCityValues .in():\n');
  const noProvs = [];
  const hasProvs = [];

  for (const city of smallerCities) {
    const vals = getCityValues(city);
    const { count } = await supabase
      .from('providers')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)
      .in('address_city', vals);

    if (count === 0) {
      noProvs.push({ name: city, count, vals });
    } else {
      hasProvs.push({ name: city, count });
    }
  }

  if (noProvs.length > 0) {
    console.log('Cities with 0 providers (would be noindex for ALL pages):');
    for (const c of noProvs) {
      console.log('  X ' + c.name + ' -> 0 providers');
      console.log('    getCityValues: [' + c.vals.join(', ') + ']');
    }
  } else {
    console.log('ALL 31 small cities have providers via getCityValues .in() !');
  }

  console.log('\nCities with providers:');
  for (const c of hasProvs) {
    console.log('  OK ' + c.name + ' -> ' + c.count + ' providers');
  }

  // Now test DOM-TOM more thoroughly
  console.log('\n\n=== PART D: DOM-TOM cities (most likely to have 0 providers) ===\n');
  const domtomCities = [
    'Fort-de-France', 'Le Lamentin', 'Schoelcher',
    'Pointe-a-Pitre', 'Les Abymes', 'Baie-Mahault',
    'Cayenne', 'Kourou', 'Saint-Laurent-du-Maroni',
    'Saint-Denis', 'Saint-Pierre', 'Le Tampon', 'Saint-Paul',
    'Mamoudzou', 'Koungou', 'Dzaoudzi',
  ];

  for (const city of domtomCities) {
    const vals = getCityValues(city);
    const { count } = await supabase
      .from('providers')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)
      .in('address_city', vals);
    console.log('  ' + (count === 0 ? 'X' : 'OK') + ' ' + city + ' -> ' + count + ' providers (vals: ' + vals.length + ')');
  }

  // Part E: Find the actual noindex logic in the codebase
  console.log('\n\n=== PART E: /services/[service]/[ville] specialty-specific noindex ===\n');
  console.log('For these pages, the noindex check filters by SPECIALTY.');
  console.log('Testing specific service+city combos with getCityValues:\n');

  // First, find what specialty values match common services
  const specQueries = [
    { service: 'plombier', specPatterns: ['Plombier', 'plombier', 'Plomberie'] },
    { service: 'electricien', specPatterns: ['Electricien', 'electricien', 'Electicien'] },
    { service: 'serrurier', specPatterns: ['Serrurier', 'serrurier', 'Serrurerie'] },
  ];

  for (const sq of specQueries) {
    for (const pat of sq.specPatterns) {
      const { count } = await supabase
        .from('providers')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true)
        .eq('specialty', pat);
      if (count > 0) {
        console.log('specialty="' + pat + '" -> ' + count + ' active providers');
      }
    }
    // Try ilike
    const { count: ilikeCount } = await supabase
      .from('providers')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)
      .ilike('specialty', '%' + sq.service + '%');
    console.log('specialty ILIKE "%' + sq.service + '%" -> ' + ilikeCount + ' active providers');
  }

  // Check what specialty looks like for plombiers specifically
  console.log('\nSample providers with specialty containing "plomb":');
  const { data: plombiers } = await supabase
    .from('providers')
    .select('name, specialty, address_city, address_department')
    .eq('is_active', true)
    .ilike('specialty', '%plomb%')
    .limit(10);

  for (const p of (plombiers || [])) {
    console.log('  ' + p.name + ' | "' + p.specialty + '" | city: ' + p.address_city + ' dept: ' + p.address_department);
  }

  // Now test with ilike for specific cities
  console.log('\n\nService+city combos using ILIKE specialty (more realistic):');
  const testPairs = [
    { city: 'Foix', service: 'plomb' },
    { city: 'Foix', service: 'electri' },
    { city: 'Mende', service: 'plomb' },
    { city: 'Mende', service: 'serru' },
    { city: 'Aurillac', service: 'plomb' },
    { city: 'Mamoudzou', service: 'plomb' },
    { city: 'Cayenne', service: 'plomb' },
    { city: 'Gap', service: 'plomb' },
    { city: 'Vesoul', service: 'plomb' },
    { city: 'Bar-le-Duc', service: 'plomb' },
  ];

  for (const tp of testPairs) {
    const vals = getCityValues(tp.city);
    const { count } = await supabase
      .from('providers')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)
      .ilike('specialty', '%' + tp.service + '%')
      .in('address_city', vals);
    console.log('  ' + (count === 0 ? 'X NOINDEX' : 'OK') + ' ' + tp.city + ' + ' + tp.service + '* -> ' + count + ' providers');
  }

  console.log('\n=== END ===');
}

main().catch(console.error);
