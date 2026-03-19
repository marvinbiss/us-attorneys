/**
 * Attorney Profile API
 * GET: Fetch attorney profile
 * PUT: Update attorney profile
 */

import { revalidatePath } from 'next/cache'
import { requireAttorney } from '@/lib/auth/attorney-guard'
import { apiSuccess, apiError } from '@/lib/api/handler'
import { logger } from '@/lib/logger'
import { slugify } from '@/lib/utils'
import { withTimeout, isTimeoutError } from '@/lib/api/timeout'
import { z } from 'zod'

// PUT request schema — only columns that actually exist
// profiles: full_name
// providers: name, bar_number, phone, address_line1, address_city, address_zip, specialty
const updateProfileSchema = z.object({
  full_name: z.string().max(100).optional(),
  // Provider fields (written to providers table, not profiles)
  name: z.string().max(200).optional(),
  bar_number: z.string().max(20).optional(),
  phone: z.string().max(20).optional(),
  address_line1: z.string().max(200).optional(),
  address_city: z.string().max(100).optional(),
  address_zip: z.string().max(10).optional(),
  primary_specialty_id: z.string().uuid().optional(),
})

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const { error: guardError, user, supabase } = await requireAttorney()
    if (guardError) return guardError

    // Fetch profile with explicit column list (profiles table)
    const { data: profile, error: profileError } = await withTimeout(
      supabase
        .from('profiles')
        .select('id, email, full_name, role, average_rating, review_count')
        .eq('id', user!.id)
        .single()
    )

    if (profileError) {
      logger.error('Error fetching profile:', profileError)
      return apiError('DATABASE_ERROR', 'Error retrieving profile', 500)
    }

    // Fetch associated provider data
    const { data: provider } = await withTimeout(
      supabase
        .from('attorneys')
        .select('id, name, slug, bar_number, phone, address_line1, address_city, address_zip, address_state, rating_average, review_count, is_verified, is_active, specialty:specialties!primary_specialty_id(name, slug)')
        .eq('user_id', user!.id)
        .single()
    )

    return apiSuccess({ profile, provider })
  } catch (error: unknown) {
    if (isTimeoutError(error)) {
      logger.error('Profile GET timeout:', error)
      return apiError('GATEWAY_TIMEOUT', 'The request timed out. Please try again.', 504)
    }
    logger.error('Profile GET error:', error)
    return apiError('INTERNAL_ERROR', 'Server error', 500)
  }
}

export async function PUT(request: Request) {
  try {
    const { error: guardError, user, supabase } = await requireAttorney()
    if (guardError) return guardError

    // Parse request body
    const body = await request.json()
    const result = updateProfileSchema.safeParse(body)
    if (!result.success) {
      return apiError('VALIDATION_ERROR', 'Validation error', 400)
    }
    const {
      full_name,
      name,
      bar_number,
      phone,
      address_line1,
      address_city,
      address_zip,
      primary_specialty_id,
    } = result.data

    // Update profiles table (only columns that exist: full_name)
    const profileUpdate: Record<string, string> = {}
    if (full_name !== undefined) profileUpdate.full_name = full_name

    let profile = null
    if (Object.keys(profileUpdate).length > 0) {
      const { data, error: updateError } = await withTimeout(
        supabase
          .from('profiles')
          .update(profileUpdate)
          .eq('id', user!.id)
          .select('id, email, full_name, role, average_rating, review_count')
          .single()
      )

      if (updateError) {
        logger.error('Error updating profile:', updateError)
        return apiError('DATABASE_ERROR', 'Error updating profile', 500)
      }
      profile = data
    }

    // Update providers table (business data)
    const providerUpdate: Record<string, string> = {}
    if (name !== undefined) providerUpdate.name = name
    if (bar_number !== undefined) providerUpdate.bar_number = bar_number
    if (phone !== undefined) providerUpdate.phone = phone
    if (address_line1 !== undefined) providerUpdate.address_line1 = address_line1
    if (address_city !== undefined) providerUpdate.address_city = address_city
    if (address_zip !== undefined) providerUpdate.address_zip = address_zip
    if (primary_specialty_id !== undefined) providerUpdate.primary_specialty_id = primary_specialty_id

    let provider = null
    if (Object.keys(providerUpdate).length > 0) {
      const { data, error: attorneyError } = await withTimeout(
        supabase
          .from('attorneys')
          .update(providerUpdate)
          .eq('user_id', user!.id)
          .select('id, name, slug, bar_number, phone, address_line1, address_city, address_zip, stable_id, is_verified, is_active, specialty:specialties!primary_specialty_id(name, slug)')
          .single()
      )

      if (attorneyError) {
        logger.error('Error updating provider:', attorneyError)
        return apiError('DATABASE_ERROR', 'Error updating attorney profile', 500)
      }
      provider = data
    }

    // On-demand revalidation of affected pages (non-blocking)
    if (provider) {
      try {
        const specialtySlug = slugify((provider.specialty as { slug?: string } | null)?.slug || 'attorney')
        const locationSlug = slugify(provider.address_city || 'united-states')
        const publicId = provider.slug || provider.stable_id

        // Attorney profile page
        if (publicId) {
          revalidatePath(`/practice-areas/${specialtySlug}/${locationSlug}/${publicId}`, 'page')
        }
        // Listing city page
        revalidatePath(`/practice-areas/${specialtySlug}/${locationSlug}`, 'page')
        // Listing service
        revalidatePath(`/practice-areas/${specialtySlug}`, 'page')

        logger.info('Revalidated paths after profile update', {
          attorneyId: provider.id,
          paths: [
            `/practice-areas/${specialtySlug}/${locationSlug}/${publicId}`,
            `/practice-areas/${specialtySlug}/${locationSlug}`,
            `/practice-areas/${specialtySlug}`,
          ],
        })
      } catch (revalError) {
        // Don't block the response if revalidation fails
        logger.error('Revalidation failed after profile update:', revalError)
      }
    }

    return apiSuccess({
      profile,
      provider,
      message: 'Profile updated successfully',
    })
  } catch (error: unknown) {
    if (isTimeoutError(error)) {
      logger.error('Profile PUT timeout:', error)
      return apiError('GATEWAY_TIMEOUT', 'The request timed out. Please try again.', 504)
    }
    logger.error('Profile PUT error:', error)
    return apiError('INTERNAL_ERROR', 'Server error', 500)
  }
}
