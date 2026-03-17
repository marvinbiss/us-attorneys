#!/usr/bin/env npx tsx
/**
 * CLI script for on-demand ISR revalidation.
 *
 * Usage:
 *   npx tsx scripts/revalidate.ts --path /practice-areas/personal-injury/new-york
 *   npx tsx scripts/revalidate.ts --paths /path1 /path2 /path3
 *   npx tsx scripts/revalidate.ts --tag attorneys
 *   npx tsx scripts/revalidate.ts --tags attorneys specialties
 *   npx tsx scripts/revalidate.ts --all-services
 *
 * Reads REVALIDATE_SECRET and NEXT_PUBLIC_SITE_URL from .env.local
 */

import { readFileSync } from 'fs'
import { resolve } from 'path'

// ── Load .env.local ──────────────────────────────────────────

function loadEnv(): Record<string, string> {
  const envPath = resolve(__dirname, '..', '.env.local')
  const vars: Record<string, string> = {}
  try {
    const content = readFileSync(envPath, 'utf-8')
    for (const line of content.split('\n')) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const eqIdx = trimmed.indexOf('=')
      if (eqIdx === -1) continue
      const key = trimmed.slice(0, eqIdx).trim()
      let value = trimmed.slice(eqIdx + 1).trim()
      // Remove surrounding quotes
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1)
      }
      vars[key] = value
    }
  } catch {
    console.error('ERROR: Could not read .env.local — make sure it exists in the project root.')
    process.exit(1)
  }
  return vars
}

const env = loadEnv()
const REVALIDATE_SECRET = env.REVALIDATE_SECRET || process.env.REVALIDATE_SECRET
const SITE_URL = env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

if (!REVALIDATE_SECRET) {
  console.error('ERROR: REVALIDATE_SECRET not found in .env.local or environment.')
  process.exit(1)
}

// ── Practice area slugs (for --all-services) ─────────────────

const PRACTICE_AREA_SLUGS = [
  'personal-injury', 'car-accident', 'truck-accident', 'motorcycle-accident',
  'slip-and-fall', 'medical-malpractice', 'wrongful-death', 'workers-compensation',
  'criminal-defense', 'dui-dwi', 'drug-crimes', 'white-collar-crime',
  'domestic-violence', 'sex-crimes', 'juvenile-defense', 'federal-crimes',
  'family-law', 'divorce', 'child-custody', 'child-support',
  'adoption', 'prenuptial-agreements', 'alimony-spousal-support',
  'immigration', 'green-card', 'visa-applications', 'deportation-defense',
  'asylum', 'citizenship-naturalization',
  'bankruptcy', 'chapter-7-bankruptcy', 'chapter-13-bankruptcy', 'debt-relief',
  'employment-law', 'wrongful-termination', 'workplace-discrimination',
  'sexual-harassment', 'wage-disputes',
  'real-estate', 'property-disputes', 'landlord-tenant', 'foreclosure-defense',
  'estate-planning', 'wills-trusts', 'probate', 'elder-law',
  'business-law', 'contracts', 'business-formation', 'mergers-acquisitions',
  'intellectual-property', 'patent', 'trademark', 'copyright',
  'tax-law', 'tax-disputes', 'irs-audit-defense',
  'civil-rights', 'police-brutality', 'discrimination',
  'consumer-protection', 'lemon-law', 'product-liability',
  'environmental-law', 'social-security-disability',
  'veterans-benefits', 'entertainment-law', 'sports-law',
  'maritime-law', 'aviation-law', 'construction-law',
]

// ── API call ─────────────────────────────────────────────────

interface RevalidateResult {
  success: boolean
  revalidated?: number
  paths?: string[]
  tags?: string[]
  errors?: Array<{ item: string; type: string; error: string }>
  error?: { message: string }
  now?: number
}

async function revalidate(body: { paths?: string[]; tags?: string[] }): Promise<RevalidateResult> {
  const url = `${SITE_URL}/api/revalidate`
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${REVALIDATE_SECRET}`,
    },
    body: JSON.stringify(body),
  })

  const data = (await response.json()) as RevalidateResult

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${data.error?.message || 'Unknown error'}`)
  }

  return data
}

// ── Batch helper (splits into chunks of 100) ────────────────

