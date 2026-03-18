/**
 * Static analysis tests for migration 429: Attorney Enrichment Tables
 *
 * These tests validate the SQL migration file structure without executing
 * against a database. They verify idempotency patterns, table definitions,
 * RLS configuration, indexes, and constraints.
 */

import { describe, it, expect, beforeAll } from 'vitest'
import fs from 'fs'
import path from 'path'

const MIGRATION_PATH = path.resolve(
  __dirname,
  '../../supabase/migrations/429_attorney_enrichment_tables.sql'
)

let sql: string

beforeAll(() => {
  sql = fs.readFileSync(MIGRATION_PATH, 'utf-8')
})

// ─── 1. File existence and basic validity ────────────────────────────────────

describe('Migration file existence', () => {
  it('should exist at the expected path', () => {
    expect(fs.existsSync(MIGRATION_PATH)).toBe(true)
  })

  it('should not be empty', () => {
    const stat = fs.statSync(MIGRATION_PATH)
    expect(stat.size).toBeGreaterThan(0)
  })

  it('should contain valid SQL (not binary or garbled)', () => {
    // SQL files should be ASCII/UTF-8 text with recognizable SQL keywords
    expect(sql).toMatch(/CREATE TABLE/i)
    expect(sql).toMatch(/ALTER TABLE/i)
  })
})

// ─── 2. Idempotency: CREATE TABLE uses IF NOT EXISTS ─────────────────────────

describe('CREATE TABLE idempotency', () => {
  const expectedTables = [
    'attorney_education',
    'attorney_awards',
    'disciplinary_actions',
    'attorney_publications',
  ]

  it('should have exactly 4 CREATE TABLE statements', () => {
    const createTableMatches = sql.match(/CREATE\s+TABLE\s+/gi)
    expect(createTableMatches).not.toBeNull()
    expect(createTableMatches!.length).toBe(4)
  })

  it.each(expectedTables)(
    'CREATE TABLE %s should use IF NOT EXISTS',
    (table) => {
      // Match CREATE TABLE IF NOT EXISTS <table_name> with flexible whitespace
      const pattern = new RegExp(
        `CREATE\\s+TABLE\\s+IF\\s+NOT\\s+EXISTS\\s+${table}\\b`,
        'i'
      )
      expect(sql).toMatch(pattern)
    }
  )

  it('should have no CREATE TABLE without IF NOT EXISTS', () => {
    // Find all CREATE TABLE statements, then verify each has IF NOT EXISTS
    const allCreateTable = sql.match(/CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(\w+)/gi) || []
    const withoutIfNotExists = allCreateTable.filter(
      (stmt) => !/IF\s+NOT\s+EXISTS/i.test(stmt)
    )
    expect(withoutIfNotExists).toEqual([])
  })
})

// ─── 3. ALTER TABLE statements wrapped in DO $$ blocks ───────────────────────

describe('ALTER TABLE idempotency', () => {
  it('all ALTER TABLE statements should be inside DO $$ blocks', () => {
    // Extract all ALTER TABLE lines
    const alterLines: string[] = []
    const lines = sql.split('\n')

    for (let i = 0; i < lines.length; i++) {
      if (/ALTER\s+TABLE\b/i.test(lines[i])) {
        // Skip ALTER TABLE ... ENABLE ROW LEVEL SECURITY (these are idempotent by nature)
        if (/ENABLE\s+ROW\s+LEVEL\s+SECURITY/i.test(lines[i])) continue

        alterLines.push(lines[i].trim())
      }
    }

    // All remaining ALTER TABLE statements should be inside DO $$ blocks
    // Verify by checking that each ALTER TABLE (non-RLS) has a preceding DO $$ BEGIN
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      if (!/ALTER\s+TABLE\b/i.test(line)) continue
      if (/ENABLE\s+ROW\s+LEVEL\s+SECURITY/i.test(line)) continue

      // Look backwards for DO $$ BEGIN
      let foundDoBlock = false
      for (let j = i - 1; j >= Math.max(0, i - 5); j--) {
        if (/DO\s+\$\$\s+BEGIN/i.test(lines[j])) {
          foundDoBlock = true
          break
        }
      }

      expect(foundDoBlock).toBe(true)
    }
  })

  it('all DO $$ blocks should have EXCEPTION WHEN duplicate_object', () => {
    const doBlocks = sql.match(/DO\s+\$\$\s+BEGIN[\s\S]*?END\s+\$\$/gi) || []
    expect(doBlocks.length).toBeGreaterThan(0)

    for (const block of doBlocks) {
      // Each DO $$ block should handle duplicate_object exception
      expect(block).toMatch(/EXCEPTION\s+WHEN\s+duplicate_object/i)
    }
  })
})

