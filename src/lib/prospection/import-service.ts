/**
 * Contact Import Service - Prospection
 * CSV/Excel import with validation, normalization and deduplication
 */

import { createAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/logger'
import type {
  ContactType,
  ContactSource,
  ProspectionContactInsert,
  ImportResult,
  ImportError,
  ImportDuplicate,
  ColumnMapping,
} from '@/types/prospection'

// Safety limits
const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50 MB
const MAX_ROWS = 500_000

// Valid fields for mapping (exported for validation)
export const VALID_FIELDS: (keyof ProspectionContactInsert)[] = [
  'contact_type', 'company_name', 'contact_name', 'email', 'phone',
  'address', 'postal_code', 'city', 'department', 'region',
  'location_code', 'population',
]

/**
 * Parse a CSV file into rows
 * Enforces MAX_ROWS limit to prevent memory exhaustion on large files.
 */
export function parseCSV(content: string): { headers: string[]; rows: Record<string, string>[] } {
  // Check file size (byte length of the string)
  const byteSize = Buffer.byteLength(content, 'utf-8')
  if (byteSize > MAX_FILE_SIZE) {
    throw new Error(`File exceeds maximum allowed size (${Math.round(MAX_FILE_SIZE / 1024 / 1024)} MB)`)
  }

  const lines = content.split(/\r?\n/).filter(line => line.trim())
  if (lines.length < 2) return { headers: [], rows: [] }

  // Enforce row limit (lines includes header, so data rows = lines.length - 1)
  if (lines.length - 1 > MAX_ROWS) {
    throw new Error(`File contains too many rows (${lines.length - 1}). Maximum allowed: ${MAX_ROWS}`)
  }

  // Detect separator (comma, semicolon, tab)
  const firstLine = lines[0]
  const separator = firstLine.includes(';') ? ';'
    : firstLine.includes('\t') ? '\t'
    : ','

  const headers = parseCsvLine(firstLine, separator).map(h => h.trim())
  const rows = lines.slice(1).map(line => {
    const values = parseCsvLine(line, separator)
    const row: Record<string, string> = {}
    headers.forEach((h, i) => {
      row[h] = (values[i] || '').trim()
    })
    return row
  })

  return { headers, rows }
}

/**
 * Parse a CSV line (handles quoted fields)
 */
function parseCsvLine(line: string, separator: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (char === separator && !inQuotes) {
      result.push(current)
      current = ''
    } else {
      current += char
    }
  }
  result.push(current)

  return result.map(v => v.replace(/^"|"$/g, '').trim())
}

/**
 * Auto-suggest column mapping
 */
export function suggestColumnMapping(headers: string[]): ColumnMapping {
  const mapping: ColumnMapping = {}
  const lowerHeaders = headers.map(h => h.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''))

  const fieldPatterns: Partial<Record<keyof ProspectionContactInsert, string[]>> = {
    contact_name: ['nom', 'name', 'contact', 'prenom', 'firstname', 'lastname', 'nom_contact', 'raison_sociale'],
    company_name: ['entreprise', 'company', 'societe', 'raison_sociale', 'denomination', 'enseigne'],
    email: ['email', 'mail', 'courriel', 'e-mail', 'adresse_email'],
    phone: ['telephone', 'phone', 'tel', 'portable', 'mobile', 'numero'],
    address: ['adresse', 'address', 'rue', 'voie', 'adresse_postale'],
    postal_code: ['code_postal', 'cp', 'postal_code', 'zip', 'code postal'],
    city: ['city', 'ville', 'commune', 'localite'],
    department: ['departement', 'department', 'dept', 'dep'],
    region: ['region'],
    location_code: ['code_insee', 'insee', 'location_code'],
    contact_type: ['type', 'contact_type', 'categorie'],
    population: ['population', 'habitants'],
  }

  for (const [field, patterns] of Object.entries(fieldPatterns)) {
    for (let i = 0; i < lowerHeaders.length; i++) {
      if (patterns.some(p => lowerHeaders[i].includes(p)) && !Object.values(mapping).includes(field as keyof ProspectionContactInsert)) {
        mapping[headers[i]] = field as keyof ProspectionContactInsert
        break
      }
    }
  }

  // Unmapped columns → null
  for (const h of headers) {
    if (!(h in mapping)) {
      mapping[h] = null
    }
  }

  return mapping
}

/**
 * Validate and transform imported rows
 */
