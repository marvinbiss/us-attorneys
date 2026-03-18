/**
 * Tests for admin-auth utility
 *
 * Covers:
 * - hasPermission: role-based access control checks
 * - validateOrigin: CSRF origin validation
 * - DEFAULT_PERMISSIONS: role hierarchy correctness
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock dependencies that are not needed for unit tests
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(),
}))

vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}))

vi.mock('next/headers', () => ({
  headers: vi.fn(),
}))

import { hasPermission, validateOrigin, DEFAULT_PERMISSIONS } from '@/lib/admin-auth'
import type { AdminUser, AdminPermissions } from '@/lib/admin-auth'
import { NextRequest } from 'next/server'

// ── Helper: build a mock AdminUser ───────────────────────────────────────────

function makeAdmin(role: 'super_admin' | 'admin' | 'moderator' | 'viewer'): AdminUser {
  return {
    id: 'user-123',
    email: 'admin@test.com',
    role,
    permissions: DEFAULT_PERMISSIONS[role],
  }
}

// ── hasPermission ────────────────────────────────────────────────────────────

describe('hasPermission', () => {
  it('super_admin has all permissions', () => {
    const admin = makeAdmin('super_admin')
    expect(hasPermission(admin, 'users', 'read')).toBe(true)
    expect(hasPermission(admin, 'users', 'write')).toBe(true)
    expect(hasPermission(admin, 'users', 'delete')).toBe(true)
    expect(hasPermission(admin, 'settings', 'write')).toBe(true)
    expect(hasPermission(admin, 'audit', 'read')).toBe(true)
    expect(hasPermission(admin, 'prospection', 'ai')).toBe(true)
  })

  it('viewer can read users but not write/delete', () => {
    const viewer = makeAdmin('viewer')
    expect(hasPermission(viewer, 'users', 'read')).toBe(true)
    expect(hasPermission(viewer, 'users', 'write')).toBe(false)
    expect(hasPermission(viewer, 'users', 'delete')).toBe(false)
  })

  it('moderator can verify providers but not delete them', () => {
    const mod = makeAdmin('moderator')
    expect(hasPermission(mod, 'providers', 'verify')).toBe(true)
    expect(hasPermission(mod, 'providers', 'delete')).toBe(false)
  })

  it('admin cannot delete users', () => {
    const admin = makeAdmin('admin')
    expect(hasPermission(admin, 'users', 'delete')).toBe(false)
  })

  it('admin can refund payments but not cancel', () => {
    const admin = makeAdmin('admin')
    expect(hasPermission(admin, 'payments', 'refund')).toBe(true)
    expect(hasPermission(admin, 'payments', 'cancel')).toBe(false)
  })

  it('viewer cannot access settings', () => {
    const viewer = makeAdmin('viewer')
    expect(hasPermission(viewer, 'settings', 'read')).toBe(false)
    expect(hasPermission(viewer, 'settings', 'write')).toBe(false)
  })

  it('moderator cannot access audit logs', () => {
    const mod = makeAdmin('moderator')
    expect(hasPermission(mod, 'audit', 'read')).toBe(false)
  })

  it('returns false for a non-existent action on a valid resource', () => {
    const admin = makeAdmin('super_admin')
    expect(hasPermission(admin, 'users', 'nonexistent' as never)).toBe(false)
  })

  it('viewer cannot access prospection', () => {
    const viewer = makeAdmin('viewer')
    expect(hasPermission(viewer, 'prospection', 'read')).toBe(false)
    expect(hasPermission(viewer, 'prospection', 'write')).toBe(false)
    expect(hasPermission(viewer, 'prospection', 'send')).toBe(false)
    expect(hasPermission(viewer, 'prospection', 'ai')).toBe(false)
  })

  it('moderator can read and write content but not publish or delete', () => {
    const mod = makeAdmin('moderator')
    expect(hasPermission(mod, 'content', 'read')).toBe(true)
    expect(hasPermission(mod, 'content', 'write')).toBe(true)
    expect(hasPermission(mod, 'content', 'publish')).toBe(false)
    expect(hasPermission(mod, 'content', 'delete')).toBe(false)
  })
})

// ── validateOrigin ───────────────────────────────────────────────────────────

describe('validateOrigin', () => {
  const originalSiteUrl = process.env.NEXT_PUBLIC_SITE_URL

  beforeEach(() => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://us-attorneys.com'
  })

  afterEach(() => {
    if (originalSiteUrl !== undefined) {
      process.env.NEXT_PUBLIC_SITE_URL = originalSiteUrl
    } else {
      delete process.env.NEXT_PUBLIC_SITE_URL
    }
  })

  it('returns true when no origin header is present (same-origin)', () => {
    const req = new NextRequest('https://us-attorneys.com/api/admin/users')
    expect(validateOrigin(req)).toBe(true)
  })

  it('returns true when origin matches NEXT_PUBLIC_SITE_URL', () => {
    const req = new NextRequest('https://us-attorneys.com/api/admin/users', {
      headers: { origin: 'https://us-attorneys.com' },
    })
    expect(validateOrigin(req)).toBe(true)
  })

  it('returns false for cross-site sec-fetch-site header', () => {
    const req = new NextRequest('https://us-attorneys.com/api/admin/users', {
      headers: { 'sec-fetch-site': 'cross-site' },
    })
    expect(validateOrigin(req)).toBe(false)
  })

  it('returns false when origin is a different domain', () => {
    const req = new NextRequest('https://us-attorneys.com/api/admin/users', {
      headers: { origin: 'https://evil.com' },
    })
    expect(validateOrigin(req)).toBe(false)
  })

  it('returns false for malformed origin', () => {
    const req = new NextRequest('https://us-attorneys.com/api/admin/users', {
      headers: { origin: 'not-a-valid-url' },
    })
    expect(validateOrigin(req)).toBe(false)
  })

  it('returns true when no allowed URLs are configured (dev mode)', () => {
    delete process.env.NEXT_PUBLIC_SITE_URL
    delete process.env.NEXTAUTH_URL
    const req = new NextRequest('http://localhost:3000/api/admin/users', {
      headers: { origin: 'http://localhost:3000' },
    })
    expect(validateOrigin(req)).toBe(true)
  })
})

// ── DEFAULT_PERMISSIONS hierarchy ────────────────────────────────────────────

describe('DEFAULT_PERMISSIONS role hierarchy', () => {
  const roles: Array<'super_admin' | 'admin' | 'moderator' | 'viewer'> = [
    'super_admin', 'admin', 'moderator', 'viewer',
  ]

  it('all 4 roles are defined', () => {
    for (const role of roles) {
      expect(DEFAULT_PERMISSIONS[role]).toBeDefined()
    }
  })

  it('super_admin has strictly more permissions than admin', () => {
    const sa = DEFAULT_PERMISSIONS.super_admin
    const a = DEFAULT_PERMISSIONS.admin
    // super_admin can delete users, admin cannot
    expect(sa.users.delete).toBe(true)
    expect(a.users.delete).toBe(false)
    // super_admin can cancel payments, admin cannot
    expect(sa.payments.cancel).toBe(true)
    expect(a.payments.cancel).toBe(false)
  })

  it('admin has more permissions than moderator', () => {
    const a = DEFAULT_PERMISSIONS.admin
    const m = DEFAULT_PERMISSIONS.moderator
    expect(a.users.write).toBe(true)
    expect(m.users.write).toBe(false)
    expect(a.settings.read).toBe(true)
    expect(m.settings.read).toBe(false)
  })

  it('moderator has more permissions than viewer', () => {
    const m = DEFAULT_PERMISSIONS.moderator
    const v = DEFAULT_PERMISSIONS.viewer
    expect(m.providers.verify).toBe(true)
    expect(v.providers.verify).toBe(false)
    expect(m.content.write).toBe(true)
    expect(v.content.write).toBe(false)
  })

  it('every role has all 9 resource keys', () => {
    const expectedResources: (keyof AdminPermissions)[] = [
      'users', 'providers', 'reviews', 'payments',
      'services', 'settings', 'audit', 'prospection', 'content',
    ]
    for (const role of roles) {
      for (const resource of expectedResources) {
        expect(DEFAULT_PERMISSIONS[role][resource]).toBeDefined()
      }
    }
  })
})
