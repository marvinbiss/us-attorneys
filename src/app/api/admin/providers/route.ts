import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requirePermission } from '@/lib/admin-auth'
import { sanitizeSearchQuery } from '@/lib/sanitize'
import { logger } from '@/lib/logger'
import { z } from 'zod'
import { createApiHandler } from '@/lib/api/handler'
import { parseCursorParams, decodeCursor, buildCursorResponse } from '@/lib/pagination'

// GET query params schema (legacy page-based + new cursor-based)
const providersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  filter: z.enum(['all', 'verified', 'pending', 'suspended']).optional().default('all'),
  search: z.string().max(100).optional().default(''),
  cursor: z.string().optional(),
})

export const dynamic = 'force-dynamic'

/** Transform a raw DB row into the frontend provider shape */
function transformProvider(p: Record<string, unknown>) {
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    email: p.email || '',
    phone: p.phone || '',
    address_city: p.address_city || '',
    address_state: p.address_state || '',
    specialty: (p.specialty as string) || 'Attorney',
    is_verified: p.is_verified,
    is_active: p.is_active,
    rating_average: Number(p.rating_average) || 0,
    review_count: Number(p.review_count) || 0,
    created_at: p.created_at,
    source: p.source,
    bar_number: p.bar_number,
  }
}

// Define the select columns once
const SELECT_COLUMNS = `
  id,
  name,
  slug,
  email,
  phone,
  address_city,
  address_state,
  bar_number,
  specialty,
  is_verified,
  is_active,
  source,
  rating_average,
  review_count,
  created_at
`

export const GET = createApiHandler(async ({ request }) => {
  // Verify admin with providers:read permission
  const authResult = await requirePermission('providers', 'read')
  if (!authResult.success || !authResult.admin) {
    return (
      authResult.error ??
      NextResponse.json({ success: false, error: { message: 'Unauthorized' } }, { status: 403 })
    )
  }

  const supabase = createAdminClient()

  const searchParams = new URL(request.url).searchParams
  const queryParams: Record<string, string | undefined> = {
    page: searchParams.get('page') || '1',
    limit: searchParams.get('limit') || '20',
    filter: searchParams.get('filter') || 'all',
    search: searchParams.get('search') || '',
    cursor: searchParams.get('cursor') || undefined,
  }
  const result = providersQuerySchema.safeParse(queryParams)
  if (!result.success) {
    return NextResponse.json(
      { success: false, error: { message: 'Invalid parameters', details: result.error.flatten() } },
      { status: 400 }
    )
  }
  const { page, limit, filter, search } = result.data

  // Determine pagination mode: cursor-based (O(1)) or legacy offset-based (O(n))
  const cursorParams = parseCursorParams(searchParams, { defaultLimit: limit, maxLimit: 100 })
  const useCursorMode = cursorParams.useCursor
  const effectiveLimit = cursorParams.limit

  // Build base query with filters
  // Infer query type from actual supabase.from('attorneys').select() signature.
  // _typeProbe creates a query builder (no network call without await) used only for type inference.
  const _typeProbe = supabase.from('attorneys').select(SELECT_COLUMNS)
  type AttorneySelectQuery = typeof _typeProbe
  const applyFilters = (q: AttorneySelectQuery): AttorneySelectQuery => {
    let filtered = q
    if (filter === 'verified') {
      filtered = filtered.in('is_verified', [true]).in('is_active', [true])
    } else if (filter === 'pending') {
      filtered = filtered.in('is_verified', [false]).in('is_active', [true])
    } else if (filter === 'suspended') {
      filtered = filtered.in('is_active', [false])
    }
    if (search) {
      const sanitized = sanitizeSearchQuery(search)
      if (sanitized) {
        filtered = filtered.or(
          `name.ilike.%${sanitized}%,email.ilike.%${sanitized}%,address_city.ilike.%${sanitized}%,bar_number.ilike.%${sanitized}%`
        )
      }
    }
    return filtered
  }

  let response: NextResponse

  if (useCursorMode) {
    // ── Cursor-based pagination (O(1)) ──
    // Fetch limit + 1 to detect hasMore
    let query = applyFilters(supabase.from('attorneys').select(SELECT_COLUMNS))

    // Apply cursor: filter rows with created_at < cursor value (descending order)
    if (cursorParams.cursor) {
      const decoded = decodeCursor(cursorParams.cursor)
      query = query.lt('created_at', decoded)
    }

    const { data: providers, error } = await query
      .order('created_at', { ascending: false })
      .limit(effectiveLimit + 1)

    if (error) {
      logger.warn('Providers cursor query failed', { code: error.code, message: error.message })
      return NextResponse.json(
        { success: false, error: { message: 'Error retrieving attorneys', code: error.code } },
        { status: 502 }
      )
    }

    const cursorResult = buildCursorResponse(
      (providers || []) as Record<string, unknown>[],
      effectiveLimit,
      'created_at'
    )

    const transformedProviders = cursorResult.data.map(transformProvider)

    response = NextResponse.json({
      success: true,
      providers: transformedProviders,
      nextCursor: cursorResult.nextCursor,
      hasMore: cursorResult.hasMore,
    })
  } else {
    // ── Legacy offset-based pagination (backwards compatible) ──
    const offset = (page - 1) * limit

    const query = applyFilters(
      supabase.from('attorneys').select(SELECT_COLUMNS, { count: 'exact' })
    )

    const {
      data: providers,
      count,
      error,
    } = await query.order('created_at', { ascending: false }).range(offset, offset + limit - 1)

    if (error) {
      logger.warn('Providers query failed', { code: error.code, message: error.message })
      return NextResponse.json(
        { success: false, error: { message: 'Error retrieving attorneys', code: error.code } },
        { status: 502 }
      )
    }

    const transformedProviders = (providers || []).map(transformProvider)

    response = NextResponse.json({
      success: true,
      providers: transformedProviders,
      total: count || 0,
      page,
      totalPages: Math.ceil((count || 0) / limit),
    })
  }

  // Prevent caching
  response.headers.set('Cache-Control', 'private, no-store, no-cache, must-revalidate, max-age=0')
  response.headers.set('Pragma', 'no-cache')
  response.headers.set('Expires', '0')
  response.headers.set('Surrogate-Control', 'no-store')
  response.headers.set('CDN-Cache-Control', 'no-store')
  response.headers.set('Vercel-CDN-Cache-Control', 'no-store')

  return response
})
