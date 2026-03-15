/**
 * Cleanup Untraceable Phones
 *
 * NULLs phone numbers on providers whose source is 'annuaire_entreprises'
 * AND who have NOT been claimed by a user. These phones were added by
 * fuzzy-matching scripts (import-gm-phones.ts, enrich-phone-bulk.ts)
 * and are untraceable — we cannot prove they belong to the right artisan.
 *
 * Phones are KEPT when:
 *   - Provider has claimed_at IS NOT NULL (user-verified)
 *   - Provider source is NOT 'annuaire_entreprises' (phone came with original scrape)
 *
 * Usage:
 *   npx tsx scripts/cleanup-untraceable-phones.ts          # dry-run (default)
 *   npx tsx scripts/cleanup-untraceable-phones.ts --fix     # actually NULL the phones
 */

import * as fs from 'fs'
import * as path from 'path'
import { createClient } from '@supabase/supabase-js'

// ============================================
// CONFIG
// ============================================

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable')
  process.exit(1)
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL!
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

const FIX_MODE = process.argv.includes('--fix')
const BATCH_SIZE = 1000
const UPDATE_BATCH = 500

const OUT_DIR = path.join(__dirname, 'output')
if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true })

const BACKUP_FILE = path.join(OUT_DIR, `backup-phones-${new Date().toISOString().slice(0, 10)}.csv`)

// ============================================
// HELPERS
// ============================================

interface ProviderRow {
  id: string
  name: string
  phone: string
  source: string | null
  claimed_at: string | null
}

async function fetchAllWithPhones(): Promise<ProviderRow[]> {
  const all: ProviderRow[] = []
  let from = 0

  while (true) {
    const { data, error } = await supabase
      .from('providers')
      .select('id, name, phone, source, claimed_at')
      .not('phone', 'is', null)
      .range(from, from + BATCH_SIZE - 1)

    if (error) throw new Error(`Fetch error at offset ${from}: ${error.message}`)
    if (!data || data.length === 0) break

    all.push(...(data as ProviderRow[]))
    from += BATCH_SIZE

    if (data.length < BATCH_SIZE) break
  }

  return all
}

function escapeCSV(val: string | null): string {
  if (!val) return ''
  if (val.includes(',') || val.includes('"') || val.includes('\n')) {
    return '"' + val.replace(/"/g, '""') + '"'
  }
  return val
}

// ============================================
// MAIN
// ============================================

async function main() {
  console.log('='.repeat(60))
  console.log(FIX_MODE
    ? '  CLEANUP UNTRACEABLE PHONES — FIX MODE (will update DB)'
    : '  CLEANUP UNTRACEABLE PHONES — DRY RUN (no changes)')
  console.log('='.repeat(60))
  console.log()

  // 1. Fetch all providers with a phone
  console.log('Fetching all providers with a phone number...')
  const providers = await fetchAllWithPhones()
  console.log(`  Total providers with phone: ${providers.length}`)
  console.log()

  // 2. Classify: keep vs null
  const toKeep: ProviderRow[] = []
  const toNull: ProviderRow[] = []

  for (const p of providers) {
    const isClaimed = p.claimed_at !== null
    const isAnnuaire = p.source === 'annuaire_entreprises'

    if (isClaimed || !isAnnuaire) {
      toKeep.push(p)
    } else {
      // source = annuaire_entreprises AND not claimed → untraceable
      toNull.push(p)
    }
  }

  // 3. Breakdown by source
  const keepBySource: Record<string, number> = {}
  const nullBySource: Record<string, number> = {}

  for (const p of toKeep) {
    const s = p.source || '(null)'
    keepBySource[s] = (keepBySource[s] || 0) + 1
  }
  for (const p of toNull) {
    const s = p.source || '(null)'
    nullBySource[s] = (nullBySource[s] || 0) + 1
  }

  // 4. Print summary
  console.log('PHONES TO KEEP (direct scrape or user-claimed):')
  console.log('-'.repeat(45))
  for (const [source, count] of Object.entries(keepBySource).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${source.padEnd(30)} ${count.toLocaleString()}`)
  }
  console.log(`  ${'TOTAL'.padEnd(30)} ${toKeep.length.toLocaleString()}`)
  console.log()

  console.log('PHONES TO NULL (untraceable fuzzy-matched):')
  console.log('-'.repeat(45))
  for (const [source, count] of Object.entries(nullBySource).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${source.padEnd(30)} ${count.toLocaleString()}`)
  }
  console.log(`  ${'TOTAL'.padEnd(30)} ${toNull.length.toLocaleString()}`)
  console.log()

  // Count claimed annuaire providers (kept because claimed)
  const claimedAnnuaire = toKeep.filter(p => p.source === 'annuaire_entreprises' && p.claimed_at !== null)
  if (claimedAnnuaire.length > 0) {
    console.log(`  (includes ${claimedAnnuaire.length} annuaire_entreprises providers KEPT because claimed)`)
    console.log()
  }

  if (toNull.length === 0) {
    console.log('Nothing to clean up.')
    return
  }

  if (!FIX_MODE) {
    console.log('DRY RUN complete. Run with --fix to apply changes.')
    return
  }

  // 5. Save backup CSV before changes
  console.log(`Saving backup to ${BACKUP_FILE}...`)
  const csvLines = ['id,name,phone,source,claimed_at']
  for (const p of toNull) {
    csvLines.push([
      p.id,
      escapeCSV(p.name),
      escapeCSV(p.phone),
      escapeCSV(p.source),
      escapeCSV(p.claimed_at),
    ].join(','))
  }
  fs.writeFileSync(BACKUP_FILE, csvLines.join('\n'), 'utf-8')
  console.log(`  Backup saved: ${toNull.length} rows`)
  console.log()

  // 6. Apply NULLs in batches
  console.log('Applying phone = NULL in batches...')
  let updated = 0
  for (let i = 0; i < toNull.length; i += UPDATE_BATCH) {
    const batch = toNull.slice(i, i + UPDATE_BATCH)
    const ids = batch.map(p => p.id)

    const { error } = await supabase
      .from('providers')
      .update({ phone: null })
      .in('id', ids)

    if (error) {
      console.error(`  ERROR at batch ${i}: ${error.message}`)
      console.error('  Stopping. Partial update applied.')
      break
    }

    updated += batch.length
    process.stdout.write(`\r  Updated ${updated.toLocaleString()} / ${toNull.length.toLocaleString()}`)
  }

  console.log()
  console.log()
  console.log('DONE.')
  console.log(`  Phones NULLed: ${updated.toLocaleString()}`)
  console.log(`  Phones kept:   ${toKeep.length.toLocaleString()}`)
  console.log(`  Backup at:     ${BACKUP_FILE}`)
}

main().catch(err => {
  console.error('FATAL:', err)
  process.exit(1)
})
