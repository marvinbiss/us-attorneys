/**
 * Attorney Assigned Leads API
 * GET: Fetch leads assigned to the authenticated attorney via lead_assignments
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
      .from('attorneys')
      .select('id')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()

    if (!provider) {
      return NextResponse.json(
        { success: false, error: { message: 'No attorney profile found' } },
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
      return NextResponse.json({ success: false, error: { message: 'Invalid data' } }, { status: 400 })
    }

    const { page, pageSize, status } = parsed.data
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    // Count query (head: true returns only count, no rows)
    let countQuery = supabase
      .from('lead_assignments')
      .select('id', { count: 'exact', head: true })
      .eq('attorney_id', provider.id)

    if (status !== 'all') {
      countQuery = countQuery.eq('status', status)
    }

    const { count, error: countError } = await countQuery

    if (countError) {
      logger.error('Error counting leads:', countError)
      return NextResponse.json(
        { success: false, error: { message: 'Error counting leads' } },
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
      .eq('attorney_id', provider.id)
      .order('assigned_at', { ascending: false })
      .range(from, to)

    if (status !== 'all') {
      dataQuery = dataQuery.eq('status', status)
    }

    const { data: assignments, error: assignError } = await dataQuery

    if (assignError) {
      logger.error('Error fetching assigned leads:', assignError)
      return NextResponse.json(
        { success: false, error: { message: 'Error retrieving leads' } },
        { status: 500 }
      )
    }

    // Fetch quotes for these leads so attorney can see sent quote info
    const leadList = assignments || []
    const requestIds = leadList
      .filter((a) => a.lead && a.status === 'quoted')
      .map((a) => (a.lead as unknown as { id: string }).id)

    const quotesMap: Record<string, { id: string; amount: number; description: string; valid_until: string; status: string; created_at: string }> = {}
    if (requestIds.length > 0) {
      const { data: quotes } = await supabase
        .from('quotes')
        .select('id, request_id, amount, description, valid_until, status, created_at')
        .eq('attorney_id', provider.id)
        .in('request_id', requestIds)

      if (quotes) {
        for (const q of quotes) {
          quotesMap[q.request_id] = {
            id: q.id,
            amount: q.amount,
            description: q.description,
            valid_until: q.valid_until,
            status: q.status,
            created_at: q.created_at,
          }
        }
      }
    }

    // Attach quote data to each assignment
    const enrichedLeads = leadList.map((a) => {
      const requestId = a.lead ? (a.lead as unknown as { id: string }).id : null
      const quote = requestId ? quotesMap[requestId] ?? null : null
      return { ...a, quote }
    })

    return NextResponse.json({
      leads: enrichedLeads,
      count: totalItems,
      pagination: {
        page,
        pageSize,
        totalPages,
        totalItems,
      },
    })
  } catch (error) {
    logger.error('Attorney leads GET error:', error)
    return NextResponse.json({ success: false, error: { message: 'Server error' } }, { status: 500 })
  }
}
