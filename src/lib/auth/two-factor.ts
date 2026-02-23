/**
 * Two-Factor Authentication (2FA) Service
 * TOTP-based 2FA with backup codes
 */

import QRCode from 'qrcode'
import crypto from 'crypto'

// TOTP implementation (RFC 6238)
const TOTP = {
  generateSecret(length = 20): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
    let secret = ''
    const randomBytes = crypto.randomBytes(length)
    for (let i = 0; i < length; i++) {
      secret += chars[randomBytes[i] % chars.length]
    }
    return secret
  },

  generateTOTP(secret: string, time: number = Date.now()): string {
    const counter = Math.floor(time / 30000)
    const counterBuffer = Buffer.alloc(8)
    counterBuffer.writeBigInt64BE(BigInt(counter))

    const decodedSecret = this.base32Decode(secret)
    const hmac = crypto.createHmac('sha1', decodedSecret)
    hmac.update(counterBuffer)
    const hash = hmac.digest()

    const offset = hash[hash.length - 1] & 0xf
    const binary =
      ((hash[offset] & 0x7f) << 24) |
      ((hash[offset + 1] & 0xff) << 16) |
      ((hash[offset + 2] & 0xff) << 8) |
      (hash[offset + 3] & 0xff)

    const otp = binary % 1000000
    return otp.toString().padStart(6, '0')
  },

  verify(token: string, secret: string, window = 1): boolean {
    const now = Date.now()
    for (let i = -window; i <= window; i++) {
      const time = now + i * 30000
      if (this.generateTOTP(secret, time) === token) {
        return true
      }
    }
    return false
  },

  base32Decode(encoded: string): Buffer {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
    encoded = encoded.toUpperCase().replace(/=+$/, '')
    let bits = ''
    for (const char of encoded) {
      const val = chars.indexOf(char)
      if (val === -1) continue
      bits += val.toString(2).padStart(5, '0')
    }
    const bytes: number[] = []
    for (let i = 0; i + 8 <= bits.length; i += 8) {
      bytes.push(parseInt(bits.slice(i, i + 8), 2))
    }
    return Buffer.from(bytes)
  },

  keyuri(accountName: string, issuer: string, secret: string): string {
    const encodedIssuer = encodeURIComponent(issuer)
    const encodedAccount = encodeURIComponent(accountName)
    return `otpauth://totp/${encodedIssuer}:${encodedAccount}?secret=${secret}&issuer=${encodedIssuer}&algorithm=SHA1&digits=6&period=30`
  },
}

const authenticator = {
  generateSecret: () => TOTP.generateSecret(),
  verify: ({ token, secret }: { token: string; secret: string }) => TOTP.verify(token, secret),
  keyuri: (account: string, issuer: string, secret: string) => TOTP.keyuri(account, issuer, secret),
}

import { createClient } from '@supabase/supabase-js'

const APP_NAME = 'ServicesArtisans'

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export interface TwoFactorSetup {
  secret: string
  qrCodeUrl: string
  backupCodes: string[]
}

export interface TwoFactorStatus {
  enabled: boolean
  verified: boolean
  backup_codes_remaining: number
  last_used?: string
  created_at?: string
}

export class TwoFactorAuthService {
  private _supabase: ReturnType<typeof getSupabaseAdmin> | null = null
  private get supabase() {
    if (!this._supabase) {
      this._supabase = getSupabaseAdmin()
    }
    return this._supabase
  }

  /**
   * Generate a new 2FA secret and QR code for setup
   */
  async generateSetup(userId: string, email: string): Promise<TwoFactorSetup> {
    // Check if 2FA is already enabled
    const { data: existing } = await this.supabase
      .from('two_factor_auth')
      .select('id, verified')
      .eq('user_id', userId)
      .single()

    if (existing?.verified) {
      throw new Error('2FA is already enabled')
    }

    // Generate secret
    const secret = authenticator.generateSecret()

    // Generate QR code URL
    const otpauthUrl = authenticator.keyuri(email, APP_NAME, secret)
    const qrCodeUrl = await QRCode.toDataURL(otpauthUrl)

    // Generate backup codes
    const backupCodes = this.generateBackupCodes(10)

    // Hash backup codes for storage
    const hashedBackupCodes = backupCodes.map((code) => this.hashCode(code))

    // Store in database (not verified yet)
    await this.supabase
      .from('two_factor_auth')
      .upsert({
        user_id: userId,
        secret: this.encryptSecret(secret),
        backup_codes: hashedBackupCodes,
        verified: false,
        created_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id',
      })

    return {
      secret,
      qrCodeUrl,
      backupCodes,
    }
  }

