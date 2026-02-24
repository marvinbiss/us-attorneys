/**
 * audit-all-mappings.ts
 *
 * Queries Supabase to build a complete cross-reference of specialty vs code_naf
 * for active providers. Uses count:exact to avoid the 1000-row limit.
 *
 * Run: cd /c/Users/USER/Downloads/servicesartisans && npx tsx scripts/audit-all-mappings.ts
 */

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://umjmbdbwcsxrvfqktiui.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVtam1iZGJ3Y3N4cnZmcWt0aXVpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTY2NjQ1OCwiZXhwIjoyMDg1MjQyNDU4fQ.6hXdR5jfhCl1AA5052k3YrBmI-UMhu36mxV2IPvYxjc',
  { auth: { autoRefreshToken: false, persistSession: false } }
)

const SPECIALTIES = [
  'peintre', 'peintre-en-batiment', 'carreleur', 'plombier', 'couvreur',
  'climaticien', 'chauffagiste', 'menuisier', 'vitrier', 'serrurier',
  'charpentier', 'electricien', 'macon', 'solier', 'nettoyage',
  'jardinier', 'Terrassier', 'Plâtrier', 'Climaticien'
]

const NAF_CODES = [
  '43.22A', '43.21A', '43.32A', '43.33Z', '43.99C', '43.34Z',
  '43.31Z', '43.22B', '43.39Z', '43.32B', '43.91B', '43.29A', '43.91A'
]

interface SpecialtyNafEntry {
  specialty: string
  totalCount: number
  nafBreakdown: { code_naf: string; libelle_naf: string; count: number }[]
}

interface NafSpecialtyEntry {
  code_naf: string
  libelle_naf: string
  totalCount: number
  specialtyBreakdown: { specialty: string; count: number }[]
}

async function getCount(
  specialty: string | null,
  code_naf: string | null
): Promise<number> {
  let query = supabase
    .from('providers')
    .select('id', { count: 'exact', head: true })
    .eq('is_active', true)

  if (specialty !== null) {
    query = query.eq('specialty', specialty)
  }
  if (code_naf !== null) {
    query = query.eq('code_naf', code_naf)
  }

  const { count, error } = await query
  if (error) {
    console.error(`Error querying specialty=${specialty}, code_naf=${code_naf}:`, error.message)
    return 0
  }
  return count ?? 0
}

async function getCountWithNullNaf(specialty: string): Promise<number> {
  const { count, error } = await supabase
    .from('providers')
    .select('id', { count: 'exact', head: true })
    .eq('is_active', true)
    .eq('specialty', specialty)
    .is('code_naf', null)

  if (error) {
    console.error(`Error querying null NAF for specialty=${specialty}:`, error.message)
    return 0
  }
  return count ?? 0
}

async function getCountWithNullSpecialty(code_naf: string): Promise<number> {
  const { count, error } = await supabase
    .from('providers')
    .select('id', { count: 'exact', head: true })
    .eq('is_active', true)
    .eq('code_naf', code_naf)
    .is('specialty', null)

  if (error) {
    console.error(`Error querying null specialty for code_naf=${code_naf}:`, error.message)
    return 0
  }
  return count ?? 0
}

async function getLibelleForNaf(code_naf: string): Promise<string> {
  const { data, error } = await supabase
    .from('providers')
    .select('libelle_naf')
    .eq('code_naf', code_naf)
    .not('libelle_naf', 'is', null)
    .limit(1)

  if (error || !data || data.length === 0) return '(unknown)'
  return data[0].libelle_naf || '(empty)'
}

