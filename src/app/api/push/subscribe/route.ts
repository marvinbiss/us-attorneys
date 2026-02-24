/**
 * Push Subscription API - ServicesArtisans
 * Manages push notification subscriptions
 */

import { NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { getVapidPublicKey } from '@/lib/notifications/push'
import { logger } from '@/lib/logger'
import { z } from 'zod'

// POST request schema
const subscribePostSchema = z.object({
  userId: z.string().uuid(),
  subscription: z.object({
    endpoint: z.string().url(),
    keys: z.object({
      p256dh: z.string().min(1),
      auth: z.string().min(1),
    }),
  }),
})

// DELETE request query params schema
const unsubscribeSchema = z.object({
  endpoint: z.string().url().optional(),
  userId: z.string().uuid().optional(),
}).refine(data => data.endpoint || data.userId, {
  message: 'endpoint or userId required',
})

// GET /api/push/subscribe - Get VAPID public key
export const dynamic = 'force-dynamic'

export async function GET() {
  const vapidKey = getVapidPublicKey()

  if (!vapidKey) {
    return NextResponse.json(
      { success: false, error: { message: 'Notifications push non configurées' } },
      { status: 503 }
    )
  }

  return NextResponse.json({ vapidPublicKey: vapidKey })
}

// POST /api/push/subscribe - Subscribe to push notifications
export async function POST(request: Request) {
  try {
    // Auth check: verify caller is the user they claim to be
    const serverSupabase = await createServerClient()
    const { data: { user } } = await serverSupabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ success: false, error: { message: 'Authentification requise' } }, { status: 401 })
    }

    const body = await request.json()
    const result = subscribePostSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json({ success: false, error: { message: 'Requête invalide', details: result.error.flatten() } }, { status: 400 })
    }
    const { userId, subscription } = result.data

    // Verify userId matches authenticated user
    if (userId !== user.id) {
      return NextResponse.json({ success: false, error: { message: 'Non autorisé' } }, { status: 403 })
    }

    // TODO: push_subscriptions table was dropped in migration 100. Re-create the table
    // before re-enabling persistence. For now return success without storing.
    void subscription // suppress unused-var warning

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('Push subscribe error:', error)
    return NextResponse.json(
      { success: false, error: { message: 'Erreur lors de l\'enregistrement de l\'abonnement' } },
      { status: 500 }
    )
  }
}

// DELETE /api/push/subscribe - Unsubscribe from push notifications
export async function DELETE(request: Request) {
  try {
    // Auth check
    const serverSupabase = await createServerClient()
    const { data: { user } } = await serverSupabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ success: false, error: { message: 'Authentification requise' } }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const queryParams = {
      endpoint: searchParams.get('endpoint') || undefined,
      userId: searchParams.get('userId') || undefined,
    }
    const result = unsubscribeSchema.safeParse(queryParams)
    if (!result.success) {
      return NextResponse.json({ success: false, error: { message: 'Requête invalide', details: result.error.flatten() } }, { status: 400 })
    }
    const { endpoint, userId } = result.data

    // Verify userId matches authenticated user if provided
    if (userId && userId !== user.id) {
      return NextResponse.json({ success: false, error: { message: 'Non autorisé' } }, { status: 403 })
    }

    // TODO: push_subscriptions table was dropped in migration 100. Re-create the table
    // before re-enabling deletion. For now return success without DB operation.
    void endpoint
    void userId

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('Push unsubscribe error:', error)
    return NextResponse.json(
      { success: false, error: { message: 'Erreur lors de la suppression de l\'abonnement' } },
      { status: 500 }
    )
  }
}
