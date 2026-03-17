import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { logAdminAction } from '@/lib/admin-auth'
import { createApiHandler } from '@/lib/api/handler'
import { logger } from '@/lib/logger'
import { isValidUuid } from '@/lib/sanitize'
import { z } from 'zod'

const updateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional(),
  list_type: z.enum(['static', 'dynamic']).optional(),
  filter_criteria: z.record(z.string(), z.unknown()).optional(),
}).strict()

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

  const { data, error } = await supabase
    .from('prospection_lists')
    .select('id, name, description, list_type, filter_criteria, contact_count, created_by, created_at, updated_at')
    .eq('id', id)
    .single()

  if (error || !data) {
    return NextResponse.json({ success: false, error: { message: 'List not found' } }, { status: 404 })
  }

  return NextResponse.json({ success: true, data })
}, { requireAdmin: true })

export const PATCH = createApiHandler(async (ctx) => {
  const id = ctx.params?.id
  if (!id || !isValidUuid(id)) {
    return NextResponse.json(
      { success: false, error: { message: 'Invalid ID' } },
      { status: 400 }
    )
  }

  const body = ctx.body

  // Strip HTML tags from text fields before storing
  const sanitizedData = { ...body }
  if (sanitizedData.name) sanitizedData.name = sanitizedData.name.replace(/<[^>]*>/g, '').trim()
  if (sanitizedData.description) sanitizedData.description = sanitizedData.description.replace(/<[^>]*>/g, '').trim()

  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('prospection_lists')
    .update(sanitizedData)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return NextResponse.json({ success: false, error: { message: 'Resource not found' } }, { status: 404 })
    }
    logger.error('Update list error', error)
    return NextResponse.json({ success: false, error: { message: 'Error during update' } }, { status: 500 })
  }
  if (!data) {
    return NextResponse.json({ success: false, error: { message: 'Resource not found' } }, { status: 404 })
  }

  await logAdminAction(ctx.user!.id, 'list.update', 'prospection_list', id, {
    updated_fields: Object.keys(body),
  })

  return NextResponse.json({ success: true, data })
}, { requireAdmin: true, bodySchema: updateSchema })

export const DELETE = createApiHandler(async (ctx) => {
  const id = ctx.params?.id
  if (!id || !isValidUuid(id)) {
    return NextResponse.json(
      { success: false, error: { message: 'Invalid ID' } },
      { status: 400 }
    )
  }

  const supabase = createAdminClient()

  const { error } = await supabase
    .from('prospection_lists')
    .delete()
    .eq('id', id)

  if (error) {
    logger.error('Delete list error', error)
    return NextResponse.json({ success: false, error: { message: 'Error during deletion' } }, { status: 500 })
  }

  await logAdminAction(ctx.user!.id, 'list.delete', 'prospection_list', id)

  return NextResponse.json({ success: true })
}, { requireAdmin: true })
