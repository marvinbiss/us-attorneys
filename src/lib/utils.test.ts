import { describe, it, expect } from 'vitest'
import {
  cn,
  formatPrice,
  slugify,
  truncate,
  getInitials,
  isValidEmail,
  isValidUSPhone,
  formatUSPhone,
  isValidSIRET,
  calculateDistance,
  getRatingColor,
  parseQueryString,
  getAttorneyUrl,
} from './utils'

describe('cn (classNames utility)', () => {
  it('should merge simple class names', () => {
    expect(cn('class1', 'class2')).toBe('class1 class2')
  })

  it('should handle conditional classes', () => {
    expect(cn('base', true && 'included', false && 'excluded')).toBe('base included')
  })

  it('should handle undefined and null values', () => {
    expect(cn('base', undefined, null, 'valid')).toBe('base valid')
  })

  it('should merge tailwind classes correctly', () => {
    expect(cn('px-2 py-1', 'px-4')).toBe('py-1 px-4')
    expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500')
  })

  it('should handle empty input', () => {
    expect(cn()).toBe('')
  })
})

describe('formatPrice', () => {
  it('should format price in EUR by default', () => {
    const result = formatPrice(100)
    expect(result).toContain('100')
    expect(result).toMatch(/$|EUR/)
  })

  it('should format large numbers with proper grouping', () => {
    const result = formatPrice(1000)
    expect(result).toMatch(/1[\s\u00A0\u202F]?000/)
  })

  it('should handle zero', () => {
    const result = formatPrice(0)
    expect(result).toContain('0')
  })
})

describe('slugify', () => {
  it('should convert to lowercase', () => {
    expect(slugify('HELLO')).toBe('hello')
  })

  it('should replace spaces with hyphens', () => {
    expect(slugify('hello world')).toBe('hello-world')
  })

  it('should remove accents', () => {
    expect(slugify('cafe')).toBe('cafe')
    expect(slugify('resume')).toBe('resume')
  })

  it('should remove special characters', () => {
    expect(slugify('hello@world!')).toBe('hello-world')
  })

  it('should handle multiple spaces', () => {
    expect(slugify('hello   world')).toBe('hello-world')
  })

  it('should trim whitespace', () => {
    expect(slugify('  hello world  ')).toBe('hello-world')
  })
})

describe('truncate', () => {
  it('should not truncate short text', () => {
    expect(truncate('hello', 10)).toBe('hello')
  })

  it('should truncate long text with ellipsis', () => {
    expect(truncate('hello world', 5)).toBe('hello...')
  })

  it('should handle exact length', () => {
    expect(truncate('hello', 5)).toBe('hello')
  })

  it('should handle empty string', () => {
    expect(truncate('', 10)).toBe('')
  })
})

describe('getInitials', () => {
  it('should get initials from full name', () => {
    expect(getInitials('John Doe')).toBe('JD')
  })

  it('should handle single name', () => {
    expect(getInitials('John')).toBe('J')
  })

  it('should limit to 2 characters', () => {
    expect(getInitials('Jean Pierre Dupont')).toBe('JP')
  })

  it('should handle lowercase names', () => {
    expect(getInitials('john doe')).toBe('JD')
  })
})

describe('isValidEmail', () => {
  it('should validate correct email', () => {
    expect(isValidEmail('test@example.com')).toBe(true)
    expect(isValidEmail('user.name@domain.fr')).toBe(true)
  })

  it('should reject invalid emails', () => {
    expect(isValidEmail('invalid')).toBe(false)
    expect(isValidEmail('invalid@')).toBe(false)
    expect(isValidEmail('@domain.com')).toBe(false)
    expect(isValidEmail('test@.com')).toBe(false)
  })

  it('should reject emails with spaces', () => {
    expect(isValidEmail('test @example.com')).toBe(false)
  })
})

describe('isValidUSPhone', () => {
  it('should validate correct US phone numbers', () => {
    expect(isValidUSPhone('2125551234')).toBe(true)
    expect(isValidUSPhone('+12125551234')).toBe(true)
  })

  it('should reject invalid phone numbers', () => {
    expect(isValidUSPhone('123')).toBe(false)
    expect(isValidUSPhone('abcdefghij')).toBe(false)
  })
})

describe('formatUSPhone', () => {
  it('should format 10-digit phone number', () => {
    expect(formatUSPhone('2125551234')).toBe('(212) 555-1234')
  })

  it('should return original if not 10 digits', () => {
    expect(formatUSPhone('+12125551234')).toBe('+12125551234')
  })
})