  /**
   * Verify and enable 2FA with the initial code
   */
  async verifyAndEnable(userId: string, code: string): Promise<boolean> {
    const { data: twoFactor } = await this.supabase
      .from('two_factor_auth')
      .select('id, user_id, secret, backup_codes, verified, verified_at, last_used_at, created_at')
      .eq('user_id', userId)
      .single()

    if (!twoFactor) {
      throw new Error('2FA setup not found')
    }

    if (twoFactor.verified) {
      throw new Error('2FA is already enabled')
    }

    // Decrypt and verify
    const secret = this.decryptSecret(twoFactor.secret)
    const isValid = authenticator.verify({ token: code, secret })

    if (!isValid) {
      throw new Error('Invalid verification code')
    }

    // Mark as verified
    await this.supabase
      .from('two_factor_auth')
      .update({
        verified: true,
        verified_at: new Date().toISOString(),
      })
      .eq('user_id', userId)

    // Update user profile
    await this.supabase
      .from('profiles')
      .update({
        two_factor_enabled: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)

    await this.logEvent(userId, '2fa_enabled')

    return true
  }

  /**
   * Verify a 2FA code during login
   */
  async verifyCode(userId: string, code: string): Promise<boolean> {
    const { data: twoFactor } = await this.supabase
      .from('two_factor_auth')
      .select('id, user_id, secret, backup_codes, verified, verified_at, last_used_at, created_at')
      .eq('user_id', userId)
      .eq('verified', true)
      .single()

    if (!twoFactor) {
      return false // 2FA not enabled
    }

    // Check if it's a backup code
    if (code.length === 8 && code.includes('-')) {
      return this.verifyBackupCode(userId, code, twoFactor)
    }

    // Verify TOTP code
    const secret = this.decryptSecret(twoFactor.secret)
    const isValid = authenticator.verify({ token: code, secret })

    if (isValid) {
      await this.supabase
        .from('two_factor_auth')
        .update({ last_used_at: new Date().toISOString() })
        .eq('user_id', userId)

      await this.logEvent(userId, '2fa_verified')
    } else {
      await this.logEvent(userId, '2fa_failed')
    }

    return isValid
  }

  /**
   * Verify a backup code
   */
  private async verifyBackupCode(
    userId: string,
    code: string,
    twoFactor: { backup_codes: string[] | null }
  ): Promise<boolean> {
    const hashedCode = this.hashCode(code)
    const backupCodes: string[] = twoFactor.backup_codes || []

    const codeIndex = backupCodes.findIndex((bc) => bc === hashedCode)

    if (codeIndex === -1) {
      await this.logEvent(userId, '2fa_backup_failed')
      return false
    }

    // Remove used backup code
    backupCodes.splice(codeIndex, 1)

    await this.supabase
      .from('two_factor_auth')
      .update({
        backup_codes: backupCodes,
        last_used_at: new Date().toISOString(),
      })
      .eq('user_id', userId)

    await this.logEvent(userId, '2fa_backup_used', {
      remaining: backupCodes.length,
    })

    return true
  }

  /**
   * Disable 2FA
   */
  async disable(userId: string, code: string): Promise<boolean> {
    // Verify the code first
    const isValid = await this.verifyCode(userId, code)

    if (!isValid) {
      throw new Error('Invalid verification code')
    }

    // Delete 2FA record
    await this.supabase
      .from('two_factor_auth')
      .delete()
      .eq('user_id', userId)

    // Update profile
    await this.supabase
      .from('profiles')
      .update({
        two_factor_enabled: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)

    await this.logEvent(userId, '2fa_disabled')

    return true
  }

  /**
   * Regenerate backup codes
   */
  async regenerateBackupCodes(userId: string, code: string): Promise<string[]> {
    // Verify the code first
    const isValid = await this.verifyCode(userId, code)

    if (!isValid) {
      throw new Error('Invalid verification code')
    }

    // Generate new backup codes
    const backupCodes = this.generateBackupCodes(10)
    const hashedBackupCodes = backupCodes.map((c) => this.hashCode(c))

    await this.supabase
      .from('two_factor_auth')
      .update({
        backup_codes: hashedBackupCodes,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)

    await this.logEvent(userId, '2fa_backup_regenerated')

    return backupCodes
  }

  /**
   * Get 2FA status for a user
   */
  async getStatus(userId: string): Promise<TwoFactorStatus> {
    const { data: twoFactor } = await this.supabase
      .from('two_factor_auth')
      .select('id, user_id, backup_codes, verified, last_used_at, created_at')
      .eq('user_id', userId)
      .single()

    if (!twoFactor) {
      return {
        enabled: false,
        verified: false,
        backup_codes_remaining: 0,
      }
    }

    return {
      enabled: true,
      verified: twoFactor.verified,
      backup_codes_remaining: twoFactor.backup_codes?.length || 0,
      last_used: twoFactor.last_used_at,
      created_at: twoFactor.created_at,
    }
  }

  /**
   * Check if user has 2FA enabled
   */
  async isEnabled(userId: string): Promise<boolean> {
    const { data } = await this.supabase
      .from('two_factor_auth')
      .select('verified')
      .eq('user_id', userId)
      .eq('verified', true)
      .single()

    return !!data
  }

  // Helper methods

  private generateBackupCodes(count: number): string[] {
    const codes: string[] = []
    for (let i = 0; i < count; i++) {
      const part1 = crypto.randomBytes(2).toString('hex').toUpperCase()
      const part2 = crypto.randomBytes(2).toString('hex').toUpperCase()
      codes.push(`${part1}-${part2}`)
    }
    return codes
  }

  private hashCode(code: string): string {
    return crypto
      .createHash('sha256')
      .update(code + (process.env.TWO_FACTOR_SALT || 'default-salt'))
      .digest('hex')
  }

  private encryptSecret(secret: string): string {
    const algorithm = 'aes-256-gcm'
    if (!process.env.TWO_FACTOR_ENCRYPTION_KEY) {
      throw new Error('TWO_FACTOR_ENCRYPTION_KEY environment variable is required')
    }
    const key = Buffer.from(process.env.TWO_FACTOR_ENCRYPTION_KEY, 'hex')
    const iv = crypto.randomBytes(16)

    const cipher = crypto.createCipheriv(algorithm, key, iv)
    let encrypted = cipher.update(secret, 'utf8', 'hex')
    encrypted += cipher.final('hex')

    const authTag = cipher.getAuthTag()

    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`
  }

  private decryptSecret(encryptedSecret: string): string {
    const algorithm = 'aes-256-gcm'
    if (!process.env.TWO_FACTOR_ENCRYPTION_KEY) {
      throw new Error('TWO_FACTOR_ENCRYPTION_KEY environment variable is required')
    }
    const key = Buffer.from(process.env.TWO_FACTOR_ENCRYPTION_KEY, 'hex')

    const [ivHex, authTagHex, encrypted] = encryptedSecret.split(':')
    const iv = Buffer.from(ivHex, 'hex')
    const authTag = Buffer.from(authTagHex, 'hex')

    const decipher = crypto.createDecipheriv(algorithm, key, iv)
    decipher.setAuthTag(authTag)

    let decrypted = decipher.update(encrypted, 'hex', 'utf8')
    decrypted += decipher.final('utf8')

    return decrypted
  }

  private async logEvent(
    userId: string,
    event: string,
    details?: Record<string, unknown>
  ): Promise<void> {
    await this.supabase
      .from('security_logs')
      .insert({
        user_id: userId,
        event_type: event,
        details,
        created_at: new Date().toISOString(),
      })
  }
}

export const twoFactorAuth = new TwoFactorAuthService()
