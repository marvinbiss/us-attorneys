import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requirePermission, logAdminAction } from '@/lib/admin-auth'
import { logger } from '@/lib/logger'
import { z } from 'zod'

// GET query params schema
const usersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  filter: z.enum(['all', 'clients', 'artisans', 'banned']).optional().default('all'),
  plan: z.enum(['all', 'free', 'pro', 'premium']).optional().default('all'),
  search: z.string().max(100).optional().default(''),
})

// POST request schema
const createUserSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(8).max(100),
  full_name: z.string().max(100).optional(),
  phone: z.string().max(20).optional(),
  user_type: z.enum(['client', 'attorney']).optional().default('client'),
})

export const dynamic = 'force-dynamic'

// GET - Liste des utilisateurs avec filtres et pagination
export async function GET(request: NextRequest) {
  try {
    // Verify admin with users:read permission
    const authResult = await requirePermission('users', 'read')
    if (!authResult.success || !authResult.admin) {
      return authResult.error
    }

    const supabase = createAdminClient()

    const searchParams = request.nextUrl.searchParams
    const queryParams = {
      page: searchParams.get('page') || '1',
      limit: searchParams.get('limit') || '20',
      filter: searchParams.get('filter') || 'all',
      plan: searchParams.get('plan') || 'all',
      search: searchParams.get('search') || '',
    }
    const result = usersQuerySchema.safeParse(queryParams)
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: { message: 'Invalid parameters', details: result.error.flatten() } },
        { status: 400 }
      )
    }
    const { page, limit, filter, plan, search } = result.data

    // NOTE: Supabase Auth does not support server-side filtering by user_metadata (type, plan, etc.).
    // We paginate the Auth list using the query params, then apply filters in application code.
    // perPage is capped at 100 to avoid oversized responses; clients must page through results.
    const authPage = parseInt(searchParams.get('page') || '1', 10)
    const authPerPage = Math.min(parseInt(searchParams.get('perPage') || '50', 10), 100)
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers({
      page: authPage,
      perPage: authPerPage,
    })

    if (authError) {
      logger.warn('Auth users list failed', { message: authError.message })
      return NextResponse.json(
        { success: false, error: { message: 'Error retrieving users' } },
        { status: 502 }
      )
    }

    // Fetch profiles for ALL returned users so type filters operate on the full set
    const profilesMap = new Map<string, Record<string, unknown>>()
    try {
      const userIds = authUsers.users.map(u => u.id)
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, email, full_name, is_admin, role, phone_e164, average_rating, review_count')
          .in('id', userIds)

        if (profiles) {
          profiles.forEach(p => profilesMap.set(p.id, p))
        }
      }
    } catch {
      // profiles table doesn't exist, continue without it
    }

    // Transform ALL users first
    let users = authUsers.users.map(user => {
      const profile = profilesMap.get(user.id) || {}
      return {
        id: user.id,
        email: user.email || '',
        full_name: (profile.full_name as string) || user.user_metadata?.full_name || user.user_metadata?.name || null,
        phone: (profile.phone_e164 as string) || user.user_metadata?.phone || null,
        user_type: Boolean(user.user_metadata?.is_artisan) ? 'attorney' : 'client',
        is_verified: !!user.email_confirmed_at,
        is_banned: user.banned_until !== null,
        subscription_plan: 'free',
        subscription_status: null,
        average_rating: (profile.average_rating as number) || 0,
        review_count: (profile.review_count as number) || 0,
        created_at: user.created_at,
        last_sign_in_at: user.last_sign_in_at,
      }
    })

    // Apply type/ban filter BEFORE pagination so counts are accurate
    if (filter === 'clients') {
      users = users.filter(u => u.user_type === 'client')
    } else if (filter === 'artisans') {
      users = users.filter(u => u.user_type === 'attorney')
    } else if (filter === 'banned') {
      users = users.filter(u => u.is_banned)
    }

    // Apply plan filter
    if (plan !== 'all') {
      users = users.filter(u => u.subscription_plan === plan)
    }

    // Apply search
    if (search) {
      const searchLower = search.toLowerCase()
      users = users.filter(u =>
        u.email.toLowerCase().includes(searchLower) ||
        (u.full_name && u.full_name.toLowerCase().includes(searchLower)) ||
        (u.phone && u.phone.includes(search))
      )
    }

    const total = users.length

    // Apply pagination AFTER all filters
    const offset = (page - 1) * limit
    const paginatedUsers = users.slice(offset, offset + limit)

    return NextResponse.json({
      success: true,
      users: paginatedUsers,
      total,
      page,
      perPage: limit,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    logger.error('Admin users list error', error)
    return NextResponse.json(
      { success: false, error: { message: 'Server error' } },
      { status: 500 }
    )
  }
}

// POST - Create a new user (admin only)
export async function POST(request: NextRequest) {
  try {
    // Verify admin with users:write permission
    const authResult = await requirePermission('users', 'write')
    if (!authResult.success || !authResult.admin) {
      return authResult.error
    }

    const supabase = createAdminClient()

    const body = await request.json()
    const result = createUserSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: { message: 'Validation error', details: result.error.flatten() } },
        { status: 400 }
      )
    }
    const { email, full_name, phone, user_type, password } = result.data

    // Create user with Supabase Auth Admin
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name,
        phone,
        is_artisan: user_type === 'attorney',
      },
    })

    if (authError) {
      logger.error('Auth creation error', authError)
      return NextResponse.json(
        { success: false, error: { message: authError.message } },
        { status: 400 }
      )
    }

    // Try to create/update profile if table exists
    if (authData.user) {
      try {
        await supabase
          .from('profiles')
          .upsert({
            id: authData.user.id,
            email,
            full_name,
            role: user_type === 'attorney' ? 'attorney' : 'client',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
      } catch {
        // profiles table doesn't exist, that's OK
      }
    }

    // Audit log
    if (authData.user) {
      await logAdminAction(authResult.admin.id, 'user.create', 'user', authData.user.id, { email, user_type })
    }

    return NextResponse.json({
      success: true,
      user: authData.user,
      message: 'User created successfully',
    })
  } catch (error) {
    logger.error('Admin user creation error', error)
    return NextResponse.json(
      { success: false, error: { message: 'Server error' } },
      { status: 500 }
    )
  }
}
