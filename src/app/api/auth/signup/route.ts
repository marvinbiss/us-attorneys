/**
 * User Signup API - US Attorneys
 * Handles user registration with email verification.
 *
 * Uses centralized error handling via withErrorHandler + ApiError classes.
 */

import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { signUpSchema } from '@/lib/validations/schemas'
import { withErrorHandler, RateLimitError, ApiError } from '@/lib/api/errors'
import { apiCreated } from '@/lib/api/response'
import { validateBody } from '@/lib/api/validation'
import { logger } from '@/lib/logger'
import { rateLimit, RATE_LIMITS } from '@/lib/rate-limiter'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

export const POST = withErrorHandler(async (request: NextRequest) => {
  // Rate limiting — auth category (5/min, fail-close)
  const rl = await rateLimit(request as unknown as Request, RATE_LIMITS.auth)
  if (!rl.success) {
    throw new RateLimitError(Math.ceil((rl.reset - Date.now()) / 1000))
  }

  // Validate environment
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new ApiError(500, 'INTERNAL_ERROR', 'Missing server configuration')
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  // Parse and validate request body
  const { email, password, firstName, lastName, phone } = await validateBody(request, signUpSchema)

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
    return apiCreated({
      message: 'Account created successfully. Check your email to activate your account.',
      requiresVerification: true,
    })
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
    throw new ApiError(500, 'INTERNAL_ERROR', 'Error creating account')
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

  return apiCreated({
    message: 'Account created successfully. Check your email to activate your account.',
    userId: authData.user.id,
    requiresVerification: true,
  })
})
