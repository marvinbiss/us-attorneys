import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requirePermission, logAdminAction } from '@/lib/admin-auth'
import { logger } from '@/lib/logger'
import { z } from 'zod'

const querySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  type: z.enum(['all', 'artisan', 'client', 'mairie']).optional().default('all'),
  search: z.string().max(200).optional().default(''),
  department: z.string().max(10).optional(),
  tags: z.string().optional(),
  consent: z.enum(['all', 'opted_in', 'opted_out']).optional().default('all'),
})

const createSchema = z.object({
  contact_type: z.enum(['artisan', 'client', 'mairie']),
  contact_name: z.string().max(200).optional(),
  company_name: z.string().max(200).optional(),
  email: z.string().email().max(255).optional(),
  phone: z.string().max(20).optional(),
  address: z.string().max(500).optional(),
  postal_code: z.string().max(10).optional(),
  city: z.string().max(100).optional(),
  department: z.string().max(10).optional(),
  region: z.string().max(100).optional(),
  location_code: z.string().max(10).optional(),
  tags: z.array(z.string()).optional(),
})

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const authResult = await requirePermission('prospection', 'read')
    if (!authResult.success) return authResult.error

    const supabase = createAdminClient()
    const params = Object.fromEntries(request.nextUrl.searchParams)
    const parsed = querySchema.safeParse(params)

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: { message: 'Invalid parameters', details: parsed.error.flatten() } },
        { status: 400 }
      )
    }

    const { page, limit, type, search, department, tags, consent } = parsed.data
    const offset = (page - 1) * limit

    let query = supabase
      .from('prospection_contacts')
      .select('*', { count: 'exact' })
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (type !== 'all') query = query.eq('contact_type', type)
    if (department) query = query.eq('department', department)
    if (consent !== 'all') query = query.eq('consent_status', consent)
    if (tags) query = query.overlaps('tags', tags.split(','))
    if (search) {
      const escaped = search.replace(/%/g, '\\%').replace(/_/g, '\\_')
      query = query.or(`contact_name.ilike.%${escaped}%,company_name.ilike.%${escaped}%,email.ilike.%${escaped}%,city.ilike.%${escaped}%`)
    }

    const { data, count, error } = await query

    if (error) {
      logger.error('Prospection contacts list error', error)
      return NextResponse.json({ success: false, error: { message: 'Error retrieving data' } }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data,
      pagination: {
        page,
        pageSize: limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    })
  } catch (error) {
    logger.error('Prospection contacts GET error', error as Error)
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

    if (!parsed.data.email && !parsed.data.phone) {
      return NextResponse.json(
        { success: false, error: { message: 'Email or phone required' } },
        { status: 400 }
      )
    }

    // Strip HTML tags from text fields before storing
    const sanitizedData = { ...parsed.data }
    const textFields = ['contact_name', 'company_name', 'address', 'city', 'region'] as const
    for (const field of textFields) {
      if (typeof sanitizedData[field] === 'string') {
        sanitizedData[field] = (sanitizedData[field] as string).replace(/<[^>]*>/g, '').trim()
      }
    }

    const { data, error } = await supabase
      .from('prospection_contacts')
      .insert({ ...sanitizedData, source: 'manual' })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json(
          { success: false, error: { message: 'Contact already exists (duplicate email or phone)' } },
          { status: 409 }
        )
      }
      logger.error('Create contact error', error)
      return NextResponse.json({ success: false, error: { message: 'Error during creation' } }, { status: 500 })
    }

    await logAdminAction(authResult.admin.id, 'contact.create', 'prospection_contact', data.id, {
      contact_type: sanitizedData.contact_type,
      email: sanitizedData.email,
      contact_name: sanitizedData.contact_name,
    })

    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (error) {
    logger.error('Prospection contacts POST error', error as Error)
    return NextResponse.json({ success: false, error: { message: 'Server error' } }, { status: 500 })
  }
}
