/**
 * Centralized API Response Helpers — US Attorneys
 *
 * THE single source of truth for all API response envelopes.
 * Import from here (not from handler.ts) for new routes.
 *
 *   Success:   { "success": true, "data": T, "meta"?: {...} }        (HTTP 200)
 *   Created:   { "success": true, "data": T }                        (HTTP 201)
 *   NoContent: empty body                                             (HTTP 204)
 *   Paginated: { "success": true, "data": T[], "meta": { pagination } }
 *   Error:     { "success": false, "error": { code, message } }      (HTTP 4xx/5xx)
 */

import { NextResponse } from 'next/server'

// ============================================
// Types
// ============================================

export interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

export interface ApiSuccessBody<T> {
  success: true
  data: T
  meta?: Record<string, unknown>
}

export interface ApiErrorBody {
  success: false
  error: {
    code: string
    message: string
  }
}

export interface ApiPaginatedBody<T> {
  success: true
  data: T[]
  meta: {
    pagination: PaginationMeta
  } & Record<string, unknown>
}

// ============================================
// Helpers
// ============================================

/**
 * Standard success response (HTTP 200 by default).
 *
 * @param data  The response payload
 * @param meta  Optional metadata (e.g., cache info, attribution)
 *
 * @example
 *   return apiSuccess({ attorney: { id: '1', name: 'Jane' } })
 *   return apiSuccess({ id: '1' }, { source: 'cache' })
 */
export function apiSuccess<T>(data: T, meta?: Record<string, unknown>): NextResponse<ApiSuccessBody<T>> {
  const body: ApiSuccessBody<T> = { success: true, data }
  if (meta && Object.keys(meta).length > 0) {
    body.meta = meta
  }
  return NextResponse.json(body, { status: 200 })
}

/**
 * Paginated response with full pagination metadata.
 *
 * @example
 *   const { data, count } = await supabase.from('attorneys').select('*', { count: 'exact' })
 *   return apiPaginated(data, count, page, limit)
 */
export function apiPaginated<T>(
  data: T[],
  total: number,
  page: number,
  limit: number,
  extraMeta?: Record<string, unknown>,
): NextResponse<ApiPaginatedBody<T>> {
  const totalPages = Math.ceil(total / limit)
  const pagination: PaginationMeta = {
    page,
    limit,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  }

  const body: ApiPaginatedBody<T> = {
    success: true,
    data,
    meta: {
      pagination,
      ...extraMeta,
    },
  }

  return NextResponse.json(body, { status: 200 })
}

/**
 * HTTP 201 Created response.
 *
 * @example
 *   return apiCreated({ booking: { id: newId, status: 'confirmed' } })
 */
export function apiCreated<T>(data: T, meta?: Record<string, unknown>): NextResponse<ApiSuccessBody<T>> {
  const body: ApiSuccessBody<T> = { success: true, data }
  if (meta && Object.keys(meta).length > 0) {
    body.meta = meta
  }
  return NextResponse.json(body, { status: 201 })
}

/**
 * Standard error response.
 *
 * @param code    Machine-readable error code (e.g., 'VALIDATION_ERROR', 'NOT_FOUND')
 * @param message Human-readable description
 * @param status  HTTP status code (default 400)
 *
 * @example
 *   return apiError('VALIDATION_ERROR', 'Invalid email address', 400)
 *   return apiError('NOT_FOUND', 'Attorney not found', 404)
 */
export function apiError(code: string, message: string, status: number = 400): NextResponse<ApiErrorBody> {
  return NextResponse.json(
    { success: false as const, error: { code, message } },
    { status }
  )
}

/**
 * HTTP 204 No Content response (empty body).
 *
 * @example
 *   return apiNoContent()
 */
export function apiNoContent(): NextResponse {
  return new NextResponse(null, { status: 204 })
}
