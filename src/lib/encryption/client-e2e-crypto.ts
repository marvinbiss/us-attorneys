/**
 * Client-Side End-to-End Encryption for Attorney-Client Messages
 * ABA Rule 1.6 Compliance: Messages encrypted before leaving the browser
 *
 * Uses Web Crypto API (AES-256-GCM) with ECDH key exchange.
 * Keys stored in IndexedDB — NEVER sent to the server.
 *
 * Architecture:
 * 1. Each user generates an ECDH P-256 key pair on first use
 * 2. Public keys are exchanged via the server
 * 3. Shared secret is derived via ECDH + HKDF
 * 4. Messages encrypted with AES-256-GCM using the shared key
 *
 * IMPORTANT: This module is CLIENT-SIDE ONLY. Never import in server components.
 */

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DB_NAME = 'usattorneys_e2e_keys'
const DB_VERSION = 1
const KEY_STORE = 'keys'
const ECDH_CURVE: EcKeyGenParams = { name: 'ECDH', namedCurve: 'P-256' }
const AES_KEY_LENGTH = 256
const IV_LENGTH = 12 // 96 bits for GCM

// ---------------------------------------------------------------------------
// IndexedDB Key Storage
// ---------------------------------------------------------------------------

function openKeyDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB not available'))
      return
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(KEY_STORE)) {
        db.createObjectStore(KEY_STORE, { keyPath: 'id' })
      }
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

async function storeInDB(id: string, data: unknown): Promise<void> {
  const db = await openKeyDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(KEY_STORE, 'readwrite')
    const store = tx.objectStore(KEY_STORE)
    store.put({ id, ...data as object })
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

async function getFromDB<T>(id: string): Promise<T | null> {
  const db = await openKeyDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(KEY_STORE, 'readonly')
    const store = tx.objectStore(KEY_STORE)
    const request = store.get(id)
    request.onsuccess = () => resolve(request.result as T | null)
    request.onerror = () => reject(request.error)
  })
}

