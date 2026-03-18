/**
 * User Signin API - US Attorneys
 * Handles user authentication with proper cookie management
 */

import { NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { signInSchema, validateRequest, formatZodErrors } from '@/lib/validations/schemas'
import { createErrorResponse, createSuccessResponse, ErrorCode } from '@/lib/errors/types'
import { authLogger } from '@/lib/logger'
import { rateLimit, RATE_LIMITS } from '@/lib/rate-limiter'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export async function POST(request: Request) {
  try {
    // Rate limiting — auth category (5/min, fail-close)
    const rl = await rateLimit(request, RATE_LIMITS.auth)
    if (!rl.success) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil((rl.reset - Date.now()) / 1000)) } }
      )
    }

    // Validate environment
    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json(
        createErrorResponse(ErrorCode.INTERNAL_ERROR, 'Missing server configuration'),
        { status: 500 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validation = validateRequest(signInSchema, body)

    if (!validation.success) {
      return NextResponse.json(
        createErrorResponse(
          ErrorCode.VALIDATION_ERROR,
          'Invalid data',
          { fields: formatZodErrors(validation.errors) }
        ),
        { status: 400 }
      )
    }

    const { email, password } = validation.data

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
        return NextResponse.json(
          createErrorResponse(ErrorCode.UNAUTHORIZED, 'Incorrect email or password'),
          { status: 401 }
        )
      }
      if (error.message.includes('Email not confirmed')) {
        return NextResponse.json(
          createErrorResponse(ErrorCode.UNAUTHORIZED, 'Please confirm your email before signing in'),
          { status: 401 }
        )
      }
      // Generic message — never leak internal error details to the client
      authLogger.warn('Signin error (unhandled type)', { detail: error.message })
      return NextResponse.json(
        createErrorResponse(ErrorCode.UNAUTHORIZED, 'Invalid email or password'),
        { status: 401 }
      )
    }

    if (!data.user || !data.session) {
      return NextResponse.json(
        createErrorResponse(ErrorCode.UNAUTHORIZED, 'Authentication failed'),
        { status: 401 }
      )
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
    const response = NextResponse.json(
      createSuccessResponse({
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
    )

    // Set refresh token as HTTP-only cookie for security
    response.cookies.set('sb-refresh-token', data.session.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/api/auth',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    })

    return response
  } catch (error: unknown) {
    authLogger.error('Signin error:', error)
    return NextResponse.json(
      createErrorResponse(ErrorCode.INTERNAL_ERROR, 'Error during connection'),
      { status: 500 }
    )
  }
}
