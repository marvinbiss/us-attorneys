/**
 * Admin Claims API
 * GET: List provider claim requests (with filtering)
 * PATCH: Approve or reject a claim
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requirePermission } from '@/lib/admin-auth'
import { logger } from '@/lib/logger'
import { z } from 'zod'

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

    // Fetch the claim
    const { data: claim, error: claimError } = await supabase
      .from('provider_claims')
      .select('id, provider_id, user_id, status')
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
      // 1. Assign the provider to the user atomically: only if user_id IS NULL.
      // This single UPDATE eliminates the race condition — no separate check needed.
      const { data: updatedProvider, error: providerError } = await supabase
        .from('providers')
        .update({
          user_id: claim.user_id,
          claimed_at: now,
          claimed_by: claim.user_id,
          updated_at: now,
        })
        .eq('id', claim.provider_id)
        .is('user_id', null)
        .select('id')
        .maybeSingle()

      if (providerError) {
        return NextResponse.json(
          { success: false, error: { message: 'Erreur lors de l\'attribution de la fiche' } },
          { status: 500 }
        )
      }

      if (!updatedProvider) {
        // No row matched: provider was already claimed by another flow — auto-reject
        await supabase
          .from('provider_claims')
          .update({ status: 'rejected', rejection_reason: 'Fiche déjà attribuée', reviewed_by: authResult.admin.id, reviewed_at: now })
          .eq('id', claimId)

        return NextResponse.json(
          { success: false, error: { message: 'Cette fiche a déjà été attribuée à un autre utilisateur' } },
          { status: 409 }
        )
      }

      // 2. Update the claim status (provider is now safely assigned)
      const { error: updateClaimError } = await supabase
        .from('provider_claims')
        .update({
          status: 'approved',
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

      // 3. Set profiles.role = 'artisan' (required by middleware + requireArtisan guard)
      const { error: profileRoleError } = await supabase
        .from('profiles')
        .update({ role: 'artisan', updated_at: now })
        .eq('id', claim.user_id)

      if (profileRoleError) {
        logger.error('Failed to set profiles.role to artisan', {
          claimId,
          userId: claim.user_id,
          error: profileRoleError,
        })
      }

      // 4. Mark user as artisan in auth metadata (belt-and-suspenders)
      await supabase.auth.admin.updateUserById(claim.user_id, {
        user_metadata: { is_artisan: true },
      })

      logger.info('Claim approved', {
        claimId,
        providerId: claim.provider_id,
        userId: claim.user_id,
        adminId: authResult.admin.id,
      })

      return NextResponse.json({
        success: true,
        message: 'Demande approuvée. La fiche a été attribuée à l\'artisan.',
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
