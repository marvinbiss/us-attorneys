/**
 * API Admin Provider - CRUD complet
 * GET: Récupérer un provider avec toutes ses relations
 * PATCH: Mise à jour complète
 * DELETE: Soft delete
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requirePermission, logAdminAction } from '@/lib/admin-auth'
import { isValidUuid } from '@/lib/sanitize'
import { logger } from '@/lib/logger'
import { z } from 'zod'

const updateProviderSchema = z.object({
  name: z.string().max(200).optional(),
  full_name: z.string().max(200).optional(),
  phone: z.string().max(20).optional().nullable(),
  email: z.string().email().optional().nullable(),
  siret: z.string().max(20).optional().nullable(),
  description: z.string().max(2000).optional().nullable(),
  address: z.string().max(200).optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  postal_code: z.string().max(10).optional().nullable(),
  department: z.string().max(100).optional().nullable(),
  region: z.string().max(100).optional().nullable(),
  is_verified: z.boolean().optional(),
  is_active: z.boolean().optional(),
})

export const dynamic = 'force-dynamic'

const ALLOWED_PROVIDER_FIELDS = [
  'name', 'slug', 'specialty', 'description', 'bio',
  'address_street', 'address_city', 'address_postal_code', 'address_region',
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

/** Map frontend form fields to database column names and sanitize values */
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

  // Direct nullable fields (no sanitization needed)
  const directFields: [string, string][] = [
    ['phone', 'phone'],
    ['email', 'email'],
    ['siret', 'siret'],
    ['postal_code', 'address_postal_code'],
  ]
  for (const [src, dest] of directFields) {
    if (body[src] !== undefined) data[dest] = body[src] || null
  }

  // Text fields that need HTML stripping
  const textFields: [string, string][] = [
    ['description', 'description'],
    ['address', 'address_street'],
    ['city', 'address_city'],
    ['region', 'address_region'],
  ]
  for (const [src, dest] of textFields) {
    if (body[src] !== undefined) data[dest] = stripTags(body[src] as string)
  }

  // Boolean fields
  if (body.is_verified !== undefined) {
    data.is_verified = Boolean(body.is_verified)
  }
  // is_premium column was dropped; is_featured is no longer stored
  if (body.is_active !== undefined) data.is_active = Boolean(body.is_active)

  return data
}

// GET - Récupérer un provider complet
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requirePermission('providers', 'read')
    if (!authResult.success || !authResult.admin) return authResult.error

    const providerId = params.id
    if (!isValidUuid(providerId)) {
      return NextResponse.json(
        { success: false, error: { message: 'Identifiant invalide' } },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    const { data: provider, error } = await supabase
      .from('providers')
      .select('id, user_id, name, slug, email, phone, siret, description, address_street, address_city, address_postal_code, address_region, latitude, longitude, is_verified, is_active, rating_average, review_count, created_at, updated_at')
      .eq('id', params.id)
      .single()

    if (error || !provider) {
      return NextResponse.json({ success: false, error: { message: 'Provider non trouvé' } }, { status: 404 })
    }

    const response = NextResponse.json({
      success: true,
      provider: {
        id: provider.id,
        user_id: provider.user_id || null,
        email: provider.email || '',
        full_name: provider.name,
        name: provider.name,
        phone: provider.phone || '',
        siret: provider.siret || '',
        description: provider.description || '',
        services: [],
        zones: [],
        address: provider.address_street || '',
        city: provider.address_city || '',
        postal_code: provider.address_postal_code || '',
        department: provider.address_region || '',
        region: provider.address_region || '',
        latitude: provider.latitude,
        longitude: provider.longitude,
        is_verified: provider.is_verified || false,
        is_active: provider.is_active !== false,
        rating: provider.rating_average || null,
        reviews_count: provider.review_count || 0,
        source: 'manual',
        created_at: provider.created_at,
        updated_at: provider.updated_at,
        slug: provider.slug,
      },
    })

    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate')
    response.headers.set('Pragma', 'no-cache')
    return response
  } catch (error) {
    logger.error('Admin provider GET error', error)
    return NextResponse.json({ success: false, error: { message: 'Erreur lors de la récupération du profil' } }, { status: 500 })
  }
}

// PATCH - Mise à jour complète du provider
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const providerId = params.id

  try {
    const authResult = await requirePermission('providers', 'write')
    if (!authResult.success || !authResult.admin) return authResult.error

    if (!isValidUuid(providerId)) {
      return NextResponse.json(
        { success: false, error: { message: 'Identifiant invalide' } },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    // Parse and validate request body
    let body: Record<string, unknown>
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ success: false, error: { message: 'JSON invalide dans le body' } }, { status: 400 })
    }

    const validationResult = updateProviderSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { success: false, error: { message: 'Erreur de validation', details: validationResult.error.flatten() } },
        { status: 400 }
      )
    }

    // Build and execute update — filter to only allowed DB columns
    const rawUpdateData = buildUpdateData(body)
    const updateData = Object.fromEntries(
      Object.entries(rawUpdateData).filter(([key]) => ALLOWED_PROVIDER_FIELDS.includes(key))
    )

    const { data, error } = await supabase
      .from('providers')
      .update(updateData)
      .eq('id', providerId)
      .select()
      .single()

    if (error) {
      logger.error('Database update failed', { code: error.code, message: error.message })
      return NextResponse.json({ success: false, error: { message: 'Erreur lors de la mise à jour' } }, { status: 500 })
    }

    // Audit log
    try {
      await logAdminAction(authResult.admin.id, 'provider.update', 'provider', providerId, updateData)
    } catch (auditError) {
      logger.warn('Audit log failed')
    }

    return NextResponse.json(
      { success: true, data, message: 'Artisan mis à jour avec succès' },
      { headers: NO_CACHE_HEADERS }
    )
  } catch (error) {
    const err = error as Error
    logger.error('Unexpected PATCH error', { message: err.message })
    return NextResponse.json({ success: false, error: { message: 'Erreur inattendue lors de la mise à jour' } }, { status: 500 })
  }
}

// DELETE - Soft delete
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const providerId = params.id

  try {
    const authResult = await requirePermission('providers', 'delete')
    if (!authResult.success || !authResult.admin) return authResult.error

    if (!isValidUuid(providerId)) {
      return NextResponse.json(
        { success: false, error: { message: 'Identifiant invalide' } },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    const { error } = await supabase
      .from('providers')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', providerId)

    if (error) {
      logger.error('Database delete failed', error)
      return NextResponse.json({ success: false, error: { message: 'Erreur lors de la suppression' } }, { status: 500 })
    }

    try {
      await logAdminAction(authResult.admin.id, 'provider.delete', 'provider', providerId)
    } catch (auditError) {
      logger.warn('Audit log failed')
    }

    return NextResponse.json({ success: true, message: 'Artisan supprimé' })
  } catch (error) {
    const err = error as Error
    logger.error('Unexpected DELETE error', { message: err.message })
    return NextResponse.json({ success: false, error: { message: 'Erreur lors de la suppression' } }, { status: 500 })
  }
}
