/**
 * Artisan Assigned Leads API
 * GET: Fetch leads assigned to the authenticated artisan via lead_assignments
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireArtisan } from '@/lib/auth/artisan-guard'
import { logger } from '@/lib/logger'
import { z } from 'zod'

const leadsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
  status: z.string().max(50).default('all'),
})

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { error: guardError, user, supabase } = await requireArtisan()
    if (guardError) return guardError

    // Get provider linked to this user
    const { data: provider } = await supabase
      .from('providers')
      .select('id')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()

    if (!provider) {
      return NextResponse.json(
        { success: false, error: { message: 'Aucun profil artisan trouvé' } },
        { status: 403 }
      )
    }

    // Parse and validate pagination & filter params
    const { searchParams } = request.nextUrl
    const parsed = leadsQuerySchema.safeParse({
      page: searchParams.get('page') ?? undefined,
      pageSize: searchParams.get('pageSize') ?? undefined,
      status: searchParams.get('status') ?? undefined,
    })

    if (!parsed.success) {
      return NextResponse.json({ success: false, error: { message: 'Donnees invalides' } }, { status: 400 })
    }

    const { page, pageSize, status } = parsed.data
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    // Count query (head: true returns only count, no rows)
    let countQuery = supabase
      .from('lead_assignments')
      .select('id', { count: 'exact', head: true })
      .eq('provider_id', provider.id)

    if (status !== 'all') {
      countQuery = countQuery.eq('status', status)
    }

    const { count, error: countError } = await countQuery

    if (countError) {
      logger.error('Error counting leads:', countError)
      return NextResponse.json(
        { success: false, error: { message: 'Erreur lors du comptage des leads' } },
        { status: 500 }
      )
    }

    const totalItems = count ?? 0
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))

    // Data query with pagination
    let dataQuery = supabase
      .from('lead_assignments')
      .select(`
        id,
        status,
        assigned_at,
        viewed_at,
        lead:devis_requests (
          id,
          service_name,
          city,
          postal_code,
          description,
          urgency,
          client_name,
          client_phone,
          created_at,
          status
        )
      `)
      .eq('provider_id', provider.id)
      .order('assigned_at', { ascending: false })
      .range(from, to)

    if (status !== 'all') {
      dataQuery = dataQuery.eq('status', status)
    }

    const { data: assignments, error: assignError } = await dataQuery

    if (assignError) {
      logger.error('Error fetching assigned leads:', assignError)
      return NextResponse.json(
        { success: false, error: { message: 'Erreur lors de la récupération des leads' } },
        { status: 500 }
      )
    }

    return NextResponse.json({
      leads: assignments || [],
      count: totalItems,
      pagination: {
        page,
        pageSize,
        totalPages,
        totalItems,
      },
    })
  } catch (error) {
    logger.error('Artisan leads GET error:', error)
    return NextResponse.json({ success: false, error: { message: 'Erreur serveur' } }, { status: 500 })
  }
}