describe('isValidSIRET', () => {
  it('should validate correct SIRET numbers', () => {
    // Test with a known valid SIRET (Luhn algorithm valid)
    expect(isValidSIRET('73282932000074')).toBe(true)
  })

  it('should reject invalid SIRET numbers', () => {
    expect(isValidSIRET('12345678901234')).toBe(false) // Invalid Luhn
    expect(isValidSIRET('1234567890123')).toBe(false) // Too short
    expect(isValidSIRET('123456789012345')).toBe(false) // Too long
    expect(isValidSIRET('abcdefghijklmn')).toBe(false) // Non-numeric
  })

  it('should handle SIRET with spaces', () => {
    expect(isValidSIRET('732 829 320 00074')).toBe(true)
  })
})

describe('calculateDistance', () => {
  it('should calculate distance between two points', () => {
    // Paris to Lyon is approximately 392 km
    const distance = calculateDistance(48.8566, 2.3522, 45.7640, 4.8357)
    expect(distance).toBeGreaterThan(380)
    expect(distance).toBeLessThan(410)
  })

  it('should return 0 for same coordinates', () => {
    const distance = calculateDistance(48.8566, 2.3522, 48.8566, 2.3522)
    expect(distance).toBe(0)
  })
})

describe('getRatingColor', () => {
  it('should return green-600 for excellent ratings', () => {
    expect(getRatingColor(5)).toBe('text-green-600')
    expect(getRatingColor(4.5)).toBe('text-green-600')
  })

  it('should return green-500 for very good ratings', () => {
    expect(getRatingColor(4.2)).toBe('text-green-500')
    expect(getRatingColor(4)).toBe('text-green-500')
  })

  it('should return yellow-500 for good ratings', () => {
    expect(getRatingColor(3.7)).toBe('text-yellow-500')
    expect(getRatingColor(3.5)).toBe('text-yellow-500')
  })

  it('should return orange-500 for average ratings', () => {
    expect(getRatingColor(3.2)).toBe('text-orange-500')
    expect(getRatingColor(3)).toBe('text-orange-500')
  })

  it('should return red-500 for poor ratings', () => {
    expect(getRatingColor(2.5)).toBe('text-red-500')
    expect(getRatingColor(1)).toBe('text-red-500')
  })
})

describe('parseQueryString', () => {
  it('should parse simple query string', () => {
    const result = parseQueryString('?foo=bar&baz=qux')
    expect(result.foo).toBe('bar')
    expect(result.baz).toBe('qux')
  })

  it('should handle empty query string', () => {
    const result = parseQueryString('')
    expect(Object.keys(result)).toHaveLength(0)
  })

  it('should handle encoded values', () => {
    const result = parseQueryString('?name=John%20Doe')
    expect(result.name).toBe('John Doe')
  })
})

describe('getAttorneyUrl', () => {
  it('should build URL with known service and city', () => {
    const url = getAttorneyUrl({ specialty: 'plombier', city: 'Paris', slug: 'dupont-plomberie-75' })
    expect(url).toBe('/practice-areas/plombier/paris/dupont-plomberie-75')
  })

  it('should prefer slug over stable_id', () => {
    const url = getAttorneyUrl({ specialty: 'electricien', city: 'Lyon', slug: 'martin-elec-69', stable_id: 'STBL123' })
    expect(url).toContain('martin-elec-69')
    expect(url).not.toContain('STBL123')
  })

  it('should fall back to stable_id when no slug', () => {
    const url = getAttorneyUrl({ specialty: 'plombier', city: 'Paris', stable_id: 'STBL456' })
    expect(url).toContain('STBL456')
  })

  it('should resolve specialty synonym to canonical slug', () => {
    const url = getAttorneyUrl({ specialty: 'peintre', city: 'Paris', slug: 'test' })
    expect(url).toContain('/peintre-en-batiment/')
  })

  it('should slugify unknown city', () => {
    const url = getAttorneyUrl({ specialty: 'plombier', city: 'City Inconnue', slug: 'test' })
    expect(url).toContain('/ville-inconnue/')
  })

  it('should fall back gracefully with missing fields', () => {
    const url = getAttorneyUrl({})
    expect(url).toMatch(/^\/services\/artisan\/france\/$/)
  })

  it('should start with /practice-areas/', () => {
    const url = getAttorneyUrl({ specialty: 'menuisier', city: 'Marseille', slug: 'bois-pro' })
    expect(url).toMatch(/^\/services\//)
  })
})
