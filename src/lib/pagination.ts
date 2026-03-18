/**
 * Cursor-based pagination utilities (P2-25)
 *
 * Replaces O(n) OFFSET pagination with O(1) cursor-based pagination.
 * Cursors are base64-encoded sort key values from the last row.
 *
 * Backwards-compatible: supports both `page` (legacy) and `cursor` params
 * during transition period.
 */

// ---------------------------------------------------------------------------
// Encode / Decode
// ---------------------------------------------------------------------------

/**
 * Encode a cursor value (the sort key of the last row) to a URL-safe string.
 * Supports string, number, and Date values.
 */
export function encodeCursor(value: string | number | Date): string {
  const raw = value instanceof Date ? value.toISOString() : String(value)
  // Buffer.from is available in Node.js (Next.js API routes)
  return Buffer.from(raw, 'utf-8').toString('base64url')
}

/**
 * Decode a cursor string back to the original sort key value.
 */
export function decodeCursor(cursor: string): string {
  return Buffer.from(cursor, 'base64url').toString('utf-8')
}

// ---------------------------------------------------------------------------
// Parse params from URLSearchParams
// ---------------------------------------------------------------------------

export interface CursorParams {
  cursor: string | null
  limit: number
  /** True when the caller sent a cursor (use cursor-based path) */
  useCursor: boolean
}

/**
 * Extract cursor pagination params from a request's search params.
 *
 * Recognises:
 *   - `cursor`  – opaque cursor from a previous response
 *   - `limit`   – page size (clamped to 1..maxLimit, default 20)
 *
 * If no `cursor` param is present the caller can fall back to OFFSET
 * pagination (legacy `page` param) for backwards compatibility.
 */
export function parseCursorParams(
  searchParams: URLSearchParams,
  { defaultLimit = 20, maxLimit = 100 } : { defaultLimit?: number; maxLimit?: number } = {},
): CursorParams {
  const cursorRaw = searchParams.get('cursor')
  const limitRaw  = searchParams.get('limit')

  let limit = defaultLimit
  if (limitRaw) {
    const parsed = parseInt(limitRaw, 10)
    if (!Number.isNaN(parsed)) {
      limit = Math.max(1, Math.min(parsed, maxLimit))
    }
  }

  return {
    cursor: cursorRaw ?? null,
    limit,
    useCursor: cursorRaw !== null,
  }
}

// ---------------------------------------------------------------------------
// Build response
// ---------------------------------------------------------------------------

export interface CursorResponse<T> {
  data: T[]
  nextCursor: string | null
  hasMore: boolean
}

/**
 * Build a cursor-paginated response from a result set.
 *
 * The query MUST fetch `limit + 1` rows so we can detect whether more rows
 * exist beyond the current page.
 *
 * @param rows      – rows returned by the query (up to limit + 1)
 * @param limit     – the requested page size
 * @param sortKey   – the property name used as the sort/cursor column
 */
export function buildCursorResponse<T extends Record<string, unknown>>(
  rows: T[],
  limit: number,
  sortKey: keyof T & string,
): CursorResponse<T> {
  const hasMore = rows.length > limit
  const data    = hasMore ? rows.slice(0, limit) : rows

  let nextCursor: string | null = null
  if (hasMore && data.length > 0) {
    const lastRow = data[data.length - 1]
    const value   = lastRow[sortKey]
    if (value !== null && value !== undefined) {
      nextCursor = encodeCursor(value as string | number | Date)
    }
  }

  return { data, nextCursor, hasMore }
}
