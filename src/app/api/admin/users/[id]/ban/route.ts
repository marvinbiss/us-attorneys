import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requirePermission, logAdminAction } from '@/lib/admin-auth'
import { logger } from '@/lib/logger'
import { isValidUuid } from '@/lib/sanitize'
import { z } from 'zod'

// POST request schema
const banUserSchema = z.object({
  action: z.enum(['ban', 'unban']),
  reason: z.string().max(500).optional(),
})

export const dynamic = 'force-dynamic'

// POST - Bannir ou débannir un utilisateur
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify admin with users:write permission
    const authResult = await requirePermission('users', 'write')
    if (!authResult.success || !authResult.admin) {
      return authResult.error
    }

    if (!isValidUuid(params.id)) {
      return NextResponse.json(
        { success: false, error: { message: 'Identifiant invalide' } },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()
    const body = await request.json()
    const result = banUserSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: { message: 'Erreur de validation', details: result.error.flatten() } },
        { status: 400 }
      )
    }
    const { action, reason } = result.data

    const isBanning = action === 'ban'

    // Ban/unban via Supabase Auth admin API
    // ban_duration: '876600h' (~100 years) to ban, 'none' to unban
    const { error: authError } = await supabase.auth.admin.updateUserById(params.id, {
      ban_duration: isBanning ? '876600h' : 'none',
    })

    if (authError) {
      logger.error('User ban/unban failed', { code: authError.message })
      return NextResponse.json(
        { success: false, error: { message: 'Impossible de modifier le statut de l\'utilisateur' } },
        { status: 500 }
      )
    }

    // Si c'est un artisan, désactiver/réactiver également le provider
    await supabase
      .from('attorneys')
      .update({
        is_active: !isBanning,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', params.id)

    // Enregistrer l'action dans les logs d'audit
    await logAdminAction(
      authResult.admin.id,
      isBanning ? 'user.ban' : 'user.unban',
      'user',
      params.id,
      { is_banned: isBanning, reason }
    )

    return NextResponse.json({
      success: true,
      message: isBanning ? 'Utilisateur banni' : 'Utilisateur débanni',
    })
  } catch (error) {
    logger.error('Admin user ban error', error)
    return NextResponse.json(
      { success: false, error: { message: 'Erreur serveur' } },
      { status: 500 }
    )
  }
}
