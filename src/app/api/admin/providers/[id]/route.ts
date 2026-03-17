/**
 * Admin Provider API - Full CRUD
 * GET: Retrieve a provider with all relations
 * PATCH: Full update
 * DELETE: Soft delete
 */

import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requirePermission, logAdminAction } from '@/lib/admin-auth'
import { isValidUuid } from '@/lib/sanitize'
import { logger } from '@/lib/logger'
import { z } from 'zod'
import { createApiHandler } from '@/lib/api/handler'

const updateAttorneySchema = z.object({
  name: z.string().max(200).optional(),
  full_name: z.string().max(200).optional(),
  phone: z.string().max(20).optional().nullable(),
  email: z.union([z.string().email(), z.literal('')]).optional().nullable(),
  siret: z.string().max(20).optional().nullable(),
  specialty: z.string().max(200).optional().nullable(),
  description: z.string().max(5000).optional().nullable(),
  bio: z.string().max(2000).optional().nullable(),
  // Accept both naming conventions (form uses address_*, legacy uses bare names)
  address: z.string().max(200).optional().nullable(),
  address_street: z.string().max(200).optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  address_city: z.string().max(100).optional().nullable(),
  postal_code: z.string().max(10).optional().nullable(),
  address_postal_code: z.string().max(10).optional().nullable(),
  department: z.string().max(100).optional().nullable(),
  region: z.string().max(100).optional().nullable(),
  address_region: z.string().max(100).optional().nullable(),
  is_verified: z.boolean().optional(),
  is_active: z.boolean().optional(),
})

export const dynamic = 'force-dynamic'

const ALLOWED_PROVIDER_FIELDS = [
  'name', 'slug', 'specialty', 'description', 'bio',
  'address_street', 'address_city', 'address_postal_code', 'address_region', 'address_department',
  'latitude', 'longitude', 'phone', 'email', 'siret',
  'is_verified', 'is_active', 'noindex', 'code_naf',
  'updated_at',
]

/** Strip HTML tags from text inputs */
const stripTags = (val: string | null | undefined): string | null =>
  val ? val.replace(/<[^>]*>/g, '').trim() : null

const NO_CACHE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate',
  'Pragma': 'no-cache',
}

/** Map frontend form fields to database column names and sanitize values.
 *  Accepts both form field names (address_street, address_city) and legacy names (address, city). */
function buildUpdateData(body: Record<string, unknown>): Record<string, unknown> {
  const data: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  }

  // Name: prefer name, fall back to full_name
  if (body.name && typeof body.name === 'string' && body.name.trim()) {
    data.name = stripTags(body.name as string)
  } else if (body.full_name && typeof body.full_name === 'string' && (body.full_name as string).trim()) {
    data.name = stripTags(body.full_name as string)
  }

  // Specialty
  if (body.specialty !== undefined) data.specialty = stripTags(body.specialty as string)

  // Direct nullable fields
  const directFields: [string, string][] = [
    ['phone', 'phone'],
    ['email', 'email'],
    ['siret', 'siret'],
  ]
  for (const [src, dest] of directFields) {
    if (body[src] !== undefined) data[dest] = body[src] || null
  }

  // Text fields that need HTML stripping
  if (body.description !== undefined) data.description = stripTags(body.description as string)
  if (body.bio !== undefined) data.bio = stripTags(body.bio as string)

  // Address fields — accept both naming conventions (form: address_*, legacy: bare)
  const addr = body.address_street ?? body.address
  if (addr !== undefined) data.address_street = stripTags(addr as string)

  const city = body.address_city ?? body.city
  if (city !== undefined) data.address_city = stripTags(city as string)

  const postal = body.address_postal_code ?? body.postal_code
  if (postal !== undefined) data.address_postal_code = (postal as string) || null

  const region = body.address_region ?? body.region ?? body.department
  if (region !== undefined) data.address_region = stripTags(region as string)

  // Boolean fields
  if (body.is_verified !== undefined) data.is_verified = Boolean(body.is_verified)
  if (body.is_active !== undefined) data.is_active = Boolean(body.is_active)

  return data
}

