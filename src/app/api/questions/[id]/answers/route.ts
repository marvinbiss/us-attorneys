/**
 * Answers API - Q&A Platform
 * GET: List answers for a question
 * POST: Submit answer (attorney only)
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createApiHandler, jsonResponse } from '@/lib/api/handler'
import { createAdminClient } from '@/lib/supabase/admin'
import { rateLimit, RATE_LIMITS } from '@/lib/rate-limiter'
import { logger } from '@/lib/logger'
import { NotFoundError } from '@/lib/errors'

const createAnswerSchema = z.object({
  body: z.string().min(20, 'Answer must be at least 20 characters').max(10000),
})

// GET /api/questions/[id]/answers
export const GET = createApiHandler(async ({ request }) => {
  const url = new URL(request.url)
  // Extract question ID from URL path: /api/questions/[id]/answers
  const segments = url.pathname.split('/')
  const questionsIdx = segments.indexOf('questions')
  const questionId = segments[questionsIdx + 1]

  if (!questionId) {
    throw new NotFoundError('Question')
  }

  const supabase = createAdminClient()

  // Verify question exists and is not flagged
  const { data: question, error: qError } = await supabase
    .from('legal_questions')
    .select('id, status')
    .eq('id', questionId)
    .single()

  if (qError || !question || question.status === 'flagged') {
    throw new NotFoundError('Question')
  }

  // Fetch answers with attorney info
  const { data: answers, error } = await supabase
    .from('legal_answers')
    .select(`
      id,
      body,
      is_accepted,
      upvotes,
      created_at,
      attorney_id
    `)
    .eq('question_id', questionId)
    .order('is_accepted', { ascending: false })
    .order('upvotes', { ascending: false })
    .order('created_at', { ascending: true })

  if (error) {
    logger.error('Failed to fetch answers', error)
    return NextResponse.json({ success: false, error: { message: 'Failed to fetch answers' } }, { status: 500 })
  }

  // Enrich with attorney details
  const attorneyIds = (answers || [])
    .map(a => a.attorney_id)
    .filter((id): id is string => id !== null)

  let attorneyMap: Record<string, { name: string; slug: string | null; photo_url: string | null; trust_score: number | null }> = {}

  if (attorneyIds.length > 0) {
    const { data: attorneys } = await supabase
      .from('attorneys')
      .select('id, name, slug, photo_url, trust_score')
      .in('id', attorneyIds)

    if (attorneys) {
      attorneyMap = Object.fromEntries(
        attorneys.map(a => [a.id, { name: a.name || 'Attorney', slug: a.slug, photo_url: a.photo_url, trust_score: a.trust_score }])
      )
    }
  }

  const enrichedAnswers = (answers || []).map(a => ({
    ...a,
    attorney: a.attorney_id ? attorneyMap[a.attorney_id] || null : null,
  }))

  return jsonResponse(enrichedAnswers)
})

// POST /api/questions/[id]/answers
export const POST = createApiHandler(async ({ request, attorney, body }) => {
  // Rate limit
  const rl = await rateLimit(request, RATE_LIMITS.contact)
  if (!rl.success) {
    return NextResponse.json({ success: false, error: { message: 'Too many requests.' } }, { status: 429 })
  }

  const url = new URL(request.url)
  const segments = url.pathname.split('/')
  const questionsIdx = segments.indexOf('questions')
  const questionId = segments[questionsIdx + 1]

  if (!questionId) {
    throw new NotFoundError('Question')
  }

  const data = body as z.infer<typeof createAnswerSchema>
  const supabase = createAdminClient()

  // Verify question exists and is open
  const { data: question, error: qError } = await supabase
    .from('legal_questions')
    .select('id, status')
    .eq('id', questionId)
    .single()

  if (qError || !question) {
    throw new NotFoundError('Question')
  }

  if (question.status === 'closed' || question.status === 'flagged') {
    return NextResponse.json({ success: false, error: { message: 'This question is no longer accepting answers.' } }, { status: 400 })
  }

  const attorneyId = attorney!.attorney_id

  // Insert answer
  const { data: answer, error } = await supabase
    .from('legal_answers')
    .insert({
      question_id: questionId,
      attorney_id: attorneyId,
      body: data.body,
    })
    .select('id, created_at')
    .single()

  if (error) {
    logger.error('Failed to create answer', error)
    return NextResponse.json({ success: false, error: { message: 'Failed to submit answer' } }, { status: 500 })
  }

  // Update answer count and status on the question
  await supabase
    .from('legal_questions')
    .update({
      answer_count: (await supabase
        .from('legal_answers')
        .select('id', { count: 'exact', head: true })
        .eq('question_id', questionId)
      ).count || 1,
      status: 'answered',
      updated_at: new Date().toISOString(),
    })
    .eq('id', questionId)

  return jsonResponse(answer, 201)
}, {
  requireAuth: true,
  requireAttorney: true,
  bodySchema: createAnswerSchema,
})
