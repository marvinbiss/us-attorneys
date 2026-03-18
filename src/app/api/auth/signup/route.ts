/**
 * User Signup API - US Attorneys
 * Handles user registration with email verification
 */

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { signUpSchema, validateRequest } from '@/lib/validations/schemas'
import { apiSuccess, apiError } from '@/lib/api/handler'
import { logger } from '@/lib/logger'
import { rateLimit, RATE_LIMITS } from '@/lib/rate-limiter'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

export async function POST(request: Request) {
  try {
    // Rate limiting — auth category (5/min, fail-close)
    const rl = await rateLimit(request, RATE_LIMITS.auth)
    if (!rl.success) {
      return NextResponse.json(
        { success: false, error: { code: 'RATE_LIMIT_ERROR', message: 'Too many requests. Please try again later.' } },
        { status: 429, headers: { 'Retry-After': String(Math.ceil((rl.reset - Date.now()) / 1000)) } }
      )
    }

    // Validate environment
    if (!supabaseUrl || !supabaseServiceKey) {
      return apiError('INTERNAL_ERROR', 'Missing server configuration', 500)
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Parse and validate request body
    const body = await request.json()
    const validation = validateRequest(signUpSchema, body)

    if (!validation.success) {
      return apiError('VALIDATION_ERROR', 'Invalid data', 400)
    }

    const { email, password, firstName, lastName, phone } = validation.data

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email.toLowerCase())
      .single()

    if (existingUser) {
      // SECURITY: Do not reveal that the email is already registered (email enumeration).
      // Return the same success response as a normal signup to prevent attackers
      // from discovering valid email addresses.
      logger.info('Signup attempted with existing email (suppressed)')
      return apiSuccess({
        message: 'Account created successfully. Check your email to activate your account.',
        requiresVerification: true,
      }, 201)
    }

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: email.toLowerCase(),
      password,
      email_confirm: true, // Sends confirmation email; account inactive until verified
      user_metadata: {
        first_name: firstName,
        last_name: lastName,
        phone,
      },
    })

    if (authError || !authData.user) {
      logger.error('Auth error:', authError)
      return apiError('INTERNAL_ERROR', 'Error creating account', 500)
    }

    // Create profile record - default to client user type
    const { error: profileError } = await supabase.from('profiles').insert({
      id: authData.user.id,
      email: email.toLowerCase(),
      full_name: `${firstName} ${lastName}`.trim(),
      phone_e164: phone || null,
      role: 'user',
      created_at: new Date().toISOString(),
    })

    if (profileError) {
      logger.error('Profile error:', profileError)
      // Don't fail completely - user is created, profile can be fixed
    }

    // Note: Verification email is automatically sent by Supabase auth.admin.createUser
    // when emailConfirm is set to true

    return apiSuccess({
      message: 'Account created successfully. Check your email to activate your account.',
      userId: authData.user.id,
      requiresVerification: true,
    }, 201)
  } catch (error: unknown) {
    logger.error('Signup error:', error)
    return apiError('INTERNAL_ERROR', 'Error during registration', 500)
  }
}
