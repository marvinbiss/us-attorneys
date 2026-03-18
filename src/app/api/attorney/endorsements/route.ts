/**
 * Peer Endorsements API
 * POST: Create an endorsement (authenticated attorney only)
 * GET:  List endorsements for an attorney (public)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createApiHandler } from '@/lib/api/handler'
import { logger } from '@/lib/logger'
import { z } from 'zod'

const createEndorsementSchema = z.object({
  endorsed_attorney_id: z.string().uuid(),
  specialty_id: z.string().uuid(),
  comment: z.string().max(200).optional(),
})

export const dynamic = 'force-dynamic'

// GET: public listing of endorsements for an attorney
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const attorneyId = searchParams.get('attorneyId')

    if (!attorneyId) {
      return NextResponse.json(
        { error: 'attorneyId query parameter is required' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    const { data: endorsements, error } = await supabase
      .from('peer_endorsements')
      .select(`
        id,
        comment,
        created_at,
        specialty_id,
        endorser:endorser_id (
          id,
          name,
          slug,
          profile_image_url,
          address_city,
          address_state,
          is_verified
        ),
        specialty:specialty_id (
          id,
          name,
          slug
        )
      `)
      .eq('endorsed_id', attorneyId)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) {
      logger.error('Failed to fetch endorsements', error)
      return NextResponse.json(
        { error: 'Failed to fetch endorsements' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: endorsements ?? [],
      count: endorsements?.length ?? 0,
    })
  } catch (err: unknown) {
    logger.error('Endorsements GET error', err as Error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST: create endorsement (authenticated attorney only)
export const POST = createApiHandler(async ({ request, attorney }) => {
  const body = await request.json()
  const result = createEndorsementSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json(
      { error: 'Validation error', details: result.error.flatten() },
      { status: 400 }
    )
  }

  const { endorsed_attorney_id, specialty_id, comment } = result.data
  const endorserAttorneyId = attorney!.attorney_id

  // Prevent self-endorsement
  if (endorserAttorneyId === endorsed_attorney_id) {
    return NextResponse.json(
      { error: 'You cannot endorse yourself' },
      { status: 400 }
    )
  }

  const supabase = await createClient()

  // Verify the endorsed attorney exists and is active
  const adminClient = createAdminClient()
  const { data: endorsedAttorney } = await adminClient
    .from('attorneys')
    .select('id, is_active')
    .eq('id', endorsed_attorney_id)
    .single()

  if (!endorsedAttorney || !endorsedAttorney.is_active) {
    return NextResponse.json(
      { error: 'Attorney not found or inactive' },
      { status: 404 }
    )
  }

  // Check the endorser is verified
  const { data: endorser } = await adminClient
    .from('attorneys')
    .select('id, is_verified')
    .eq('id', endorserAttorneyId)
    .single()

  if (!endorser?.is_verified) {
    return NextResponse.json(
      { error: 'Only verified attorneys can endorse peers' },
      { status: 403 }
    )
  }

  // Insert endorsement (RLS will enforce endorser ownership)
  const { data: endorsement, error: insertError } = await supabase
    .from('peer_endorsements')
    .insert({
      endorser_id: endorserAttorneyId,
      endorsed_id: endorsed_attorney_id,
      specialty_id,
      comment: comment?.trim() || null,
    })
    .select('id')
    .single()

  if (insertError) {
    // Unique violation = already endorsed
    if (insertError.code === '23505') {
      return NextResponse.json(
        { error: 'You have already endorsed this attorney for this specialty' },
        { status: 409 }
      )
    }
    logger.error('Failed to create endorsement', insertError)
    return NextResponse.json(
      { error: 'Failed to create endorsement' },
      { status: 500 }
    )
  }

  return NextResponse.json({
    success: true,
    data: endorsement,
    message: 'Endorsement created successfully',
  }, { status: 201 })
}, { requireAttorney: true })
