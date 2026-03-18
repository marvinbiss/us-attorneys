import { describe, it, expect } from 'vitest'
import {
  sanitizeSearchQuery,
  sanitizeHtml,
  sanitizeUserInput,
  sanitizeEmail,
  sanitizePhone,
  sanitizeUuid,
  isValidUuid,
  sanitizeSiret,
} from '@/lib/sanitize'

// ── sanitizeSearchQuery ─────────────────────────────────────────────────────

describe('sanitizeSearchQuery', () => {
  it('returns empty string for falsy input', () => {
    expect(sanitizeSearchQuery('')).toBe('')
    expect(sanitizeSearchQuery(null as unknown as string)).toBe('')
    expect(sanitizeSearchQuery(undefined as unknown as string)).toBe('')
  })

  it('returns empty string for non-string input', () => {
    expect(sanitizeSearchQuery(123 as unknown as string)).toBe('')
  })

  it('trims whitespace', () => {
    expect(sanitizeSearchQuery('  hello  ')).toBe('hello')
  })

  it('escapes PostgreSQL LIKE special characters', () => {
    expect(sanitizeSearchQuery('100%')).toContain('\\%')
    expect(sanitizeSearchQuery('under_score')).toContain('\\_')
    expect(sanitizeSearchQuery('back\\slash')).toContain('\\\\')
  })

  it('escapes single quotes (SQL injection prevention)', () => {
    const result = sanitizeSearchQuery("O'Brien")
    expect(result).toContain("''")
    expect(result).not.toBe("O'Brien")
  })

  it('removes semicolons (SQL injection prevention)', () => {
    expect(sanitizeSearchQuery('test; DROP TABLE users;')).not.toContain(';')
  })

  it('removes SQL comment patterns', () => {
    expect(sanitizeSearchQuery('test -- comment')).not.toContain('--')
    expect(sanitizeSearchQuery('test /* block */ end')).not.toContain('/*')
    expect(sanitizeSearchQuery('test */ end')).not.toContain('*/')
  })

  it('removes null bytes', () => {
    expect(sanitizeSearchQuery('test\0injection')).not.toContain('\0')
  })

  it('truncates input to 200 characters', () => {
    const longInput = 'a'.repeat(300)
    expect(sanitizeSearchQuery(longInput).length).toBeLessThanOrEqual(200)
  })

  it('handles a realistic search query', () => {
    const result = sanitizeSearchQuery('personal injury attorney')
    expect(result).toBe('personal injury attorney')
  })
})

// ── sanitizeHtml ────────────────────────────────────────────────────────────

describe('sanitizeHtml', () => {
  it('returns empty string for falsy input', () => {
    expect(sanitizeHtml('')).toBe('')
    expect(sanitizeHtml(null as unknown as string)).toBe('')
    expect(sanitizeHtml(undefined as unknown as string)).toBe('')
  })

  it('escapes HTML angle brackets', () => {
    expect(sanitizeHtml('<script>alert("xss")</script>')).not.toContain('<')
    expect(sanitizeHtml('<script>alert("xss")</script>')).not.toContain('>')
  })

  it('escapes ampersands', () => {
    expect(sanitizeHtml('A & B')).toContain('&amp;')
  })

  it('escapes double quotes', () => {
    expect(sanitizeHtml('say "hello"')).toContain('&quot;')
  })

  it('escapes single quotes', () => {
    expect(sanitizeHtml("it's")).toContain('&#x27;')
  })

  it('escapes forward slashes', () => {
    expect(sanitizeHtml('a/b')).toContain('&#x2F;')
  })

  it('handles XSS payloads by escaping all HTML', () => {
    const xss = '<img src=x onerror=alert(1)>'
    const result = sanitizeHtml(xss)
    // sanitizeHtml escapes chars, not removes them - no raw HTML tags
    expect(result).not.toContain('<img')
    expect(result).not.toContain('<')
    expect(result).not.toContain('>')
    expect(result).toContain('&lt;')
    expect(result).toContain('&gt;')
  })
})

// ── sanitizeUserInput ───────────────────────────────────────────────────────

describe('sanitizeUserInput', () => {
  it('returns empty string for falsy input', () => {
    expect(sanitizeUserInput('')).toBe('')
    expect(sanitizeUserInput(null as unknown as string)).toBe('')
  })

  it('removes control characters', () => {
    expect(sanitizeUserInput('test\x00\x07\x1F')).toBe('test')
  })

  it('removes script tags', () => {
    const input = 'Hello <script>alert("xss")</script> World'
    const result = sanitizeUserInput(input)
    expect(result).not.toContain('<script>')
    expect(result).not.toContain('</script>')
  })

  it('removes javascript: protocol', () => {
    expect(sanitizeUserInput('javascript:alert(1)')).not.toMatch(/javascript:/i)
  })

  it('removes event handlers', () => {
    expect(sanitizeUserInput('onerror=alert(1)')).not.toMatch(/onerror\s*=/i)
    expect(sanitizeUserInput('onclick=evil()')).not.toMatch(/onclick\s*=/i)
  })

  it('removes data: protocol', () => {
    expect(sanitizeUserInput('data:text/html,<h1>xss</h1>')).not.toMatch(/data:/i)
  })

  it('truncates input to 10000 characters', () => {
    const longInput = 'a'.repeat(20000)
    expect(sanitizeUserInput(longInput).length).toBeLessThanOrEqual(10000)
  })

  it('preserves normal text', () => {
    expect(sanitizeUserInput('Hello, this is a normal comment.')).toBe('Hello, this is a normal comment.')
  })
})

