/**
 * Artisan Claim API
 * POST: Submit a claim request for a provider page (SIRET verification + admin review)
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
  attorneyId: z.string().uuid('ID artisan invalide'),
  siret: z.string().regex(/^\d{14}$/, 'Le SIRET doit contenir exactement 14 chiffres'),
  fullName: z.string().min(2, 'Le nom est requis (min. 2 caractères)'),
  email: z.string().email('Email invalide'),
  phone: z.string().min(10, 'Numéro de téléphone invalide'),
  position: z.string().min(2, 'Le poste est requis'),
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
        { error: 'Trop de demandes. Réessayez dans quelques minutes.' },
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
        { error: 'Corps de requête invalide' },
        { status: 400 }
      )
    }

    const validation = claimSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Données invalides', details: validation.error.flatten() },
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
          { error: 'Vous avez déjà une fiche artisan associée à votre compte' },
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
          { error: 'Vous avez déjà une demande de revendication en cours de validation' },
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
          { error: 'Une demande de revendication est déjà en cours avec cet email' },
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
        { error: 'Une demande de revendication est déjà en cours pour cette fiche' },
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
        { error: 'Fiche artisan introuvable' },
        { status: 404 }
      )
    }

    if (provider.user_id) {
      return NextResponse.json(
        { error: 'Cette fiche a déjà été revendiquée par un autre utilisateur' },
        { status: 409 }
      )
    }

    if (!provider.siret) {
      return NextResponse.json(
        { error: 'Cette fiche ne contient pas de numéro SIRET. Contactez-nous à support@us-attorneys.com pour revendiquer cette fiche manuellement.' },
        { status: 400 }
      )
    }

    // SIRET verification (normalize: strip spaces)
    const normalizedInput = siret.replace(/\s/g, '')
    const normalizedStored = provider.siret.replace(/\s/g, '')

    if (normalizedInput !== normalizedStored) {
      logger.warn('Claim SIRET mismatch', {
        userId: user?.id || 'anonymous',
        claimantEmail: email,
        attorneyId,
        attorneyName: provider.name,
        inputSiren: normalizedInput.slice(0, 9),
        storedSiren: normalizedStored.slice(0, 9),
      })

      return NextResponse.json(
        { error: 'Le numéro SIRET ne correspond pas à celui enregistré pour cet artisan' },
        { status: 403 }
      )
    }

    // SIRET matches — create a pending claim for admin review
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
          { error: 'Vous avez déjà soumis une demande pour cette fiche' },
          { status: 409 }
        )
      }
      logger.error('Claim insert error', { error: insertError, userId: user?.id, attorneyId })
      return NextResponse.json(
        { error: 'Erreur lors de la soumission de la demande', debug: { message: insertError.message, code: insertError.code, details: insertError.details } },
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
      message: 'Votre demande de revendication a été soumise. Un administrateur la validera sous 24 à 48 heures.',
    })
  } catch (err) {
    logger.error('Claim API unexpected error', { error: err })
    return NextResponse.json(
      { error: 'Erreur serveur', debug: String(err) },
      { status: 500 }
    )
  }
}