async function revalidatePaths(paths: string[]): Promise<void> {
  const CHUNK_SIZE = 100
  let totalRevalidated = 0
  let totalErrors = 0

  for (let i = 0; i < paths.length; i += CHUNK_SIZE) {
    const chunk = paths.slice(i, i + CHUNK_SIZE)
    const chunkNum = Math.floor(i / CHUNK_SIZE) + 1
    const totalChunks = Math.ceil(paths.length / CHUNK_SIZE)

    if (totalChunks > 1) {
      console.log(`\nBatch ${chunkNum}/${totalChunks} (${chunk.length} paths)...`)
    }

    const result = await revalidate({ paths: chunk })
    totalRevalidated += result.revalidated || 0
    if (result.errors) {
      totalErrors += result.errors.length
      for (const err of result.errors) {
        console.error(`  FAILED: ${err.item} — ${err.error}`)
      }
    }
  }

  console.log(`\nDone: ${totalRevalidated} revalidated, ${totalErrors} errors.`)
}

// ── CLI parsing ──────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2)

  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    console.log(`
ISR Revalidation CLI — us-attorneys.com

Usage:
  npx tsx scripts/revalidate.ts --path /practice-areas/personal-injury/new-york
  npx tsx scripts/revalidate.ts --paths /path1 /path2 /path3
  npx tsx scripts/revalidate.ts --tag attorneys
  npx tsx scripts/revalidate.ts --tags attorneys specialties
  npx tsx scripts/revalidate.ts --all-services

Options:
  --path <path>        Revalidate a single path
  --paths <p1> <p2>    Revalidate multiple paths
  --tag <tag>          Revalidate a single cache tag
  --tags <t1> <t2>     Revalidate multiple cache tags
  --all-services       Revalidate all /practice-areas/[service] pages
  --help               Show this help

Environment:
  REVALIDATE_SECRET    (from .env.local) Required
  NEXT_PUBLIC_SITE_URL (from .env.local) Defaults to http://localhost:3000
`)
    process.exit(0)
  }

  console.log(`Target: ${SITE_URL}`)

  // --all-services
  if (args.includes('--all-services')) {
    const paths = PRACTICE_AREA_SLUGS.map((s) => `/practice-areas/${s}`)
    console.log(`Revalidating ${paths.length} practice area pages...`)
    await revalidatePaths(paths)
    return
  }

  // --path <single>
  const pathIdx = args.indexOf('--path')
  if (pathIdx !== -1) {
    const path = args[pathIdx + 1]
    if (!path || path.startsWith('--')) {
      console.error('ERROR: --path requires a value')
      process.exit(1)
    }
    console.log(`Revalidating: ${path}`)
    const result = await revalidate({ paths: [path] })
    console.log(`Done: ${result.revalidated} revalidated.`)
    return
  }

  // --paths <multiple>
  const pathsIdx = args.indexOf('--paths')
  if (pathsIdx !== -1) {
    const paths: string[] = []
    for (let i = pathsIdx + 1; i < args.length; i++) {
      if (args[i].startsWith('--')) break
      paths.push(args[i])
    }
    if (paths.length === 0) {
      console.error('ERROR: --paths requires at least one value')
      process.exit(1)
    }
    console.log(`Revalidating ${paths.length} paths...`)
    await revalidatePaths(paths)
    return
  }

  // --tag <single>
  const tagIdx = args.indexOf('--tag')
  if (tagIdx !== -1) {
    const tag = args[tagIdx + 1]
    if (!tag || tag.startsWith('--')) {
      console.error('ERROR: --tag requires a value')
      process.exit(1)
    }
    console.log(`Revalidating tag: ${tag}`)
    const result = await revalidate({ tags: [tag] })
    console.log(`Done: ${result.revalidated} revalidated.`)
    return
  }

  // --tags <multiple>
  const tagsIdx = args.indexOf('--tags')
  if (tagsIdx !== -1) {
    const tags: string[] = []
    for (let i = tagsIdx + 1; i < args.length; i++) {
      if (args[i].startsWith('--')) break
      tags.push(args[i])
    }
    if (tags.length === 0) {
      console.error('ERROR: --tags requires at least one value')
      process.exit(1)
    }
    console.log(`Revalidating ${tags.length} tags: ${tags.join(', ')}`)
    const result = await revalidate({ tags })
    console.log(`Done: ${result.revalidated} revalidated.`)
    if (result.errors) {
      for (const err of result.errors) {
        console.error(`  FAILED: ${err.item} — ${err.error}`)
      }
    }
    return
  }

  console.error('ERROR: No valid option provided. Use --help for usage.')
  process.exit(1)
}

main().catch((err) => {
  console.error('FATAL:', err instanceof Error ? err.message : err)
  process.exit(1)
})
