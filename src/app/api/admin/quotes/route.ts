import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requirePermission } from '@/lib/admin-auth'
import { sanitizeSearchQuery } from '@/lib/sanitize'
import { logger } from '@/lib/logger'
import { z } from 'zod'

// GET query params schema
const quotesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  status: z.enum(['all', 'pending', 'sent', 'accepted', 'refused', 'completed']).optional().default('all'),
  search: z.string().max(100).optional().default(''),
})

export const dynamic = 'force-dynamic'

// GET - Liste des demandes de devis (devis_requests)
export async function GET(request: NextRequest) {
  try {
    // Verify admin with services:read permission
    const authResult = await requirePermission('services', 'read')
    if (!authResult.success || !authResult.admin) {
      return authResult.error
    }

    const supabase = createAdminClient()

    const searchParams = request.nextUrl.searchParams
    const queryParams = {
      page: searchParams.get('page') || '1',
      limit: searchParams.get('limit') || '20',
      status: searchParams.get('status') || 'all',
      search: searchParams.get('search') || '',
    }
    const result = quotesQuerySchema.safeParse(queryParams)
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: { message: 'Paramètres invalides', details: result.error.flatten() } },
        { status: 400 }
      )
    }
    const { page, limit, status, search } = result.data

    const offset = (page - 1) * limit

    let query = supabase
      .from('devis_requests')
      .select(
        'id, client_id, service_name, postal_code, city, description, budget, urgency, client_name, client_email, client_phone, status, created_at',
        { count: 'exact' }
      )

    // Filtre par statut — valeurs CHECK: pending/sent/accepted/refused/completed
    if (status !== 'all') {
      query = query.eq('status', status)
    }

    // Recherche sur service_name, description, client_name, client_email ou postal_code
    if (search) {
      const sanitized = sanitizeSearchQuery(search)
      if (sanitized) {
        query = query.or(
          `service_name.ilike.%${sanitized}%,description.ilike.%${sanitized}%,client_name.ilike.%${sanitized}%,client_email.ilike.%${sanitized}%,postal_code.ilike.%${sanitized}%,city.ilike.%${sanitized}%`
        )
      }
    }

    const { data: demandes, count, error } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      logger.warn('Devis requests query failed, returning empty list', { code: error.code, message: error.message })
      return NextResponse.json({
        success: true,
        demandes: [],
        total: 0,
        page,
        totalPages: 0,
      })
    }

    return NextResponse.json({
      success: true,
      demandes: demandes || [],
      total: count || 0,
      page,
      totalPages: Math.ceil((count || 0) / limit),
    })
  } catch (error) {
    logger.error('Admin devis requests list error', error)
    return NextResponse.json(
      { success: false, error: { message: 'Erreur serveur' } },
      { status: 500 }
    )
  }
}