export function validateRows(
  rows: Record<string, string>[],
  mapping: ColumnMapping,
  contactType: ContactType,
  sourceFile: string
): {
  valid: ProspectionContactInsert[]
  errors: ImportError[]
} {
  const valid: ProspectionContactInsert[] = []
  const errors: ImportError[] = []

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    const rowNum = i + 2 // +2 because header = row 1

    const contact: ProspectionContactInsert = {
      contact_type: contactType,
      source: 'import' as ContactSource,
      source_file: sourceFile,
      source_row: rowNum,
    }

    let hasContactInfo = false

    for (const [csvCol, field] of Object.entries(mapping)) {
      if (!field || !row[csvCol]) continue

      const value = row[csvCol].trim()
      if (!value) continue

      switch (field) {
        case 'email': {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
          if (!emailRegex.test(value)) {
            errors.push({ row: rowNum, field: 'email', message: `Invalid email: ${value}` })
          } else {
            contact.email = value.toLowerCase()
            hasContactInfo = true
          }
          break
        }
        case 'phone': {
          contact.phone = value
          hasContactInfo = true
          break
        }
        case 'population': {
          const pop = parseInt(value.replace(/\s/g, ''), 10)
          if (!isNaN(pop)) contact.population = pop
          break
        }
        case 'contact_type': {
          const validTypes: ContactType[] = ['attorney', 'client', 'municipality']
          const lower = value.toLowerCase()
          if (validTypes.includes(lower as ContactType)) {
            contact.contact_type = lower as ContactType
          }
          break
        }
        default:
          (contact as unknown as Record<string, unknown>)[field] = value
      }
    }

    if (!hasContactInfo) {
      errors.push({ row: rowNum, field: 'email/phone', message: 'Neither email nor phone provided' })
      continue
    }

    valid.push(contact)
  }

  return { valid, errors }
}

/**
 * Check duplicates against existing database
 * Uses batched lookups (chunks of 500) instead of loading ALL contacts into memory.
 */
export async function checkDuplicates(
  contacts: ProspectionContactInsert[]
): Promise<{
  unique: ProspectionContactInsert[]
  duplicates: ImportDuplicate[]
}> {
  const supabase = createAdminClient()
  const unique: ProspectionContactInsert[] = []
  const duplicates: ImportDuplicate[] = []

  // Collect unique emails and phones from the import batch
  const allEmails = Array.from(new Set(
    contacts.filter(c => c.email).map(c => c.email!.toLowerCase())
  ))
  const allPhones = Array.from(new Set(
    contacts.filter(c => c.phone).map(c => c.phone!)
  ))

  const existingByEmail: Record<string, string> = {}
  const existingByPhone: Record<string, string> = {}

  // Batch email lookups in chunks of 500 to avoid query size limits
  const LOOKUP_BATCH_SIZE = 500
  if (allEmails.length > 0) {
    for (let i = 0; i < allEmails.length; i += LOOKUP_BATCH_SIZE) {
      const batch = allEmails.slice(i, i + LOOKUP_BATCH_SIZE)
      const { data } = await supabase
        .from('prospection_contacts')
        .select('id, email_canonical')
        .in('email_canonical', batch)
        .eq('is_active', true)

      if (data) {
        for (const d of data) {
          if (d.email_canonical) {
            existingByEmail[d.email_canonical] = d.id
          }
        }
      }
    }
  }

  // Batch phone lookups: extract last 9 digits from import phones and
  // look up matching phone_e164 values in batches
  if (allPhones.length > 0) {
    // Normalize import phones to their last 9 digits for matching
    const phoneSuffixes = Array.from(new Set(
      allPhones.map(p => p.replace(/\D/g, '').slice(-9)).filter(s => s.length === 9)
    ))

    // Batch phone lookups using .or() to avoid N+1 queries
    for (let i = 0; i < phoneSuffixes.length; i += LOOKUP_BATCH_SIZE) {
      const batch = phoneSuffixes.slice(i, i + LOOKUP_BATCH_SIZE)
      if (batch.length === 0) continue

      const orFilter = batch.map(s => `phone_e164.like.%${s}`).join(',')
      const { data } = await supabase
        .from('prospection_contacts')
        .select('id, phone_e164')
        .eq('is_active', true)
        .or(orFilter)

      if (data) {
        for (const d of data) {
          if (d.phone_e164) {
            const suffix = d.phone_e164.replace(/\D/g, '').slice(-9)
            if (suffix.length === 9 && !existingByPhone[suffix]) {
              existingByPhone[suffix] = d.id
            }
          }
        }
      }
    }
  }

  // Verify each contact
  const seenEmails = new Set<string>()
  const seenPhones = new Set<string>()

  for (const contact of contacts) {
    const email = contact.email?.toLowerCase()
    const phone = contact.phone
    const phoneSuffix = phone ? phone.replace(/\D/g, '').slice(-9) : ''

    let isDuplicate = false

    if (email && existingByEmail[email]) {
      duplicates.push({
        row: contact.source_row || 0,
        existing_id: existingByEmail[email],
        match_field: 'email',
        match_value: email,
      })
      isDuplicate = true
    }

    if (!isDuplicate && email && seenEmails.has(email)) {
      isDuplicate = true
    }

    if (!isDuplicate && phoneSuffix.length === 9 && existingByPhone[phoneSuffix]) {
      duplicates.push({
        row: contact.source_row || 0,
        existing_id: existingByPhone[phoneSuffix],
        match_field: 'phone',
        match_value: phone!,
      })
      isDuplicate = true
    }

    if (!isDuplicate && phone && seenPhones.has(phoneSuffix)) {
      isDuplicate = true
    }

    if (!isDuplicate) {
      if (email) seenEmails.add(email)
      if (phoneSuffix.length === 9) seenPhones.add(phoneSuffix)
      unique.push(contact)
    }
  }

  return { unique, duplicates }
}

