import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requirePermission, logAdminAction } from '@/lib/admin-auth'
import { logger } from '@/lib/logger'
import { isValidUuid } from '@/lib/sanitize'
import { z } from 'zod'

// POST request schema
const gdprDeleteSchema = z.object({
  confirmDelete: z.literal('SUPPRIMER'),
})

export const dynamic = 'force-dynamic'

// POST - Supprimer/Anonymiser les données d'un utilisateur (RGPD)
export async function POST(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    // Verify admin with users:delete permission (GDPR deletion is critical)
    const authResult = await requirePermission('users', 'delete')
    if (!authResult.success || !authResult.admin) {
      return authResult.error
    }

    if (!isValidUuid(params.userId)) {
      return NextResponse.json(
        { success: false, error: { message: 'Identifiant invalide' } },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()
    const userId = params.userId
    const body = await request.json()
    const result = gdprDeleteSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: { message: 'Confirmation requise (SUPPRIMER)', details: result.error.flatten() } },
        { status: 400 }
      )
    }

    const completedSteps: string[] = []

    try {
      // Étape 1 — Récupérer l'email du profil pour anonymiser les avis client
      completedSteps.push('fetch_profile')
      const { data: profileData } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', userId)
        .maybeSingle()

      // Étape 2 — Vérifier si l'utilisateur est un artisan
      completedSteps.push('check_artisan')
      const { data: artisanRecord } = await supabase
        .from('attorneys')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle()

      // Étape 3 — Anonymiser le profil (seules les colonnes qui existent sur profiles)
      completedSteps.push('anonymize_profile')
      await supabase
        .from('profiles')
        .update({
          email: `deleted_${userId.slice(0, 8)}@anonymized.local`,
          full_name: 'Utilisateur supprimé',
          phone_e164: null,
        })
        .eq('id', userId)

      // Étape 4 — Anonymiser les avis client (filtrés par client_email)
      completedSteps.push('anonymize_client_reviews')
      if (profileData?.email) {
        await supabase
          .from('reviews')
          .update({
            client_name: 'Utilisateur supprimé',
            client_email: 'deleted@anonymized.local',
          })
          .eq('client_email', profileData.email)
      }

      // Étape 5 — Anonymiser les réponses d'avis uniquement si l'utilisateur est un artisan
      completedSteps.push('anonymize_artisan_reviews')
      if (artisanRecord) {
        await supabase
          .from('reviews')
          .update({
            artisan_response: null,
            artisan_responded_at: null,
          })
          .eq('attorney_id', userId)
      }

      // Étape 6 — Désactiver le provider si c'est un artisan
      completedSteps.push('deactivate_provider')
      if (artisanRecord) {
        await supabase
          .from('attorneys')
          .update({
            is_active: false,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', userId)
      }

      // Étape 7 — Log d'audit
      completedSteps.push('audit_log')
      await logAdminAction(authResult.admin.id, 'gdpr.delete', 'user', userId, { anonymized: true })
    } catch (stepError) {
      const failedStep = completedSteps[completedSteps.length - 1] ?? 'unknown'
      logger.error('GDPR delete failed at step', { completedSteps, userId, error: stepError })
      return NextResponse.json(
        {
          success: false,
          error: {
            message: `Suppression partielle — étape échouée: ${failedStep}`,
            completedSteps,
          },
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Données utilisateur anonymisées conformément au RGPD',
    })
  } catch (error) {
    logger.error('Admin GDPR delete error', error)
    return NextResponse.json(
      { success: false, error: { message: 'Erreur serveur' } },
      { status: 500 }
    )
  }
}
