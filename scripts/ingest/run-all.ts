/**
 * Master Ingestion Orchestrator
 * Runs all ingestion scripts in the correct order.
 *
 * Order:
 *   1. Geographic data (counties, ZIP codes) — foundation
 *   2. CourtListener courts — enrichment layer
 *   3. Attorneys by state (Big 6 first, then others)
 *
 * Usage: npx tsx scripts/ingest/run-all.ts [--dry-run] [--step N] [--from N]
 *
 * Options:
 *   --dry-run    Pass --dry-run to all sub-scripts
 *   --step N     Run only step N
 *   --from N     Start from step N (skip previous steps)
 */

import { execSync } from 'child_process'

const args = process.argv.slice(2)
const DRY_RUN = args.includes('--dry-run')
const STEP = (() => {
  const idx = args.indexOf('--step')
  return idx !== -1 ? parseInt(args[idx + 1], 10) : null
})()
const FROM = (() => {
  const idx = args.indexOf('--from')
  return idx !== -1 ? parseInt(args[idx + 1], 10) : 1
})()

interface IngestionStep {
  step: number
  name: string
  script: string
  args: string[]
  records: string
}

const STEPS: IngestionStep[] = [
  // Phase 1: Geographic foundation
  {
    step: 1,
    name: 'US Counties (Census Bureau)',
    script: 'scripts/ingest/counties.ts',
    args: [],
    records: '~3,244 counties',
  },
  {
    step: 2,
    name: 'US ZIP Codes + Cities (OpenDataSoft)',
    script: 'scripts/ingest/zip-codes.ts',
    args: [],
    records: '~41,000 ZIP codes + ~30,000 cities',
  },

  // Phase 2: Courts
  {
    step: 3,
    name: 'CourtListener Courts',
    script: 'scripts/ingest/courtlistener-courts.ts',
    args: [],
    records: '~400 courts',
  },

  // Phase 3: Attorneys (Big 6 states = ~60% of all US attorneys)
  {
    step: 4,
    name: 'NY Attorneys (Open Data CSV)',
    script: 'scripts/ingest/ny-attorneys.ts',
    args: [],
    records: '~429,000 attorneys',
  },
  {
    step: 5,
    name: 'CA Attorneys (CalBar)',
    script: 'scripts/ingest/ca-attorneys.ts',
    args: [],
    records: '~190,000 attorneys',
  },
  {
    step: 6,
    name: 'FL Attorneys (FL Bar)',
    script: 'scripts/ingest/fl-attorneys.ts',
    args: [],
    records: '~108,000 attorneys',
  },
  {
    step: 7,
    name: 'TX Attorneys (TX Bar)',
    script: 'scripts/ingest/tx-attorneys.ts',
    args: [],
    records: '~100,000 attorneys',
  },
  {
    step: 8,
    name: 'IL Attorneys (ARDC)',
    script: 'scripts/ingest/il-attorneys.ts',
    args: [],
    records: '~95,000 attorneys',
  },
  {
    step: 9,
    name: 'OH Attorneys (Supreme Court)',
    script: 'scripts/ingest/oh-attorneys.ts',
    args: [],
    records: '~90,000 attorneys',
  },

  // Phase 4: Enrichment
  {
    step: 10,
    name: 'Census Bureau ACS Data',
    script: 'scripts/ingest/census-data.ts',
    args: [],
    records: '~32,000 cities',
  },
  {
    step: 11,
    name: 'Assign Practice Areas (keyword matching)',
    script: 'scripts/ingest/assign-specialties.ts',
    args: [],
    records: 'all attorneys with text fields',
  },
  {
    step: 12,
    name: 'Deduplicate Attorneys (report only)',
    script: 'scripts/ingest/deduplicate-attorneys.ts',
    args: [],
    records: 'cross-state duplicates',
  },
]

function run(step: IngestionStep): boolean {
  const extraArgs = [...step.args]
  if (DRY_RUN) extraArgs.push('--dry-run')

  const cmd = `npx tsx ${step.script} ${extraArgs.join(' ')}`.trim()

  console.log(`\n${'='.repeat(70)}`)
  console.log(`STEP ${step.step}: ${step.name}`)
  console.log(`Records: ${step.records}`)
  console.log(`Command: ${cmd}`)
  console.log('='.repeat(70))

  try {
    execSync(cmd, {
      stdio: 'inherit',
      env: process.env,
      timeout: 30 * 60 * 1000, // 30 minutes max per step
    })
    console.log(`\n✓ Step ${step.step} completed successfully`)
    return true
  } catch (err: any) {
    console.error(`\n✗ Step ${step.step} FAILED: ${err.message}`)
    return false
  }
}

// ============================================================================
// MAIN
// ============================================================================

function main() {
  console.log('╔══════════════════════════════════════════════════════════════════════╗')
  console.log('║           US ATTORNEYS — MASTER DATA INGESTION PIPELINE             ║')
  console.log('╚══════════════════════════════════════════════════════════════════════╝')
  console.log()
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN' : 'LIVE'}`)
  console.log(`Steps: ${STEP ? `only step ${STEP}` : `${FROM} through ${STEPS.length}`}`)
  console.log(`Total estimated records: ~1,053,000+ attorneys + enrichment`)
  console.log()

  // Show plan
  console.log('EXECUTION PLAN:')
  STEPS.forEach(s => {
    const willRun = STEP ? s.step === STEP : s.step >= FROM
    const marker = willRun ? '→' : '  (skip)'
    console.log(`  ${marker} Step ${s.step}: ${s.name} [${s.records}]`)
  })
  console.log()

  // Prerequisites check
  const requiredEnvVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
  ]

  const missing = requiredEnvVars.filter(v => !process.env[v])
  if (missing.length > 0) {
    console.error('Missing required environment variables:')
    missing.forEach(v => console.error(`  - ${v}`))
    console.error('\nRun: source .env.local')
    process.exit(1)
  }

  if (!DRY_RUN && !process.env.COURTLISTENER_API_TOKEN) {
    console.warn('⚠ COURTLISTENER_API_TOKEN not set — step 3 will fail')
    console.warn('  Get free token at https://www.courtlistener.com/register/')
  }

  // Execute
  const results: { step: number; name: string; success: boolean }[] = []
  const startTime = Date.now()

  for (const step of STEPS) {
    const shouldRun = STEP ? step.step === STEP : step.step >= FROM

    if (!shouldRun) {
      results.push({ step: step.step, name: step.name, success: true })
      continue
    }

    const success = run(step)
    results.push({ step: step.step, name: step.name, success })

    if (!success && !DRY_RUN) {
      console.error(`\nStopping pipeline at step ${step.step} due to failure.`)
      console.error(`Resume with: npx tsx scripts/ingest/run-all.ts --from ${step.step}`)
      break
    }
  }

  // Summary
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(0)
  const succeeded = results.filter(r => r.success).length
  const failed = results.filter(r => !r.success).length

  console.log('\n' + '='.repeat(70))
  console.log('PIPELINE SUMMARY')
  console.log('='.repeat(70))
  results.forEach(r => {
    console.log(`  ${r.success ? '✓' : '✗'} Step ${r.step}: ${r.name}`)
  })
  console.log()
  console.log(`Completed: ${succeeded}/${results.length}`)
  console.log(`Failed:    ${failed}`)
  console.log(`Duration:  ${elapsed}s`)

  if (failed > 0) process.exit(1)
}

main()
