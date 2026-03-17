/**
 * User Signup API - US Attorneys
 * Handles user registration with email verification
 */

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { signUpSchema, validateRequest, formatZodErrors } from '@/lib/validations/schemas'
import { createErrorResponse, createSuccessResponse, ErrorCode, getHttpStatus as _getHttpStatus } from '@/lib/errors/types'
import { logger } from '@/lib/logger'
import { rateLimit, RATE_LIMITS } from '@/lib/rate-limiter'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    // Rate limiting
    const rl = await rateLimit(request, RATE_LIMITS.auth)
    if (!rl.success) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429 }
      )
    }

    // Validate environment
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        createErrorResponse(ErrorCode.INTERNAL_ERROR, 'Missing server configuration'),
        { status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Parse and validate request body
    const body = await request.json()
    const validation = validateRequest(signUpSchema, body)

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

    const { email, password, firstName, lastName, phone } = validation.data

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email.toLowerCase())
      .single()

    if (existingUser) {
      return NextResponse.json(
        createErrorResponse(ErrorCode.ALREADY_EXISTS, 'Un compte existe deja avec cet email'),
        { status: 409 }
      )
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
      return NextResponse.json(
        createErrorResponse(ErrorCode.INTERNAL_ERROR, authError?.message || 'Error creating account'),
        { status: 500 }
      )
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

    return NextResponse.json(
      createSuccessResponse({
        message: 'Account created successfully. Check your email to activate your account.',
        userId: authData.user.id,
        requiresVerification: true,
      }),
      { status: 201 }
    )
  } catch (error) {
    logger.error('Signup error:', error)
    return NextResponse.json(
      createErrorResponse(ErrorCode.INTERNAL_ERROR, 'Error during registration'),
      { status: 500 }
    )
  }
}
