import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requirePermission, logAdminAction } from '@/lib/admin-auth'
import { logger } from '@/lib/logger'
import { isValidUuid } from '@/lib/sanitize'
import { z } from 'zod'

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
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify admin with services:read permission
    const authResult = await requirePermission('services', 'read')
    if (!authResult.success || !authResult.admin) {
      return authResult.error
    }

    if (!isValidUuid(params.id)) {
      return NextResponse.json(
        { success: false, error: { message: 'Invalid ID' } },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    const { data: service, error } = await supabase
      .from('specialties')
      .select('id, name, slug, description, icon, category, is_active, sort_order, created_at')
      .eq('id', params.id)
      .single()

    if (error) {
      logger.warn('Service detail query failed', { code: error.code, message: error.message })
      return NextResponse.json(
        { success: false, error: { message: 'Service not found' } },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, service })
  } catch (error) {
    logger.error('Admin service details error', error)
    return NextResponse.json(
      { success: false, error: { message: 'Server error' } },
      { status: 500 }
    )
  }
}

// PATCH - Update a service
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify admin with services:write permission
    const authResult = await requirePermission('services', 'write')
    if (!authResult.success || !authResult.admin) {
      return authResult.error
    }

    if (!isValidUuid(params.id)) {
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
      .eq('id', params.id)
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
    await logAdminAction(authResult.admin.id, 'service.update', 'service', params.id, result.data)

    return NextResponse.json({
      success: true,
      service: data,
      message: 'Service updated',
    })
  } catch (error) {
    logger.error('Admin service update error', error)
    return NextResponse.json(
      { success: false, error: { message: 'Server error' } },
      { status: 500 }
    )
  }
}

// DELETE - Delete/deactivate a service
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify admin with services:delete permission
    const authResult = await requirePermission('services', 'delete')
    if (!authResult.success || !authResult.admin) {
      return authResult.error
    }

    if (!isValidUuid(params.id)) {
      return NextResponse.json(
        { success: false, error: { message: 'Invalid ID' } },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    // Log the deletion
    await logAdminAction(authResult.admin.id, 'service.delete', 'service', params.id)

    // Soft delete
    const { error } = await supabase
      .from('specialties')
      .update({ is_active: false })
      .eq('id', params.id)

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
  } catch (error) {
    logger.error('Admin service delete error', error)
    return NextResponse.json(
      { success: false, error: { message: 'Server error' } },
      { status: 500 }
    )
  }
}
