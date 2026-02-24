/**
 * Artisan Profile API
 * GET: Fetch artisan profile
 * PUT: Update artisan profile
 */

import { NextResponse } from 'next/server'
import { requireArtisan } from '@/lib/auth/artisan-guard'
import { logger } from '@/lib/logger'
import { z } from 'zod'

// PUT request schema — only columns that actually exist
// profiles: full_name
// providers: name, siret, phone, address_street, address_city, address_postal_code, specialty
const updateProfileSchema = z.object({
  full_name: z.string().max(100).optional(),
  // Provider fields (written to providers table, not profiles)
  name: z.string().max(200).optional(),
  siret: z.string().max(20).optional(),
  phone: z.string().max(20).optional(),
  address_street: z.string().max(200).optional(),
  address_city: z.string().max(100).optional(),
  address_postal_code: z.string().max(10).optional(),
  specialty: z.string().max(100).optional(),
})

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const { error: guardError, user, supabase } = await requireArtisan()
    if (guardError) return guardError

    // Fetch profile with explicit column list (profiles table)
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, email, full_name, role, average_rating, review_count')
      .eq('id', user!.id)
      .single()

    if (profileError) {
      logger.error('Error fetching profile:', profileError)
      return NextResponse.json(
        { error: 'Erreur lors de la récupération du profil' },
        { status: 500 }
      )
    }

    // Fetch associated provider data
    const { data: provider } = await supabase
      .from('providers')
      .select('id, name, slug, siret, phone, address_street, address_city, address_postal_code, address_region, specialty, rating_average, review_count, is_verified, is_active')
      .eq('user_id', user!.id)
      .single()

    return NextResponse.json({ profile, provider })
  } catch (error) {
    logger.error('Profile GET error:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request) {
  try {
    const { error: guardError, user, supabase } = await requireArtisan()
    if (guardError) return guardError

    // Parse request body
    const body = await request.json()
    const result = updateProfileSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation error', details: result.error.flatten() },
        { status: 400 }
      )
    }
    const {
      full_name,
      name,
      siret,
      phone,
      address_street,
      address_city,
      address_postal_code,
      specialty,
    } = result.data

    // Update profiles table (only columns that exist: full_name)
    const profileUpdate: Record<string, string> = {}
    if (full_name !== undefined) profileUpdate.full_name = full_name

    let profile = null
    if (Object.keys(profileUpdate).length > 0) {
      const { data, error: updateError } = await supabase
        .from('profiles')
        .update(profileUpdate)
        .eq('id', user!.id)
        .select('id, email, full_name, role, average_rating, review_count')
        .single()

      if (updateError) {
        logger.error('Error updating profile:', updateError)
        return NextResponse.json(
          { error: 'Erreur lors de la mise à jour du profil' },
          { status: 500 }
        )
      }
      profile = data
    }

    // Update providers table (business data)
    const providerUpdate: Record<string, string> = {}
    if (name !== undefined) providerUpdate.name = name
    if (siret !== undefined) providerUpdate.siret = siret
    if (phone !== undefined) providerUpdate.phone = phone
    if (address_street !== undefined) providerUpdate.address_street = address_street
    if (address_city !== undefined) providerUpdate.address_city = address_city
    if (address_postal_code !== undefined) providerUpdate.address_postal_code = address_postal_code
    if (specialty !== undefined) providerUpdate.specialty = specialty

    let provider = null
    if (Object.keys(providerUpdate).length > 0) {
      const { data, error: providerError } = await supabase
        .from('providers')
        .update(providerUpdate)
        .eq('user_id', user!.id)
        .select('id, name, slug, siret, phone, address_street, address_city, address_postal_code, specialty, is_verified, is_active')
        .single()

      if (providerError) {
        logger.error('Error updating provider:', providerError)
        return NextResponse.json(
          { error: 'Erreur lors de la mise à jour du profil artisan' },
          { status: 500 }
        )
      }
      provider = data
    }

    return NextResponse.json({
      success: true,
      profile,
      provider,
      message: 'Profil mis à jour avec succès'
    })
  } catch (error) {
    logger.error('Profile PUT error:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
