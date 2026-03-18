/**
 * Session Idle Timeout — US Attorneys
 *
 * Enforces idle timeout for authenticated sessions:
 *   - Regular users: 30 minutes
 *   - Admin users (super_admin, admin, moderator): 15 minutes
 *
 * Uses a cookie-based `last_active` timestamp. Each API call through
 * the admin auth layer or middleware updates the timestamp.
 * If the session has been idle beyond the threshold, the user must
 * re-authenticate.
 */

import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'

/** Cookie name for tracking last activity timestamp */
export const LAST_ACTIVE_COOKIE = 'sa_last_active'

/** Idle timeout in milliseconds — regular users (30 minutes) */
const USER_IDLE_TIMEOUT_MS = 30 * 60 * 1000

/** Idle timeout in milliseconds — admin users (15 minutes) */
const ADMIN_IDLE_TIMEOUT_MS = 15 * 60 * 1000

export interface SessionCheckResult {
  expired: boolean
  error?: NextResponse
}

/**
 * Update the last_active cookie to current timestamp.
 * Call this on every authenticated API request.
 */
export async function touchSession(): Promise<void> {
  try {
    const cookieStore = await cookies()
    cookieStore.set(LAST_ACTIVE_COOKIE, Date.now().toString(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24, // 24 hours (cookie lifetime, not idle timeout)
    })
  } catch {
    // cookies() can fail outside request context — silently ignore
  }
}

/**
 * Check if the current session has been idle too long.
 *
 * @param isAdmin - Whether the user is an admin (stricter timeout)
 * @returns SessionCheckResult with expired=true if re-auth is needed
 */
export async function checkSessionIdle(isAdmin: boolean = false): Promise<SessionCheckResult> {
  try {
    const cookieStore = await cookies()
    const lastActiveCookie = cookieStore.get(LAST_ACTIVE_COOKIE)

    // No cookie = first request in this session, set it and allow
    if (!lastActiveCookie?.value) {
      await touchSession()
      return { expired: false }
    }

    const lastActive = parseInt(lastActiveCookie.value, 10)
    if (isNaN(lastActive)) {
      // Corrupted cookie — reset and allow
      await touchSession()
      return { expired: false }
    }

    const idleMs = Date.now() - lastActive
    const timeoutMs = isAdmin ? ADMIN_IDLE_TIMEOUT_MS : USER_IDLE_TIMEOUT_MS

    if (idleMs > timeoutMs) {
      const timeoutMinutes = Math.round(timeoutMs / 60000)
      logger.info('Session idle timeout exceeded', {
        idleMinutes: Math.round(idleMs / 60000),
        timeoutMinutes,
        isAdmin,
      })

      // Sign out the user server-side to invalidate the session
      try {
        const supabase = await createClient()
        await supabase.auth.signOut()
      } catch {
        // Best effort — the 401 response will force client-side re-auth anyway
      }

      // Clear the cookie
      cookieStore.set(LAST_ACTIVE_COOKIE, '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 0,
      })

      return {
        expired: true,
        error: NextResponse.json(
          {
            success: false,
            error: {
              code: 'SESSION_EXPIRED',
              message: `Your session has been idle for more than ${timeoutMinutes} minutes. Please sign in again.`,
            },
          },
          { status: 401 }
        ),
      }
    }

    // Session is still active — refresh the timestamp
    await touchSession()
    return { expired: false }
  } catch {
    // If anything fails, allow the request (fail-open for session check)
    return { expired: false }
  }
}
