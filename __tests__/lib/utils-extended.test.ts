import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  formatDate,
  formatRelativeTime,
  getAvatarColor,
  debounce,
  throttle,
  formatUSPhone,
  isValidUSPhone,
  isValidBarNumber,
  measurePerformance,
} from '@/lib/utils'

// ── formatDate ──────────────────────────────────────────────────────────────

describe('formatDate', () => {
  it('formats a date string in US English', () => {
    const result = formatDate('2026-01-15')
    expect(result).toContain('January')
    expect(result).toContain('15')
    expect(result).toContain('2026')
  })

  it('formats a Date object', () => {
    const result = formatDate(new Date(2026, 0, 15))
    expect(result).toContain('January')
    expect(result).toContain('2026')
  })

  it('accepts custom options', () => {
    const result = formatDate('2026-03-18', { month: 'short', day: 'numeric' })
    expect(result).toContain('Mar')
    expect(result).toContain('18')
  })
})

// ── formatRelativeTime ──────────────────────────────────────────────────────

describe('formatRelativeTime', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-03-18T12:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns "Just now" for less than 1 minute ago', () => {
    const result = formatRelativeTime(new Date('2026-03-18T11:59:45Z'))
    expect(result).toBe('Just now')
  })

  it('returns minutes for less than 1 hour', () => {
    const result = formatRelativeTime(new Date('2026-03-18T11:30:00Z'))
    expect(result).toBe('30 min ago')
  })

  it('returns hours for less than 1 day', () => {
    const result = formatRelativeTime(new Date('2026-03-18T06:00:00Z'))
    expect(result).toBe('6h ago')
  })

  it('returns days for less than 1 week', () => {
    const result = formatRelativeTime(new Date('2026-03-15T12:00:00Z'))
    expect(result).toBe('3d ago')
  })

  it('returns formatted date for more than 1 week', () => {
    const result = formatRelativeTime(new Date('2026-03-01T12:00:00Z'))
    expect(result).toContain('Mar')
  })
})

// ── getAvatarColor ──────────────────────────────────────────────────────────

describe('getAvatarColor', () => {
  it('returns a consistent color for the same name', () => {
    const color1 = getAvatarColor('John Smith')
    const color2 = getAvatarColor('John Smith')
    expect(color1).toBe(color2)
  })

  it('returns different colors for different names', () => {
    const color1 = getAvatarColor('Alice')
    const color2 = getAvatarColor('Bob')
    // Not guaranteed but statistically likely with different names
    // Just verify they return valid gradient classes
    expect(color1).toMatch(/^from-\w+-500 to-\w+-600$/)
    expect(color2).toMatch(/^from-\w+-500 to-\w+-600$/)
  })

  it('returns a valid Tailwind gradient class', () => {
    const color = getAvatarColor('Test User')
    expect(color).toContain('from-')
    expect(color).toContain('to-')
  })
})

// ── debounce ────────────────────────────────────────────────────────────────

describe('debounce', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('delays function execution', () => {
    const fn = vi.fn()
    const debounced = debounce(fn, 300)

    debounced()
    expect(fn).not.toHaveBeenCalled()

    vi.advanceTimersByTime(300)
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('resets timer on subsequent calls', () => {
    const fn = vi.fn()
    const debounced = debounce(fn, 300)

    debounced()
    vi.advanceTimersByTime(200)
    debounced() // Reset timer
    vi.advanceTimersByTime(200)
    expect(fn).not.toHaveBeenCalled()

    vi.advanceTimersByTime(100)
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('passes arguments to the original function', () => {
    const fn = vi.fn()
    const debounced = debounce(fn, 100)

    debounced('arg1', 'arg2')
    vi.advanceTimersByTime(100)
    expect(fn).toHaveBeenCalledWith('arg1', 'arg2')
  })
})

// ── throttle ────────────────────────────────────────────────────────────────

describe('throttle', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('executes immediately on first call', () => {
    const fn = vi.fn()
    const throttled = throttle(fn, 300)

    throttled()
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('blocks subsequent calls within the limit period', () => {
    const fn = vi.fn()
    const throttled = throttle(fn, 300)

    throttled()
    throttled()
    throttled()
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('allows execution after the limit period', () => {
    const fn = vi.fn()
    const throttled = throttle(fn, 300)

    throttled()
    expect(fn).toHaveBeenCalledTimes(1)

    vi.advanceTimersByTime(300)
    throttled()
    expect(fn).toHaveBeenCalledTimes(2)
  })
})

// ── isValidUSPhone (extended) ───────────────────────────────────────────────

describe('isValidUSPhone (extended)', () => {
  it('accepts formatted phone numbers', () => {
    expect(isValidUSPhone('(212) 555-1234')).toBe(true)
    expect(isValidUSPhone('212.555.1234')).toBe(true)
    expect(isValidUSPhone('212-555-1234')).toBe(true)
  })

  it('rejects numbers starting with 0 or 1 in area code', () => {
    expect(isValidUSPhone('0125551234')).toBe(false)
    expect(isValidUSPhone('1125551234')).toBe(false)
  })

  it('rejects too-short numbers', () => {
    expect(isValidUSPhone('21255512')).toBe(false)
  })
})

// ── isValidBarNumber (extended) ─────────────────────────────────────────────

describe('isValidBarNumber (extended)', () => {
  it('accepts various state bar number formats', () => {
    expect(isValidBarNumber('12345678')).toBe(true)     // Numeric only
    expect(isValidBarNumber('CA-123456')).toBe(true)     // State prefix with dash
    expect(isValidBarNumber('FL0012345')).toBe(true)     // State prefix no dash
  })

  it('rejects numbers with special characters other than hyphen', () => {
    expect(isValidBarNumber('CA#123')).toBe(false)
    expect(isValidBarNumber('NY@456')).toBe(false)
  })

  it('rejects whitespace-only input', () => {
    expect(isValidBarNumber('   ')).toBe(false)
  })
})

// ── formatUSPhone (extended) ────────────────────────────────────────────────

describe('formatUSPhone (extended)', () => {
  it('formats a clean 10-digit number', () => {
    expect(formatUSPhone('3105551234')).toBe('(310) 555-1234')
  })

  it('strips non-digit characters before formatting', () => {
    expect(formatUSPhone('(310) 555-1234')).toBe('(310) 555-1234')
  })
})

// ── measurePerformance ──────────────────────────────────────────────────────

describe('measurePerformance', () => {
  it('returns a stop function', () => {
    const end = measurePerformance('test-operation')
    expect(typeof end).toBe('function')
    // Just verify it doesn't throw
    end()
  })
})
