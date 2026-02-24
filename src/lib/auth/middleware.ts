/**
 * Authentication Middleware - ServicesArtisans
 * Proper auth checks for protected routes
 */

import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

export type UserRole = 'client' | 'artisan' | 'admin'

export interface AuthenticatedUser {
  id: string
  email: string
  role: UserRole
}

export interface AuthResult {
  success: boolean
  user?: AuthenticatedUser
  error?: string
}

/**
 * Verify authentication from request headers
 */
export async function verifyAuth(request: NextRequest): Promise<AuthResult> {
  try {
    const authHeader = request.headers.get('authorization')

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { success: false, error: 'Missing or invalid authorization header' }
    }

    const token = authHeader.replace('Bearer ', '')

    if (!supabaseUrl || !supabaseServiceKey) {
      logger.error('Supabase configuration missing')
      return { success: false, error: 'Server configuration error' }
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { data: { user }, error } = await supabase.auth.getUser(token)

    if (error || !user) {
      return { success: false, error: 'Invalid or expired token' }
    }

    // Get user role from metadata or profiles table
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const role = (profile?.role as UserRole) || 'client'

    return {
      success: true,
      user: {
        id: user.id,
        email: user.email || '',
        role,
      },
    }
  } catch (error) {
    logger.error('Auth verification error', error as Error)
    return { success: false, error: 'Authentication failed' }
  }
}

/**
 * Require specific role for access
 */
export async function requireRole(
  request: NextRequest,
  allowedRoles: UserRole[]
): Promise<{ user: AuthenticatedUser } | NextResponse> {
  const authResult = await verifyAuth(request)

  if (!authResult.success || !authResult.user) {
    return NextResponse.json(
      { error: authResult.error || 'Unauthorized' },
      { status: 401 }
    )
  }

  if (!allowedRoles.includes(authResult.user.role)) {
    return NextResponse.json(
      { error: 'Insufficient permissions' },
      { status: 403 }
    )
  }

  return { user: authResult.user }
}

/**
 * Require admin role
 */
export async function requireAdmin(request: NextRequest) {
  return requireRole(request, ['admin'])
}

/**
 * Require artisan or admin role
 */
export async function requireArtisan(request: NextRequest) {
  return requireRole(request, ['artisan', 'admin'])
}

/**
 * Require authenticated user (any role)
 */
export async function requireAuth(request: NextRequest) {
  return requireRole(request, ['client', 'artisan', 'admin'])
}
