/**
 * Questions API - Ask a Lawyer Q&A Platform
 * GET: List questions with pagination, filter by specialty/state/status
 * POST: Create question (authenticated, rate limited)
 */

import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createApiHandler, paginatedResponse, jsonResponse } from '@/lib/api/handler'
import { createAdminClient } from '@/lib/supabase/admin'
import { rateLimit, RATE_LIMITS } from '@/lib/rate-limiter'
import { slugify } from '@/lib/utils'
import { logger } from '@/lib/logger'
import { ValidationError } from '@/lib/errors'

// GET query params
const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  specialty: z.string().uuid().optional(),
  state: z.string().length(2).optional(),
  status: z.enum(['open', 'answered', 'closed']).optional(),
  sort: z.enum(['recent', 'popular', 'unanswered']).default('recent'),
})

// POST body schema
const createQuestionSchema = z.object({
  title: z.string().min(10, 'Title must be at least 10 characters').max(200),
  body: z.string().min(30, 'Question must be at least 30 characters').max(5000),
  specialty_id: z.string().uuid().optional(),
  state_code: z.string().length(2).optional(),
  city: z.string().max(100).optional(),
})

// GET /api/questions
export const GET = createApiHandler(async ({ request }) => {
  const { searchParams } = new URL(request.url)

  const parsed = listQuerySchema.safeParse({
    page: searchParams.get('page') || 1,
    limit: searchParams.get('limit') || 20,
    specialty: searchParams.get('specialty') || undefined,
    state: searchParams.get('state') || undefined,
    status: searchParams.get('status') || undefined,
    sort: searchParams.get('sort') || 'recent',
  })

  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues.map(e => e.message).join(', '))
  }

  const { page, limit, specialty, state, status, sort } = parsed.data
  const offset = (page - 1) * limit

  const supabase = createAdminClient()

  // Build query
  let query = supabase
    .from('legal_questions')
    .select(`
      id,
      slug,
      title,
      body,
      specialty_id,
      state_code,
      city,
      asked_by_name,
      status,
      view_count,
      answer_count,
      is_featured,
      created_at
    `, { count: 'exact' })
    .neq('status', 'flagged')

  if (specialty) {
    query = query.eq('specialty_id', specialty)
  }
  if (state) {
    query = query.eq('state_code', state)
  }
  if (status) {
    query = query.eq('status', status)
  }

  // Sort
  switch (sort) {
    case 'popular':
      query = query.order('view_count', { ascending: false })
      break
    case 'unanswered':
      query = query.eq('answer_count', 0).order('created_at', { ascending: false })
      break
    default:
      query = query.order('created_at', { ascending: false })
  }

  query = query.range(offset, offset + limit - 1)

  const { data, count, error } = await query

  if (error) {
    logger.error('Failed to fetch questions', error)
    return NextResponse.json({ success: false, error: { message: 'Failed to fetch questions' } }, { status: 500 })
  }

  return paginatedResponse(data || [], {
    page,
    limit,
    total: count || 0,
  })
})

// POST /api/questions
export const POST = createApiHandler(async ({ request, user, body }) => {
  // Rate limit
  const rl = await rateLimit(request, RATE_LIMITS.contact)
  if (!rl.success) {
    return NextResponse.json({ success: false, error: { message: 'Too many requests. Please try again later.' } }, { status: 429 })
  }

  const data = body as z.infer<typeof createQuestionSchema>

  // Generate slug from title
  const baseSlug = slugify(data.title)
  const slug = `${baseSlug}-${Date.now().toString(36)}`

  const supabase = createAdminClient()

  // Get user display name
  let askedByName = 'Anonymous'
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single()
    if (profile?.full_name) {
      askedByName = profile.full_name
    }
  }

  const { data: question, error } = await supabase
    .from('legal_questions')
    .insert({
      slug,
      title: data.title,
      body: data.body,
      specialty_id: data.specialty_id || null,
      state_code: data.state_code || null,
      city: data.city || null,
      asked_by: user?.id || null,
      asked_by_name: askedByName,
      status: 'open',
    })
    .select('id, slug')
    .single()

  if (error) {
    logger.error('Failed to create question', error)
    return NextResponse.json({ success: false, error: { message: 'Failed to create question' } }, { status: 500 })
  }

  return jsonResponse(question, 201)
}, {
  requireAuth: true,
  bodySchema: createQuestionSchema,
})
