import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requirePermission, logAdminAction } from '@/lib/admin-auth'
import { sanitizeSearchQuery } from '@/lib/sanitize'
import { logger } from '@/lib/logger'
import { z } from 'zod'
import { createApiHandler } from '@/lib/api/handler'

// POST request schema
const createServiceSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  icon: z.string().max(50).optional(),
  parent_id: z.string().uuid().optional().nullable(),
  meta_title: z.string().max(100).optional(),
  meta_description: z.string().max(200).optional(),
})

export const dynamic = 'force-dynamic'

// GET - Liste des services
export const GET = createApiHandler(async ({ request }) => {
  // Verify admin with services:read permission
  const authResult = await requirePermission('services', 'read')
  if (!authResult.success || !authResult.admin) {
    return authResult.error!
  }

  const supabase = createAdminClient()

  const searchParams = new URL(request.url).searchParams
  const search = searchParams.get('search') || ''
  const includeInactive = searchParams.get('includeInactive') === 'true'

  let query = supabase
    .from('specialties')
    .select('id, name, slug, description, icon, category, is_active, sort_order, created_at')
    .order('name', { ascending: true })

  if (!includeInactive) {
    query = query.eq('is_active', true)
  }

  if (search) {
    const sanitized = sanitizeSearchQuery(search)
    if (sanitized) {
      query = query.ilike('name', `%${sanitized}%`)
    }
  }

  const { data: services, error } = await query

  if (error) {
    logger.warn('Services query failed, returning empty list', { code: error.code, message: error.message })
    return NextResponse.json({
      success: true,
      services: [],
    })
  }

  return NextResponse.json({
    success: true,
    services: services || [],
  })
})

// POST - Create a service
export const POST = createApiHandler(async ({ request }) => {
  // Verify admin with services:write permission
  const authResult = await requirePermission('services', 'write')
  if (!authResult.success || !authResult.admin) {
    return authResult.error!
  }

  const supabase = createAdminClient()
  const body = await request.json()
  const result = createServiceSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json(
      { success: false, error: { message: 'Validation error', details: result.error.flatten() } },
      { status: 400 }
    )
  }
  const { name: rawName, description: rawDescription, icon, parent_id, meta_title: rawMetaTitle, meta_description: rawMetaDescription } = result.data

  // Strip HTML tags from text fields
  const name = rawName.replace(/<[^>]*>/g, '').trim()
  const description = rawDescription?.replace(/<[^>]*>/g, '').trim()
  const meta_title = rawMetaTitle?.replace(/<[^>]*>/g, '').trim()
  const meta_description = rawMetaDescription?.replace(/<[^>]*>/g, '').trim()

  // Generate the slug
  const slug = name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')

  const { data, error } = await supabase
    .from('specialties')
    .insert({
      name,
      slug,
      description,
      icon,
      parent_id,
      meta_title: meta_title || name,
      meta_description: meta_description || description,
      is_active: true,
      created_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json(
        { success: false, error: { message: 'A service with this name already exists' } },
        { status: 409 }
      )
    }
    logger.error('Service create error', error)
    return NextResponse.json(
      { success: false, error: { message: 'Error creating service' } },
      { status: 500 }
    )
  }

  // Audit log with actual admin ID
  await logAdminAction(
    authResult.admin.id,
    'service.create',
    'service',
    data.id,
    { name, slug }
  )

  return NextResponse.json({
    success: true,
    service: data,
    message: 'Service created successfully',
  })
})
