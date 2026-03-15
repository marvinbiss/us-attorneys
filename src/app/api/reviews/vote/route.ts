/**
 * Review Vote API - US Attorneys
 * Handles "Was this review helpful?" votes with deduplication
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/logger'
import { z } from 'zod'

const voteSchema = z.object({
  reviewId: z.string().uuid(),
})

export const dynamic = 'force-dynamic'

/**
 * Build a voter fingerprint for deduplication.
 * Authenticated user -> user id; anonymous -> IP address.
 */
function getVoterFingerprint(
  userId: string | null,
  request: Request
): string {
  if (userId) return `user:${userId}`
  const forwarded = request.headers.get('x-forwarded-for')
  const ip =
    forwarded?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  return `ip:${ip}`
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const result = voteSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: { message: 'Invalid request', details: result.error.flatten() } },
        { status: 400 }
      )
    }
    const { reviewId } = result.data

    const supabase = await createClient()

    // Optional auth for fingerprint
    const { data: { user } } = await supabase.auth.getUser()
    const fingerprint = getVoterFingerprint(user?.id ?? null, request)

    const adminSupabase = createAdminClient()

    // Verify the review exists and is published
    const { data: review, error: fetchError } = await adminSupabase
      .from('reviews')
      .select('id, helpful_count')
      .eq('id', reviewId)
      .eq('status', 'published')
      .single()

    if (fetchError || !review) {
      return NextResponse.json(
        { success: false, error: { message: 'Review not found or not published' } },
        { status: 404 }
      )
    }

    // Try deduplication via review_votes upsert
    try {
      const { error: voteError } = await adminSupabase
        .from('review_votes')
        .upsert(
          {
            review_id: reviewId,
            voter_fingerprint: fingerprint,
            is_helpful: true,
          },
          { onConflict: 'review_id,voter_fingerprint', ignoreDuplicates: true }
        )

      if (voteError) {
        // If review_votes table doesn't exist yet (42P01), fall through
        const pgCode = typeof voteError === 'object' && voteError !== null && 'code' in voteError
          ? (voteError as { code: string }).code
          : undefined
        if (pgCode === '42P01') {
          throw new Error('TABLE_NOT_FOUND')
        }
        throw voteError
      }

      // Recount from actual votes (authoritative, avoids race condition)
      const { count, error: countError } = await adminSupabase
        .from('review_votes')
        .select('id', { count: 'exact', head: true })
        .eq('review_id', reviewId)
        .eq('is_helpful', true)

      if (countError) throw countError

      const newCount = count ?? 0
      const { error: updateError } = await adminSupabase
        .from('reviews')
        .update({ helpful_count: newCount })
        .eq('id', reviewId)

      if (updateError) throw updateError

      return NextResponse.json({ success: true, helpful_count: newCount })
    } catch (err) {
      // Fallback: review_votes table doesn't exist yet
      const msg = err instanceof Error ? err.message : ''
      if (msg === 'TABLE_NOT_FOUND') {
        logger.warn('review_votes table missing - falling back to simple increment')
        const { error: updateError } = await adminSupabase
          .from('reviews')
          .update({ helpful_count: (review.helpful_count ?? 0) + 1 })
          .eq('id', reviewId)

        if (updateError) throw updateError

        return NextResponse.json({
          success: true,
          helpful_count: (review.helpful_count ?? 0) + 1,
        })
      }
      throw err
    }
  } catch (error) {
    logger.error('Erreur vote avis:', error)
    return NextResponse.json(
      { success: false, error: { message: 'Erreur serveur lors du vote' } },
      { status: 500 }
    )
  }
}