async function main() {
  console.log('='.repeat(100))
  console.log('AUDIT: Complete specialty <-> code_naf Cross-Reference')
  console.log('Date:', new Date().toISOString())
  console.log('Filter: is_active = true only')
  console.log('='.repeat(100))

  // First, get overall active provider count
  const { count: totalActive } = await supabase
    .from('providers')
    .select('id', { count: 'exact', head: true })
    .eq('is_active', true)

  console.log(`\nTotal active providers: ${totalActive}\n`)

  // Also check for specialties or NAF codes not in our known lists
  console.log('--- Checking for unknown specialties/NAF codes ---')
  const { data: sampleSpecialties } = await supabase
    .from('providers')
    .select('specialty')
    .eq('is_active', true)
    .not('specialty', 'is', null)
    .limit(1000)

  const distinctSpecialties = [...new Set((sampleSpecialties || []).map(r => r.specialty))].sort()
  const unknownSpecialties = distinctSpecialties.filter(s => !SPECIALTIES.includes(s))
  if (unknownSpecialties.length > 0) {
    console.log(`WARNING: Found specialties not in known list: ${unknownSpecialties.join(', ')}`)
  } else {
    console.log('All found specialties are in the known list.')
  }

  const { data: sampleNafs } = await supabase
    .from('providers')
    .select('code_naf')
    .eq('is_active', true)
    .not('code_naf', 'is', null)
    .limit(1000)

  const distinctNafs = [...new Set((sampleNafs || []).map(r => r.code_naf))].sort()
  const unknownNafs = distinctNafs.filter(n => !NAF_CODES.includes(n))
  if (unknownNafs.length > 0) {
    console.log(`WARNING: Found NAF codes not in known list: ${unknownNafs.join(', ')}`)
  } else {
    console.log('All found NAF codes are in the known list.')
  }
  console.log(`Distinct specialties found: ${distinctSpecialties.join(', ')}`)
  console.log(`Distinct NAF codes found: ${distinctNafs.join(', ')}`)

  // Collect libelle_naf for each NAF code
  const libelleMap: Record<string, string> = {}
  const allNafCodes = [...new Set([...NAF_CODES, ...distinctNafs])]
  for (const naf of allNafCodes) {
    libelleMap[naf] = await getLibelleForNaf(naf)
  }

  // ============================================================
  // SECTION 1: specialty -> code_naf matrix
  // ============================================================
  console.log('\n' + '='.repeat(100))
  console.log('SECTION 1: Complete specialty -> code_naf matrix')
  console.log('For each specialty: which NAF codes do its active providers have?')
  console.log('='.repeat(100))

  const allSpecialties = [...new Set([...SPECIALTIES, ...distinctSpecialties])].sort((a, b) =>
    a.toLowerCase().localeCompare(b.toLowerCase())
  )

  const specialtyData: SpecialtyNafEntry[] = []

  for (const spec of allSpecialties) {
    const totalCount = await getCount(spec, null)
    if (totalCount === 0) continue // skip if no active providers

    const nafBreakdown: SpecialtyNafEntry['nafBreakdown'] = []

    for (const naf of allNafCodes) {
      const count = await getCount(spec, naf)
      if (count > 0) {
        nafBreakdown.push({
          code_naf: naf,
          libelle_naf: libelleMap[naf],
          count
        })
      }
    }

    // Also check NULL code_naf
    const nullNafCount = await getCountWithNullNaf(spec)
    if (nullNafCount > 0) {
      nafBreakdown.push({
        code_naf: '(NULL)',
        libelle_naf: '(no NAF code)',
        count: nullNafCount
      })
    }

    nafBreakdown.sort((a, b) => b.count - a.count)

    specialtyData.push({ specialty: spec, totalCount, nafBreakdown })

    console.log(`\n  Specialty: "${spec}" — ${totalCount} active providers`)
    for (const entry of nafBreakdown) {
      const pct = ((entry.count / totalCount) * 100).toFixed(1)
      console.log(`    ${entry.code_naf.padEnd(10)} ${String(entry.count).padStart(6)} providers (${pct.padStart(5)}%)  — ${entry.libelle_naf}`)
    }
  }

  // ============================================================
  // SECTION 2: code_naf -> specialty matrix
  // ============================================================
  console.log('\n' + '='.repeat(100))
  console.log('SECTION 2: Complete code_naf -> specialty matrix')
  console.log('For each NAF code: which specialties are associated with it?')
  console.log('='.repeat(100))

  const nafData: NafSpecialtyEntry[] = []

  for (const naf of allNafCodes) {
    const totalCount = await getCount(null, naf)
    if (totalCount === 0) continue

    const specialtyBreakdown: NafSpecialtyEntry['specialtyBreakdown'] = []

    for (const spec of allSpecialties) {
      const count = await getCount(spec, naf)
      if (count > 0) {
        specialtyBreakdown.push({ specialty: spec, count })
      }
    }

    // Also check NULL specialty
    const nullSpecCount = await getCountWithNullSpecialty(naf)
    if (nullSpecCount > 0) {
      specialtyBreakdown.push({ specialty: '(NULL)', count: nullSpecCount })
    }

    specialtyBreakdown.sort((a, b) => b.count - a.count)

    nafData.push({
      code_naf: naf,
      libelle_naf: libelleMap[naf],
      totalCount,
      specialtyBreakdown
    })

    console.log(`\n  NAF: ${naf} — "${libelleMap[naf]}" — ${totalCount} active providers`)
    for (const entry of specialtyBreakdown) {
      const pct = ((entry.count / totalCount) * 100).toFixed(1)
      console.log(`    ${entry.specialty.padEnd(25)} ${String(entry.count).padStart(6)} providers (${pct.padStart(5)}%)`)
    }
  }

  // ============================================================
  // SECTION 3: Identify 1:1 mappings and conflicts
  // ============================================================
  console.log('\n' + '='.repeat(100))
  console.log('SECTION 3: Mapping Analysis — 1:1 mappings vs conflicts')
  console.log('='.repeat(100))

  // 3a: Specialties that map to exactly 1 NAF code
  console.log('\n--- 3a: Specialties that map to exactly 1 NAF code (clean 1:1) ---')
  const cleanSpecialties = specialtyData.filter(s => {
    const nonNull = s.nafBreakdown.filter(n => n.code_naf !== '(NULL)')
    return nonNull.length === 1
  })
  if (cleanSpecialties.length === 0) {
    console.log('  (none)')
  } else {
    for (const s of cleanSpecialties) {
      const primary = s.nafBreakdown.find(n => n.code_naf !== '(NULL)')!
      const nullEntry = s.nafBreakdown.find(n => n.code_naf === '(NULL)')
      const nullNote = nullEntry ? ` (+${nullEntry.count} with NULL NAF)` : ''
      console.log(`  "${s.specialty}" -> ${primary.code_naf} (${primary.count}/${s.totalCount} providers)${nullNote}`)
    }
  }

  // 3b: Specialties spread across multiple NAF codes
  console.log('\n--- 3b: Specialties with providers across MULTIPLE NAF codes (conflicts) ---')
  const multiNafSpecialties = specialtyData.filter(s => {
    const nonNull = s.nafBreakdown.filter(n => n.code_naf !== '(NULL)')
    return nonNull.length > 1
  })
  if (multiNafSpecialties.length === 0) {
    console.log('  (none)')
  } else {
    for (const s of multiNafSpecialties) {
      const nonNull = s.nafBreakdown.filter(n => n.code_naf !== '(NULL)')
      const codes = nonNull.map(n => `${n.code_naf}(${n.count})`).join(', ')
      console.log(`  "${s.specialty}" -> ${nonNull.length} NAF codes: ${codes}`)
    }
  }

  // 3c: Specialties with NO NAF code at all (all NULL)
  console.log('\n--- 3c: Specialties where ALL providers have NULL code_naf ---')
  const allNullSpecialties = specialtyData.filter(s => {
    const nonNull = s.nafBreakdown.filter(n => n.code_naf !== '(NULL)')
    return nonNull.length === 0
  })
  if (allNullSpecialties.length === 0) {
    console.log('  (none)')
  } else {
    for (const s of allNullSpecialties) {
      console.log(`  "${s.specialty}" — ${s.totalCount} providers, all with NULL code_naf`)
    }
  }

  // 3d: NAF codes shared by multiple specialties
  console.log('\n--- 3d: NAF codes shared by MULTIPLE specialties (ambiguous NAF) ---')
  const multiSpecNafs = nafData.filter(n => {
    const nonNull = n.specialtyBreakdown.filter(s => s.specialty !== '(NULL)')
    return nonNull.length > 1
  })
  if (multiSpecNafs.length === 0) {
    console.log('  (none)')
  } else {
    for (const n of multiSpecNafs) {
      const nonNull = n.specialtyBreakdown.filter(s => s.specialty !== '(NULL)')
      const specs = nonNull.map(s => `${s.specialty}(${s.count})`).join(', ')
      console.log(`  ${n.code_naf} "${n.libelle_naf}" -> ${nonNull.length} specialties: ${specs}`)
    }
  }

  // 3e: NAF codes that map to exactly 1 specialty
  console.log('\n--- 3e: NAF codes that map to exactly 1 specialty (clean 1:1) ---')
  const cleanNafs = nafData.filter(n => {
    const nonNull = n.specialtyBreakdown.filter(s => s.specialty !== '(NULL)')
    return nonNull.length === 1
  })
  if (cleanNafs.length === 0) {
    console.log('  (none)')
  } else {
    for (const n of cleanNafs) {
      const primary = n.specialtyBreakdown.find(s => s.specialty !== '(NULL)')!
      const nullEntry = n.specialtyBreakdown.find(s => s.specialty === '(NULL)')
      const nullNote = nullEntry ? ` (+${nullEntry.count} with NULL specialty)` : ''
      console.log(`  ${n.code_naf} "${n.libelle_naf}" -> "${primary.specialty}" (${primary.count}/${n.totalCount})${nullNote}`)
    }
  }

  // Summary table
  console.log('\n' + '='.repeat(100))
  console.log('SUMMARY TABLE')
  console.log('='.repeat(100))
  console.log(`\n  Total active providers:              ${totalActive}`)
  console.log(`  Distinct specialties with providers:  ${specialtyData.length}`)
  console.log(`  Distinct NAF codes with providers:    ${nafData.length}`)
  console.log(`  Clean 1:1 specialty->NAF:             ${cleanSpecialties.length}`)
  console.log(`  Multi-NAF specialties (conflicts):    ${multiNafSpecialties.length}`)
  console.log(`  All-NULL-NAF specialties:             ${allNullSpecialties.length}`)
  console.log(`  Clean 1:1 NAF->specialty:             ${cleanNafs.length}`)
  console.log(`  Multi-specialty NAFs (ambiguous):     ${multiSpecNafs.length}`)

  console.log('\n' + '='.repeat(100))
  console.log('AUDIT COMPLETE')
  console.log('='.repeat(100))
}

main().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
