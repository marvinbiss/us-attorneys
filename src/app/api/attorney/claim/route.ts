/**
 * Attorney Claim API
 * POST: Submit a claim request for a provider page (bar number verification + admin review)
 * Auth is OPTIONAL — anonymous claims are supported (account created on admin approval)
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/logger'
import { checkRateLimit } from '@/lib/rate-limiter'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const claimSchema = z.object({
  attorneyId: z.string().uuid('Invalid attorney ID'),
  siret: z.string().min(1, 'Bar number is required'),
  fullName: z.string().min(2, 'Name is required (min. 2 characters)'),
  email: z.string().email('Invalid email'),
  phone: z.string().min(10, 'Invalid phone number'),
  position: z.string().min(2, 'Position is required'),
})

export async function POST(request: Request) {
  try {
    // Rate limiting (public endpoint — 3 requests per 5 min per IP)
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || request.headers.get('x-real-ip')
      || request.headers.get('cf-connecting-ip')
      || 'unknown'
    const rl = await checkRateLimit(`claim:${ip}`, { window: 300_000, max: 20 })
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again in a few minutes.' },
        { status: 429 }
      )
    }

    // Auth is OPTIONAL — try to get user, but don't fail if not logged in
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Validate body
    let body
    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      )
    }

    const validation = claimSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid data', details: validation.error.flatten() },
        { status: 400 }
      )
    }

    const { attorneyId, siret, fullName, email, phone, position } = validation.data
    const adminClient = createAdminClient()

    // Duplicate checks — different logic for authenticated vs anonymous
    if (user) {
      // Authenticated: check if user already owns a provider
      const { data: existingProvider } = await adminClient
        .from('attorneys')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (existingProvider) {
        return NextResponse.json(
          { error: 'You already have an attorney listing associated with your account' },
          { status: 409 }
        )
      }

      // Check if user already has a pending claim
      const { data: pendingClaims } = await adminClient
        .from('attorney_claims')
        .select('id')
        .eq('user_id', user.id)
        .eq('status', 'pending')
        .limit(1)

      if (pendingClaims && pendingClaims.length > 0) {
        return NextResponse.json(
          { error: 'You already have a pending claim request' },
          { status: 409 }
        )
      }
    } else {
      // Anonymous: check by email if there's already a pending claim
      const { data: emailPendingClaims } = await adminClient
        .from('attorney_claims')
        .select('id')
        .eq('claimant_email', email.trim().toLowerCase())
        .eq('status', 'pending')
        .limit(1)

      if (emailPendingClaims && emailPendingClaims.length > 0) {
        return NextResponse.json(
          { error: 'A claim request is already in progress with this email' },
          { status: 409 }
        )
      }
    }

    // Check if this specific provider already has a pending claim from anyone
    const { data: providerPendingClaims } = await adminClient
      .from('attorney_claims')
      .select('id')
      .eq('attorney_id', attorneyId)
      .eq('status', 'pending')
      .limit(1)

    if (providerPendingClaims && providerPendingClaims.length > 0) {
      return NextResponse.json(
        { error: 'A claim request is already in progress for this listing' },
        { status: 409 }
      )
    }

    // Fetch provider
    const { data: provider, error: attorneyError } = await adminClient
      .from('attorneys')
      .select('id, name, siret, user_id')
      .eq('id', attorneyId)
      .single()

    if (attorneyError || !provider) {
      return NextResponse.json(
        { error: 'Fiche attorney not found' },
        { status: 404 }
      )
    }

    if (provider.user_id) {
      return NextResponse.json(
        { error: 'This listing has already been claimed by another user' },
        { status: 409 }
      )
    }

    if (!provider.siret) {
      return NextResponse.json(
        { error: 'This listing does not have a bar number. Contact us at support@us-attorneys.com to claim this listing manually.' },
        { status: 400 }
      )
    }

    // Bar number verification (normalize: strip spaces)
    const normalizedInput = siret.replace(/\s/g, '').toLowerCase()
    const normalizedStored = provider.siret.replace(/\s/g, '').toLowerCase()

    if (normalizedInput !== normalizedStored) {
      logger.warn('Claim bar number mismatch', {
        userId: user?.id || 'anonymous',
        claimantEmail: email,
        attorneyId,
        attorneyName: provider.name,
      })

      return NextResponse.json(
        { error: 'The bar number does not match the one registered for this attorney' },
        { status: 403 }
      )
    }

    // Bar number matches — create a pending claim for admin review
    const { error: insertError } = await adminClient
      .from('attorney_claims')
      .insert({
        attorney_id: attorneyId,
        user_id: user?.id ?? null,
        siret_provided: normalizedInput,
        claimant_name: fullName,
        claimant_email: email.trim().toLowerCase(),
        claimant_phone: phone,
        claimant_position: position,
        status: 'pending',
      })

    if (insertError) {
      if (insertError.code === '23505') {
        return NextResponse.json(
          { error: 'You have already submitted a claim for this listing' },
          { status: 409 }
        )
      }
      logger.error('Claim insert error', { error: insertError, userId: user?.id, attorneyId })
      return NextResponse.json(
        { error: 'Error submitting the claim request', debug: { message: insertError.message, code: insertError.code, details: insertError.details } },
        { status: 500 }
      )
    }

    // Update user profile if authenticated
    if (user) {
      await adminClient
        .from('profiles')
        .update({
          full_name: fullName,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)
    }

    logger.info('Claim submitted', {
      userId: user?.id || 'anonymous',
      claimantEmail: email,
      attorneyId,
      attorneyName: provider.name,
    })

    return NextResponse.json({
      success: true,
      message: 'Your claim request has been submitted. An administrator will review it within 24 to 48 hours.',
    })
  } catch (err) {
    logger.error('Claim API unexpected error', { error: err })
    return NextResponse.json(
      { error: 'Server error', debug: String(err) },
      { status: 500 }
    )
  }
}
