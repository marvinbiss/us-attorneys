/**
 * client_id on leads — regression tests
 *
 * Validates that both INSERT code paths for devis_requests (legacy table name = consultation requests) include client_id,
 * and that the claim-lead backfill endpoint is correctly structured.
 *
 * These are static source-code tests (no runtime DB needed).
 */

import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { join } from 'path'

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), 'utf-8')
}

describe('client_id on lead creation — server action', () => {
  const source = readSource('src/app/actions/lead.ts')

  it('resolves authenticated user before insert', () => {
    expect(source).toContain('supabase.auth.getUser()')
  })

  it('includes client_id in INSERT payload', () => {
    expect(source).toContain("client_id: user?.id ?? null")
  })

  it('uses server supabase client (has user session)', () => {
    expect(source).toContain("from '@/lib/supabase/server'")
  })

  it('falls back to null for anonymous submissions', () => {
    // user?.id ?? null handles both unauthenticated and no-session cases
    expect(source).toContain('?? null')
  })
})

describe('client_id on lead creation -- quotes API route', () => {
  const source = readSource('src/app/api/quotes/route.ts')

  it('imports server client for auth resolution', () => {
    expect(source).toContain("import { createClient } from '@/lib/supabase/server'")
  })

  it('resolves authenticated user via server client', () => {
    expect(source).toContain('await createClient()')
    expect(source).toContain('supabase.auth.getUser()')
  })

  it('includes client_id in INSERT payload', () => {
    expect(source).toContain('client_id')
  })

  it('handles auth check before creating quote', () => {
    // The route checks authentication and returns 401 if not authenticated
    expect(source).toContain('status: 401')
    expect(source).toContain('Authentication required')
  })

  it('uses force-dynamic', () => {
    expect(source).toContain("export const dynamic = 'force-dynamic'")
  })
})

describe('claim-lead backfill endpoint', () => {
  const source = readSource('src/app/api/client/leads/claim/route.ts')

  it('requires authentication', () => {
    expect(source).toContain('requireAuth: true')
  })

  it('uses admin client for cross-user update', () => {
    expect(source).toContain("from '@/lib/supabase/admin'")
    expect(source).toContain('createAdminClient()')
  })

  it('only updates rows where client_id IS NULL', () => {
    expect(source).toContain(".is('client_id', null)")
  })

  it('matches on client_email', () => {
    expect(source).toContain(".eq('client_email', profile.email)")
  })

  it('sets client_id to authenticated user id', () => {
    expect(source).toContain('.update({ client_id: user!.id })')
  })

  it('is idempotent (re-running is safe)', () => {
    // The IS NULL filter ensures already-claimed leads aren't touched
    expect(source).toContain(".is('client_id', null)")
    expect(source).toContain('.update({ client_id: user!.id })')
  })

  it('returns count of claimed leads', () => {
    expect(source).toContain("claimed: claimed?.length || 0")
  })

  it('uses force-dynamic', () => {
    expect(source).toContain("export const dynamic = 'force-dynamic'")
  })

  it('does not expose any toxic fields', () => {
    expect(source).not.toContain('trust_score')
    expect(source).not.toContain('trust_badge')
    expect(source).not.toContain('is_premium')
    expect(source).not.toContain('insee')
    expect(source).not.toContain('pappers')
  })
})

describe('No public route contamination', () => {
  const files = [
    'src/app/actions/lead.ts',
    'src/app/api/quotes/route.ts',
    'src/app/api/client/leads/claim/route.ts',
  ]

  for (const file of files) {
    it(`${file} does not import from (public)`, () => {
      const source = readSource(file)
      expect(source).not.toContain("from '@/app/(public)")
      expect(source).not.toContain('from "@/app/(public)')
    })
  }
})