// ─── 4. Expected tables are defined ──────────────────────────────────────────

describe('Expected table definitions', () => {
  const tables = [
    {
      name: 'attorney_education',
      requiredColumns: ['id', 'attorney_id', 'institution', 'degree', 'graduation_year', 'is_verified', 'created_at', 'updated_at'],
    },
    {
      name: 'attorney_awards',
      requiredColumns: ['id', 'attorney_id', 'title', 'issuer', 'year', 'is_verified', 'created_at'],
    },
    {
      name: 'disciplinary_actions',
      requiredColumns: ['id', 'attorney_id', 'state', 'action_type', 'effective_date', 'source_url', 'is_public', 'created_at', 'updated_at'],
    },
    {
      name: 'attorney_publications',
      requiredColumns: ['id', 'attorney_id', 'title', 'publication_type', 'publisher', 'is_verified', 'created_at'],
    },
  ]

  it.each(tables)('$name table should be defined', ({ name }) => {
    const pattern = new RegExp(`CREATE\\s+TABLE\\s+IF\\s+NOT\\s+EXISTS\\s+${name}\\b`, 'i')
    expect(sql).toMatch(pattern)
  })

  it.each(tables)('$name should have all required columns', ({ name, requiredColumns }) => {
    // Extract the CREATE TABLE block for this table
    const tablePattern = new RegExp(
      `CREATE\\s+TABLE\\s+IF\\s+NOT\\s+EXISTS\\s+${name}\\s*\\(([^;]+?)\\);`,
      'is'
    )
    const match = sql.match(tablePattern)
    expect(match).not.toBeNull()

    const tableBody = match![1]
    for (const col of requiredColumns) {
      // Column name should appear in the CREATE TABLE body
      const colPattern = new RegExp(`\\b${col}\\b`, 'i')
      expect(tableBody).toMatch(colPattern)
    }
  })

  it('all tables should have UUID primary keys', () => {
    for (const { name } of tables) {
      const tablePattern = new RegExp(
        `CREATE\\s+TABLE\\s+IF\\s+NOT\\s+EXISTS\\s+${name}\\s*\\(([^;]+?)\\);`,
        'is'
      )
      const match = sql.match(tablePattern)
      expect(match).not.toBeNull()
      expect(match![1]).toMatch(/id\s+UUID\s+PRIMARY\s+KEY/i)
    }
  })

  it('all tables should reference attorneys(id) with ON DELETE CASCADE', () => {
    for (const { name } of tables) {
      const tablePattern = new RegExp(
        `CREATE\\s+TABLE\\s+IF\\s+NOT\\s+EXISTS\\s+${name}\\s*\\(([^;]+?)\\);`,
        'is'
      )
      const match = sql.match(tablePattern)
      expect(match).not.toBeNull()
      expect(match![1]).toMatch(/REFERENCES\s+attorneys\s*\(\s*id\s*\)\s+ON\s+DELETE\s+CASCADE/i)
    }
  })
})

// ─── 5. RLS enabled on all 4 tables ──────────────────────────────────────────

describe('Row Level Security', () => {
  const tables = [
    'attorney_education',
    'attorney_awards',
    'disciplinary_actions',
    'attorney_publications',
  ]

  it.each(tables)('RLS should be enabled on %s', (table) => {
    const pattern = new RegExp(
      `ALTER\\s+TABLE\\s+${table}\\s+ENABLE\\s+ROW\\s+LEVEL\\s+SECURITY`,
      'i'
    )
    expect(sql).toMatch(pattern)
  })

  it('should have public read policies for all 4 tables', () => {
    // Each table should have a SELECT policy
    for (const table of tables) {
      const pattern = new RegExp(
        `CREATE\\s+POLICY\\s+[^;]*?ON\\s+${table}\\s+FOR\\s+SELECT`,
        'is'
      )
      expect(sql).toMatch(pattern)
    }
  })
})

// ─── 6. Expected indexes ─────────────────────────────────────────────────────

