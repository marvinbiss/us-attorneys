/**
 * Notifications V1 — RLS + schema tests
 *
 * Validates:
 * 1. Migration 107 schema constraints
 * 2. RLS policies (user isolation, admin access)
 * 3. Idempotency constraint (UNIQUE on event_id, channel, recipient_id)
 * 4. Notification processor mapping (all 5 triggers covered)
 * 5. No public imports from notification routes
 */

import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

const MIGRATION_PATH = join(
  process.cwd(),
  'supabase/migrations/107_notifications_v1.sql'
)

let migrationSQL: string

try {
  migrationSQL = readFileSync(MIGRATION_PATH, 'utf-8')
} catch {
  migrationSQL = ''
}

describe('Notifications V1 Migration — Schema', () => {
  it('should have the migration file', () => {
    expect(migrationSQL.length).toBeGreaterThan(0)
  })

  describe('notifications table', () => {
    it('creates notifications table', () => {
      expect(migrationSQL).toContain('CREATE TABLE IF NOT EXISTS notifications')
    })

    it('has required columns', () => {
      expect(migrationSQL).toContain('user_id UUID NOT NULL')
      expect(migrationSQL).toContain('type TEXT NOT NULL')
      expect(migrationSQL).toContain('title TEXT NOT NULL')
      expect(migrationSQL).toContain('message TEXT NOT NULL')
      expect(migrationSQL).toContain('read BOOLEAN NOT NULL DEFAULT FALSE')
      expect(migrationSQL).toContain('metadata JSONB NOT NULL')
    })

    it('enforces type CHECK constraint with all notification types', () => {
      expect(migrationSQL).toContain("CHECK (type IN (")
      expect(migrationSQL).toContain("'lead_created'")
      expect(migrationSQL).toContain("'lead_dispatched'")
      expect(migrationSQL).toContain("'lead_viewed'")
      expect(migrationSQL).toContain("'quote_received'")
      expect(migrationSQL).toContain("'lead_closed'")
      expect(migrationSQL).toContain("'system'")
    })

    it('has RLS enabled', () => {
      expect(migrationSQL).toContain('ALTER TABLE notifications ENABLE ROW LEVEL SECURITY')
    })

    it('has user SELECT policy scoped to own notifications', () => {
      expect(migrationSQL).toContain('Users view own notifications')
      expect(migrationSQL).toContain('user_id = auth.uid()')
    })

    it('has user UPDATE policy scoped to own notifications', () => {
      expect(migrationSQL).toContain('Users update own notifications')
    })

    it('has admin ALL policy', () => {
      expect(migrationSQL).toContain('Admins manage all notifications')
      expect(migrationSQL).toContain('is_admin()')
    })

    it('has indexes for efficient querying', () => {
      expect(migrationSQL).toContain('idx_notifications_user')
      expect(migrationSQL).toContain('idx_notifications_unread')
    })

    it('has partial index for unread notifications', () => {
      expect(migrationSQL).toContain('WHERE read = FALSE')
    })
  })

  describe('notification_deliveries table (idempotency)', () => {
    it('creates notification_deliveries table', () => {
      expect(migrationSQL).toContain('CREATE TABLE IF NOT EXISTS notification_deliveries')
    })

    it('has UNIQUE constraint for idempotency', () => {
      expect(migrationSQL).toContain('UNIQUE (event_id, channel, recipient_id)')
    })

    it('enforces channel CHECK constraint', () => {
      expect(migrationSQL).toContain("channel IN ('email', 'in_app', 'sms', 'push')")
    })

    it('enforces status CHECK constraint', () => {
      expect(migrationSQL).toContain("status IN ('sent', 'failed', 'skipped')")
    })

    it('has RLS enabled with admin-only access', () => {
      expect(migrationSQL).toContain('ALTER TABLE notification_deliveries ENABLE ROW LEVEL SECURITY')
      expect(migrationSQL).toContain('Admins manage deliveries')
    })

    it('has indexes for querying', () => {
      expect(migrationSQL).toContain('idx_notification_deliveries_event')
      expect(migrationSQL).toContain('idx_notification_deliveries_recipient')
    })
  })

  describe('no INSERT/DELETE RLS for regular users', () => {
    it('does NOT have user INSERT policy on notifications (admin/service_role only)', () => {
      // Users should NOT be able to insert notifications — only server-side code
      expect(migrationSQL).not.toContain('Users insert notifications')
      expect(migrationSQL).not.toContain('Users create notifications')
    })

    it('does NOT have user DELETE policy on notifications', () => {
      expect(migrationSQL).not.toContain('Users delete notifications')
    })
  })
})