// ── sanitizeEmail ───────────────────────────────────────────────────────────

describe('sanitizeEmail', () => {
  it('returns empty string for falsy input', () => {
    expect(sanitizeEmail('')).toBe('')
    expect(sanitizeEmail(null as unknown as string)).toBe('')
  })

  it('lowercases and trims email', () => {
    expect(sanitizeEmail('  User@Example.COM  ')).toBe('user@example.com')
  })

  it('rejects invalid email formats', () => {
    expect(sanitizeEmail('not-an-email')).toBe('')
    expect(sanitizeEmail('missing@')).toBe('')
    expect(sanitizeEmail('@no-local.com')).toBe('')
  })

  it('accepts valid emails', () => {
    expect(sanitizeEmail('john@example.com')).toBe('john@example.com')
    expect(sanitizeEmail('user.name+tag@domain.co')).toBe('user.name+tag@domain.co')
  })

  it('truncates to 254 characters', () => {
    const longLocal = 'a'.repeat(250)
    const result = sanitizeEmail(`${longLocal}@example.com`)
    expect(result.length).toBeLessThanOrEqual(254)
  })
})

// ── sanitizePhone ───────────────────────────────────────────────────────────

describe('sanitizePhone', () => {
  it('returns empty string for falsy input', () => {
    expect(sanitizePhone('')).toBe('')
    expect(sanitizePhone(null as unknown as string)).toBe('')
  })

  it('strips non-digit characters except leading +', () => {
    expect(sanitizePhone('+1 (212) 555-1234')).toBe('+12125551234')
  })

  it('preserves only the first +', () => {
    expect(sanitizePhone('+1+2+3')).toBe('+123')
  })

  it('truncates to 20 characters', () => {
    const longNumber = '+' + '1'.repeat(30)
    expect(sanitizePhone(longNumber).length).toBeLessThanOrEqual(20)
  })

  it('handles normal phone numbers', () => {
    expect(sanitizePhone('2125551234')).toBe('2125551234')
  })
})

// ── sanitizeUuid ────────────────────────────────────────────────────────────

describe('sanitizeUuid', () => {
  it('returns null for falsy input', () => {
    expect(sanitizeUuid('')).toBeNull()
    expect(sanitizeUuid(null as unknown as string)).toBeNull()
  })

  it('accepts valid UUID v4', () => {
    const uuid = '550e8400-e29b-41d4-a716-446655440000'
    expect(sanitizeUuid(uuid)).toBe(uuid)
  })

  it('lowercases UUID', () => {
    const uuid = '550E8400-E29B-41D4-A716-446655440000'
    expect(sanitizeUuid(uuid)).toBe(uuid.toLowerCase())
  })

  it('trims whitespace', () => {
    const uuid = '  550e8400-e29b-41d4-a716-446655440000  '
    expect(sanitizeUuid(uuid)).toBe('550e8400-e29b-41d4-a716-446655440000')
  })

  it('rejects non-UUID strings', () => {
    expect(sanitizeUuid('not-a-uuid')).toBeNull()
    expect(sanitizeUuid('12345')).toBeNull()
  })

  it('rejects UUIDs with wrong version nibble', () => {
    // Version must be 4 for UUID v4
    expect(sanitizeUuid('550e8400-e29b-21d4-a716-446655440000')).toBeNull()
  })
})

// ── isValidUuid ─────────────────────────────────────────────────────────────

describe('isValidUuid', () => {
  it('validates standard UUIDs (any version)', () => {
    expect(isValidUuid('550e8400-e29b-41d4-a716-446655440000')).toBe(true)
    expect(isValidUuid('550e8400-e29b-11d4-a716-446655440000')).toBe(true) // v1
  })

  it('rejects invalid strings', () => {
    expect(isValidUuid('not-a-uuid')).toBe(false)
    expect(isValidUuid('')).toBe(false)
    expect(isValidUuid('550e8400-e29b-41d4-a716')).toBe(false) // truncated
  })
})

// ── sanitizeSiret (legacy) ──────────────────────────────────────────────────

describe('sanitizeSiret', () => {
  it('returns empty string for falsy input', () => {
    expect(sanitizeSiret('')).toBe('')
    expect(sanitizeSiret(null as unknown as string)).toBe('')
  })

  it('strips non-digit characters', () => {
    expect(sanitizeSiret('123-456-789-01234')).toBe('12345678901234')
  })

  it('truncates to 14 digits if too long', () => {
    expect(sanitizeSiret('123456789012345678').length).toBeLessThanOrEqual(14)
  })

  it('returns digits as-is when exactly 14', () => {
    expect(sanitizeSiret('12345678901234')).toBe('12345678901234')
  })
})
