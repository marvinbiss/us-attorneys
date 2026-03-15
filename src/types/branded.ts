/**
 * Branded Types pour la type-safety au runtime
 *
 * Ces types empêchent de passer un UserId là où on attend un ProviderId
 * même si les deux sont des strings UUID.
 */

declare const __brand: unique symbol
type Brand<T, B> = T & { [__brand]: B }

// ============================================================================
// BRANDED ID TYPES
// ============================================================================

export type ProviderId = Brand<string, 'ProviderId'>
export type UserId = Brand<string, 'UserId'>
export type QuoteId = Brand<string, 'QuoteId'>
export type ReviewId = Brand<string, 'ReviewId'>
export type ServiceId = Brand<string, 'ServiceId'>
export type CityId = Brand<string, 'CityId'>
export type RegionId = Brand<string, 'RegionId'>
export type DepartmentId = Brand<string, 'DepartmentId'>
export type AttestationId = Brand<string, 'AttestationId'>
export type VerificationId = Brand<string, 'VerificationId'>

// ============================================================================
// BRANDED VALUE TYPES
// ============================================================================

export type Siret = Brand<string, 'Siret'>
export type Siren = Brand<string, 'Siren'>
export type Email = Brand<string, 'Email'>
export type Phone = Brand<string, 'Phone'>
export type Slug = Brand<string, 'Slug'>
export type PostalCode = Brand<string, 'PostalCode'>
export type InseeCode = Brand<string, 'InseeCode'>

// ============================================================================
// TYPE GUARDS & VALIDATORS
// ============================================================================

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const SIRET_REGEX = /^\d{14}$/
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE_REGEX = /^(?:\+1)?[2-9]\d{2}[2-9]\d{6}$/
const POSTAL_CODE_REGEX = /^\d{5}$/
const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

export function isValidUUID(value: string): boolean {
  return UUID_REGEX.test(value)
}

export function isValidSiret(value: string): boolean {
  if (!SIRET_REGEX.test(value)) return false
  // Luhn checksum
  let sum = 0
  for (let i = 0; i < 14; i++) {
    let digit = parseInt(value[i], 10)
    if (i % 2 === 0) {
      digit *= 2
      if (digit > 9) digit -= 9
    }
    sum += digit
  }
  return sum % 10 === 0
}

export function isValidEmail(value: string): boolean {
  return EMAIL_REGEX.test(value)
}

export function isValidPhone(value: string): boolean {
  return PHONE_REGEX.test(value.replace(/\s/g, ''))
}

export function isValidSlug(value: string): boolean {
  return SLUG_REGEX.test(value)
}

export function isValidPostalCode(value: string): boolean {
  return POSTAL_CODE_REGEX.test(value)
}

// ============================================================================
// CONSTRUCTORS (avec validation)
// ============================================================================

export function createAttorneyId(value: string): ProviderId {
  if (!isValidUUID(value)) throw new Error(`Invalid ProviderId: ${value}`)
  return value as ProviderId
}

export function createUserId(value: string): UserId {
  if (!isValidUUID(value)) throw new Error(`Invalid UserId: ${value}`)
  return value as UserId
}

export function createQuoteId(value: string): QuoteId {
  if (!isValidUUID(value)) throw new Error(`Invalid QuoteId: ${value}`)
  return value as QuoteId
}

export function createReviewId(value: string): ReviewId {
  if (!isValidUUID(value)) throw new Error(`Invalid ReviewId: ${value}`)
  return value as ReviewId
}

export function createServiceId(value: string): ServiceId {
  if (!isValidUUID(value)) throw new Error(`Invalid ServiceId: ${value}`)
  return value as ServiceId
}

export function createCityId(value: string): CityId {
  if (!isValidUUID(value)) throw new Error(`Invalid CityId: ${value}`)
  return value as CityId
}

export function createSiret(value: string): Siret {
  if (!isValidSiret(value)) throw new Error(`Invalid Siret: ${value}`)
  return value as Siret
}

export function createEmail(value: string): Email {
  if (!isValidEmail(value)) throw new Error(`Invalid Email: ${value}`)
  return value.toLowerCase() as Email
}

export function createPhone(value: string): Phone {
  const cleaned = value.replace(/\s/g, '')
  if (!isValidPhone(cleaned)) throw new Error(`Invalid Phone: ${value}`)
  // Normalize to E.164
  if (!cleaned.startsWith('+1')) {
    return `+1${cleaned}` as Phone
  }
  return cleaned as Phone
}

export function createSlug(value: string): Slug {
  if (!isValidSlug(value)) throw new Error(`Invalid Slug: ${value}`)
  return value as Slug
}

export function createPostalCode(value: string): PostalCode {
  if (!isValidPostalCode(value)) throw new Error(`Invalid PostalCode: ${value}`)
  return value as PostalCode
}

// ============================================================================
// UNSAFE CONSTRUCTORS (pour données de confiance, ex: DB)
// ============================================================================

export function unsafeCreateProviderId(value: string): ProviderId {
  return value as ProviderId
}

export function unsafeCreateUserId(value: string): UserId {
  return value as UserId
}

export function unsafeCreateQuoteId(value: string): QuoteId {
  return value as QuoteId
}

export function unsafeCreateReviewId(value: string): ReviewId {
  return value as ReviewId
}

export function unsafeCreateSiret(value: string): Siret {
  return value as Siret
}

export function unsafeCreateEmail(value: string): Email {
  return value as Email
}

export function unsafeCreatePhone(value: string): Phone {
  return value as Phone
}

export function unsafeCreateSlug(value: string): Slug {
  return value as Slug
}

// ============================================================================
// EXTRACTION (pour passer aux APIs externes)
// ============================================================================

export function extractId(branded: ProviderId | UserId | QuoteId | ReviewId | ServiceId | CityId): string {
  return branded as string
}

export function extractValue(branded: Siret | Email | Phone | Slug | PostalCode): string {
  return branded as string
}
