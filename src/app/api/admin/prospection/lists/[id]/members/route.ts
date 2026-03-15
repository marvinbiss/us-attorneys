import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requirePermission, logAdminAction } from '@/lib/admin-auth'
import { logger } from '@/lib/logger'
import { isValidUuid } from '@/lib/sanitize'
import { z } from 'zod'

const addMembersSchema = z.object({
  contact_ids: z.array(z.string().uuid()).min(1).max(1000),
})

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requirePermission('prospection', 'read')
    if (!authResult.success) return authResult.error

    const { id } = await params
    if (!isValidUuid(id)) {
      return NextResponse.json(
        { success: false, error: { message: 'Invalid ID' } },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()
    const rawPage = parseInt(request.nextUrl.searchParams.get('page') || '1')
    const rawLimit = parseInt(request.nextUrl.searchParams.get('limit') || '20')
    const page = isNaN(rawPage) || rawPage < 1 ? 1 : rawPage
    const limit = isNaN(rawLimit) || rawLimit < 1 ? 20 : Math.min(rawLimit, 100)
    const offset = (page - 1) * limit

    const { data, count, error } = await supabase
      .from('prospection_list_members')
      .select('*, contact:prospection_contacts(*)', { count: 'exact' })
      .eq('list_id', id)
      .order('added_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      logger.error('List members error', error)
      return NextResponse.json({ success: false, error: { message: 'Error retrieving data' } }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data,
      pagination: { page, pageSize: limit, total: count || 0, totalPages: Math.ceil((count || 0) / limit) },
    })
  } catch (error) {
    logger.error('Members GET error', error as Error)
    return NextResponse.json({ success: false, error: { message: 'Server error' } }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requirePermission('prospection', 'write')
    if (!authResult.success || !authResult.admin) return authResult.error

    const { id } = await params
    if (!isValidUuid(id)) {
      return NextResponse.json(
        { success: false, error: { message: 'Invalid ID' } },
        { status: 400 }
      )
    }

    const body = await request.json()
    const parsed = addMembersSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: { message: 'Invalid data', details: parsed.error.flatten() } },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()
    const members = parsed.data.contact_ids.map(contact_id => ({
      list_id: id,
      contact_id,
    }))

    const { error } = await supabase
      .from('prospection_list_members')
      .upsert(members, { onConflict: 'list_id,contact_id' })

    if (error) {
      logger.error('Add members error', error)
      return NextResponse.json({ success: false, error: { message: 'Error during creation' } }, { status: 500 })
    }

    await logAdminAction(authResult.admin.id, 'list.add_members', 'prospection_list', id, {
      member_count: members.length,
    })

    return NextResponse.json({ success: true, data: { added: members.length } })
  } catch (error) {
    logger.error('Members POST error', error as Error)
    return NextResponse.json({ success: false, error: { message: 'Server error' } }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requirePermission('prospection', 'write')
    if (!authResult.success || !authResult.admin) return authResult.error

    const { id } = await params
    if (!isValidUuid(id)) {
      return NextResponse.json(
        { success: false, error: { message: 'Invalid ID' } },
        { status: 400 }
      )
    }

    const body = await request.json()

    const bodySchema = z.object({
      contact_ids: z.array(z.string().uuid()).min(1).max(1000),
    })
    const parsed = bodySchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: { message: 'Invalid data', details: parsed.error.flatten() } },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()
    const { error } = await supabase
      .from('prospection_list_members')
      .delete()
      .eq('list_id', id)
      .in('contact_id', parsed.data.contact_ids)

    if (error) {
      logger.error('Remove members error', error)
      return NextResponse.json({ success: false, error: { message: 'Error during deletion' } }, { status: 500 })
    }

    await logAdminAction(authResult.admin.id, 'list.remove_members', 'prospection_list', id, {
      member_count: parsed.data.contact_ids.length,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('Members DELETE error', error as Error)
    return NextResponse.json({ success: false, error: { message: 'Server error' } }, { status: 500 })
  }
}