describe('Notifications V1 — Lead Event Processor', () => {
  const PROCESSOR_PATH = join(
    process.cwd(),
    'src/lib/notifications/lead-notifications.ts'
  )

  let processorCode: string

  try {
    processorCode = readFileSync(PROCESSOR_PATH, 'utf-8')
  } catch {
    processorCode = ''
  }

  it('processor file exists', () => {
    expect(processorCode.length).toBeGreaterThan(0)
  })

  it('handles all 5 required triggers', () => {
    // created, dispatched, viewed, quoted, completed/expired
    expect(processorCode).toContain("case 'created':")
    expect(processorCode).toContain("case 'dispatched':")
    expect(processorCode).toContain("case 'viewed':")
    expect(processorCode).toContain("case 'quoted':")
    expect(processorCode).toContain("case 'completed':")
    expect(processorCode).toContain("case 'expired':")
  })

  it('uses admin client (service_role) for cross-table reads', () => {
    expect(processorCode).toContain('createAdminClient')
  })

  it('checks idempotency before delivery', () => {
    expect(processorCode).toContain('notification_deliveries')
    expect(processorCode).toContain('maybeSingle')
    expect(processorCode).toContain('if (existing) return')
  })

  it('records delivery after processing', () => {
    expect(processorCode).toContain("supabase.from('notification_deliveries').insert")
  })

  it('uses existing Resend email infrastructure', () => {
    expect(processorCode).toContain("from '@/lib/api/resend-client'")
    expect(processorCode).toContain('sendEmail')
  })

  it('dispatched event targets attorney only', () => {
    // dispatched should notify attorney, not client
    expect(processorCode).toContain("dispatched: { channels: ['email', 'in_app'], targetRoles: ['attorney'] }")
  })

  it('viewed event is in-app only (no email)', () => {
    expect(processorCode).toContain("viewed:     { channels: ['in_app'],          targetRoles: ['client'] }")
  })

  it('does not expose provider IDs in client-facing notification messages', () => {
    // Notification specs for client should not contain raw attorney_id references
    // The processor builds notification messages without exposing internal IDs
    expect(processorCode).toContain("type: 'lead_created'")
    expect(processorCode).toContain("type: 'quote_received'")
    // Email templates are sanitized — no raw provider IDs in client email content
    expect(processorCode).not.toContain('provider.id')
  })
})

describe('Notifications V1 — logLeadEvent Integration', () => {
  const EVENTS_PATH = join(process.cwd(), 'src/lib/dashboard/events.ts')
  let eventsCode: string

  try {
    eventsCode = readFileSync(EVENTS_PATH, 'utf-8')
  } catch {
    eventsCode = ''
  }

  it('logLeadEvent imports processLeadEvent', () => {
    expect(eventsCode).toContain("import { processLeadEvent }")
  })

  it('logLeadEvent calls processLeadEvent after insert', () => {
    expect(eventsCode).toContain('processLeadEvent({')
  })

  it('processLeadEvent is fire-and-forget (non-blocking)', () => {
    expect(eventsCode).toContain('.catch(')
  })

  it('logLeadEvent returns event ID from insert', () => {
    expect(eventsCode).toContain(".select('id').single()")
  })
})

describe('Notifications V1 — API Routes (private only)', () => {
  const apiFiles = [
    'src/app/api/notifications/route.ts',
    'src/app/api/notifications/[id]/read/route.ts',
    'src/app/api/notifications/read-all/route.ts',
  ]

  for (const file of apiFiles) {
    const fullPath = join(process.cwd(), file)

    it(`${file} exists`, () => {
      expect(existsSync(fullPath)).toBe(true)
    })

    it(`${file} requires authentication`, () => {
      const content = readFileSync(fullPath, 'utf-8')
      expect(content).toContain('auth.getUser()')
      expect(content).toContain('401')
    })

    it(`${file} is force-dynamic (no caching)`, () => {
      const content = readFileSync(fullPath, 'utf-8')
      expect(content).toContain("dynamic = 'force-dynamic'")
    })

    it(`${file} does not import from (public)`, () => {
      const content = readFileSync(fullPath, 'utf-8')
      expect(content).not.toContain('(public)')
      expect(content).not.toContain('sitemap')
    })
  }
})

describe('Notifications V1 — No SEO Impact', () => {
  it('no notification routes are in (public) route group', () => {
    const publicNotifPath = join(
      process.cwd(),
      'src/app/(public)/notifications'
    )
    expect(existsSync(publicNotifPath)).toBe(false)
  })

  it('no notification routes modify sitemap', () => {
    const sitemapPath = join(process.cwd(), 'src/app/sitemap.ts')
    if (existsSync(sitemapPath)) {
      const content = readFileSync(sitemapPath, 'utf-8')
      expect(content).not.toContain('notification')
    }
  })
})
