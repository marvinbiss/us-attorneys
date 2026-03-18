/**
 * POST /api/push/subscribe   — Save push subscription for current user
 * DELETE /api/push/subscribe  — Remove push subscription (unsubscribe)
 *
 * Subscriptions are stored in the push_subscriptions table (migration 434).
 * RLS ensures users can only manage their own subscriptions.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/logger'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const pushLogger = logger.child({ component: 'push' })

// ---------------------------------------------------------------------------
// Validation schemas
// ---------------------------------------------------------------------------

const subscriptionSchema = z.object({
  endpoint: z.string().url().min(10).max(2048),
  expirationTime: z.number().nullable().optional(),
  keys: z.object({
    p256dh: z.string().min(10).max(512),
    auth: z.string().min(10).max(512),
  }),
})

const unsubscribeSchema = z.object({
  endpoint: z.string().url().min(10).max(2048),
})

// ---------------------------------------------------------------------------
// POST — Subscribe
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 },
      )
    }

    const body = await request.json()
    const parsed = subscriptionSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid subscription object',
            details: parsed.error.flatten().fieldErrors,
          },
        },
        { status: 400 },
      )
    }

    const { endpoint, keys } = parsed.data

    // Use admin client to bypass RLS for upsert (we verified user above)
    const adminSupabase = createAdminClient()

    // Upsert — if this exact endpoint already exists for this user, update keys
    const { error: upsertError } = await adminSupabase
      .from('push_subscriptions')
      .upsert(
        {
          user_id: user.id,
          endpoint,
          p256dh: keys.p256dh,
          auth: keys.auth,
          last_used_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,endpoint' },
      )

    if (upsertError) {
      pushLogger.error('Failed to save push subscription', upsertError, { userId: user.id })
      return NextResponse.json(
        { success: false, error: { code: 'DB_ERROR', message: 'Failed to save subscription' } },
        { status: 500 },
      )
    }

    pushLogger.info('Push subscription saved', { userId: user.id })
    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    pushLogger.error('Push subscribe error', error)
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'Internal server error' } },
      { status: 500 },
    )
  }
}

// ---------------------------------------------------------------------------
// DELETE — Unsubscribe
// ---------------------------------------------------------------------------

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 },
      )
    }

    const body = await request.json()
    const parsed = unsubscribeSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid endpoint' } },
        { status: 400 },
      )
    }

    const adminSupabase = createAdminClient()

    const { error: deleteError } = await adminSupabase
      .from('push_subscriptions')
      .delete()
      .eq('user_id', user.id)
      .eq('endpoint', parsed.data.endpoint)

    if (deleteError) {
      pushLogger.error('Failed to delete push subscription', deleteError, { userId: user.id })
      return NextResponse.json(
        { success: false, error: { code: 'DB_ERROR', message: 'Failed to remove subscription' } },
        { status: 500 },
      )
    }

    pushLogger.info('Push subscription removed', { userId: user.id })
    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    pushLogger.error('Push unsubscribe error', error)
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'Internal server error' } },
      { status: 500 },
    )
  }
}
