import { NextRequest, NextResponse } from 'next/server'
import { requirePermission } from '@/lib/admin-auth'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

// GET - List GDPR/privacy requests
export async function GET(_request: NextRequest) {
  try {
    // Verify admin with users:read permission (GDPR requests)
    const authResult = await requirePermission('users', 'read')
    if (!authResult.success || !authResult.admin) {
      return authResult.error
    }

    // The data_export_requests table was removed in migration 100.
    // The GDPR queue feature is disabled.
    return NextResponse.json({
      success: true,
      requests: [],
      total: 0,
      page: 1,
      totalPages: 1,
      message: 'GDPR request feature disabled — table not available',
    })
  } catch (error: unknown) {
    logger.error('Admin GDPR requests error', error)
    return NextResponse.json(
      { success: false, error: { message: 'Server error' } },
      { status: 500 }
    )
  }
}
