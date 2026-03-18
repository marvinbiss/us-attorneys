import { describe, it, expect } from 'vitest'
import {
  encodeCursor,
  decodeCursor,
  parseCursorParams,
  buildCursorResponse,
} from '@/lib/pagination'

describe('encodeCursor / decodeCursor', () => {
  it('round-trips a string value', () => {
    const original = '2026-03-18T10:30:00.000Z'
    const encoded = encodeCursor(original)
    expect(encoded).not.toBe(original)
    expect(decodeCursor(encoded)).toBe(original)
  })

  it('round-trips a number value', () => {
    const encoded = encodeCursor(42)
    expect(decodeCursor(encoded)).toBe('42')
  })

  it('round-trips a Date value as ISO string', () => {
    const date = new Date('2026-01-15T08:00:00.000Z')
    const encoded = encodeCursor(date)
    expect(decodeCursor(encoded)).toBe('2026-01-15T08:00:00.000Z')
  })

  it('produces URL-safe base64 (no +, /, =)', () => {
    const encoded = encodeCursor('value/with+special=chars')
    expect(encoded).not.toMatch(/[+/=]/)
  })
})

describe('parseCursorParams', () => {
  it('returns useCursor=false when no cursor param', () => {
    const params = new URLSearchParams('limit=10')
    const result = parseCursorParams(params)
    expect(result.useCursor).toBe(false)
    expect(result.cursor).toBeNull()
    expect(result.limit).toBe(10)
  })

  it('returns useCursor=true when cursor param is present', () => {
    const cursor = encodeCursor('2026-03-18T10:00:00Z')
    const params = new URLSearchParams(`cursor=${cursor}&limit=25`)
    const result = parseCursorParams(params)
    expect(result.useCursor).toBe(true)
    expect(result.cursor).toBe(cursor)
    expect(result.limit).toBe(25)
  })

  it('uses defaultLimit when limit param is absent', () => {
    const params = new URLSearchParams('')
    const result = parseCursorParams(params, { defaultLimit: 50 })
    expect(result.limit).toBe(50)
  })

  it('clamps limit to maxLimit', () => {
    const params = new URLSearchParams('limit=500')
    const result = parseCursorParams(params, { maxLimit: 100 })
    expect(result.limit).toBe(100)
  })

  it('clamps limit to minimum 1', () => {
    const params = new URLSearchParams('limit=-5')
    const result = parseCursorParams(params)
    expect(result.limit).toBe(1)
  })
})

describe('buildCursorResponse', () => {
  const makeRows = (n: number) =>
    Array.from({ length: n }, (_, i) => ({
      id: `id-${i}`,
      created_at: `2026-03-${String(18 - i).padStart(2, '0')}T00:00:00Z`,
    }))

  it('returns hasMore=false when rows <= limit', () => {
    const rows = makeRows(5)
    const result = buildCursorResponse(rows, 10, 'created_at')
    expect(result.hasMore).toBe(false)
    expect(result.nextCursor).toBeNull()
    expect(result.data).toHaveLength(5)
  })

  it('returns hasMore=true and nextCursor when rows > limit', () => {
    const rows = makeRows(11) // limit + 1
    const result = buildCursorResponse(rows, 10, 'created_at')
    expect(result.hasMore).toBe(true)
    expect(result.nextCursor).not.toBeNull()
    expect(result.data).toHaveLength(10)
    // cursor should decode to the last row's created_at
    expect(decodeCursor(result.nextCursor!)).toBe(rows[9].created_at)
  })

  it('trims the extra row from data', () => {
    const rows = makeRows(6)
    const result = buildCursorResponse(rows, 5, 'created_at')
    expect(result.data).toHaveLength(5)
    expect(result.data).not.toContainEqual(rows[5])
  })

  it('handles empty rows', () => {
    const result = buildCursorResponse([], 10, 'created_at')
    expect(result.hasMore).toBe(false)
    expect(result.nextCursor).toBeNull()
    expect(result.data).toHaveLength(0)
  })
})
