/**
 * Peer Endorsements — Single endorsement operations
 * DELETE: Revoke own endorsement
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

const endorsementIdSchema = z.string().uuid('Invalid endorsement ID')

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const parsed = endorsementIdSchema.safeParse(id)
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0]?.message || 'Invalid endorsement ID' } },
        { status: 400 }
      )
    }

    // Get current user
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Find the attorney record for this user
    // adminClient justified: needs to read peer_endorsements across users to verify ownership
    const adminClient = createAdminClient()
    const { data: attorney } = await adminClient
      .from('attorneys')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!attorney) {
      return NextResponse.json(
        { error: 'Attorney profile required' },
        { status: 403 }
      )
    }

    // Verify this endorsement belongs to the current attorney (endorser)
    const { data: endorsement } = await adminClient
      .from('peer_endorsements')
      .select('id, endorser_id')
      .eq('id', id)
      .single()

    if (!endorsement) {
      return NextResponse.json(
        { error: 'Endorsement not found' },
        { status: 404 }
      )
    }

    if (endorsement.endorser_id !== attorney.id) {
      return NextResponse.json(
        { error: 'You can only revoke your own endorsements' },
        { status: 403 }
      )
    }

    // Delete via RLS-enabled client
    const { error: deleteError } = await supabase
      .from('peer_endorsements')
      .delete()
      .eq('id', id)

    if (deleteError) {
      logger.error('Failed to delete endorsement', deleteError)
      return NextResponse.json(
        { error: 'Failed to revoke endorsement' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Endorsement revoked',
    })
  } catch (err: unknown) {
    logger.error('Endorsement DELETE error', err as Error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
