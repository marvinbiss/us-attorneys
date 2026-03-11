/**
 * Estimation Lead API - ServicesArtisans
 * Handles lead submissions from chat and callback estimation flows
 */

import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/logger'
import { headers } from 'next/headers'

export const dynamic = 'force-dynamic'

const estimationLeadSchema = z.object({
  nom: z.string().optional(),
  telephone: z.string().min(10, 'Numéro de téléphone invalide (min 10 caractères)'),
  email: z.string().email('Email invalide').optional().or(z.literal('')),
  metier: z.string().min(1, 'Le métier est requis'),
  ville: z.string().min(1, 'La ville est requise'),
  departement: z.string().min(1, 'Le département est requis'),
  description_projet: z.string().optional(),
  estimation_min: z.number().optional(),
  estimation_max: z.number().optional(),
  source: z.enum(['chat', 'callback'], { message: 'La source est requise' }),
  conversation_history: z.array(z.unknown()).optional(),
  page_url: z.string().optional(),
  artisan_public_id: z.string().optional(),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Validate input
    const validation = estimationLeadSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Données invalides', details: validation.error.flatten() },
        { status: 400 }
      )
    }

    const data = validation.data
    const supabase = createAdminClient()

    // Normalize empty email to null
    const email = data.email && data.email.length > 0 ? data.email : null

    // Insert into estimation_leads
    const { data: lead, error: dbError } = await supabase
      .from('estimation_leads')
      .insert({
        nom: data.nom || null,
        telephone: data.telephone,
        email,
        metier: data.metier,
        ville: data.ville,
        departement: data.departement,
        description_projet: data.description_projet || null,
        estimation_min: data.estimation_min ?? null,
        estimation_max: data.estimation_max ?? null,
        source: data.source,
        conversation_history: data.conversation_history ?? null,
        page_url: data.page_url || null,
        artisan_public_id: data.artisan_public_id || null,
      })
      .select('id')
      .single()

    if (dbError) {
      logger.error('Estimation lead DB error', dbError)
      return NextResponse.json(
        { error: 'Erreur lors de l\'enregistrement' },
        { status: 500 }
      )
    }

    // Log in audit_logs via admin client (no user session required)
    const headersList = await headers()
    const ipAddress =
      headersList.get('x-forwarded-for')?.split(',')[0] ||
      headersList.get('x-real-ip') ||
      null
    const userAgent = headersList.get('user-agent') || null

    supabase
      .from('audit_logs')
      .insert({
        action: 'estimation_lead.create',
        resource_type: 'estimation_lead',
        resource_id: lead.id,
        new_value: {
          metier: data.metier,
          ville: data.ville,
          departement: data.departement,
          source: data.source,
          artisan_public_id: data.artisan_public_id || null,
        },
        metadata: {
          ip_address: ipAddress,
          user_agent: userAgent,
          page_url: data.page_url || null,
        },
        created_at: new Date().toISOString(),
      })
      .then(({ error }) => {
        if (error) {
          logger.error('Failed to log estimation lead audit event', error)
        }
      })

    return NextResponse.json({ success: true, id: lead.id })
  } catch (error) {
    logger.error('Estimation lead API error', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
