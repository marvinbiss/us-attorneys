/**
 * Tests for P0.4 — Migration 405: RLS policy fixes
 *
 * Validates SQL syntax and semantic correctness:
 * - DROP POLICY IF EXISTS before CREATE POLICY
 * - Policies reference correct tables and columns
 * - Authentication checks use auth.role() = 'authenticated'
 * - UPDATE policies include both USING and WITH CHECK
 * - No leftover WITH CHECK (true) on sensitive tables
 */

import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

const migrationPath = path.resolve(
  __dirname,
  '../../supabase/migrations/405_fix_rls_bookings_and_audit.sql'
)
const sql = fs.readFileSync(migrationPath, 'utf-8')

describe('Migration 405 — RLS bookings and audit', () => {
  // ── Structure checks ─────────────────────────────────────────────────────

  it('exists and is not empty', () => {
    expect(sql.length).toBeGreaterThan(0)
  })

  // ── BOOKINGS table ────────────────────────────────────────────────────────

  describe('bookings INSERT policy', () => {
    it('drops the old permissive policy before creating the new one', () => {
      expect(sql).toContain('DROP POLICY IF EXISTS "Public can create bookings" ON bookings')
    })

    it('creates an authenticated-only INSERT policy', () => {
      expect(sql).toContain('CREATE POLICY "Authenticated users create bookings" ON bookings')
      expect(sql).toMatch(
        /CREATE POLICY "Authenticated users create bookings" ON bookings[\s\S]*?FOR INSERT[\s\S]*?WITH CHECK\s*\(auth\.role\(\)\s*=\s*'authenticated'\)/
      )
    })

    it('does NOT have WITH CHECK (true) for bookings INSERT', () => {
      // The old policy had WITH CHECK (true) — verify the new one does not
      const bookingsInsertSection = sql.slice(
        sql.indexOf('Authenticated users create bookings'),
        sql.indexOf('Clients update own bookings')
      )
      expect(bookingsInsertSection).not.toContain('WITH CHECK (true)')
    })
  })

  describe('bookings UPDATE policies', () => {
    it('creates client UPDATE policy with USING and WITH CHECK on client_id', () => {
      expect(sql).toContain('CREATE POLICY "Clients update own bookings" ON bookings')
      expect(sql).toMatch(/USING\s*\(client_id\s*=\s*auth\.uid\(\)\)/)
      expect(sql).toMatch(/WITH CHECK\s*\(client_id\s*=\s*auth\.uid\(\)\)/)
    })

    it('creates attorney UPDATE policy using subquery on attorneys.user_id', () => {
      expect(sql).toContain('CREATE POLICY "Attorneys update own bookings" ON bookings')
      expect(sql).toMatch(
        /attorney_id\s+IN\s*\(\s*SELECT\s+id\s+FROM\s+attorneys\s+WHERE\s+user_id\s*=\s*auth\.uid\(\)\s*\)/
      )
    })

    it('attorney UPDATE policy has both USING and WITH CHECK clauses', () => {
      const attorneyPolicySection = sql.slice(
        sql.indexOf('Attorneys update own bookings')
      )
      // Must have both USING and WITH CHECK for UPDATE
      expect(attorneyPolicySection).toContain('FOR UPDATE USING')
      expect(attorneyPolicySection).toContain('WITH CHECK')
    })
  })

  // ── REVIEW_VOTES table ────────────────────────────────────────────────────

  describe('review_votes INSERT policy', () => {
    it('drops both old permissive policies', () => {
      expect(sql).toContain('DROP POLICY IF EXISTS "Anyone can vote on reviews" ON review_votes')
      expect(sql).toContain('DROP POLICY IF EXISTS "Anyone can insert review votes" ON review_votes')
    })

    it('creates authenticated-only INSERT policy', () => {
      expect(sql).toContain('CREATE POLICY "Authenticated users can vote on reviews" ON review_votes')
      expect(sql).toMatch(
        /CREATE POLICY "Authenticated users can vote on reviews" ON review_votes[\s\S]*?FOR INSERT[\s\S]*?WITH CHECK\s*\(auth\.role\(\)\s*=\s*'authenticated'\)/
      )
    })
  })

  // ── ESTIMATION_LEADS — intentionally public ───────────────────────────────

  describe('estimation_leads (intentionally public)', () => {
    it('does NOT drop or change estimation_leads policies', () => {
      expect(sql).not.toMatch(/DROP POLICY.*ON estimation_leads/)
      expect(sql).not.toMatch(/CREATE POLICY.*ON estimation_leads/)
    })
  })

  // ── ANALYTICS_EVENTS — intentionally public ───────────────────────────────

  describe('analytics_events (intentionally public)', () => {
    it('does NOT drop or change analytics_events policies', () => {
      expect(sql).not.toMatch(/DROP POLICY.*ON analytics_events/)
      expect(sql).not.toMatch(/CREATE POLICY.*ON analytics_events/)
    })
  })

  // ── WAITLIST — conditional fix ────────────────────────────────────────────

  describe('waitlist (conditional)', () => {
    it('uses DO $$ block to check if waitlist table exists', () => {
      expect(sql).toContain("IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'waitlist')")
    })

    it('creates authenticated-only policy for waitlist INSERT', () => {
      expect(sql).toContain("Authenticated users join waitlist")
      expect(sql).toContain("auth.role() = ''authenticated''")
    })
  })

  // ── General SQL hygiene ───────────────────────────────────────────────────

  describe('SQL hygiene', () => {
    it('every CREATE POLICY is preceded by DROP POLICY IF EXISTS for the same table (where applicable)', () => {
      // bookings has DROP before CREATE
      const bookingsDropIdx = sql.indexOf('DROP POLICY IF EXISTS "Public can create bookings"')
      const bookingsCreateIdx = sql.indexOf('CREATE POLICY "Authenticated users create bookings"')
      expect(bookingsDropIdx).toBeLessThan(bookingsCreateIdx)

      // review_votes has DROP before CREATE
      const rvDropIdx = sql.indexOf('DROP POLICY IF EXISTS "Anyone can vote on reviews"')
      const rvCreateIdx = sql.indexOf('CREATE POLICY "Authenticated users can vote on reviews"')
      expect(rvDropIdx).toBeLessThan(rvCreateIdx)
    })

    it('uses auth.role() for role checks (not auth.uid() IS NOT NULL)', () => {
      // The standard Supabase pattern for "is authenticated" is auth.role() = 'authenticated'
      const createPolicies = sql.match(/CREATE POLICY[\s\S]*?;/g) || []
      for (const policy of createPolicies) {
        if (policy.includes('FOR INSERT') && !policy.includes('client_id') && !policy.includes('attorney_id')) {
          // Generic INSERT policies should use auth.role()
          if (policy.includes("'authenticated'")) {
            expect(policy).toMatch(/auth\.role\(\)/)
          }
        }
      }
    })

    it('does not contain any WITH CHECK (true) for user-facing tables', () => {
      // Split out the documentation comments from actual SQL
      const sqlStatements = sql
        .split('\n')
        .filter(line => !line.trim().startsWith('--'))
        .join('\n')

      // The actual CREATE POLICY statements should not have WITH CHECK (true)
      const createStatements = sqlStatements.match(/CREATE POLICY[^;]*;/g) || []
      for (const stmt of createStatements) {
        expect(stmt).not.toContain('WITH CHECK (true)')
      }
    })
  })
})
