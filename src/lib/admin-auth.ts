/**
 * Admin Authentication Utility - US Attorneys
 * Ensures only admin users can access admin endpoints
 */

import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/logger'
import { type AdminRole, type AdminPermissions, DEFAULT_PERMISSIONS } from '@/types/admin'

// Re-export types so existing imports from '@/lib/admin-auth' continue to work
export type { AdminRole, AdminPermissions } from '@/types/admin'
export { DEFAULT_PERMISSIONS } from '@/types/admin'

// Admin email whitelist from environment variable (fallback when profiles table doesn't exist)
// Set ADMIN_EMAILS in .env.local as comma-separated list: admin1@example.com,admin2@example.com
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '').split(',').filter(email => email.trim().length > 0)

/** Lightweight admin user for auth results (subset of full AdminUser from types/admin) */
export interface AdminUser {
  id: string
  email: string
  role: AdminRole
  permissions: AdminPermissions
}

export interface AdminAuthResult {
  success: boolean
  admin?: AdminUser
  error?: NextResponse
}

/**
 * Validate request origin for CSRF protection.
 * Returns true if the origin matches the expected domain, or if no origin header is present.
 * Returns false if the origin is present but doesn't match.
 */
export function validateOrigin(request: NextRequest): boolean {
  const origin = request.headers.get('origin') || request.headers.get('referer')
  const secFetchSite = request.headers.get('sec-fetch-site')

  // Block cross-site requests identified by Sec-Fetch-Site header
  if (secFetchSite === 'cross-site') {
    return false
  }

  // If no origin header, allow (same-origin browser requests, API clients, curl)
  if (!origin) {
    return true
  }

  const allowedUrls = [
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.NEXTAUTH_URL,
  ].filter(Boolean) as string[]

  // If no allowed URLs are configured, allow all (development mode)
  if (allowedUrls.length === 0) {
    return true
  }

  // Compare origin against allowed URLs
  try {
    const originHost = new URL(origin).origin
    return allowedUrls.some(url => {
      try {
        return new URL(url).origin === originHost
      } catch {
        return false
      }
    })
  } catch {
    // Malformed origin header — reject
    return false
  }
}

/**
 * Validate CSRF using headers() from next/headers (no request object needed).
 * Used internally by requirePermission() so all admin routes are protected.
 */
async function validateCsrf(): Promise<NextResponse | null> {
  try {
    const headersList = await headers()
    const origin = headersList.get('origin') || headersList.get('referer')
    const secFetchSite = headersList.get('sec-fetch-site')

    // Block cross-site requests identified by Sec-Fetch-Site header
    if (secFetchSite === 'cross-site') {
      logger.warn('CSRF blocked: cross-site request detected via Sec-Fetch-Site')
      return NextResponse.json(
        { success: false, error: { code: 'CSRF_REJECTED', message: 'Request origin not authorized' } },
        { status: 403 }
      )
    }

    // If no origin header, allow (same-origin browser requests, API clients, curl)
    if (!origin) {
      return null
    }

    const allowedUrls = [
      process.env.NEXT_PUBLIC_SITE_URL,
      process.env.NEXTAUTH_URL,
    ].filter(Boolean) as string[]

    // If no allowed URLs are configured, allow all (development mode)
    if (allowedUrls.length === 0) {
      return null
    }

    // Compare origin against allowed URLs
    let originHost: string
    try {
      originHost = new URL(origin).origin
    } catch {
      logger.warn('CSRF blocked: malformed origin header', { origin })
      return NextResponse.json(
        { success: false, error: { code: 'CSRF_REJECTED', message: 'Request origin not authorized' } },
        { status: 403 }
      )
    }

    const isAllowed = allowedUrls.some(url => {
      try {
        return new URL(url).origin === originHost
      } catch {
        return false
      }
    })

    if (!isAllowed) {
      logger.warn('CSRF blocked: origin mismatch', { origin: originHost, allowed: allowedUrls })
      return NextResponse.json(
        { success: false, error: { code: 'CSRF_REJECTED', message: 'Request origin not authorized' } },
        { status: 403 }
      )
    }

    return null
  } catch {
    // If headers() fails (e.g., outside request context), allow
    return null
  }
}

/**
 * Verify that the current user is an admin
 * Returns admin user info if authorized, or error response if not
 */
