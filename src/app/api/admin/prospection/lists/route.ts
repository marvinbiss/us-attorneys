import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requirePermission, logAdminAction } from '@/lib/admin-auth'
import { logger } from '@/lib/logger'
import { z } from 'zod'

const createSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  list_type: z.enum(['static', 'dynamic']).optional().default('static'),
  filter_criteria: z.record(z.string(), z.unknown()).optional(),
})

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const authResult = await requirePermission('prospection', 'read')
    if (!authResult.success) return authResult.error

    const supabase = createAdminClient()
    const page = Math.max(parseInt(request.nextUrl.searchParams.get('page') || '1') || 1, 1)
    const limit = Math.min(Math.max(parseInt(request.nextUrl.searchParams.get('limit') || '50') || 50, 1), 100)
    const offset = (page - 1) * limit

    const { data, count, error } = await supabase
      .from('prospection_lists')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      logger.error('List lists error', error)
      return NextResponse.json({ success: false, error: { message: 'Error retrieving data' } }, { status: 500 })
    }

    return NextResponse.json({ success: true, data, pagination: { page, limit, total: count || 0 } })
  } catch (error) {
    logger.error('Lists GET error', error as Error)
    return NextResponse.json({ success: false, error: { message: 'Server error' } }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requirePermission('prospection', 'write')
    if (!authResult.success || !authResult.admin) return authResult.error

    const supabase = createAdminClient()
    const body = await request.json()
    const parsed = createSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: { message: 'Invalid data', details: parsed.error.flatten() } },
        { status: 400 }
      )
    }

    // Strip HTML tags from text fields before storing
    const sanitizedData = { ...parsed.data }
    if (sanitizedData.name) sanitizedData.name = sanitizedData.name.replace(/<[^>]*>/g, '').trim()
    if (sanitizedData.description) sanitizedData.description = sanitizedData.description.replace(/<[^>]*>/g, '').trim()

    const { data, error } = await supabase
      .from('prospection_lists')
      .insert({ ...sanitizedData, created_by: authResult.admin.id })
      .select()
      .single()

    if (error) {
      logger.error('Create list error', error)
      return NextResponse.json({ success: false, error: { message: 'Error during creation' } }, { status: 500 })
    }

    await logAdminAction(authResult.admin.id, 'list.create', 'prospection_list', data.id, {
      name: sanitizedData.name,
      list_type: sanitizedData.list_type,
    })

    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (error) {
    logger.error('Lists POST error', error as Error)
    return NextResponse.json({ success: false, error: { message: 'Server error' } }, { status: 500 })
  }
}
