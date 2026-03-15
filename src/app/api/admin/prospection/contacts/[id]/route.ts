import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requirePermission, logAdminAction } from '@/lib/admin-auth'
import { logger } from '@/lib/logger'
import { isValidUuid } from '@/lib/sanitize'
import { z } from 'zod'

const updateSchema = z.object({
  contact_name: z.string().max(200).optional(),
  company_name: z.string().max(200).optional(),
  email: z.string().email().max(255).optional(),
  phone: z.string().max(20).optional(),
  address: z.string().max(500).optional(),
  postal_code: z.string().max(10).optional(),
  city: z.string().max(100).optional(),
  department: z.string().max(10).optional(),
  region: z.string().max(100).optional(),
  tags: z.array(z.string()).optional(),
  consent_status: z.enum(['opted_in', 'opted_out']).optional(),
})

export const dynamic = 'force-dynamic'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requirePermission('prospection', 'read')
    if (!authResult.success) return authResult.error

    const { id } = await params
    if (!isValidUuid(id)) {
      return NextResponse.json(
        { success: false, error: { message: 'Identifiant invalide' } },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from('prospection_contacts')
      .select('id, contact_type, company_name, contact_name, email, email_canonical, phone, phone_e164, address, postal_code, city, department, region, location_code, population, attorney_id, source, source_file, source_row, tags, custom_fields, consent_status, opted_out_at, is_active, created_at, updated_at')
      .eq('id', id)
      .single()

    if (error || !data) {
      return NextResponse.json(
        { success: false, error: { message: 'Contact non trouvé' } },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    logger.error('Get contact error', error as Error)
    return NextResponse.json({ success: false, error: { message: 'Erreur serveur' } }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requirePermission('prospection', 'write')
    if (!authResult.success || !authResult.admin) return authResult.error

    const { id } = await params
    if (!isValidUuid(id)) {
      return NextResponse.json(
        { success: false, error: { message: 'Identifiant invalide' } },
        { status: 400 }
      )
    }

    const body = await request.json()
    const parsed = updateSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: { message: 'Données invalides', details: parsed.error.flatten() } },
        { status: 400 }
      )
    }

    // Strip HTML tags from text fields before storing
    const sanitizedData = { ...parsed.data }
    const textFields = ['contact_name', 'company_name', 'address', 'city', 'region'] as const
    for (const field of textFields) {
      if (typeof sanitizedData[field] === 'string') {
        sanitizedData[field] = (sanitizedData[field] as string).replace(/<[^>]*>/g, '').trim()
      }
    }

    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('prospection_contacts')
      .update(sanitizedData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      logger.error('Update contact error', error)
      return NextResponse.json({ success: false, error: { message: 'Erreur lors de la mise à jour' } }, { status: 500 })
    }

    await logAdminAction(authResult.admin.id, 'contact.update', 'prospection_contact', id, {
      updated_fields: Object.keys(parsed.data),
    })

    return NextResponse.json({ success: true, data })
  } catch (error) {
    logger.error('Patch contact error', error as Error)
    return NextResponse.json({ success: false, error: { message: 'Erreur serveur' } }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requirePermission('prospection', 'write')
    if (!authResult.success || !authResult.admin) return authResult.error

    const { id } = await params
    if (!isValidUuid(id)) {
      return NextResponse.json(
        { success: false, error: { message: 'Identifiant invalide' } },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()
    const gdpr = request.nextUrl.searchParams.get('gdpr') === 'true'

    if (gdpr) {
      // RGPD Article 17 — Full erasure
      const { error } = await supabase.rpc('prospection_gdpr_erase', { p_contact_id: id })
      if (error) {
        logger.error('GDPR erase error', error)
        return NextResponse.json({ success: false, error: { message: 'Erreur lors de la suppression' } }, { status: 500 })
      }
      await logAdminAction(authResult.admin.id, 'gdpr_erasure', 'prospection_contact', id, {
        reason: 'RGPD Article 17 - Droit à l\'effacement'
      })
    } else {
      // Soft delete
      const { error } = await supabase
        .from('prospection_contacts')
        .update({ is_active: false })
        .eq('id', id)
      if (error) {
        logger.error('Soft delete contact error', error)
        return NextResponse.json({ success: false, error: { message: 'Erreur lors de la suppression' } }, { status: 500 })
      }
      await logAdminAction(authResult.admin.id, 'contact.delete', 'prospection_contact', id, {
        method: 'soft_delete',
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('Delete contact error', error as Error)
    return NextResponse.json({ success: false, error: { message: 'Erreur serveur' } }, { status: 500 })
  }
}