export async function verifyAdmin(): Promise<AdminAuthResult> {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return {
        success: false,
        error: NextResponse.json(
          { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
          { status: 401 }
        ),
      }
    }

    // Check admin role in profiles table — single query for performance
    const adminSupabase = createAdminClient()
    let role: AdminRole | null = null
    let isAdmin = false
    let profileError: { message: string; code?: string } | null = null

    // Try to get is_admin + role in one query (saves ~100ms per request)
    const { data: profile, error: combinedError } = await adminSupabase
      .from('profiles')
      .select('is_admin, role')
      .eq('id', user.id)
      .single()

    if (!combinedError && profile) {
      isAdmin = profile.is_admin === true
      if (profile.role) {
        role = profile.role as AdminRole
      }
    } else if (combinedError && combinedError.message?.includes('column')) {
      // 'role' column may not exist — fall back to is_admin only
      const { data: fallbackProfile, error: fallbackError } = await adminSupabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single()

      if (!fallbackError && fallbackProfile) {
        isAdmin = fallbackProfile.is_admin === true
      }
      profileError = fallbackError
    } else {
      profileError = combinedError
    }

    // Deny access if profile couldn't be read at all
    if (profileError) {
      logger.error('Profile access failed - denying admin access for security', {
        userId: user.id,
        email: user.email,
      })
      return {
        success: false,
        error: NextResponse.json(
          { success: false, error: { code: 'PROFILE_ACCESS_ERROR', message: 'Unable to verify permissions' } },
          { status: 503 }
        ),
      }
    }

    // Whitelist check ONLY with valid profile
    if (!isAdmin && !role && user.email && ADMIN_EMAILS.includes(user.email) && profile) {
      isAdmin = true
      role = 'viewer' // Use least privilege for whitelist-only admins
    }

    // Verify admin access
    const validRoles: AdminRole[] = ['super_admin', 'admin', 'moderator', 'viewer']

    if (!isAdmin && (!role || !validRoles.includes(role))) {
      // Log unauthorized access attempt
      logger.warn('Unauthorized admin access attempt', { userId: user.id, email: user.email })

      return {
        success: false,
        error: NextResponse.json(
          { success: false, error: { code: 'FORBIDDEN', message: 'Admin access required' } },
          { status: 403 }
        ),
      }
    }

    // If user has is_admin=true but no role column, grant super_admin
    const adminRole: AdminRole = role && validRoles.includes(role) ? role : (isAdmin ? 'super_admin' : 'viewer')

    return {
      success: true,
      admin: {
        id: user.id,
        email: user.email || '',
        role: adminRole,
        permissions: DEFAULT_PERMISSIONS[adminRole],
      },
    }
  } catch (error: unknown) {
    logger.error('Admin auth error', error as Error)
    return {
      success: false,
      error: NextResponse.json(
        { success: false, error: { code: 'AUTH_ERROR', message: 'Authentication error' } },
        { status: 500 }
      ),
    }
  }
}

/**
 * Check if admin has specific permission
 */
export function hasPermission(
  admin: AdminUser,
  resource: keyof AdminPermissions,
  action: string
): boolean {
  const resourcePermissions = admin.permissions[resource]
  if (!resourcePermissions) return false
  return (resourcePermissions as Record<string, boolean>)[action] === true
}

/**
 * Require specific permission or return 403
 */
export async function requirePermission(
  resource: keyof AdminPermissions,
  action: string
): Promise<AdminAuthResult> {
  // CSRF validation — block cross-origin requests
  const csrfError = await validateCsrf()
  if (csrfError) {
    return { success: false, error: csrfError }
  }

  const authResult = await verifyAdmin()

  if (!authResult.success || !authResult.admin) {
    return authResult
  }

  if (!hasPermission(authResult.admin, resource, action)) {
    return {
      success: false,
      error: NextResponse.json(
        { success: false, error: { code: 'INSUFFICIENT_PERMISSIONS', message: 'Insufficient permissions' } },
        { status: 403 }
      ),
    }
  }

  return authResult
}

/**
 * Log admin action for audit trail
 */
export async function logAdminAction(
  adminId: string,
  action: string,
  entityType: string,
  entityId: string,
  details?: Record<string, unknown>
): Promise<void> {
  try {
    const supabase = createAdminClient()
    await supabase.from('audit_logs').insert({
      user_id: adminId,
      action,
      resource_type: entityType,
      resource_id: entityId,
      new_value: details || {},
    })
  } catch (error: unknown) {
    // Audit logging should not break the main operation
    logger.error('Audit log error', error as Error)
  }
}
