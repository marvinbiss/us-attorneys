/**
 * Secure Message Encryption/Decryption
 * ABA Rule 1.6 Compliance: Attorney-Client Privilege Protection
 *
 * Uses AES-256-GCM via Node.js crypto module (server-side only).
 * Per-conversation key derived via HKDF from conversation ID + server secret.
 *
 * IMPORTANT: This module is SERVER-SIDE ONLY. Never import in client components.
 */

import { randomBytes, createCipheriv, createDecipheriv, createHmac } from 'crypto'
import { logger } from '@/lib/logger'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 12 // 96 bits recommended for GCM
const AUTH_TAG_LENGTH = 16 // 128 bits
const KEY_LENGTH = 32 // 256 bits

/**
 * Get the server encryption secret.
 * Falls back to SUPABASE_SERVICE_ROLE_KEY if MESSAGE_ENCRYPTION_SECRET is not set.
 */
function getServerSecret(): Buffer {
  const secret = process.env.MESSAGE_ENCRYPTION_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!secret) {
    throw new Error('MESSAGE_ENCRYPTION_SECRET or SUPABASE_SERVICE_ROLE_KEY must be set for message encryption')
  }
  return Buffer.from(secret, 'utf-8')
}

/**
 * Derive a per-conversation encryption key using HKDF-like construction.
 * Uses HMAC-SHA256 with the server secret as key and conversation ID as info.
 *
 * @param conversationId - UUID of the conversation
 * @returns 32-byte key buffer
 */
export function deriveConversationKey(conversationId: string): Buffer {
  const secret = getServerSecret()

  // HKDF extract: PRK = HMAC-SHA256(secret, conversationId)
  const prk = createHmac('sha256', secret)
    .update(conversationId)
    .digest()

  // HKDF expand: OKM = HMAC-SHA256(PRK, info || 0x01)
  const okm = createHmac('sha256', prk)
    .update(Buffer.concat([
      Buffer.from('attorney-client-privileged-v1', 'utf-8'),
      Buffer.from([0x01]),
    ]))
    .digest()

  return okm.subarray(0, KEY_LENGTH)
}

export interface EncryptedMessage {
  encrypted: string // base64-encoded ciphertext + auth tag
  iv: string // base64-encoded IV
}

/**
 * Encrypt a plaintext message using AES-256-GCM.
 *
 * @param plaintext - The message content to encrypt
 * @param conversationId - Used to derive the per-conversation key
 * @returns Object with base64-encoded encrypted content and IV
 */
export function encryptMessage(plaintext: string, conversationId: string): EncryptedMessage {
  try {
    const key = deriveConversationKey(conversationId)
    const iv = randomBytes(IV_LENGTH)

    const cipher = createCipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH })
    const encrypted = Buffer.concat([
      cipher.update(plaintext, 'utf-8'),
      cipher.final(),
      cipher.getAuthTag(),
    ])

    return {
      encrypted: encrypted.toString('base64'),
      iv: iv.toString('base64'),
    }
  } catch (error) {
    logger.error('Message encryption failed', { error, conversationId })
    throw new Error('Failed to encrypt message')
  }
}

/**
 * Decrypt an AES-256-GCM encrypted message.
 *
 * @param encryptedBase64 - Base64-encoded ciphertext + auth tag
 * @param ivBase64 - Base64-encoded IV
 * @param conversationId - Used to derive the per-conversation key
 * @returns Decrypted plaintext
 */
export function decryptMessage(encryptedBase64: string, ivBase64: string, conversationId: string): string {
  try {
    const key = deriveConversationKey(conversationId)
    const iv = Buffer.from(ivBase64, 'base64')
    const encryptedWithTag = Buffer.from(encryptedBase64, 'base64')

    // Split ciphertext and auth tag
    const ciphertext = encryptedWithTag.subarray(0, encryptedWithTag.length - AUTH_TAG_LENGTH)
    const authTag = encryptedWithTag.subarray(encryptedWithTag.length - AUTH_TAG_LENGTH)

    const decipher = createDecipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH })
    decipher.setAuthTag(authTag)

    const decrypted = Buffer.concat([
      decipher.update(ciphertext),
      decipher.final(),
    ])

    return decrypted.toString('utf-8')
  } catch (error) {
    logger.error('Message decryption failed', { error, conversationId })
    throw new Error('Failed to decrypt message')
  }
}

/**
 * Generate a content preview (first N characters) for notifications.
 * Returns null if preview generation is disabled.
 *
 * @param plaintext - Original message content
 * @param maxLength - Maximum preview length (default: 50)
 * @returns Truncated preview or null
 */
export function generateContentPreview(plaintext: string, maxLength = 50): string {
  if (!plaintext) return ''
  if (plaintext.length <= maxLength) return plaintext
  return plaintext.substring(0, maxLength) + '...'
}

/**
 * Encrypt a file buffer using AES-256-GCM.
 *
 * @param fileBuffer - The file content as Buffer
 * @param conversationId - Used to derive the per-conversation key
 * @returns Object with base64-encoded encrypted content and IV
 */
export function encryptFile(fileBuffer: Buffer, conversationId: string): EncryptedMessage {
  try {
    const key = deriveConversationKey(conversationId)
    const iv = randomBytes(IV_LENGTH)

    const cipher = createCipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH })
    const encrypted = Buffer.concat([
      cipher.update(fileBuffer),
      cipher.final(),
      cipher.getAuthTag(),
    ])

    return {
      encrypted: encrypted.toString('base64'),
      iv: iv.toString('base64'),
    }
  } catch (error) {
    logger.error('File encryption failed', { error, conversationId })
    throw new Error('Failed to encrypt file')
  }
}

/**
 * Decrypt an AES-256-GCM encrypted file.
 *
 * @param encryptedBase64 - Base64-encoded ciphertext + auth tag
 * @param ivBase64 - Base64-encoded IV
 * @param conversationId - Used to derive the per-conversation key
 * @returns Decrypted file as Buffer
 */
export function decryptFile(encryptedBase64: string, ivBase64: string, conversationId: string): Buffer {
  try {
    const key = deriveConversationKey(conversationId)
    const iv = Buffer.from(ivBase64, 'base64')
    const encryptedWithTag = Buffer.from(encryptedBase64, 'base64')

    const ciphertext = encryptedWithTag.subarray(0, encryptedWithTag.length - AUTH_TAG_LENGTH)
    const authTag = encryptedWithTag.subarray(encryptedWithTag.length - AUTH_TAG_LENGTH)

    const decipher = createDecipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH })
    decipher.setAuthTag(authTag)

    return Buffer.concat([
      decipher.update(ciphertext),
      decipher.final(),
    ])
  } catch (error) {
    logger.error('File decryption failed', { error, conversationId })
    throw new Error('Failed to decrypt file')
  }
}