// GET - Retrieve a complete provider
export const GET = createApiHandler(async ({ params }) => {
  const authResult = await requirePermission('providers', 'read')
  if (!authResult.success || !authResult.admin) return authResult.error!

  const attorneyId = params?.id
  if (!attorneyId || !isValidUuid(attorneyId)) {
    return NextResponse.json(
      { success: false, error: { message: 'Invalid ID' } },
      { status: 400 }
    )
  }

  const supabase = createAdminClient()

  const { data: provider, error } = await supabase
    .from('attorneys')
    .select('id, user_id, stable_id, name, slug, email, phone, siret, specialty, description, bio, address_street, address_city, address_postal_code, address_region, address_department, latitude, longitude, is_verified, is_active, rating_average, review_count, created_at, updated_at')
    .eq('id', attorneyId)
    .single()

  if (error || !provider) {
    return NextResponse.json({ success: false, error: { message: 'Provider not found' } }, { status: 404 })
  }

  const response = NextResponse.json({
    success: true,
    provider: {
      id: provider.id,
      user_id: provider.user_id || null,
      stable_id: provider.stable_id || null,
      email: provider.email || '',
      full_name: provider.name,
      name: provider.name,
      slug: provider.slug,
      phone: provider.phone || '',
      siret: provider.siret || '',
      specialty: provider.specialty || '',
      description: provider.description || '',
      bio: provider.bio || '',
      // Use DB column names directly so form fields match
      address_street: provider.address_street || '',
      address_city: provider.address_city || '',
      address_postal_code: provider.address_postal_code || '',
      address_region: provider.address_region || '',
      address_department: provider.address_department || '',
      latitude: provider.latitude,
      longitude: provider.longitude,
      is_verified: provider.is_verified || false,
      is_active: provider.is_active !== false,
      rating_average: provider.rating_average || null,
      review_count: provider.review_count || 0,
      created_at: provider.created_at,
      updated_at: provider.updated_at,
    },
  })

  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate')
  response.headers.set('Pragma', 'no-cache')
  return response
})

// PATCH - Full provider update
export const PATCH = createApiHandler(async ({ request, params }) => {
  const attorneyId = params?.id

  const authResult = await requirePermission('providers', 'write')
  if (!authResult.success || !authResult.admin) return authResult.error!

  if (!attorneyId || !isValidUuid(attorneyId)) {
    return NextResponse.json(
      { success: false, error: { message: 'Invalid ID' } },
      { status: 400 }
    )
  }

  const supabase = createAdminClient()

  // Parse and validate request body
  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ success: false, error: { message: 'Invalid JSON in request body' } }, { status: 400 })
  }

  const validationResult = updateAttorneySchema.safeParse(body)
  if (!validationResult.success) {
    return NextResponse.json(
      { success: false, error: { message: 'Validation error', details: validationResult.error.flatten() } },
      { status: 400 }
    )
  }

  // Build and execute update — filter to only allowed DB columns
  const rawUpdateData = buildUpdateData(body)
  const updateData = Object.fromEntries(
    Object.entries(rawUpdateData).filter(([key]) => ALLOWED_PROVIDER_FIELDS.includes(key))
  )

  const { data, error } = await supabase
    .from('attorneys')
    .update(updateData)
    .eq('id', attorneyId)
    .select()
    .single()

  if (error) {
    logger.error('Database update failed', { code: error.code, message: error.message })
    return NextResponse.json({ success: false, error: { message: 'Error during update' } }, { status: 500 })
  }

  // Audit log
  try {
    await logAdminAction(authResult.admin.id, 'provider.update', 'provider', attorneyId, updateData)
  } catch {
    logger.warn('Audit log failed')
  }

  return NextResponse.json(
    { success: true, data, message: 'Attorney updated successfully' },
    { headers: NO_CACHE_HEADERS }
  )
})

// DELETE - Soft delete
export const DELETE = createApiHandler(async ({ params }) => {
  const attorneyId = params?.id

  const authResult = await requirePermission('providers', 'delete')
  if (!authResult.success || !authResult.admin) return authResult.error!

  if (!attorneyId || !isValidUuid(attorneyId)) {
    return NextResponse.json(
      { success: false, error: { message: 'Invalid ID' } },
      { status: 400 }
    )
  }

  const supabase = createAdminClient()

  const { error } = await supabase
    .from('attorneys')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('id', attorneyId)

  if (error) {
    logger.error('Database delete failed', error)
    return NextResponse.json({ success: false, error: { message: 'Error during deletion' } }, { status: 500 })
  }

  try {
    await logAdminAction(authResult.admin.id, 'provider.delete', 'provider', attorneyId)
  } catch {
    logger.warn('Audit log failed')
  }

  return NextResponse.json({ success: true, message: 'Attorney deleted' })
})
