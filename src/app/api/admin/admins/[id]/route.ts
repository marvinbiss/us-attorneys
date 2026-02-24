import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { type AdminRole } from '@/types/admin'
import { requirePermission, logAdminAction } from '@/lib/admin-auth'
import { logger } from '@/lib/logger'
import { isValidUuid } from '@/lib/sanitize'
import { z } from 'zod'

// PATCH request schema
const updateAdminSchema = z.object({
  role: z.enum(['super_admin', 'admin', 'moderator', 'viewer']).optional(),
  is_admin: z.boolean().optional(),
})

export const dynamic = 'force-dynamic'

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify admin with settings:read permission (admin management)
    const authResult = await requirePermission('settings', 'read')
    if (!authResult.success || !authResult.admin) {
      return authResult.error
    }

    // Only super_admin can view admin details
    if (authResult.admin.role !== 'super_admin') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Réservé aux super admins' } },
        { status: 403 }
      )
    }

    if (!isValidUuid(params.id)) {
      return NextResponse.json(
        { success: false, error: { message: 'Identifiant invalide' } },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    // Fetch admin from profiles table (admin_roles table does not exist)
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('id, email, full_name, role, is_admin, created_at')
      .eq('id', params.id)
      .single()

    if (error) {
      logger.error('Admin fetch error', error)
      return NextResponse.json({ success: false, error: { message: 'Administrateur non trouvé' } }, { status: 404 })
    }

    return NextResponse.json({
      admin: {
        id: profile.id,
        email: profile.email || '',
        full_name: profile.full_name || null,
        role: profile.role as AdminRole | null,
        is_admin: profile.is_admin,
        created_at: profile.created_at,
      },
    })
  } catch (error) {
    logger.error('Admin fetch error', error)
    return NextResponse.json({ success: false, error: { message: 'Erreur serveur' } }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify admin with settings:write permission (admin management)
    const authResult = await requirePermission('settings', 'write')
    if (!authResult.success || !authResult.admin) {
      return authResult.error
    }

    // Only super_admin can modify admins
    if (authResult.admin.role !== 'super_admin') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Seuls les super admins peuvent modifier les rôles' } },
        { status: 403 }
      )
    }

    if (!isValidUuid(params.id)) {
      return NextResponse.json(
        { success: false, error: { message: 'Identifiant invalide' } },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()
    const body = await request.json()
    const result = updateAdminSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: { message: 'Erreur de validation', details: result.error.flatten() } },
        { status: 400 }
      )
    }
    const { role, is_admin } = result.data

    const updateData: Record<string, unknown> = {}
    if (role !== undefined) updateData.role = role
    if (is_admin !== undefined) updateData.is_admin = is_admin
    updateData.updated_at = new Date().toISOString()

    // Update profiles table (admin_roles table does not exist)
    const { data: updatedAdmin, error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', params.id)
      .select('id, email, full_name, role, is_admin, created_at')
      .single()

    if (error) {
      logger.error('Admin update error', error)
      return NextResponse.json({ success: false, error: { message: 'Erreur lors de la mise à jour' } }, { status: 500 })
    }

    // Log audit
    await logAdminAction(authResult.admin.id, 'admin_updated', 'settings', params.id, { role, is_admin })

    return NextResponse.json({
      admin: {
        id: updatedAdmin.id,
        email: updatedAdmin.email || '',
        full_name: updatedAdmin.full_name || null,
        role: updatedAdmin.role as AdminRole | null,
        is_admin: updatedAdmin.is_admin,
        created_at: updatedAdmin.created_at,
      },
    })
  } catch (error) {
    logger.error('Admin update error', error)
    return NextResponse.json({ success: false, error: { message: 'Erreur serveur' } }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify admin with settings:write permission (admin management)
    const authResult = await requirePermission('settings', 'write')
    if (!authResult.success || !authResult.admin) {
      return authResult.error
    }

    // Only super_admin can delete admins
    if (authResult.admin.role !== 'super_admin') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Seuls les super admins peuvent supprimer des administrateurs' } },
        { status: 403 }
      )
    }

    if (!isValidUuid(params.id)) {
      return NextResponse.json(
        { success: false, error: { message: 'Identifiant invalide' } },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    // Revoke admin rights by clearing role and is_admin on profiles table
    const { error } = await supabase
      .from('profiles')
      .update({ role: null, is_admin: false, updated_at: new Date().toISOString() })
      .eq('id', params.id)

    if (error) {
      logger.error('Admin delete error', error)
      return NextResponse.json({ success: false, error: { message: 'Erreur lors de la suppression' } }, { status: 500 })
    }

    // Log audit
    await logAdminAction(authResult.admin.id, 'admin_deleted', 'settings', params.id)

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('Admin delete error', error)
    return NextResponse.json({ success: false, error: { message: 'Erreur serveur' } }, { status: 500 })
  }
}
