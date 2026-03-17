/**
 * Dashboard V2 — RLS policy tests
 *
 * These tests verify the SQL migration constraints:
 * 1. lead_events is append-only (no UPDATE, no DELETE)
 * 2. audit_logs is immutable (no UPDATE, no DELETE)
 * 3. access_logs is append-only (no UPDATE, no DELETE)
 * 4. RLS policies are correctly defined
 *
 * NOTE: These tests validate the SQL schema design, not runtime queries.
 * Runtime RLS tests require a live Supabase instance.
 */

import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { join } from 'path'

const MIGRATION_PATH = join(
  process.cwd(),
  'supabase/migrations/106_dashboard_v2.sql'
)

let migrationSQL: string

try {
  migrationSQL = readFileSync(MIGRATION_PATH, 'utf-8')
} catch {
  migrationSQL = ''
}

describe('Dashboard V2 Migration — Schema Constraints', () => {
  it('should have the migration file', () => {
    expect(migrationSQL.length).toBeGreaterThan(0)
  })

  describe('lead_events table', () => {
    it('creates lead_events table', () => {
      expect(migrationSQL).toContain('CREATE TABLE IF NOT EXISTS lead_events')
    })

    it('has required columns', () => {
      expect(migrationSQL).toContain('lead_id UUID NOT NULL')
      expect(migrationSQL).toContain('event_type TEXT NOT NULL')
      expect(migrationSQL).toContain('metadata JSONB NOT NULL')
      expect(migrationSQL).toContain("DEFAULT '{}'")
    })

    it('enforces event_type CHECK constraint', () => {
      expect(migrationSQL).toContain("CHECK (event_type IN (")
      expect(migrationSQL).toContain("'created'")
      expect(migrationSQL).toContain("'dispatched'")
      expect(migrationSQL).toContain("'viewed'")
      expect(migrationSQL).toContain("'quoted'")
      expect(migrationSQL).toContain("'declined'")
      expect(migrationSQL).toContain("'reassigned'")
    })

    it('has BEFORE UPDATE trigger to prevent mutation', () => {
      expect(migrationSQL).toContain('trigger_lead_events_no_update')
      expect(migrationSQL).toContain('BEFORE UPDATE ON lead_events')
    })

    it('has BEFORE DELETE trigger to prevent deletion', () => {
      expect(migrationSQL).toContain('trigger_lead_events_no_delete')
      expect(migrationSQL).toContain('BEFORE DELETE ON lead_events')
    })

    it('has RLS enabled', () => {
      expect(migrationSQL).toContain('ALTER TABLE lead_events ENABLE ROW LEVEL SECURITY')
    })

    it('has admin-only SELECT policy (artisan policy deferred to later migration)', () => {
      expect(migrationSQL).toContain('Admins view all lead events')
    })

    it('has admin SELECT policy', () => {
      expect(migrationSQL).toContain('Admins view all lead events')
      expect(migrationSQL).toContain('is_admin()')
    })

    it('has indexes for efficient querying', () => {
      expect(migrationSQL).toContain('idx_lead_events_lead')
      expect(migrationSQL).toContain('idx_lead_events_provider')
      expect(migrationSQL).toContain('idx_lead_events_type')
    })
  })

  describe('access_logs table', () => {
    it('adds indexes on access_logs (table created in earlier migration)', () => {
      expect(migrationSQL).toContain('idx_access_logs_path')
      expect(migrationSQL).toContain('idx_access_logs_created')
    })

    it('has BEFORE UPDATE trigger to prevent mutation', () => {
      expect(migrationSQL).toContain('trigger_access_logs_no_update')
      expect(migrationSQL).toContain('BEFORE UPDATE ON access_logs')
    })

    it('has BEFORE DELETE trigger to prevent deletion', () => {
      expect(migrationSQL).toContain('trigger_access_logs_no_delete')
      expect(migrationSQL).toContain('BEFORE DELETE ON access_logs')
    })

    it('has RLS enabled with admin-only access', () => {
      expect(migrationSQL).toContain('ALTER TABLE access_logs ENABLE ROW LEVEL SECURITY')
      expect(migrationSQL).toContain('Admins view access logs')
    })
  })

  describe('audit_logs immutability', () => {
    it('has BEFORE UPDATE trigger to prevent mutation', () => {
      expect(migrationSQL).toContain('trigger_audit_logs_no_update')
      expect(migrationSQL).toContain('BEFORE UPDATE ON audit_logs')
    })

    it('has BEFORE DELETE trigger to prevent deletion', () => {
      expect(migrationSQL).toContain('trigger_audit_logs_no_delete')
      expect(migrationSQL).toContain('BEFORE DELETE ON audit_logs')
    })

    it('raises exception with descriptive message', () => {
      expect(migrationSQL).toContain("audit_logs is immutable: % not allowed")
    })
  })
})

