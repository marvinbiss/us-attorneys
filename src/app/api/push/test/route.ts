/**
 * POST /api/push/test — Send a test push notification to the current admin user
 *
 * Admin-only endpoint. Useful for verifying the push pipeline end-to-end.
 */

import { NextResponse } from 'next/server'
import { requirePermission } from '@/lib/admin-auth'
import { sendPushToUser } from '@/lib/push/send'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

const pushLogger = logger.child({ component: 'push' })

export async function POST() {
  try {
    // Admin-only: require at least settings:read permission
    const auth = await requirePermission('settings', 'read')
    if (!auth.success || !auth.admin) {
      return auth.error!
    }

    const result = await sendPushToUser(auth.admin.id, {
      title: 'US Attorneys — Test Notification',
      body: 'Push notifications are working correctly!',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      url: '/admin',
      tag: 'test-notification',
    })

    if (result.sent === 0 && result.failed === 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NO_SUBSCRIPTIONS',
            message: 'No push subscriptions found for your account. Enable notifications first.',
          },
        },
        { status: 404 },
      )
    }

    pushLogger.info('Test push sent', {
      userId: auth.admin.id,
      sent: result.sent.toString(),
      failed: result.failed.toString(),
    })

    return NextResponse.json({
      success: true,
      sent: result.sent,
      failed: result.failed,
    })
  } catch (error: unknown) {
    pushLogger.error('Test push error', error)
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'Internal server error' } },
      { status: 500 },
    )
  }
}
