/**
 * Vote API - Q&A Platform
 * POST: Upvote/downvote a question or answer (authenticated)
 */

import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createApiHandler, jsonResponse } from '@/lib/api/handler'
import { createAdminClient } from '@/lib/supabase/admin'
import { rateLimit, RATE_LIMITS } from '@/lib/rate-limiter'
import { logger } from '@/lib/logger'
import { NotFoundError, ValidationError } from '@/lib/errors'

const voteSchema = z.object({
  vote_type: z.enum(['up', 'down']),
  answer_id: z.string().uuid().optional(),
})

// POST /api/questions/[id]/vote
export const POST = createApiHandler(async ({ request, user, body }) => {
  const rl = await rateLimit(request, RATE_LIMITS.contact)
  if (!rl.success) {
    return NextResponse.json(
      { success: false, error: { message: 'Too many requests.' } },
      { status: 429 }
    )
  }

  const url = new URL(request.url)
  const segments = url.pathname.split('/')
  const questionsIdx = segments.indexOf('questions')
  const questionId = segments[questionsIdx + 1]

  if (!questionId) {
    throw new NotFoundError('Question')
  }

  const data = body as z.infer<typeof voteSchema>
  const userId = user!.id
  const supabase = createAdminClient()

  // Verify question exists
  const { data: question, error: qError } = await supabase
    .from('legal_questions')
    .select('id')
    .eq('id', questionId)
    .single()

  if (qError || !question) {
    throw new NotFoundError('Question')
  }

  // If voting on an answer, verify it belongs to this question
  if (data.answer_id) {
    const { data: answer, error: aError } = await supabase
      .from('legal_answers')
      .select('id')
      .eq('id', data.answer_id)
      .eq('question_id', questionId)
      .single()

    if (aError || !answer) {
      throw new ValidationError('Answer not found for this question')
    }
  }

  // Determine vote target
  const voteTarget = data.answer_id
    ? { answer_id: data.answer_id, question_id: null }
    : { question_id: questionId, answer_id: null }

  // Check for existing vote
  let existingQuery = supabase
    .from('qa_votes')
    .select('id, vote_type')
    .eq('user_id', userId)

  if (data.answer_id) {
    existingQuery = existingQuery.eq('answer_id', data.answer_id)
  } else {
    existingQuery = existingQuery.eq('question_id', questionId)
  }

  const { data: existing } = await existingQuery.maybeSingle()

  if (existing) {
    if (existing.vote_type === data.vote_type) {
      // Same vote — remove it (toggle off)
      await supabase.from('qa_votes').delete().eq('id', existing.id)
      return jsonResponse({ action: 'removed', vote_type: null })
    }
    // Different vote — remove old, insert new
    await supabase.from('qa_votes').delete().eq('id', existing.id)
  }

  // Insert new vote
  const { error: insertError } = await supabase
    .from('qa_votes')
    .insert({
      user_id: userId,
      ...voteTarget,
      vote_type: data.vote_type,
    })

  if (insertError) {
    logger.error('Failed to insert vote', insertError)
    return NextResponse.json(
      { success: false, error: { message: 'Failed to record vote' } },
      { status: 500 }
    )
  }

  return jsonResponse({ action: existing ? 'changed' : 'voted', vote_type: data.vote_type })
}, {
  requireAuth: true,
  bodySchema: voteSchema,
})
