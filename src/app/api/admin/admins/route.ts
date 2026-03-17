import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { type AdminRole } from '@/types/admin'
import { requirePermission, logAdminAction } from '@/lib/admin-auth'
import { logger } from '@/lib/logger'
import { createApiHandler } from '@/lib/api/handler'
import { z } from 'zod'

// GET query params schema
const adminsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
})

// POST request schema
const createAdminSchema = z.object({
  user_id: z.string().uuid(),
  role: z.enum(['super_admin', 'admin', 'moderator', 'viewer']),
})

export const dynamic = 'force-dynamic'

export const GET = createApiHandler(async ({ request }) => {
  const authResult = await requirePermission('settings', 'read')
  if (!authResult.success || !authResult.admin) {
    return authResult.error!
  }

  if (authResult.admin.role !== 'super_admin') {
    return NextResponse.json(
      { success: false, error: { code: 'FORBIDDEN', message: 'Reserved for super admins' } },
      { status: 403 }
    )
  }

  const supabase = createAdminClient()

  const { searchParams } = new URL(request.url)
  const queryParams = {
    page: searchParams.get('page') || '1',
    limit: searchParams.get('limit') || '20',
  }
  const result = adminsQuerySchema.safeParse(queryParams)
  if (!result.success) {
    return NextResponse.json(
      { success: false, error: { message: 'Invalid parameters', details: result.error.flatten() } },
      { status: 400 }
    )
  }
  const { page, limit } = result.data
  const offset = (page - 1) * limit

  // Fetch admins from profiles table (admin_roles table does not exist)
  const { data: profiles, error, count } = await supabase
    .from('profiles')
    .select('id, email, full_name, role, is_admin, created_at', { count: 'exact' })
    .or('is_admin.eq.true,role.in.(super_admin,admin,moderator,viewer)')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) {
    logger.warn('Profiles admin query failed', { code: error.code, message: error.message })
    return NextResponse.json({
      admins: [],
      total: 0,
      totalPages: 0,
      page,
    })
  }

  const admins = (profiles || []).map(p => ({
    id: p.id,
    email: p.email || '',
    full_name: p.full_name || null,
    role: p.role as AdminRole | null,
    is_admin: p.is_admin,
    created_at: p.created_at,
  }))

  return NextResponse.json({
    admins,
    total: count || 0,
    totalPages: Math.ceil((count || 0) / limit),
    page,
  })
})

export const POST = createApiHandler(async ({ request }) => {
  const authResult = await requirePermission('settings', 'write')
  if (!authResult.success || !authResult.admin) {
    return authResult.error!
  }

  if (authResult.admin.role !== 'super_admin') {
    return NextResponse.json(
      { success: false, error: { code: 'FORBIDDEN', message: 'Only super admins can add administrators' } },
      { status: 403 }
    )
  }

  const supabase = createAdminClient()

  const body = await request.json()
  const result = createAdminSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json(
      { success: false, error: { message: 'Validation error', details: result.error.flatten() } },
      { status: 400 }
    )
  }
  const { user_id, role } = result.data

  // Promote user to admin role via profiles table
  const { data: updatedProfile, error } = await supabase
    .from('profiles')
    .update({ role: role, is_admin: true, updated_at: new Date().toISOString() })
    .eq('id', user_id)
    .select('id, email, full_name, role, is_admin, created_at')
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return NextResponse.json(
        { success: false, error: { message: 'No user found with this ID' } },
        { status: 404 }
      )
    }
    logger.error('Error promoting user to admin', error)
    return NextResponse.json({ success: false, error: { message: 'Error creating administrator' } }, { status: 500 })
  }

  await logAdminAction(authResult.admin.id, 'admin_created', 'settings', updatedProfile.id, { role })

  return NextResponse.json({
    admin: {
      id: updatedProfile.id,
      email: updatedProfile.email || '',
      full_name: updatedProfile.full_name || null,
      role: updatedProfile.role as AdminRole | null,
      is_admin: updatedProfile.is_admin,
      created_at: updatedProfile.created_at,
    },
  })
})
