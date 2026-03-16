/**
 * Input Sanitization Utilities - US Attorneys
 * Prevents SQL injection and XSS attacks
 */

/**
 * Sanitize a string for use in Supabase/PostgreSQL ILIKE queries
 * Escapes special characters that could be used for injection
 */
export function sanitizeSearchQuery(input: string): string {
  if (!input || typeof input !== 'string') {
    return ''
  }

  // Remove null bytes
  let sanitized = input.replace(/\0/g, '')

  // Limit length to prevent DoS
  sanitized = sanitized.slice(0, 200)

  // Escape PostgreSQL LIKE special characters
  sanitized = sanitized
    .replace(/\\/g, '\\\\') // Escape backslashes first
    .replace(/%/g, '\\%')   // Escape percent
    .replace(/_/g, '\\_')   // Escape underscore

  // Remove any potential SQL injection patterns
  sanitized = sanitized
    .replace(/'/g, "''")    // Escape single quotes
    .replace(/"/g, '""')    // Escape double quotes
    .replace(/;/g, '')      // Remove semicolons
    .replace(/--/g, '')     // Remove SQL comments
    .replace(/\/\*/g, '')   // Remove block comment start
    .replace(/\*\//g, '')   // Remove block comment end

  return sanitized.trim()
}

/**
 * Sanitize HTML to prevent XSS
 */
export function sanitizeHtml(input: string): string {
  if (!input || typeof input !== 'string') {
    return ''
  }

  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
}

/**
 * Sanitize user input for display (basic XSS prevention)
 */
export function sanitizeUserInput(input: string): string {
  if (!input || typeof input !== 'string') {
    return ''
  }

  // Remove null bytes and control characters
  let sanitized = input.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')

  // Limit length
  sanitized = sanitized.slice(0, 10000)

  // Remove potential script injections
  sanitized = sanitized
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .replace(/data:/gi, '')

  return sanitized.trim()
}

/**
 * Validate and sanitize email
 */
export function sanitizeEmail(input: string): string {
  if (!input || typeof input !== 'string') {
    return ''
  }

  const sanitized = input.toLowerCase().trim().slice(0, 254)

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(sanitized)) {
    return ''
  }

  return sanitized
}

/**
 * Validate and sanitize phone number (French format)
 */
export function sanitizePhone(input: string): string {
  if (!input || typeof input !== 'string') {
    return ''
  }

  // Remove all non-digit characters except + at the start
  let sanitized = input.replace(/[^\d+]/g, '')

  // Keep only the first + if present
  if (sanitized.startsWith('+')) {
    sanitized = '+' + sanitized.slice(1).replace(/\+/g, '')
  }

  // Limit length
  return sanitized.slice(0, 20)
}

/**
 * Sanitize UUID parameter
 */
export function sanitizeUuid(input: string): string | null {
  if (!input || typeof input !== 'string') {
    return null
  }

  const sanitized = input.trim().toLowerCase()

  // UUID v4 format validation
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

  if (!uuidRegex.test(sanitized)) {
    return null
  }

  return sanitized
}

/**
 * Validate UUID format (any version)
 */
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function isValidUuid(value: string): boolean {
  return UUID_REGEX.test(value)
}

/**
 * Sanitize SIRET number
 * @deprecated Legacy French business ID. Use bar_number validation instead.
 */
export function sanitizeSiret(input: string): string {
  if (!input || typeof input !== 'string') {
    return ''
  }

  // Remove all non-digit characters
  const sanitized = input.replace(/\D/g, '')

  // SIRET is exactly 14 digits
  if (sanitized.length !== 14) {
    return sanitized.slice(0, 14)
  }

  return sanitized
}
