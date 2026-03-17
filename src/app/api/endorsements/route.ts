/**
 * Peer Endorsements API
 *
 * GET  — List endorsements for an attorney (by endorsed_id query param)
 * POST — Create an endorsement (verified attorney only, cannot self-endorse)
 */

import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createApiHandler, jsonResponse } from '@/lib/api/handler'
import { createAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/logger'

// ── GET: list endorsements ──────────────────────────────────────────

export const GET = createApiHandler(async ({ request }) => {
  const { searchParams } = new URL(request.url)
  const endorsedId = searchParams.get('endorsed_id')

  if (!endorsedId) {
    return NextResponse.json(
      { success: false, error: { code: 'VALIDATION_ERROR', message: 'endorsed_id is required' } },
      { status: 400 },
    )
  }

  // Validate UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(endorsedId)) {
    return NextResponse.json(
      { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid endorsed_id format' } },
      { status: 400 },
    )
  }

  const supabase = createAdminClient()

  const { data, error } = await supabase
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
        avatar_url,
        specialty,
        address_city,
        address_state,
        is_verified
      )
    `)
    .eq('endorsed_id', endorsedId)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) {
    logger.error('Failed to fetch endorsements', error)
    return NextResponse.json(
      { success: false, error: { code: 'DB_ERROR', message: 'Failed to fetch endorsements' } },
      { status: 500 },
    )
  }

  const response = jsonResponse(data || [])
  response.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600')
  return response
}, {})

// ── POST: create endorsement ────────────────────────────────────────

const createEndorsementSchema = z.object({
  endorsed_id: z.string().uuid('Invalid attorney ID'),
  specialty_id: z.string().uuid('Invalid specialty ID').optional(),
  comment: z.string().max(500, 'Comment must be 500 characters or less').optional(),
})

export const POST = createApiHandler(
  async ({ body, attorney }) => {
    const { endorsed_id, specialty_id, comment } = body
    const endorserId = attorney!.attorney_id

    // Cannot self-endorse (also enforced by DB constraint)
    if (endorserId === endorsed_id) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'You cannot endorse yourself' } },
        { status: 400 },
      )
    }

    const supabase = createAdminClient()

    // Verify the endorsed attorney exists
    const { data: endorsedAttorney } = await supabase
      .from('attorneys')
      .select('id')
      .eq('id', endorsed_id)
      .single()

    if (!endorsedAttorney) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Endorsed attorney not found' } },
        { status: 404 },
      )
    }

    // Verify endorser is verified (also enforced by RLS, but explicit check for clear error)
    const { data: endorserAttorney } = await supabase
      .from('attorneys')
      .select('is_verified')
      .eq('id', endorserId)
      .single()

    if (!endorserAttorney?.is_verified) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Only verified attorneys can endorse others' } },
        { status: 403 },
      )
    }

    const { data, error } = await supabase
      .from('peer_endorsements')
      .insert({
        endorser_id: endorserId,
        endorsed_id,
        specialty_id: specialty_id || null,
        comment: comment || null,
      })
      .select('id, created_at')
      .single()

    if (error) {
      // Unique constraint violation = already endorsed
      if (error.code === '23505') {
        return NextResponse.json(
          { success: false, error: { code: 'CONFLICT', message: 'You have already endorsed this attorney' } },
          { status: 409 },
        )
      }
      logger.error('Failed to create endorsement', error)
      return NextResponse.json(
        { success: false, error: { code: 'DB_ERROR', message: 'Failed to create endorsement' } },
        { status: 500 },
      )
    }

    return jsonResponse(data, 201)
  },
  {
    bodySchema: createEndorsementSchema,
    requireAuth: true,
    requireAttorney: true,
  },
)