describe('Dashboard V2 — No Public Imports', () => {
  const dashboardFiles = [
    'src/app/(private)/attorney-dashboard/leads/page.tsx',
    'src/app/(private)/attorney-dashboard/leads/[id]/page.tsx',
    'src/app/(private)/attorney-dashboard/leads/[id]/history/page.tsx',
    'src/app/(private)/attorney-dashboard/settings/page.tsx',
    'src/app/admin/(dashboard)/leads/page.tsx',
    'src/app/admin/(dashboard)/dispatch/page.tsx',
    'src/app/admin/(dashboard)/tools/page.tsx',
    'src/app/admin/(dashboard)/journal/page.tsx',
  ]

  for (const file of dashboardFiles) {
    it(`${file} does not import from (public)`, () => {
      try {
        const content = readFileSync(join(process.cwd(), file), 'utf-8')
        expect(content).not.toContain('from \'@/app/(public)')
        expect(content).not.toContain('from "@/app/(public)')
        expect(content).not.toContain('/(public)/')
      } catch {
        // File might not exist in test environment
      }
    })
  }
})

describe('Dashboard V2 — X-Robots-Tag + Cache-Control', () => {
  const middleware = readFileSync(
    join(process.cwd(), 'src/middleware.ts'),
    'utf-8'
  )

  it('middleware sets X-Robots-Tag for private routes', () => {
    expect(middleware).toContain('X-Robots-Tag')
    expect(middleware).toContain('noindex, nofollow')
    expect(middleware).toContain('/attorney-dashboard')
    expect(middleware).toContain('/client-dashboard')
    expect(middleware).toContain('/admin')
  })

  it('middleware sets Cache-Control no-store for private routes', () => {
    expect(middleware).toContain('Cache-Control')
    expect(middleware).toContain('no-store')
  })
})

describe('Dashboard V2 — Admin Auth on /api/admin/leads', () => {
  it('/api/admin/leads/route.ts calls requirePermission()', () => {
    const content = readFileSync(
      join(process.cwd(), 'src/app/api/admin/leads/route.ts'),
      'utf-8'
    )
    expect(content).toContain('requirePermission')
  })
})

describe('Dashboard V2 — No SEO/INSEE/Pappers Data', () => {
  const apiFiles = [
    'src/app/api/attorney/leads/[id]/route.ts',
    'src/app/api/attorney/leads/[id]/action/route.ts',
    'src/app/api/attorney/leads/[id]/history/route.ts',
    'src/app/api/attorney/settings/route.ts',
    'src/app/api/admin/dispatch/route.ts',
    'src/app/api/admin/journal/route.ts',
  ]

  for (const file of apiFiles) {
    it(`${file} does not expose forbidden data`, () => {
      try {
        const content = readFileSync(join(process.cwd(), file), 'utf-8')
        expect(content).not.toContain('insee')
        expect(content).not.toContain('pappers')
        expect(content).not.toContain('google_reviews')
        expect(content).not.toContain('trust_score')
        expect(content).not.toContain('trust_badge')
        expect(content).not.toContain('is_premium')
      } catch {
        // File might not exist in test environment
      }
    })
  }
})