/**
 * Insert contacts into database in batches
 */
export async function bulkInsertContacts(
  contacts: ProspectionContactInsert[]
): Promise<{ inserted: number; failed: number }> {
  const supabase = createAdminClient()
  let inserted = 0
  let failed = 0
  const batchSize = 500

  for (let i = 0; i < contacts.length; i += batchSize) {
    const batch = contacts.slice(i, i + batchSize)
    const { error } = await supabase
      .from('prospection_contacts')
      .insert(batch)

    if (error) {
      logger.error('Bulk insert error', { error: error.message, offset: i })
      failed += batch.length
    } else {
      inserted += batch.length
    }
  }

  return { inserted, failed }
}

/**
 * Complete import pipeline
 * Validates file size before processing.
 */
export async function importContacts(
  csvContent: string,
  mapping: ColumnMapping,
  contactType: ContactType,
  sourceFile: string
): Promise<ImportResult> {
  // 0. Validate file size upfront
  const byteSize = Buffer.byteLength(csvContent, 'utf-8')
  if (byteSize > MAX_FILE_SIZE) {
    throw new Error(`File exceeds maximum allowed size (${Math.round(MAX_FILE_SIZE / 1024 / 1024)} MB)`)
  }

  // 1. Parse the CSV (also validates row count)
  const { rows } = parseCSV(csvContent)

  // 2. Validate
  const { valid, errors } = validateRows(rows, mapping, contactType, sourceFile)

  // 3. Deduplicate
  const { unique, duplicates } = await checkDuplicates(valid)

  // 4. Insert
  const { inserted, failed } = await bulkInsertContacts(unique)

  return {
    total_rows: rows.length,
    valid: valid.length,
    duplicates: duplicates.length,
    errors: errors.length + failed,
    imported: inserted,
    error_details: errors,
    duplicate_details: duplicates,
  }
}

/**
 * Sync active attorneys from database to prospection_contacts
 */
export async function syncArtisansFromDatabase(
  filters?: { department?: string; service?: string }
): Promise<{ synced: number; skipped: number }> {
  const supabase = createAdminClient()

  // Build the query
  let query = supabase
    .from('attorneys')
    .select('id, name, email, phone, address_street, address_city, address_postal_code, address_department, address_region, siret')
    .eq('is_active', true)

  if (filters?.department) {
    query = query.eq('address_department', filters.department)
  }

  const { data: providers, error } = await query

  if (error || !providers) {
    logger.error('Failed to load providers', { error: error?.message })
    return { synced: 0, skipped: 0 }
  }

  let synced = 0
  let skipped = 0

  for (const provider of providers) {
    // Check if already imported
    const { data: existing } = await supabase
      .from('prospection_contacts')
      .select('id')
      .eq('attorney_id', provider.id)
      .eq('is_active', true)
      .limit(1)

    if (existing && existing.length > 0) {
      skipped++
      continue
    }

    const contact: ProspectionContactInsert = {
      contact_type: 'attorney',
      company_name: provider.name,
      contact_name: provider.name,
      email: provider.email,
      phone: provider.phone,
      address: provider.address_street,
      postal_code: provider.address_postal_code,
      city: provider.address_city,
      department: provider.address_department,
      region: provider.address_region,
      attorney_id: provider.id,
      source: 'database',
    }

    const { error: insertError } = await supabase
      .from('prospection_contacts')
      .insert(contact)

    if (insertError) {
      logger.warn('Failed to sync provider', { id: provider.id, error: insertError.message })
      skipped++
    } else {
      synced++
    }
  }

  return { synced, skipped }
}
