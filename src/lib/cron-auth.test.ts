/**
 * Tests for P0.4 — Cron Auth (timing-safe Bearer token verification)
 *
 * Validates:
 * - Valid Bearer token returns true
 * - Missing header returns false
 * - Wrong token returns false
 * - No CRON_SECRET env var returns false
 * - Token with different length returns false (timing-safe length check)
 * - No "Bearer " prefix returns false
 * - Uses crypto.timingSafeEqual (not naive ===)
 */

import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'
import { verifyCronSecret } from './cron-auth'

const REAL_SECRET = 'my-super-secret-cron-token-32chars'

describe('verifyCronSecret', () => {
  const originalEnv = process.env.CRON_SECRET

  beforeEach(() => {
    process.env.CRON_SECRET = REAL_SECRET
  })

  afterEach(() => {
    if (originalEnv !== undefined) {
      process.env.CRON_SECRET = originalEnv
    } else {
      delete process.env.CRON_SECRET
    }
  })

  it('returns true for valid Bearer token', () => {
    expect(verifyCronSecret(`Bearer ${REAL_SECRET}`)).toBe(true)
  })

  it('returns false when header is null', () => {
    expect(verifyCronSecret(null)).toBe(false)
  })

  it('returns false when header is empty string', () => {
    expect(verifyCronSecret('')).toBe(false)
  })

  it('returns false when token is wrong but same length', () => {
    // Same length as REAL_SECRET to test the timingSafeEqual path (not length check)
    const wrongToken = 'XX-super-secret-cron-token-32chaXX'.slice(0, REAL_SECRET.length)
    expect(wrongToken.length).toBe(REAL_SECRET.length)
    expect(verifyCronSecret(`Bearer ${wrongToken}`)).toBe(false)
  })

  it('returns false when CRON_SECRET env var is not set', () => {
    delete process.env.CRON_SECRET
    expect(verifyCronSecret(`Bearer ${REAL_SECRET}`)).toBe(false)
  })

  it('returns false when CRON_SECRET is empty string', () => {
    process.env.CRON_SECRET = ''
    expect(verifyCronSecret('Bearer anything')).toBe(false)
  })

  it('returns false when token has shorter length (early reject)', () => {
    expect(verifyCronSecret('Bearer short')).toBe(false)
  })

  it('returns false when token has longer length (early reject)', () => {
    expect(verifyCronSecret(`Bearer ${REAL_SECRET}extra-characters`)).toBe(false)
  })

  it('returns false without "Bearer " prefix', () => {
    expect(verifyCronSecret(REAL_SECRET)).toBe(false)
  })

  it('returns false with lowercase "bearer " prefix', () => {
    expect(verifyCronSecret(`bearer ${REAL_SECRET}`)).toBe(false)
  })

  it('returns false with "Bearer" but no space after', () => {
    expect(verifyCronSecret(`Bearer${REAL_SECRET}`)).toBe(false)
  })
})

// ── Source-level verification ───────────────────────────────────────────────

describe('cron-auth implementation correctness', () => {
  const source = fs.readFileSync(path.resolve(__dirname, 'cron-auth.ts'), 'utf-8')

  it('uses crypto.timingSafeEqual (not naive === comparison)', () => {
    expect(source).toContain('timingSafeEqual')
  })

  it('checks token length before timingSafeEqual (required by Node crypto)', () => {
    expect(source).toContain('token.length !== cronSecret.length')
  })

  it('imports crypto module', () => {
    expect(source).toMatch(/import crypto from ['"]crypto['"]/)
  })

  it('checks for "Bearer " prefix', () => {
    expect(source).toContain("'Bearer '")
  })

  it('returns false when cronSecret or authHeader is falsy', () => {
    expect(source).toContain('if (!cronSecret || !authHeader) return false')
  })
})

// ── Verify all cron routes use verifyCronSecret (not old pattern) ───────────

describe('all cron routes import verifyCronSecret', () => {
  const cronDir = path.resolve(__dirname, '../app/api/cron')
  let cronDirs: string[] = []

  try {
    cronDirs = fs.readdirSync(cronDir).filter((entry: string) => {
      return fs.statSync(path.join(cronDir, entry)).isDirectory()
    })
  } catch {
    // cron dir may not exist in test env
  }

  if (cronDirs.length > 0) {
    for (const dir of cronDirs) {
      it(`${dir}/route.ts imports verifyCronSecret from @/lib/cron-auth`, () => {
        const routePath = path.join(cronDir, dir, 'route.ts')
        const routeSource = fs.readFileSync(routePath, 'utf-8')
        expect(routeSource).toContain('verifyCronSecret')
        expect(routeSource).toContain('@/lib/cron-auth')
        // Verify it does NOT use the old insecure naive pattern
        expect(routeSource).not.toMatch(/authHeader\s*!==\s*`Bearer \$\{/)
        expect(routeSource).not.toMatch(/authHeader\s*!==\s*['"]Bearer /)
      })
    }
  } else {
    it.skip('no cron directories found (skipped)', () => {})
  }
})