async function deleteFromDB(id: string): Promise<void> {
  const db = await openKeyDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(KEY_STORE, 'readwrite')
    const store = tx.objectStore(KEY_STORE)
    store.delete(id)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

// ---------------------------------------------------------------------------
// Key pair management
// ---------------------------------------------------------------------------

interface StoredKeyPair {
  id: string
  publicKeyJwk: JsonWebKey
  privateKeyJwk: JsonWebKey
  createdAt: string
}

/**
 * Generate a new ECDH key pair for the current user.
 * Stored in IndexedDB. The public key is exported for sharing with the server.
 */
export async function generateUserKeyPair(userId: string): Promise<JsonWebKey> {
  const keyPair = await crypto.subtle.generateKey(
    ECDH_CURVE,
    true, // extractable
    ['deriveKey', 'deriveBits']
  )

  const publicKeyJwk = await crypto.subtle.exportKey('jwk', keyPair.publicKey)
  const privateKeyJwk = await crypto.subtle.exportKey('jwk', keyPair.privateKey)

  await storeInDB(`user-keypair-${userId}`, {
    publicKeyJwk,
    privateKeyJwk,
    createdAt: new Date().toISOString(),
  })

  return publicKeyJwk
}

/**
 * Get the current user's key pair from IndexedDB.
 * Returns null if no key pair exists (call generateUserKeyPair first).
 */
export async function getUserKeyPair(userId: string): Promise<{
  publicKey: CryptoKey
  privateKey: CryptoKey
  publicKeyJwk: JsonWebKey
} | null> {
  const stored = await getFromDB<StoredKeyPair>(`user-keypair-${userId}`)
  if (!stored) return null

  const publicKey = await crypto.subtle.importKey(
    'jwk',
    stored.publicKeyJwk,
    ECDH_CURVE,
    true,
    []
  )

  const privateKey = await crypto.subtle.importKey(
    'jwk',
    stored.privateKeyJwk,
    ECDH_CURVE,
    true,
    ['deriveKey', 'deriveBits']
  )

  return { publicKey, privateKey, publicKeyJwk: stored.publicKeyJwk }
}

/**
 * Delete the user's key pair from IndexedDB.
 * WARNING: This will make all previously encrypted messages unreadable.
 */
export async function deleteUserKeyPair(userId: string): Promise<void> {
  await deleteFromDB(`user-keypair-${userId}`)
}

// ---------------------------------------------------------------------------
// Shared key derivation (ECDH)
// ---------------------------------------------------------------------------

/**
 * Derive a shared AES-256-GCM key from the user's private key and the
 * other participant's public key using ECDH + HKDF.
 *
 * @param privateKey - Current user's ECDH private key
 * @param otherPublicKeyJwk - Other participant's exported public key (JWK)
 * @param conversationId - Used as HKDF salt for domain separation
 */
async function deriveSharedKey(
  privateKey: CryptoKey,
  otherPublicKeyJwk: JsonWebKey,
  conversationId: string
): Promise<CryptoKey> {
  const otherPublicKey = await crypto.subtle.importKey(
    'jwk',
    otherPublicKeyJwk,
    ECDH_CURVE,
    false,
    []
  )

  // Step 1: ECDH to get shared bits
  const sharedBits = await crypto.subtle.deriveBits(
    { name: 'ECDH', public: otherPublicKey },
    privateKey,
    256
  )

  // Step 2: Import shared bits as HKDF key material
  const hkdfKey = await crypto.subtle.importKey(
    'raw',
    sharedBits,
    'HKDF',
    false,
    ['deriveKey']
  )

  // Step 3: HKDF to derive AES-256-GCM key with conversation-specific salt
  const encoder = new TextEncoder()
  const salt = encoder.encode(`aba-rule-1.6:${conversationId}`)
  const info = encoder.encode('attorney-client-privileged-e2e-v1')

  return crypto.subtle.deriveKey(
    { name: 'HKDF', hash: 'SHA-256', salt, info },
    hkdfKey,
    { name: 'AES-GCM', length: AES_KEY_LENGTH },
    false,
    ['encrypt', 'decrypt']
  )
}

// ---------------------------------------------------------------------------
// Conversation key management
// ---------------------------------------------------------------------------

interface StoredConversationKey {
  id: string
  otherPublicKeyJwk: JsonWebKey
  createdAt: string
}

/**
 * Generate (derive) a shared conversation key from the user's private key
 * and the other participant's public key. Caches the public key in IndexedDB.
 *
 * @param userId - Current user's ID
 * @param conversationId - Conversation UUID
 * @param otherPublicKeyJwk - Other participant's ECDH public key (JWK)
 */
export async function generateConversationKey(
  userId: string,
  conversationId: string,
  otherPublicKeyJwk: JsonWebKey
): Promise<CryptoKey> {
  // Store the other party's public key for future use
  await storeInDB(`conv-key-${conversationId}`, {
    otherPublicKeyJwk,
    createdAt: new Date().toISOString(),
  })

  const userKeys = await getUserKeyPair(userId)
  if (!userKeys) {
    throw new Error('User key pair not found. Call generateUserKeyPair first.')
  }

  return deriveSharedKey(userKeys.privateKey, otherPublicKeyJwk, conversationId)
}

/**
 * Get (or re-derive) the shared conversation key.
 * Returns null if no key data is stored for this conversation.
 */
export async function getConversationKey(
  userId: string,
  conversationId: string
): Promise<CryptoKey | null> {
  const stored = await getFromDB<StoredConversationKey>(`conv-key-${conversationId}`)
  if (!stored?.otherPublicKeyJwk) return null

  const userKeys = await getUserKeyPair(userId)
  if (!userKeys) return null

  return deriveSharedKey(userKeys.privateKey, stored.otherPublicKeyJwk, conversationId)
}

// ---------------------------------------------------------------------------
// Message encryption/decryption (AES-256-GCM)
// ---------------------------------------------------------------------------

export interface E2EEncryptedMessage {
  ciphertext: string // base64
  iv: string // base64
}

/**
 * Encrypt a plaintext message using AES-256-GCM.
 * Uses the Web Crypto API (client-side, no Node.js crypto).
 *
 * @param plaintext - Message content to encrypt
 * @param key - AES-256-GCM CryptoKey (from generateConversationKey)
 * @returns { ciphertext, iv } both as base64 strings
 */
export async function encryptMessage(
  plaintext: string,
  key: CryptoKey
): Promise<E2EEncryptedMessage> {
  const encoder = new TextEncoder()
  const data = encoder.encode(plaintext)

  // Generate random IV (96 bits for GCM)
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH))

  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    data
  )

  return {
    ciphertext: arrayBufferToBase64(encrypted),
    iv: arrayBufferToBase64(iv.buffer),
  }
}

/**
 * Decrypt an AES-256-GCM encrypted message.
 *
 * @param ciphertext - Base64-encoded ciphertext (includes GCM auth tag)
 * @param iv - Base64-encoded initialization vector
 * @param key - AES-256-GCM CryptoKey (from getConversationKey)
 * @returns Decrypted plaintext string
 */
export async function decryptMessage(
  ciphertext: string,
  iv: string,
  key: CryptoKey
): Promise<string> {
  const encryptedData = base64ToArrayBuffer(ciphertext)
  const ivData = base64ToArrayBuffer(iv)

  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: ivData },
    key,
    encryptedData
  )

  const decoder = new TextDecoder()
  return decoder.decode(decrypted)
}

// ---------------------------------------------------------------------------
// Utility: Base64 <-> ArrayBuffer
// ---------------------------------------------------------------------------

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes.buffer
}

// ---------------------------------------------------------------------------
// Initialization helper
// ---------------------------------------------------------------------------

/**
 * Ensure the user has an ECDH key pair. Creates one if missing.
 * Returns the public key JWK for sharing with the server.
 */
export async function ensureUserKeyPair(userId: string): Promise<JsonWebKey> {
  const existing = await getUserKeyPair(userId)
  if (existing) return existing.publicKeyJwk

  return generateUserKeyPair(userId)
}

/**
 * Check if client-side E2E encryption is available in this browser.
 */
export function isE2EAvailable(): boolean {
  return (
    typeof crypto !== 'undefined' &&
    typeof crypto.subtle !== 'undefined' &&
    typeof indexedDB !== 'undefined'
  )
}
