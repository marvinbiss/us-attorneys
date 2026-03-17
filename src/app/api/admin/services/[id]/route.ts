import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requirePermission, logAdminAction } from '@/lib/admin-auth'
import { logger } from '@/lib/logger'
import { isValidUuid } from '@/lib/sanitize'
import { z } from 'zod'
import { createApiHandler } from '@/lib/api/handler'

// PATCH request schema
const updateServiceSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  icon: z.string().max(50).optional(),
  parent_id: z.string().uuid().optional().nullable(),
  meta_title: z.string().max(100).optional(),
  meta_description: z.string().max(200).optional(),
  is_active: z.boolean().optional(),
  slug: z.string().max(100).optional(),
})

export const dynamic = 'force-dynamic'

// GET - Service details
export const GET = createApiHandler(async ({ params }) => {
  // Verify admin with services:read permission
  const authResult = await requirePermission('services', 'read')
  if (!authResult.success || !authResult.admin) {
    return authResult.error!
  }

  const id = params?.id
  if (!id || !isValidUuid(id)) {
    return NextResponse.json(
      { success: false, error: { message: 'Invalid ID' } },
      { status: 400 }
    )
  }

  const supabase = createAdminClient()

  const { data: service, error } = await supabase
    .from('specialties')
    .select('id, name, slug, description, icon, category, is_active, sort_order, created_at')
    .eq('id', id)
    .single()

  if (error) {
    logger.warn('Service detail query failed', { code: error.code, message: error.message })
    return NextResponse.json(
      { success: false, error: { message: 'Service not found' } },
      { status: 404 }
    )
  }

  return NextResponse.json({ success: true, service })
})

// PATCH - Update a service
export const PATCH = createApiHandler(async ({ request, params }) => {
  // Verify admin with services:write permission
  const authResult = await requirePermission('services', 'write')
  if (!authResult.success || !authResult.admin) {
    return authResult.error!
  }

  const id = params?.id
  if (!id || !isValidUuid(id)) {
    return NextResponse.json(
      { success: false, error: { message: 'Invalid ID' } },
      { status: 400 }
    )
  }

  const supabase = createAdminClient()
  const body = await request.json()
  const result = updateServiceSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json(
      { success: false, error: { message: 'Validation error', details: result.error.flatten() } },
      { status: 400 }
    )
  }

  // Strip HTML tags from text fields before storing
  const sanitizedData = { ...result.data }
  const textFields = ['name', 'description', 'meta_title', 'meta_description'] as const
  for (const field of textFields) {
    if (typeof sanitizedData[field] === 'string') {
      sanitizedData[field] = (sanitizedData[field] as string).replace(/<[^>]*>/g, '').trim()
    }
  }

  const { data, error } = await supabase
    .from('specialties')
    .update({
      ...sanitizedData,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    logger.error('Service update failed', { code: error.code, message: error.message })
    return NextResponse.json(
      { success: false, error: { message: 'Unable to update the service' } },
      { status: 500 }
    )
  }

  // Audit log
  await logAdminAction(authResult.admin.id, 'service.update', 'service', id, result.data)

  return NextResponse.json({
    success: true,
    service: data,
    message: 'Service updated',
  })
})

// DELETE - Delete/deactivate a service
export const DELETE = createApiHandler(async ({ params }) => {
  // Verify admin with services:delete permission
  const authResult = await requirePermission('services', 'delete')
  if (!authResult.success || !authResult.admin) {
    return authResult.error!
  }

  const id = params?.id
  if (!id || !isValidUuid(id)) {
    return NextResponse.json(
      { success: false, error: { message: 'Invalid ID' } },
      { status: 400 }
    )
  }

  const supabase = createAdminClient()

  // Log the deletion
  await logAdminAction(authResult.admin.id, 'service.delete', 'service', id)

  // Soft delete
  const { error } = await supabase
    .from('specialties')
    .update({ is_active: false })
    .eq('id', id)

  if (error) {
    logger.error('Service delete failed', { code: error.code, message: error.message })
    return NextResponse.json(
      { success: false, error: { message: 'Unable to deactivate the service' } },
      { status: 500 }
    )
  }

  return NextResponse.json({
    success: true,
    message: 'Service deactivated',
  })
})
