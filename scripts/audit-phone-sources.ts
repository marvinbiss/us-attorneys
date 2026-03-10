/**
 * audit-phone-sources.ts
 *
 * Audits all providers with phone numbers to determine the likely source
 * of each phone number (verified claim, direct scrape, fuzzy enrichment, etc.)
 */

import { createClient } from '@supabase/supabase-js';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

const SUPABASE_URL = 'https://umjmbdbwcsxrvfqktiui.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVtam1iZGJ3Y3N4cnZmcWt0aXVpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTY2NjQ1OCwiZXhwIjoyMDg1MjQyNDU4fQ.6hXdR5jfhCl1AA5052k3YrBmI-UMhu36mxV2IPvYxjc';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

interface ProviderRow {
  id: string;
  name: string;
  phone: string;
  siret: string | null;
  source: string | null;
  source_api: string | null;
  created_at: string;
  updated_at: string;
  claimed_at: string | null;
  address_department: string | null;
}

type PhoneCategory = 'verified_claim' | 'direct_scrape' | 'enrichment_fuzzy' | 'enrichment_same_day';

interface CategorizedProvider {
  id: string;
  name: string;
  phone: string;
  source: string | null;
  source_api: string | null;
  department: string | null;
}

async function fetchAllProvidersWithPhones(): Promise<ProviderRow[]> {
  const PAGE_SIZE = 1000;
  const all: ProviderRow[] = [];
  let offset = 0;

  while (true) {
    const { data, error } = await supabase
      .from('providers')
      .select('id, name, phone, siret, source, source_api, created_at, updated_at, claimed_at, address_department')
      .not('phone', 'is', null)
      .neq('phone', '')
      .range(offset, offset + PAGE_SIZE - 1)
      .order('id');

    if (error) {
      throw new Error(`Supabase error at offset ${offset}: ${error.message}`);
    }

    if (!data || data.length === 0) break;

    all.push(...(data as ProviderRow[]));
    if (data.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;

    if (offset % 10000 === 0) {
      console.log(`  Fetched ${all.length} providers so far...`);
    }
  }

  return all;
}

function sameDay(a: string, b: string): boolean {
  return a.slice(0, 10) === b.slice(0, 10);
}

function categorize(p: ProviderRow): PhoneCategory {
  // Priority 1: claimed providers — user entered the phone
  if (p.claimed_at) return 'verified_claim';

  // Priority 2: non-annuaire sources — phone came with the original scrape
  if (p.source !== 'annuaire_entreprises') return 'direct_scrape';

  // Priority 3: annuaire_entreprises with different dates — phone added later by enrichment
  if (!sameDay(p.created_at, p.updated_at)) return 'enrichment_fuzzy';

  // Priority 4: annuaire_entreprises with same-day timestamps
  return 'enrichment_same_day';
}

async function main() {
  console.log('=== Phone Source Audit ===\n');
  console.log('Fetching all providers with phone numbers...');

  const providers = await fetchAllProvidersWithPhones();
  console.log(`Total providers with phones: ${providers.length}\n`);

  const categories: Record<PhoneCategory, CategorizedProvider[]> = {
    verified_claim: [],
    direct_scrape: [],
    enrichment_fuzzy: [],
    enrichment_same_day: [],
  };

  // Also track source breakdown within each category
  const sourceBreakdown: Record<PhoneCategory, Record<string, number>> = {
    verified_claim: {},
    direct_scrape: {},
    enrichment_fuzzy: {},
    enrichment_same_day: {},
  };

  // Department breakdown for enrichment categories
  const deptBreakdown: Record<string, Record<string, number>> = {
    enrichment_fuzzy: {},
    enrichment_same_day: {},
  };

  for (const p of providers) {
    const cat = categorize(p);
    categories[cat].push({
      id: p.id,
      name: p.name,
      phone: p.phone,
      source: p.source,
      source_api: p.source_api,
      department: p.address_department,
    });

    const src = p.source || 'null';
    sourceBreakdown[cat][src] = (sourceBreakdown[cat][src] || 0) + 1;

    if (cat === 'enrichment_fuzzy' || cat === 'enrichment_same_day') {
      const dept = p.address_department || 'unknown';
      if (!deptBreakdown[cat][dept]) deptBreakdown[cat][dept] = 0;
      deptBreakdown[cat][dept]++;
    }
  }

  // Print summary
  const total = providers.length;
  console.log('--- SUMMARY ---');
  console.log(`\nTotal providers with phones: ${total}\n`);

  const labels: Record<PhoneCategory, string> = {
    verified_claim: 'VERIFIED (claimed by user)',
    direct_scrape: 'DIRECT SCRAPE (GM/PJ/other)',
    enrichment_fuzzy: 'FUZZY ENRICHMENT (annuaire + later update)',
    enrichment_same_day: 'SAME-DAY (annuaire, created=updated date)',
  };

  for (const cat of Object.keys(categories) as PhoneCategory[]) {
    const count = categories[cat].length;
    const pct = ((count / total) * 100).toFixed(1);
    console.log(`  ${labels[cat]}: ${count.toLocaleString()} (${pct}%)`);

    // Show source breakdown
    const sources = Object.entries(sourceBreakdown[cat]).sort((a, b) => b[1] - a[1]);
    for (const [src, cnt] of sources) {
      console.log(`      source="${src}": ${cnt.toLocaleString()}`);
    }
  }

  // Department breakdown for suspicious categories
  console.log('\n--- DEPARTMENT BREAKDOWN (enrichment_fuzzy, top 20) ---');
  const fuzzyDepts = Object.entries(deptBreakdown.enrichment_fuzzy).sort((a, b) => b[1] - a[1]).slice(0, 20);
  for (const [dept, cnt] of fuzzyDepts) {
    console.log(`  ${dept}: ${cnt.toLocaleString()}`);
  }

  console.log('\n--- DEPARTMENT BREAKDOWN (enrichment_same_day, top 20) ---');
  const sameDayDepts = Object.entries(deptBreakdown.enrichment_same_day).sort((a, b) => b[1] - a[1]).slice(0, 20);
  for (const [dept, cnt] of sameDayDepts) {
    console.log(`  ${dept}: ${cnt.toLocaleString()}`);
  }

  // Build report
  const report = {
    generated_at: new Date().toISOString(),
    total_providers_with_phones: total,
    summary: Object.fromEntries(
      (Object.keys(categories) as PhoneCategory[]).map(cat => [
        cat,
        {
          count: categories[cat].length,
          percentage: ((categories[cat].length / total) * 100).toFixed(1) + '%',
          source_breakdown: sourceBreakdown[cat],
        },
      ])
    ),
    categories: {
      verified_claim: categories.verified_claim.map(p => p.id),
      direct_scrape: categories.direct_scrape.map(p => p.id),
      enrichment_fuzzy: categories.enrichment_fuzzy.map(p => p.id),
      enrichment_same_day: categories.enrichment_same_day.map(p => p.id),
    },
    department_breakdown: {
      enrichment_fuzzy: deptBreakdown.enrichment_fuzzy,
      enrichment_same_day: deptBreakdown.enrichment_same_day,
    },
  };

  // Save report
  const outDir = join(process.cwd(), 'scripts', '.verify-data');
  mkdirSync(outDir, { recursive: true });
  const outPath = join(outDir, 'phone-source-audit.json');
  writeFileSync(outPath, JSON.stringify(report, null, 2), 'utf-8');
  console.log(`\nReport saved to: ${outPath}`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
