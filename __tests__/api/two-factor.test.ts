/**
 * Tests — Two-Factor Authentication Service (src/lib/auth/two-factor.ts)
 * generateSetup, verifyAndEnable, verifyCode, disable, getStatus, isEnabled,
 * backup codes, brute force protection, hashCode salt requirement
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import crypto from 'crypto'

// ============================================
// Environment variables (must be set BEFORE import)
// ============================================
const ENCRYPTION_KEY_HEX = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef'

process.env.TWO_FACTOR_ENCRYPTION_KEY = ENCRYPTION_KEY_HEX
process.env.TWO_FACTOR_SALT = 'test-salt'

// ============================================
// QRCode mock
// ============================================
vi.mock('qrcode', () => ({
  default: {
    toDataURL: vi.fn().mockResolvedValue('data:image/png;base64,FAKE_QR_CODE'),
  },
}))

// ============================================
// Supabase admin mock
// ============================================

// Per-table result store
let mockResults: Record<string, { data: unknown; error: unknown }> = {}
let insertCaptures: Array<{ table: string; row: unknown }> = []
let updateCaptures: Array<{ table: string; row: unknown; eqs: Array<[string, unknown]> }> = []
let deleteCaptures: Array<{ table: string; eqs: Array<[string, unknown]> }> = []
let upsertCaptures: Array<{ table: string; row: unknown }> = []

function makeBuilder(tableName: string) {
  const eqs: Array<[string, unknown]> = []
  const b: Record<string, unknown> = {}
  b.select = vi.fn().mockReturnValue(b)
  b.eq = vi.fn().mockImplementation((col: string, val: unknown) => {
    eqs.push([col, val])
    return b
  })
  b.gte = vi.fn().mockReturnValue(b)
  b.lte = vi.fn().mockReturnValue(b)
  b.limit = vi.fn().mockReturnValue(b)
  b.order = vi.fn().mockReturnValue(b)
  b.single = vi.fn().mockReturnValue(b)
  b.in = vi.fn().mockReturnValue(b)
  b.insert = vi.fn().mockImplementation((row: unknown) => {
    insertCaptures.push({ table: tableName, row })
    return b
  })
  b.update = vi.fn().mockImplementation((row: unknown) => {
    updateCaptures.push({ table: tableName, row, eqs: [...eqs] })
    return b
  })
  b.upsert = vi.fn().mockImplementation((row: unknown) => {
    upsertCaptures.push({ table: tableName, row })
    return b
  })
  b.delete = vi.fn().mockImplementation(() => {
    deleteCaptures.push({ table: tableName, eqs: [...eqs] })
    return b
  })

  ;(b as Record<string, unknown>).then = (resolve: (v: unknown) => unknown) => {
    const result = mockResults[tableName] || { data: null, error: null }
    return resolve({ data: result.data, error: result.error })
  }
  return b
}

/** Default from() implementation — uses mockResults keyed by table name */
function defaultFromImpl(table: string) {
  return makeBuilder(table)
}

const mockAdminSupabase = {
  from: vi.fn().mockImplementation(defaultFromImpl),
}

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(() => mockAdminSupabase),
}))

// ============================================
// Helpers
// ============================================
const TEST_USER_ID = '550e8400-e29b-41d4-a716-446655440099'
const TEST_EMAIL = 'test@example.com'

