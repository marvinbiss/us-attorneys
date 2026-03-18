/**
 * Deadline Reminder API — US Attorneys
 *
 * POST: Save a deadline reminder (requires authentication)
 *   - Stores in `deadline_reminders` table
 *   - Triggers push/email at 30d, 7d, 1d before deadline
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { rateLimit } from '@/lib/rate-limiter'
import { logger } from '@/lib/logger'

const reminderSchema = z.object({
  specialtySlug: z.string().min(1).max(100),
  stateCode: z.string().length(2).transform(s => s.toUpperCase()),
  incidentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  deadlineDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
})

export async function POST(request: NextRequest) {
  // Rate limit
  const rl = await rateLimit(request, { maxRequests: 10, windowMs: 60_000, failOpen: false })
  if (!rl.success) {
    return NextResponse.json({ error: 'Too many requests.' }, { status: 429 })
  }

  try {
    // Auth check
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required. Please sign in to save deadline reminders.' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const parsed = reminderSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const { specialtySlug, stateCode, incidentDate, deadlineDate } = parsed.data

    // Verify deadline is in the future
    if (new Date(deadlineDate) <= new Date()) {
      return NextResponse.json(
        { error: 'Cannot set reminders for past deadlines.' },
        { status: 400 }
      )
    }

    // Insert reminder (admin client to bypass RLS for insert)
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('deadline_reminders')
      .upsert(
        {
          user_id: user.id,
          specialty_slug: specialtySlug,
          state_code: stateCode,
          incident_date: incidentDate,
          deadline_date: deadlineDate,
          reminded_30d: false,
          reminded_7d: false,
          reminded_1d: false,
        },
        {
          onConflict: 'user_id,specialty_slug,state_code,incident_date',
        }
      )
      .select('id')
      .single()

    if (error) {
      logger.error('Failed to save deadline reminder', { error: error.message, userId: user.id })
      return NextResponse.json(
        { error: 'Failed to save reminder. Please try again.' },
        { status: 500 }
      )
    }

    logger.info('Deadline reminder saved', {
      reminderId: data.id,
      userId: user.id,
      specialtySlug,
      stateCode,
      deadlineDate,
    })

    return NextResponse.json({
      success: true,
      reminderId: data.id,
      message: 'Reminder saved! You will receive notifications at 30, 7, and 1 day before your deadline.',
    })
  } catch (error) {
    logger.error('Deadline reminder API error', { error })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
