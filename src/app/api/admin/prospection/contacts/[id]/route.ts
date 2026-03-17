import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { logAdminAction } from '@/lib/admin-auth'
import { createApiHandler } from '@/lib/api/handler'
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

export const GET = createApiHandler(async (ctx) => {
  const id = ctx.params?.id
  if (!id || !isValidUuid(id)) {
    return NextResponse.json(
      { success: false, error: { message: 'Invalid ID' } },
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
      { success: false, error: { message: 'Contact not found' } },
      { status: 404 }
    )
  }

  return NextResponse.json({ success: true, data })
}, { requireAdmin: true })

export const PATCH = createApiHandler(async (ctx) => {
  const id = ctx.params?.id
  if (!id || !isValidUuid(id)) {
    return NextResponse.json(
      { success: false, error: { message: 'Invalid ID' } },
      { status: 400 }
    )
  }

  const body = ctx.body

  // Strip HTML tags from text fields before storing
  const sanitizedData = { ...body }
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
    return NextResponse.json({ success: false, error: { message: 'Error during update' } }, { status: 500 })
  }

  await logAdminAction(ctx.user!.id, 'contact.update', 'prospection_contact', id, {
    updated_fields: Object.keys(body),
  })

  return NextResponse.json({ success: true, data })
}, { requireAdmin: true, bodySchema: updateSchema })

export const DELETE = createApiHandler(async (ctx) => {
  const id = ctx.params?.id
  if (!id || !isValidUuid(id)) {
    return NextResponse.json(
      { success: false, error: { message: 'Invalid ID' } },
      { status: 400 }
    )
  }

  const supabase = createAdminClient()
  const gdpr = ctx.request.nextUrl.searchParams.get('gdpr') === 'true'

  if (gdpr) {
    // RGPD Article 17 — Full erasure
    const { error } = await supabase.rpc('prospection_gdpr_erase', { p_contact_id: id })
    if (error) {
      logger.error('GDPR erase error', error)
      return NextResponse.json({ success: false, error: { message: 'Error during deletion' } }, { status: 500 })
    }
    await logAdminAction(ctx.user!.id, 'gdpr_erasure', 'prospection_contact', id, {
      reason: 'GDPR Article 17 - Right to erasure'
    })
  } else {
    // Soft delete
    const { error } = await supabase
      .from('prospection_contacts')
      .update({ is_active: false })
      .eq('id', id)
    if (error) {
      logger.error('Soft delete contact error', error)
      return NextResponse.json({ success: false, error: { message: 'Error during deletion' } }, { status: 500 })
    }
    await logAdminAction(ctx.user!.id, 'contact.delete', 'prospection_contact', id, {
      method: 'soft_delete',
    })
  }

  return NextResponse.json({ success: true })
}, { requireAdmin: true })
