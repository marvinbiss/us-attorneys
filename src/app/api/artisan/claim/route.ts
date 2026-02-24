/**
 * Artisan Claim API
 * POST: Submit a claim request for a provider page (SIRET verification + admin review)
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/logger'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const claimSchema = z.object({
  providerId: z.string().uuid('ID artisan invalide'),
  siret: z.string().regex(/^\d{14}$/, 'Le SIRET doit contenir exactement 14 chiffres'),
  fullName: z.string().min(2, 'Le nom est requis (min. 2 caractères)'),
  email: z.string().email('Email invalide'),
  phone: z.string().min(10, 'Numéro de téléphone invalide'),
  position: z.string().min(2, 'Le poste est requis'),
})

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    // Auth check
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Vous devez être connecté pour revendiquer une fiche' },
        { status: 401 }
      )
    }

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

    const { providerId, siret, fullName, email, phone, position } = validation.data
    const adminClient = createAdminClient()

    // Check if user already owns a provider
    const { data: existingProvider } = await adminClient
      .from('providers')
      .select('id, name')
      .eq('user_id', user.id)
      .single()

    if (existingProvider) {
      return NextResponse.json(
        { error: 'Vous avez déjà une fiche artisan associée à votre compte' },
        { status: 409 }
      )
    }

    // Check if user already has a pending claim (for any provider)
    const { data: pendingClaims } = await adminClient
      .from('provider_claims')
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

    // Check if this specific provider already has a pending claim from anyone
    const { data: providerPendingClaims } = await adminClient
      .from('provider_claims')
      .select('id')
      .eq('provider_id', providerId)
      .eq('status', 'pending')
      .limit(1)

    if (providerPendingClaims && providerPendingClaims.length > 0) {
      return NextResponse.json(
        { error: 'Une demande de revendication est déjà en cours pour cette fiche' },
        { status: 409 }
      )
    }

    // Fetch provider
    const { data: provider, error: providerError } = await adminClient
      .from('providers')
      .select('id, name, siret, user_id')
      .eq('id', providerId)
      .single()

    if (providerError || !provider) {
      return NextResponse.json(
        { error: 'Fiche artisan introuvable' },
        { status: 404 }
      )
    }

    // Check if already claimed by someone
    if (provider.user_id) {
      return NextResponse.json(
        { error: 'Cette fiche a déjà été revendiquée par un autre utilisateur' },
        { status: 409 }
      )
    }

    // Check if provider has a SIRET to match against
    if (!provider.siret) {
      return NextResponse.json(
        { error: 'Cette fiche ne contient pas de numéro SIRET. Contactez-nous à support@servicesartisans.fr pour revendiquer cette fiche manuellement.' },
        { status: 400 }
      )
    }

    // SIRET verification (normalize: strip spaces)
    const normalizedInput = siret.replace(/\s/g, '')
    const normalizedStored = provider.siret.replace(/\s/g, '')

    if (normalizedInput !== normalizedStored) {
      // Log failed SIRET attempt for abuse detection
      logger.warn('Claim SIRET mismatch', {
        userId: user.id,
        userEmail: user.email,
        providerId,
        providerName: provider.name,
        // Only log first 9 digits (SIREN) for privacy — last 5 are establishment-specific
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
      .from('provider_claims')
      .insert({
        provider_id: providerId,
        user_id: user.id,
        siret_provided: normalizedInput,
        claimant_name: fullName,
        claimant_email: email,
        claimant_phone: phone,
        claimant_position: position,
        status: 'pending',
      })

    // Update user profile with provided contact info
    await adminClient
      .from('profiles')
      .update({
        full_name: fullName,
        phone_e164: phone.replace(/\s/g, ''),
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)

    if (insertError) {
      // Handle unique constraint violation (race condition: 2 requests at once)
      if (insertError.code === '23505') {
        return NextResponse.json(
          { error: 'Vous avez déjà soumis une demande pour cette fiche' },
          { status: 409 }
        )
      }
      logger.error('Claim insert error', { error: insertError, userId: user.id, providerId })
      return NextResponse.json(
        { error: 'Erreur lors de la soumission de la demande' },
        { status: 500 }
      )
    }

    // Log successful claim submission
    logger.info('Claim submitted', {
      userId: user.id,
      userEmail: user.email,
      providerId,
      providerName: provider.name,
    })

    return NextResponse.json({
      success: true,
      message: 'Votre demande de revendication a été soumise. Un administrateur la validera sous 24 à 48 heures.',
    })
  } catch (err) {
    logger.error('Claim API unexpected error', { error: err })
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
