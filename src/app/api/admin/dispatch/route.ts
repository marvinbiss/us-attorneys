/**
 * Admin Dispatch API
 * GET: Dispatch monitoring (queue status, recent assignments)
 * POST: Dispatch actions (reassign, replay)
 */

import { NextRequest, NextResponse } from 'next/server'
import { requirePermission, logAdminAction } from '@/lib/admin-auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { logLeadEvent } from '@/lib/dashboard/events'
import { dispatchLead } from '@/app/actions/dispatch'
import { logger } from '@/lib/logger'
import { isValidUuid } from '@/lib/sanitize'
import { z } from 'zod'

const actionBodySchema = z.object({
  action: z.enum(['reassign', 'replay']),
  assignmentId: z.string().uuid(),
  newProviderId: z.string().uuid().optional(),
})

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  // Verify admin with services:read permission
  const auth = await requirePermission('services', 'read')
  if (!auth.success || !auth.admin) return auth.error!

  try {
    const supabase = createAdminClient()
    const url = new URL(request.url)
    const page = parseInt(url.searchParams.get('page') || '1')
    const limit = 20
    const offset = (page - 1) * limit

    // Recent assignments with provider info
    const { data: assignments, error: assignError } = await supabase
      .from('lead_assignments')
      .select(`
        id,
        lead_id,
        status,
        assigned_at,
        viewed_at,
        source_table,
        score,
        distance_km,
        position,
        attorney:attorneys(id, name, specialty, address_city)
      `)
      .order('assigned_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (assignError) {
      logger.warn('Dispatch assignments query failed', { code: assignError.code, message: assignError.message })
      return NextResponse.json({
        assignments: [],
        stats: { pending: 0, viewed: 0, quoted: 0, total: 0 },
        page,
        pageSize: limit,
      })
    }

    // Queue stats - fetch all counts in parallel
    const [
      { count: pendingCount },
      { count: viewedCount },
      { count: quotedCount },
      { count: totalCount },
    ] = await Promise.all([
      supabase.from('lead_assignments').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('lead_assignments').select('id', { count: 'exact', head: true }).eq('status', 'viewed'),
      supabase.from('lead_assignments').select('id', { count: 'exact', head: true }).eq('status', 'quoted'),
      supabase.from('lead_assignments').select('id', { count: 'exact', head: true }),
    ])

    return NextResponse.json({
      assignments: assignments || [],
      stats: {
        pending: pendingCount || 0,
        viewed: viewedCount || 0,
        quoted: quotedCount || 0,
        total: totalCount || 0,
      },
      page,
      pageSize: limit,
    })
  } catch (error) {
    logger.error('Dispatch GET error', error)
    return NextResponse.json({
      assignments: [],
      stats: { pending: 0, viewed: 0, quoted: 0, total: 0 },
      page: 1,
      pageSize: 20,
    })
  }
}

export async function POST(request: NextRequest) {
  // Verify admin with services:write permission
  const auth = await requirePermission('services', 'write')
  if (!auth.success || !auth.admin) return auth.error!

  try {
    const body = await request.json()
    const bodyValidation = actionBodySchema.safeParse(body)
    if (!bodyValidation.success) {
      return NextResponse.json(
        { success: false, error: { message: 'Invalid parameters', details: bodyValidation.error.flatten() } },
        { status: 400 }
      )
    }
    const { action, assignmentId, newProviderId } = bodyValidation.data

    const supabase = createAdminClient()

    if (action === 'reassign') {
      if (!newProviderId) {
        return NextResponse.json({ success: false, error: { message: 'newProviderId required for reassign' } }, { status: 400 })
      }

      // Get current assignment
      const { data: current } = await supabase
        .from('lead_assignments')
        .select('lead_id, attorney_id, source_table')
        .eq('id', assignmentId)
        .single()

      if (!current) {
        return NextResponse.json({ success: false, error: { message: 'Assignment not found' } }, { status: 404 })
      }

      // Update assignment to new provider
      await supabase
        .from('lead_assignments')
        .update({
          attorney_id: newProviderId,
          status: 'pending',
          assigned_at: new Date().toISOString(),
          viewed_at: null,
        })
        .eq('id', assignmentId)

      await logLeadEvent(current.lead_id, 'reassigned', {
        attorneyId: newProviderId,
        actorId: auth.admin.id,
        metadata: {
          previousProviderId: current.attorney_id,
          reason: 'admin_reassign',
        },
      })

      await logAdminAction(
        auth.admin.id,
        'dispatch_reassign',
        'lead_assignment',
        assignmentId,
        { from: current.attorney_id, to: newProviderId }
      )
    } else if (action === 'replay') {
      // Re-dispatch using configurable algorithm
      const { data: currentReplay } = await supabase
        .from('lead_assignments')
        .select('lead_id, source_table')
        .eq('id', assignmentId)
        .single()

      if (!currentReplay) {
        return NextResponse.json({ success: false, error: { message: 'Assignment not found' } }, { status: 404 })
      }

      const result = await dispatchLead(currentReplay.lead_id, {
        sourceTable: (currentReplay.source_table as 'devis_requests' | 'leads') || 'devis_requests', // legacy table name 'devis_requests' = consultation requests
      })

      await logAdminAction(
        auth.admin.id,
        'dispatch_replay',
        'lead_assignment',
        assignmentId,
        { newAssignments: result }
      )
    } else {
      return NextResponse.json({ success: false, error: { message: 'Invalid action' } }, { status: 400 })
    }

    return NextResponse.json({ success: true, action })
  } catch (error) {
    logger.error('Dispatch POST error', error)
    return NextResponse.json({ success: false, error: { message: 'Server error' } }, { status: 500 })
  }
}

// DELETE - Delete an assignment
export async function DELETE(request: NextRequest) {
  const auth = await requirePermission('services', 'delete')
  if (!auth.success || !auth.admin) return auth.error!

  try {
    const body = await request.json()
    const id = body?.id

    if (!id || !isValidUuid(id)) {
      return NextResponse.json(
        { success: false, error: { message: 'Invalid ID' } },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    const { error } = await supabase
      .from('lead_assignments')
      .delete()
      .eq('id', id)

    if (error) {
      logger.error('Dispatch assignment delete error', error)
      return NextResponse.json(
        { success: false, error: { message: 'Error during deletion' } },
        { status: 500 }
      )
    }

    await logAdminAction(auth.admin.id, 'dispatch_assignment_deleted', 'lead_assignment', id)

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('Dispatch assignment delete error', error)
    return NextResponse.json(
      { success: false, error: { message: 'Server error' } },
      { status: 500 }
    )
  }
}
