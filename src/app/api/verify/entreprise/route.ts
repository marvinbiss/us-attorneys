import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import {
  getEntrepriseParSiret,
  getEntrepriseParSiren,
  rechercherEntreprises,
  verifierSanteEntreprise,
  getBadgeConfiance
} from '@/lib/api/pappers'
import { z } from 'zod'

// GET query params schemas
const verifySchema = z.object({
  action: z.literal('verify').optional().default('verify'),
  siret: z.string().min(14).max(14),
})

const sirenSchema = z.object({
  action: z.literal('siren'),
  siren: z.string().min(9).max(9),
})

const searchSchema = z.object({
  action: z.literal('search'),
  q: z.string().min(2).max(200),
  codePostal: z.string().max(10).optional().nullable(),
  limit: z.coerce.number().int().min(1).max(100).optional().default(10),
})

const healthSchema = z.object({
  action: z.literal('health'),
  siret: z.string().min(14).max(14),
})

// POST request schema
const entreprisePostSchema = z.object({
  siret: z.string().min(14).max(14),
  attorneyId: z.string().uuid().optional(),
})

/**
 * API de vérification d'entreprise
 * Combine les données INSEE et Pappers pour une vérification complète
 */

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const action = searchParams.get('action') || 'verify'

  try {
    switch (action) {
      // Vérification complète par SIRET
      case 'verify': {
        const queryParams = {
          action: 'verify' as const,
          siret: searchParams.get('siret'),
        }
        const result = verifySchema.safeParse(queryParams)
        if (!result.success) {
          return NextResponse.json(
            { success: false, error: { message: 'SIRET requis (14 chiffres)', details: result.error.flatten() } },
            { status: 400 }
          )
        }
        const { siret } = result.data

        // Récupérer les infos Pappers
        const entreprise = await getEntrepriseParSiret(siret)

        if (!entreprise) {
          return NextResponse.json({
            success: false,
            error: { message: 'Entreprise non trouvée' },
            code: 'NOT_FOUND'
          })
        }

        // Vérifier la santé
        const sante = await verifierSanteEntreprise(siret)
        const badge = getBadgeConfiance(entreprise)

        return NextResponse.json({
          success: true,
          data: {
            entreprise,
            verification: {
              sante,
              badge
            }
          }
        })
      }

      // Vérification par SIREN
      case 'siren': {
        const queryParams = {
          action: 'siren' as const,
          siren: searchParams.get('siren'),
        }
        const result = sirenSchema.safeParse(queryParams)
        if (!result.success) {
          return NextResponse.json(
            { success: false, error: { message: 'SIREN requis (9 chiffres)', details: result.error.flatten() } },
            { status: 400 }
          )
        }
        const { siren } = result.data

        const entreprise = await getEntrepriseParSiren(siren)

        if (!entreprise) {
          return NextResponse.json({
            success: false,
            error: { message: 'Entreprise non trouvée' },
            code: 'NOT_FOUND'
          })
        }

        return NextResponse.json({
          success: true,
          data: { entreprise }
        })
      }

      // Recherche par nom
      case 'search': {
        const queryParams = {
          action: 'search' as const,
          q: searchParams.get('q'),
          codePostal: searchParams.get('codePostal'),
          limit: searchParams.get('limit') || '10',
        }
        const result = searchSchema.safeParse(queryParams)
        if (!result.success) {
          return NextResponse.json(
            { success: false, error: { message: 'Requête trop courte (min 2 caractères)', details: result.error.flatten() } },
            { status: 400 }
          )
        }
        const { q, codePostal, limit } = result.data

        const resultats = await rechercherEntreprises(q, {
          codePostal: codePostal || undefined,
          limit
        })

        return NextResponse.json({
          success: true,
          data: resultats
        })
      }

      // Vérification santé rapide
      case 'health': {
        const queryParams = {
          action: 'health' as const,
          siret: searchParams.get('siret'),
        }
        const result = healthSchema.safeParse(queryParams)
        if (!result.success) {
          return NextResponse.json(
            { success: false, error: { message: 'SIRET requis (14 chiffres)', details: result.error.flatten() } },
            { status: 400 }
          )
        }
        const { siret } = result.data

        const sante = await verifierSanteEntreprise(siret)

        return NextResponse.json({
          success: true,
          data: sante
        })
      }

      default:
        return NextResponse.json(
          { success: false, error: { message: 'Action invalide' } },
          { status: 400 }
        )
    }
  } catch (error) {
    logger.error('Erreur API entreprise', error)
    return NextResponse.json(
      { success: false, error: { message: 'Erreur serveur' } },
      { status: 500 }
    )
  }
}

/**
 * POST - Enrichir un profil artisan avec les données Pappers
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const result = entreprisePostSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: { message: 'Erreur de validation', details: result.error.flatten() } },
        { status: 400 }
      )
    }
    const { siret, attorneyId } = result.data

    // Récupérer les données Pappers
    const entreprise = await getEntrepriseParSiret(siret)

    if (!entreprise) {
      return NextResponse.json({
        success: false,
        error: { message: 'Entreprise non trouvée' }
      })
    }

    // Vérifier la santé
    const sante = await verifierSanteEntreprise(siret)
    const badge = getBadgeConfiance(entreprise)

    // Si un attorneyId est fourni, mettre à jour le profil
    if (attorneyId) {
      const { createClient } = await import('@supabase/supabase-js')
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )

      // Only update columns that exist in the providers table.
      // Dropped columns: company_name, trust_badge, trust_score, etc.
      // Non-existent columns: siret_verified, company_legal_form, company_naf_*, pappers_data
      await supabase
        .from('attorneys')
        .update({
          siret: siret,
          is_verified: true,
        })
        .eq('id', attorneyId)
    }

    return NextResponse.json({
      success: true,
      data: {
        entreprise,
        verification: {
          sante,
          badge
        }
      }
    })
  } catch (error) {
    logger.error('Erreur enrichissement entreprise', error)
    return NextResponse.json(
      { success: false, error: { message: 'Erreur serveur' } },
      { status: 500 }
    )
  }
}