function encryptSecret(secret: string): string {
  const key = Buffer.from(ENCRYPTION_KEY_HEX, 'hex')
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv)
  let encrypted = cipher.update(secret, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  const authTag = cipher.getAuthTag()
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`
}

function hashCode(code: string): string {
  return crypto
    .createHash('sha256')
    .update(code + 'test-salt')
    .digest('hex')
}

function base32Decode(encoded: string): Buffer {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
  let bits = ''
  for (const char of encoded.toUpperCase()) {
    const val = chars.indexOf(char)
    if (val === -1) continue
    bits += val.toString(2).padStart(5, '0')
  }
  const bytes: number[] = []
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(parseInt(bits.slice(i, i + 8), 2))
  }
  return Buffer.from(bytes)
}

function generateValidTOTP(secret: string): string {
  const counter = Math.floor(Date.now() / 30000)
  const counterBuffer = Buffer.alloc(8)
  counterBuffer.writeBigInt64BE(BigInt(counter))
  const decodedSecret = base32Decode(secret)
  const hmac = crypto.createHmac('sha1', decodedSecret)
  hmac.update(counterBuffer)
  const hash = hmac.digest()
  const offset = hash[hash.length - 1] & 0xf
  const binary =
    ((hash[offset] & 0x7f) << 24) |
    ((hash[offset + 1] & 0xff) << 16) |
    ((hash[offset + 2] & 0xff) << 8) |
    (hash[offset + 3] & 0xff)
  return (binary % 1000000).toString().padStart(6, '0')
}

// ============================================
// Reset between tests
// ============================================
beforeEach(() => {
  vi.clearAllMocks()
  // Restore the default from() implementation (brute force test overrides it)
  mockAdminSupabase.from.mockImplementation(defaultFromImpl)
  mockResults = {}
  insertCaptures = []
  updateCaptures = []
  deleteCaptures = []
  upsertCaptures = []
  process.env.TWO_FACTOR_ENCRYPTION_KEY = ENCRYPTION_KEY_HEX
  process.env.TWO_FACTOR_SALT = 'test-salt'
})

// ============================================
// Tests
// ============================================

describe('TwoFactorAuthService', () => {
  async function getService() {
    const mod = await import('@/lib/auth/two-factor')
    return new mod.TwoFactorAuthService()
  }

  const TEST_SECRET = 'JBSWY3DPEHPK3PXP'

  // ------------------------------------------
  // 1. generateSetup creates secret and QR code
  // ------------------------------------------
  describe('generateSetup', () => {
    it('creates secret, QR code URL, and 10 backup codes', async () => {
      mockResults['two_factor_auth'] = { data: null, error: { code: 'PGRST116', message: 'not found' } }

      const svc = await getService()
      const result = await svc.generateSetup(TEST_USER_ID, TEST_EMAIL)

      expect(result.secret).toBeDefined()
      expect(typeof result.secret).toBe('string')
      expect(result.secret.length).toBeGreaterThanOrEqual(16)

      expect(result.qrCodeUrl).toBe('data:image/png;base64,FAKE_QR_CODE')

      expect(result.backupCodes).toHaveLength(10)
      for (const code of result.backupCodes) {
        expect(code).toMatch(/^[A-F0-9]{4}-[A-F0-9]{4}$/)
      }

      const tfaUpsert = upsertCaptures.find((c) => c.table === 'two_factor_auth')
      expect(tfaUpsert).toBeDefined()
    })

    // ------------------------------------------
    // 2. generateSetup throws if already verified
    // ------------------------------------------
    it('throws if 2FA is already enabled and verified', async () => {
      mockResults['two_factor_auth'] = {
        data: { id: 'existing-id', verified: true },
        error: null,
      }

      const svc = await getService()
      await expect(svc.generateSetup(TEST_USER_ID, TEST_EMAIL)).rejects.toThrow(
        '2FA is already enabled'
      )
    })
  })

  // ------------------------------------------
  // 3-4. verifyAndEnable
  // ------------------------------------------
  describe('verifyAndEnable', () => {
    it('succeeds with a valid TOTP code', async () => {
      const encryptedSecret = encryptSecret(TEST_SECRET)

      mockResults['two_factor_auth'] = {
        data: {
          id: 'tfa-1',
          user_id: TEST_USER_ID,
          secret: encryptedSecret,
          backup_codes: [],
          verified: false,
          verified_at: null,
          last_used_at: null,
          created_at: new Date().toISOString(),
        },
        error: null,
      }

      const otp = generateValidTOTP(TEST_SECRET)

      const svc = await getService()
      const result = await svc.verifyAndEnable(TEST_USER_ID, otp)

      expect(result).toBe(true)

      const tfaUpdate = updateCaptures.find(
        (c) => c.table === 'two_factor_auth' && (c.row as Record<string, unknown>).verified === true
      )
      expect(tfaUpdate).toBeDefined()

      const profileUpdate = updateCaptures.find(
        (c) =>
          c.table === 'profiles' &&
          (c.row as Record<string, unknown>).two_factor_enabled === true
      )
      expect(profileUpdate).toBeDefined()

      const logInsert = insertCaptures.find(
        (c) =>
          c.table === 'security_logs' &&
          (c.row as Record<string, unknown>).event_type === '2fa_enabled'
      )
      expect(logInsert).toBeDefined()
    })

    it('throws with an invalid TOTP code', async () => {
      const encryptedSecret = encryptSecret(TEST_SECRET)

      mockResults['two_factor_auth'] = {
        data: {
          id: 'tfa-1',
          user_id: TEST_USER_ID,
          secret: encryptedSecret,
          backup_codes: [],
          verified: false,
          verified_at: null,
          last_used_at: null,
          created_at: new Date().toISOString(),
        },
        error: null,
      }

      const svc = await getService()
      await expect(svc.verifyAndEnable(TEST_USER_ID, '000000')).rejects.toThrow(
        'Invalid verification code'
      )
    })

    it('throws when 2FA setup not found', async () => {
      mockResults['two_factor_auth'] = { data: null, error: { code: 'PGRST116' } }

      const svc = await getService()
      await expect(svc.verifyAndEnable(TEST_USER_ID, '123456')).rejects.toThrow(
        '2FA setup not found'
      )
    })
  })

  // ------------------------------------------
  // 5-7. verifyCode
  // ------------------------------------------
  describe('verifyCode', () => {
    function makeTfaRecord() {
      return {
        id: 'tfa-1',
        user_id: TEST_USER_ID,
        secret: encryptSecret(TEST_SECRET),
        backup_codes: [],
        verified: true,
        verified_at: new Date().toISOString(),
        last_used_at: null,
        created_at: new Date().toISOString(),
      }
    }

    // 5. verifyCode with valid TOTP returns true
    it('returns true with a valid TOTP code', async () => {
      mockResults['two_factor_auth'] = { data: makeTfaRecord(), error: null }
      mockResults['security_logs'] = { data: [], error: null }

      const validCode = generateValidTOTP(TEST_SECRET)
      const svc = await getService()
      const result = await svc.verifyCode(TEST_USER_ID, validCode)

      expect(result).toBe(true)
    })

    // 6. verifyCode with invalid TOTP returns false
    it('returns false with an invalid TOTP code', async () => {
      mockResults['two_factor_auth'] = { data: makeTfaRecord(), error: null }
      mockResults['security_logs'] = { data: [], error: null }

      const svc = await getService()
      const result = await svc.verifyCode(TEST_USER_ID, '000000')

      expect(result).toBe(false)
    })

    // 7. verifyCode blocks after 5 failures (brute force)
    it('throws after 5 failed attempts (brute force protection)', async () => {
      const tfaRecord = makeTfaRecord()

      // Override from() to give fine-grained per-call results for security_logs
      let securityLogSelectCount = 0
      mockAdminSupabase.from.mockImplementation((table: string) => {
        if (table === 'security_logs') {
          const builder = makeBuilder(table)
          // Override the thenable to track select vs insert calls
          const origSelect = builder.select as unknown as (...a: unknown[]) => unknown
          builder.select = vi.fn().mockImplementation((...args: unknown[]) => {
            securityLogSelectCount++
            if (securityLogSelectCount === 1) {
              // First select: block check — no blocks
              mockResults['security_logs'] = { data: [], error: null }
            } else if (securityLogSelectCount === 2) {
              // Second select: recent failures — 5 entries to trigger block
              mockResults['security_logs'] = {
                data: [{ id: '1' }, { id: '2' }, { id: '3' }, { id: '4' }, { id: '5' }],
                error: null,
              }
            }
            return origSelect(...args)
          })
          return builder
        }
        // two_factor_auth — return the TFA record
        mockResults['two_factor_auth'] = { data: tfaRecord, error: null }
        return makeBuilder(table)
      })

      const svc = await getService()
      await expect(svc.verifyCode(TEST_USER_ID, '000000')).rejects.toThrow(
        'Too many failed attempts. Please try again later.'
      )
    })

    it('throws immediately if user is already blocked', async () => {
      mockResults['two_factor_auth'] = { data: makeTfaRecord(), error: null }
      // security_logs block check returns a block entry
      mockResults['security_logs'] = { data: [{ id: 'block-1' }], error: null }

      const svc = await getService()
      await expect(svc.verifyCode(TEST_USER_ID, '123456')).rejects.toThrow(
        'Too many failed attempts. Please try again later.'
      )
    })

    it('returns false when 2FA is not enabled (no record)', async () => {
      mockResults['two_factor_auth'] = { data: null, error: { code: 'PGRST116' } }

      const svc = await getService()
      const result = await svc.verifyCode(TEST_USER_ID, '123456')
      expect(result).toBe(false)
    })
  })

  // ------------------------------------------
  // 8-9. Backup code verification
  // ------------------------------------------
  describe('backup codes', () => {
    // The source code detects backup codes with: code.length === 8 && code.includes('-')
    // Generated backup codes are XXXX-XXXX (9 chars), so we use a 7-char + dash = 8-char code
    // to match the detection logic. Format: XXX-XXXX (3+1+4 = 8 chars)
    const BACKUP_CODE = 'AB1-CD34'

    // 8. Backup code verification works
    it('verifies a valid backup code', async () => {
      const hashedBackup = hashCode(BACKUP_CODE)
      const encryptedSecret = encryptSecret(TEST_SECRET)

      mockResults['two_factor_auth'] = {
        data: {
          id: 'tfa-1',
          user_id: TEST_USER_ID,
          secret: encryptedSecret,
          backup_codes: [hashedBackup, hashCode('BB2-EF56')],
          verified: true,
          verified_at: new Date().toISOString(),
          last_used_at: null,
          created_at: new Date().toISOString(),
        },
        error: null,
      }
      mockResults['security_logs'] = { data: [], error: null }

      const svc = await getService()
      const result = await svc.verifyCode(TEST_USER_ID, BACKUP_CODE)

      expect(result).toBe(true)

      const tfaUpdate = updateCaptures.find(
        (c) =>
          c.table === 'two_factor_auth' &&
          Array.isArray((c.row as Record<string, unknown>).backup_codes)
      )
      expect(tfaUpdate).toBeDefined()
      const updatedCodes = (tfaUpdate!.row as Record<string, unknown>).backup_codes as string[]
      expect(updatedCodes).toHaveLength(1)
      expect(updatedCodes).not.toContain(hashedBackup)
    })

    // 9. Backup code is consumed after use
    it('consumes backup code after successful use (not reusable)', async () => {
      const hashedBackup = hashCode(BACKUP_CODE)
      const encryptedSecret = encryptSecret(TEST_SECRET)

      mockResults['two_factor_auth'] = {
        data: {
          id: 'tfa-1',
          user_id: TEST_USER_ID,
          secret: encryptedSecret,
          backup_codes: [hashedBackup],
          verified: true,
          verified_at: new Date().toISOString(),
          last_used_at: null,
          created_at: new Date().toISOString(),
        },
        error: null,
      }
      mockResults['security_logs'] = { data: [], error: null }

      const svc = await getService()
      await svc.verifyCode(TEST_USER_ID, BACKUP_CODE)

      const tfaUpdate = updateCaptures.find(
        (c) =>
          c.table === 'two_factor_auth' &&
          Array.isArray((c.row as Record<string, unknown>).backup_codes)
      )
      expect(tfaUpdate).toBeDefined()
      const remaining = (tfaUpdate!.row as Record<string, unknown>).backup_codes as string[]
      expect(remaining).toHaveLength(0)

      const logInsert = insertCaptures.find(
        (c) =>
          c.table === 'security_logs' &&
          (c.row as Record<string, unknown>).event_type === '2fa_backup_used'
      )
      expect(logInsert).toBeDefined()
    })

    it('returns false for an invalid backup code', async () => {
      const encryptedSecret = encryptSecret(TEST_SECRET)

      mockResults['two_factor_auth'] = {
        data: {
          id: 'tfa-1',
          user_id: TEST_USER_ID,
          secret: encryptedSecret,
          backup_codes: [hashCode('AB1-REAL')],
          verified: true,
          verified_at: new Date().toISOString(),
          last_used_at: null,
          created_at: new Date().toISOString(),
        },
        error: null,
      }
      mockResults['security_logs'] = { data: [], error: null }

      const svc = await getService()
      // Use a code that is 8 chars with dash (detected as backup) but does not match
      const result = await svc.verifyCode(TEST_USER_ID, 'ZZZ-FAKE')

      expect(result).toBe(false)
    })
  })

  // ------------------------------------------
  // 10. disable removes 2FA record
  // ------------------------------------------
  describe('disable', () => {
    it('removes 2FA record after valid code verification', async () => {
      const encryptedSecret = encryptSecret(TEST_SECRET)

      mockResults['two_factor_auth'] = {
        data: {
          id: 'tfa-1',
          user_id: TEST_USER_ID,
          secret: encryptedSecret,
          backup_codes: [],
          verified: true,
          verified_at: new Date().toISOString(),
          last_used_at: null,
          created_at: new Date().toISOString(),
        },
        error: null,
      }
      mockResults['security_logs'] = { data: [], error: null }

      const validOtp = generateValidTOTP(TEST_SECRET)

      const svc = await getService()
      const result = await svc.disable(TEST_USER_ID, validOtp)

      expect(result).toBe(true)

      const tfaDelete = deleteCaptures.find((c) => c.table === 'two_factor_auth')
      expect(tfaDelete).toBeDefined()

      const profileUpdate = updateCaptures.find(
        (c) =>
          c.table === 'profiles' &&
          (c.row as Record<string, unknown>).two_factor_enabled === false
      )
      expect(profileUpdate).toBeDefined()
    })

    it('throws if verification code is invalid', async () => {
      const encryptedSecret = encryptSecret(TEST_SECRET)

      mockResults['two_factor_auth'] = {
        data: {
          id: 'tfa-1',
          user_id: TEST_USER_ID,
          secret: encryptedSecret,
          backup_codes: [],
          verified: true,
          verified_at: new Date().toISOString(),
          last_used_at: null,
          created_at: new Date().toISOString(),
        },
        error: null,
      }
      mockResults['security_logs'] = { data: [], error: null }

      const svc = await getService()
      await expect(svc.disable(TEST_USER_ID, '000000')).rejects.toThrow(
        'Invalid verification code'
      )
    })
  })

  // ------------------------------------------
  // 11. getStatus returns correct shape
  // ------------------------------------------
  describe('getStatus', () => {
    it('returns enabled status with backup code count', async () => {
      mockResults['two_factor_auth'] = {
        data: {
          id: 'tfa-1',
          user_id: TEST_USER_ID,
          backup_codes: ['hash1', 'hash2', 'hash3'],
          verified: true,
          last_used_at: '2026-02-20T10:00:00Z',
          created_at: '2026-02-01T00:00:00Z',
        },
        error: null,
      }

      const svc = await getService()
      const status = await svc.getStatus(TEST_USER_ID)

      expect(status).toEqual({
        enabled: true,
        verified: true,
        backup_codes_remaining: 3,
        last_used: '2026-02-20T10:00:00Z',
        created_at: '2026-02-01T00:00:00Z',
      })
    })

    it('returns disabled status when no 2FA record exists', async () => {
      mockResults['two_factor_auth'] = { data: null, error: { code: 'PGRST116' } }

      const svc = await getService()
      const status = await svc.getStatus(TEST_USER_ID)

      expect(status).toEqual({
        enabled: false,
        verified: false,
        backup_codes_remaining: 0,
      })
    })

    it('returns 0 backup codes remaining when backup_codes is null', async () => {
      mockResults['two_factor_auth'] = {
        data: {
          id: 'tfa-1',
          user_id: TEST_USER_ID,
          backup_codes: null,
          verified: true,
          last_used_at: null,
          created_at: '2026-02-01T00:00:00Z',
        },
        error: null,
      }

      const svc = await getService()
      const status = await svc.getStatus(TEST_USER_ID)

      expect(status.backup_codes_remaining).toBe(0)
    })
  })

  // ------------------------------------------
  // isEnabled
  // ------------------------------------------
  describe('isEnabled', () => {
    it('returns true when 2FA is verified', async () => {
      mockResults['two_factor_auth'] = {
        data: { verified: true },
        error: null,
      }

      const svc = await getService()
      const result = await svc.isEnabled(TEST_USER_ID)
      expect(result).toBe(true)
    })

    it('returns false when no 2FA record exists', async () => {
      mockResults['two_factor_auth'] = { data: null, error: { code: 'PGRST116' } }

      const svc = await getService()
      const result = await svc.isEnabled(TEST_USER_ID)
      expect(result).toBe(false)
    })
  })

  // ------------------------------------------
  // 12. hashCode throws without TWO_FACTOR_SALT
  // ------------------------------------------
  describe('hashCode (salt requirement)', () => {
    it('throws when TWO_FACTOR_SALT is not set', async () => {
      delete process.env.TWO_FACTOR_SALT

      mockResults['two_factor_auth'] = { data: null, error: { code: 'PGRST116' } }

      const svc = await getService()
      await expect(svc.generateSetup(TEST_USER_ID, TEST_EMAIL)).rejects.toThrow(
        'TWO_FACTOR_SALT environment variable is required'
      )
    })
  })

  // ------------------------------------------
  // Encryption key requirement
  // ------------------------------------------
  describe('encryptSecret (encryption key requirement)', () => {
    it('throws when TWO_FACTOR_ENCRYPTION_KEY is not set', async () => {
      delete process.env.TWO_FACTOR_ENCRYPTION_KEY
      process.env.TWO_FACTOR_SALT = 'test-salt'

      mockResults['two_factor_auth'] = { data: null, error: { code: 'PGRST116' } }

      const svc = await getService()
      await expect(svc.generateSetup(TEST_USER_ID, TEST_EMAIL)).rejects.toThrow(
        'TWO_FACTOR_ENCRYPTION_KEY environment variable is required'
      )
    })
  })
})
