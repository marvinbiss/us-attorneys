import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { logAdminAction } from '@/lib/admin-auth'
import { createApiHandler } from '@/lib/api/handler'
import { logger } from '@/lib/logger'
import { isValidUuid } from '@/lib/sanitize'
import { z } from 'zod'

const addMembersSchema = z.object({
  contact_ids: z.array(z.string().uuid()).min(1).max(1000),
})

const removeMembersSchema = z.object({
  contact_ids: z.array(z.string().uuid()).min(1).max(1000),
})

export const dynamic = 'force-dynamic'

export const GET = createApiHandler(async (ctx) => {
  const id = ctx.params?.id
  if (!id || !isValidUuid(id)) {
    return NextResponse.json(
      { success: false, error: { message: 'Invalid ID' } },
      { status: 400 }
    )
  }

  const supabase = createAdminClient()
  const rawPage = parseInt(ctx.request.nextUrl.searchParams.get('page') || '1')
  const rawLimit = parseInt(ctx.request.nextUrl.searchParams.get('limit') || '20')
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
}, { requireAdmin: true })

export const POST = createApiHandler(async (ctx) => {
  const id = ctx.params?.id
  if (!id || !isValidUuid(id)) {
    return NextResponse.json(
      { success: false, error: { message: 'Invalid ID' } },
      { status: 400 }
    )
  }

  const body = ctx.body

  const supabase = createAdminClient()
  const members = body.contact_ids.map((contact_id: string) => ({
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

  await logAdminAction(ctx.user!.id, 'list.add_members', 'prospection_list', id, {
    member_count: members.length,
  })

  return NextResponse.json({ success: true, data: { added: members.length } })
}, { requireAdmin: true, bodySchema: addMembersSchema })

export const DELETE = createApiHandler(async (ctx) => {
  const id = ctx.params?.id
  if (!id || !isValidUuid(id)) {
    return NextResponse.json(
      { success: false, error: { message: 'Invalid ID' } },
      { status: 400 }
    )
  }

  // Parse body manually since DELETE with bodySchema would try to parse before we validate params
  const rawBody = await ctx.request.json()
  const parsed = removeMembersSchema.safeParse(rawBody)

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

  await logAdminAction(ctx.user!.id, 'list.remove_members', 'prospection_list', id, {
    member_count: parsed.data.contact_ids.length,
  })

  return NextResponse.json({ success: true })
}, { requireAdmin: true })
