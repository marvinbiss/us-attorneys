/**
 * User Signin API - US Attorneys
 * Handles user authentication with proper cookie management.
 *
 * Uses centralized error handling via withErrorHandler + ApiError classes.
 */

import { NextRequest } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { signInSchema } from '@/lib/validations/schemas'
import { withErrorHandler, UnauthorizedError, RateLimitError, ApiError } from '@/lib/api/errors'
import { apiSuccess } from '@/lib/api/response'
import { validateBody } from '@/lib/api/validation'
import { authLogger } from '@/lib/logger'
import { rateLimit, RATE_LIMITS } from '@/lib/rate-limiter'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export const POST = withErrorHandler(async (request: NextRequest) => {
  // Rate limiting — auth category (5/min, fail-close)
  const rl = await rateLimit(request as unknown as Request, RATE_LIMITS.auth)
  if (!rl.success) {
    throw new RateLimitError(Math.ceil((rl.reset - Date.now()) / 1000))
  }

  // Validate environment
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new ApiError(500, 'INTERNAL_ERROR', 'Missing server configuration')
  }

  // Parse and validate request body
  const { email, password } = await validateBody(request, signInSchema)

  // Create Supabase client with cookie handling
  const cookieStore = await cookies()
  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.set({ name, value: '', ...options })
        },
      },
    }
  )

  // Attempt sign in
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.toLowerCase(),
    password,
  })

  if (error) {
    // Handle specific error types
    if (error.message.includes('Invalid login credentials')) {
      throw new UnauthorizedError('Incorrect email or password')
    }
    if (error.message.includes('Email not confirmed')) {
      throw new UnauthorizedError('Please confirm your email before signing in')
    }
    // Generic message — never leak internal error details to the client
    authLogger.warn('Signin error (unhandled type)', { detail: error.message })
    throw new UnauthorizedError('Invalid email or password')
  }

  if (!data.user || !data.session) {
    throw new UnauthorizedError('Authentication failed')
  }

  // Get user profile (may not exist yet)
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', data.user.id)
    .single()

  // Determine if the user is an attorney based on role
  const isAttorney = profile?.role === 'attorney'

  // SECURITY FIX: Do not expose the refresh token in the JSON response
  // The refresh token is managed by Supabase HTTP-only cookies
  const response = apiSuccess({
    user: {
      id: data.user.id,
      email: data.user.email,
      fullName: profile?.full_name || data.user.user_metadata?.full_name || `${data.user.user_metadata?.first_name || ''} ${data.user.user_metadata?.last_name || ''}`.trim() || null,
      role: profile?.role || 'user',
      userType: profile?.role === 'attorney' ? 'attorney' : 'client',
      isAttorney,
    },
    session: {
      accessToken: data.session.access_token,
      expiresAt: data.session.expires_at,
      // refreshToken intentionally omitted for security
    },
  })

  // Set refresh token as HTTP-only cookie for security
  response.cookies.set('sb-refresh-token', data.session.refresh_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/api/auth',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  })

  return response
})
