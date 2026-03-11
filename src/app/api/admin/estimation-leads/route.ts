/**
 * Admin API — Estimation Leads
 * Liste et gestion des leads capturés par le widget estimation IA
 */

import { NextRequest, NextResponse } from 'next/server'
import { requirePermission } from '@/lib/admin-auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  source: z.enum(['all', 'chat', 'callback']).default('all'),
  search: z.string().optional(),
  metier: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
})

export async function GET(request: NextRequest) {
  const auth = await requirePermission('audit', 'read')
  if (!auth.success || !auth.admin) return auth.error!

  try {
    const { searchParams } = new URL(request.url)
    const parsed = querySchema.safeParse(Object.fromEntries(searchParams))

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Paramètres invalides', details: parsed.error.flatten() },
        { status: 400 },
      )
    }

    const { page, limit, source, search, metier, from, to } = parsed.data
    const offset = (page - 1) * limit
    const supabase = createAdminClient()

    // Build query
    let query = supabase
      .from('estimation_leads')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })

    if (source !== 'all') {
      query = query.eq('source', source)
    }

    if (search) {
      query = query.or(`telephone.ilike.%${search}%,nom.ilike.%${search}%,email.ilike.%${search}%,ville.ilike.%${search}%`)
    }

    if (metier) {
      query = query.ilike('metier', `%${metier}%`)
    }

    if (from) {
      query = query.gte('created_at', from)
    }

    if (to) {
      query = query.lte('created_at', `${to}T23:59:59.999Z`)
    }

    const { data, error, count } = await query.range(offset, offset + limit - 1)

    if (error) {
      return NextResponse.json(
        { error: 'Erreur base de données', details: error.message },
        { status: 500 },
      )
    }

    // Stats query (total, today, by source)
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()

    const [totalRes, todayRes, chatRes, callbackRes] = await Promise.all([
      supabase.from('estimation_leads').select('id', { count: 'exact', head: true }),
      supabase.from('estimation_leads').select('id', { count: 'exact', head: true }).gte('created_at', todayStart),
      supabase.from('estimation_leads').select('id', { count: 'exact', head: true }).eq('source', 'chat'),
      supabase.from('estimation_leads').select('id', { count: 'exact', head: true }).eq('source', 'callback'),
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
  } catch (error) {
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 },
    )
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await requirePermission('audit', 'read')
  if (!auth.success || !auth.admin) return auth.error!

  try {
    const { id } = await request.json()
    if (!id) {
      return NextResponse.json({ error: 'ID requis' }, { status: 400 })
    }

    const supabase = createAdminClient()
    const { error } = await supabase
      .from('estimation_leads')
      .delete()
      .eq('id', id)

    if (error) {
      return NextResponse.json(
        { error: 'Erreur suppression', details: error.message },
        { status: 500 },
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
