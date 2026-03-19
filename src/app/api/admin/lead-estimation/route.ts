/**
 * Admin API — Estimation Leads
 * List and management of leads captured by the AI estimation widget
 */

import { NextResponse } from 'next/server'
import { requirePermission } from '@/lib/admin-auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { z } from 'zod'
import { createApiHandler } from '@/lib/api/handler'

export const dynamic = 'force-dynamic'

const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  source: z.enum(['all', 'chat', 'callback']).default('all'),
  search: z.string().optional(),
  specialty: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
})

export const GET = createApiHandler(async ({ request }) => {
  const auth = await requirePermission('audit', 'read')
  if (!auth.success || !auth.admin) return auth.error as NextResponse

  const { searchParams } = new URL(request.url)
  const parsed = querySchema.safeParse(Object.fromEntries(searchParams))

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid parameters', details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const { page, limit, source, search, specialty, from, to } = parsed.data
  const offset = (page - 1) * limit
  const supabase = createAdminClient()

  let query = supabase
    .from('estimation_leads')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })

  if (source !== 'all') {
    query = query.eq('source', source)
  }

  if (search) {
    query = query.or(
      `phone.ilike.%${search}%,name.ilike.%${search}%,email.ilike.%${search}%,city.ilike.%${search}%`
    )
  }

  if (specialty) {
    query = query.ilike('specialty', `%${specialty}%`)
  }

  if (from) {
    query = query.gte('created_at', from)
  }

  if (to) {
    query = query.lte('created_at', `${to}T23:59:59.999Z`)
  }

  const { data, error, count } = await query.range(offset, offset + limit - 1)

  if (error) {
    return NextResponse.json({ error: 'Database error', details: error.message }, { status: 500 })
  }

  // Stats query (total, today, by source)
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()

  const [totalRes, todayRes, chatRes, callbackRes] = await Promise.all([
    supabase.from('estimation_leads').select('id', { count: 'exact', head: true }),
    supabase
      .from('estimation_leads')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', todayStart),
    supabase
      .from('estimation_leads')
      .select('id', { count: 'exact', head: true })
      .eq('source', 'chat'),
    supabase
      .from('estimation_leads')
      .select('id', { count: 'exact', head: true })
      .eq('source', 'callback'),
  ])

  return NextResponse.json({
    success: true,
    data: data ?? [],
    pagination: {
      page,
      limit,
      total: count ?? 0,
      totalPages: Math.ceil((count ?? 0) / limit),
    },
    stats: {
      total: totalRes.count ?? 0,
      today: todayRes.count ?? 0,
      chat: chatRes.count ?? 0,
      callback: callbackRes.count ?? 0,
    },
  })
})

export const DELETE = createApiHandler(async ({ request }) => {
  const auth = await requirePermission('audit', 'read')
  if (!auth.success || !auth.admin) return auth.error as NextResponse

  const { id } = await request.json()
  if (!id) {
    return NextResponse.json({ error: 'ID required' }, { status: 400 })
  }

  const supabase = createAdminClient()
  const { error } = await supabase.from('estimation_leads').delete().eq('id', id)

  if (error) {
    return NextResponse.json({ error: 'Deletion error', details: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
})
