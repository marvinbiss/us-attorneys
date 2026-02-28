/**
 * Admin Claims API
 * GET: List provider claim requests (with filtering)
 * PATCH: Approve or reject a claim
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requirePermission } from '@/lib/admin-auth'
import { logger } from '@/lib/logger'
import { sendClaimApprovedEmail } from '@/lib/api/resend-client'
import { z } from 'zod'
import crypto from 'crypto'

export const dynamic = 'force-dynamic'

// GET query params
const claimsQuerySchema = z.object({
  status: z.enum(['pending', 'approved', 'rejected', 'all']).optional().default('pending'),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
})

// PATCH body
const claimActionSchema = z.object({
  claimId: z.string().uuid(),
  action: z.enum(['approve', 'reject']),
  rejectionReason: z.string().max(500).optional(),
})

export async function GET(request: NextRequest) {
  try {
    const authResult = await requirePermission('providers', 'read')
    if (!authResult.success || !authResult.admin) {
      return authResult.error
    }

    const supabase = createAdminClient()

    const searchParams = request.nextUrl.searchParams
    const result = claimsQuerySchema.safeParse({
      status: searchParams.get('status') || 'pending',
      page: searchParams.get('page') || '1',
      limit: searchParams.get('limit') || '20',
    })

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: { message: 'Paramètres invalides' } },
        { status: 400 }
      )
    }

    const { status, page, limit } = result.data
    const offset = (page - 1) * limit

    let query = supabase
      .from('provider_claims')
      .select(`
        id,
        status,
        siret_provided,
        claimant_name,
        claimant_email,
        claimant_phone,
        claimant_position,
        rejection_reason,
        reviewed_at,
        created_at,
        provider_id,
        user_id,
        provider:provider_id(id, name, siret, address_city, stable_id),
        user:user_id(id, email, full_name)
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (status !== 'all') {
      query = query.eq('status', status)
    }

    const { data: claims, error, count } = await query

    if (error) {
      return NextResponse.json(
        { success: false, error: { message: 'Erreur lors de la récupération des demandes' } },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: claims,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    })
  } catch {
    return NextResponse.json(
      { success: false, error: { message: 'Erreur serveur' } },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const authResult = await requirePermission('providers', 'write')
    if (!authResult.success || !authResult.admin) {
      return authResult.error
    }

    const body = await request.json()
    const validation = claimActionSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: { message: 'Données invalides', details: validation.error.flatten() } },
        { status: 400 }
      )
    }

    const { claimId, action, rejectionReason } = validation.data
    const supabase = createAdminClient()
    const now = new Date().toISOString()

    // Fetch the claim (include contact fields for anonymous claims)
    const { data: claim, error: claimError } = await supabase
      .from('provider_claims')
      .select('id, provider_id, user_id, status, claimant_email, claimant_name, claimant_phone, claimant_position')
      .eq('id', claimId)
      .single()

    if (claimError || !claim) {
      return NextResponse.json(
        { success: false, error: { message: 'Demande introuvable' } },
        { status: 404 }
      )
    }

    if (claim.status !== 'pending') {
      return NextResponse.json(
        { success: false, error: { message: 'Cette demande a déjà été traitée' } },
        { status: 409 }
      )
    }

    if (action === 'approve') {
      // Resolve the user ID: either from the claim (authenticated) or create account (anonymous)
      let resolvedUserId = claim.user_id
      let accountCreated = false

      if (!resolvedUserId) {
        // Anonymous claim — resolve or create user account
        const claimEmail = claim.claimant_email?.trim().toLowerCase()
        if (!claimEmail) {
          return NextResponse.json(
            { success: false, error: { message: 'Claim anonyme sans email — impossible de créer le compte' } },
            { status: 400 }
          )
        }

        // Check if a user with this email already exists (profiles OR auth.users)
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', claimEmail)
          .single()

        if (existingProfile) {
          resolvedUserId = existingProfile.id
          logger.info('Anonymous claim: reusing existing user from profiles', { claimId, email: claimEmail, userId: resolvedUserId })
        } else {
          // Try to create new account via Supabase admin auth
          const { data: newUser, error: createUserError } = await supabase.auth.admin.createUser({
            email: claimEmail,
            password: crypto.randomUUID(),
            email_confirm: true,
            user_metadata: {
              full_name: claim.claimant_name || '',
              is_artisan: true,
            },
          })

          if (createUserError || !newUser.user) {
            // User might exist in auth.users but not in profiles (e.g. incomplete signup)
            // Use generateLink to resolve their ID from auth.users
            const { data: linkData } = await supabase.auth.admin.generateLink({
              type: 'recovery',
              email: claimEmail,
            })

            if (linkData?.user?.id) {
              resolvedUserId = linkData.user.id
              logger.info('Anonymous claim: found existing auth user via recovery', { claimId, email: claimEmail, userId: resolvedUserId })

              // Ensure profile exists (upsert with role)
              const { error: upsertError } = await supabase.from('profiles').upsert({
                id: resolvedUserId,
                email: claimEmail,
                full_name: claim.claimant_name || '',
                role: 'artisan',
                created_at: now,
                updated_at: now,
              }, { onConflict: 'id' })

              if (upsertError) {
                logger.error('Failed to upsert profile for existing auth user', { claimId, userId: resolvedUserId, error: upsertError })
                return NextResponse.json(
                  { success: false, error: { message: `Erreur création profil: ${upsertError.message}` } },
                  { status: 500 }
                )
              }
            } else {
              logger.error('Failed to create or resolve user for anonymous claim', {
                claimId,
                email: claimEmail,
                createError: createUserError?.message,
              })
              return NextResponse.json(
                { success: false, error: { message: 'Erreur lors de la création du compte artisan' } },
                { status: 500 }
              )
            }
          } else {
            resolvedUserId = newUser.user.id
            accountCreated = true

            // Create profile row (upsert in case a trigger already created a partial row)
            const { error: profileError } = await supabase.from('profiles').upsert({
              id: resolvedUserId,
              email: claimEmail,
              full_name: claim.claimant_name || '',
              role: 'artisan',
              created_at: now,
              updated_at: now,
            }, { onConflict: 'id' })

            if (profileError) {
              logger.error('Failed to create profile for new user', { claimId, userId: resolvedUserId, error: profileError })
              return NextResponse.json(
                { success: false, error: { message: `Erreur création profil: ${profileError.message}` } },
                { status: 500 }
              )
            }

            logger.info('Anonymous claim: created new user', { claimId, email: claimEmail, userId: resolvedUserId })
          }
        }
      }

      // 1. Assign the provider to the user atomically: only if user_id IS NULL.
      const { data: updatedProvider, error: providerError } = await supabase
        .from('providers')
        .update({
          user_id: resolvedUserId,
          claimed_at: now,
          claimed_by: resolvedUserId,
          updated_at: now,
        })
        .eq('id', claim.provider_id)
        .is('user_id', null)
        .select('id, name')
        .maybeSingle()

      if (providerError) {
        return NextResponse.json(
          { success: false, error: { message: `Erreur attribution: ${providerError.message} [code=${providerError.code}] [details=${providerError.details}]` } },
          { status: 500 }
        )
      }

      if (!updatedProvider) {
        await supabase
          .from('provider_claims')
          .update({ status: 'rejected', rejection_reason: 'Fiche déjà attribuée', reviewed_by: authResult.admin.id, reviewed_at: now })
          .eq('id', claimId)

        return NextResponse.json(
          { success: false, error: { message: 'Cette fiche a déjà été attribuée à un autre utilisateur' } },
          { status: 409 }
        )
      }

      // 2. Update the claim status + link to resolved user
      const { error: updateClaimError } = await supabase
        .from('provider_claims')
        .update({
          status: 'approved',
          user_id: resolvedUserId,
          reviewed_by: authResult.admin.id,
          reviewed_at: now,
        })
        .eq('id', claimId)

      if (updateClaimError) {
        return NextResponse.json(
          { success: false, error: { message: 'Erreur lors de la mise à jour de la demande' } },
          { status: 500 }
        )
      }

      // 3. Set profiles.role = 'artisan' (skip if already admin/super_admin/moderator)
      const { data: currentProfile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', resolvedUserId)
        .single()

      const protectedRoles = ['super_admin', 'admin', 'moderator']
      if (!currentProfile || !protectedRoles.includes(currentProfile.role)) {
        await supabase
          .from('profiles')
          .update({ role: 'artisan', updated_at: now })
          .eq('id', resolvedUserId)
      }

      // 4. Mark user as artisan in auth metadata
      await supabase.auth.admin.updateUserById(resolvedUserId, {
        user_metadata: { is_artisan: true },
      })

      // 5. For anonymous claims: generate recovery link + send email
      let emailStatus = 'skipped'
      if (!claim.user_id) {
        const claimEmail = claim.claimant_email!.trim().toLowerCase()
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://servicesartisans.fr'

        try {
          const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
            type: 'recovery',
            email: claimEmail,
            options: {
              redirectTo: `${siteUrl}/auth/callback?next=/definir-mot-de-passe`,
            },
          })

          if (linkError || !linkData?.properties?.hashed_token) {
            emailStatus = `link_error: ${linkError?.message || 'no hashed_token returned'}`
            logger.error('Failed to generate recovery link', { claimId, error: linkError })
          } else {
            // Send hashed_token to intermediate page — verifyOtp client-side (avoids email pre-fetch + otp_expired)
            const safeLink = `${siteUrl}/auth/setup-password?token=${linkData.properties.hashed_token}`

            const emailResult = await sendClaimApprovedEmail({
              to: claimEmail,
              name: claim.claimant_name || 'Artisan',
              providerName: updatedProvider.name || 'Votre fiche',
              passwordLink: safeLink,
            })

            emailStatus = emailResult?.id ? `sent (id: ${emailResult.id})` : 'sent (no id)'
            logger.info('Claim approval email result', { claimId, email: claimEmail, emailResult })
          }
        } catch (emailErr) {
          emailStatus = `exception: ${emailErr instanceof Error ? emailErr.message : String(emailErr)}`
          logger.error('Failed to send claim approval email', { claimId, error: emailErr })
        }
      }

      logger.info('Claim approved', {
        claimId,
        providerId: claim.provider_id,
        userId: resolvedUserId,
        adminId: authResult.admin.id,
        accountCreated,
        emailStatus,
      })

      return NextResponse.json({
        success: true,
        message: `Demande approuvée. La fiche a été attribuée. Email: ${emailStatus}`,
      })
    } else {
      // Reject
      const { error: rejectError } = await supabase
        .from('provider_claims')
        .update({
          status: 'rejected',
          rejection_reason: rejectionReason || null,
          reviewed_by: authResult.admin.id,
          reviewed_at: now,
        })
        .eq('id', claimId)

      if (rejectError) {
        return NextResponse.json(
          { success: false, error: { message: 'Erreur lors du rejet' } },
          { status: 500 }
        )
      }

      logger.info('Claim rejected', {
        claimId,
        providerId: claim.provider_id,
        userId: claim.user_id,
        adminId: authResult.admin.id,
        reason: rejectionReason || null,
      })

      return NextResponse.json({
        success: true,
        message: 'Demande rejetée.',
      })
    }
  } catch (err) {
    logger.error('Admin claims PATCH error', { error: err })
    return NextResponse.json(
      { success: false, error: { message: 'Erreur serveur' } },
      { status: 500 }
    )
  }
}