describe('Indexes', () => {
  const expectedIndexes = [
    // attorney_education
    'idx_attorney_education_attorney',
    'idx_attorney_education_institution',
    // attorney_awards
    'idx_attorney_awards_attorney',
    'idx_attorney_awards_issuer_year',
    // disciplinary_actions
    'idx_disciplinary_actions_attorney',
    'idx_disciplinary_actions_state_type',
    'idx_disciplinary_actions_effective_date',
    // attorney_publications
    'idx_attorney_publications_attorney',
    'idx_attorney_publications_type_date',
  ]

  it(`should define all ${expectedIndexes.length} expected indexes`, () => {
    for (const idx of expectedIndexes) {
      const pattern = new RegExp(`CREATE\\s+INDEX\\s+IF\\s+NOT\\s+EXISTS\\s+${idx}\\b`, 'i')
      expect(sql).toMatch(pattern)
    }
  })

  it('all CREATE INDEX statements should use IF NOT EXISTS', () => {
    const allCreateIndex = sql.match(/CREATE\s+INDEX\s+(?:IF\s+NOT\s+EXISTS\s+)?(\w+)/gi) || []
    const withoutIfNotExists = allCreateIndex.filter(
      (stmt) => !/IF\s+NOT\s+EXISTS/i.test(stmt)
    )
    expect(withoutIfNotExists).toEqual([])
  })

  it('each enrichment table should have an index on attorney_id', () => {
    const tables = [
      'attorney_education',
      'attorney_awards',
      'disciplinary_actions',
      'attorney_publications',
    ]
    for (const table of tables) {
      // Look for an index on this table that covers attorney_id
      const pattern = new RegExp(
        `CREATE\\s+INDEX\\s+IF\\s+NOT\\s+EXISTS\\s+\\w+\\s+ON\\s+${table}\\s*\\(\\s*attorney_id`,
        'i'
      )
      expect(sql).toMatch(pattern)
    }
  })
})

// ─── 7. CHECK constraints ────────────────────────────────────────────────────

describe('CHECK constraints', () => {
  it('should have a CHECK constraint on graduation_year', () => {
    expect(sql).toMatch(/chk_education_graduation_year/i)
    expect(sql).toMatch(/graduation_year\s*>=\s*1900/i)
    expect(sql).toMatch(/graduation_year\s*<=\s*2100/i)
  })

  it('should have a CHECK constraint on award year', () => {
    expect(sql).toMatch(/chk_award_year/i)
    expect(sql).toMatch(/year\s*>=\s*1950/i)
    expect(sql).toMatch(/year\s*<=\s*2100/i)
  })

  it('should have a CHECK constraint on disciplinary action state format', () => {
    expect(sql).toMatch(/chk_disciplinary_state_format/i)
    // Verify the regex pattern for 2 uppercase letters
    expect(sql).toMatch(/\^\[A-Z\]\{2\}\$/i)
  })

  it('should have a CHECK constraint on disciplinary action_type values', () => {
    expect(sql).toMatch(/chk_disciplinary_action_type/i)
    // Verify key action types are included
    const actionTypes = ['suspension', 'disbarment', 'probation', 'reinstatement']
    for (const actionType of actionTypes) {
      expect(sql).toContain(actionType)
    }
  })

  it('should have a CHECK constraint on disciplinary date range', () => {
    expect(sql).toMatch(/chk_disciplinary_date_range/i)
    expect(sql).toMatch(/end_date\s*>=\s*effective_date/i)
  })

  it('should have a CHECK constraint on publication_type values', () => {
    expect(sql).toMatch(/chk_publication_type/i)
    const pubTypes = ['article', 'book', 'law_review', 'speaking']
    for (const pubType of pubTypes) {
      expect(sql).toContain(pubType)
    }
  })

  it('disciplinary_actions.source_url should be NOT NULL', () => {
    // Extract the disciplinary_actions CREATE TABLE block
    const tablePattern = /CREATE\s+TABLE\s+IF\s+NOT\s+EXISTS\s+disciplinary_actions\s*\(([^;]+?)\);/is
    const match = sql.match(tablePattern)
    expect(match).not.toBeNull()
    // source_url should be TEXT NOT NULL (mandatory for legal data integrity)
    expect(match![1]).toMatch(/source_url\s+TEXT\s+NOT\s+NULL/i)
  })
})

// ─── 8. Unique constraints ───────────────────────────────────────────────────

describe('Unique constraints', () => {
  it('should have a unique constraint on attorney_education (attorney_id, institution, degree)', () => {
    expect(sql).toMatch(/uq_attorney_education_record/i)
    expect(sql).toMatch(/UNIQUE\s*\(\s*attorney_id\s*,\s*institution\s*,\s*degree\s*\)/i)
  })

  it('should have a unique constraint on attorney_awards (attorney_id, title, issuer, year)', () => {
    expect(sql).toMatch(/uq_attorney_award_record/i)
    expect(sql).toMatch(/UNIQUE\s*\(\s*attorney_id\s*,\s*title\s*,\s*issuer\s*,\s*year\s*\)/i)
  })

  it('should have a unique constraint on attorney_publications (attorney_id, title, publisher)', () => {
    expect(sql).toMatch(/uq_attorney_publication_record/i)
    expect(sql).toMatch(/UNIQUE\s*\(\s*attorney_id\s*,\s*title\s*,\s*publisher\s*\)/i)
  })
})
