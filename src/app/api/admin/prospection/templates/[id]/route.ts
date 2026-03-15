import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requirePermission, logAdminAction } from '@/lib/admin-auth'
import { logger } from '@/lib/logger'
import { isValidUuid } from '@/lib/sanitize'
// DOMPurify lazy-imported inside PATCH to avoid JSDOM crash in serverless cold start
import { z } from 'zod'

const updateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  channel: z.enum(['email', 'sms', 'whatsapp']).optional(),
  audience_type: z.enum(['artisan', 'client', 'mairie']).nullish(),
  subject: z.string().max(200).optional(),
  body: z.string().min(1).max(50000).optional(),
  html_body: z.string().optional(),
  ai_system_prompt: z.string().max(5000).optional(),
  variables: z.array(z.string()).optional(),
  is_active: z.boolean().optional(),
}).strict()

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
        { success: false, error: { message: 'Invalid ID' } },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from('prospection_templates')
      .select('id, name, channel, audience_type, subject, body, html_body, whatsapp_template_name, whatsapp_template_sid, whatsapp_approved, ai_system_prompt, ai_context, variables, is_active, created_by, created_at, updated_at')
      .eq('id', id)
      .single()

    if (error || !data) {
      return NextResponse.json({ success: false, error: { message: 'Template not found' } }, { status: 404 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    logger.error('Get template error', error as Error)
    return NextResponse.json({ success: false, error: { message: 'Server error' } }, { status: 500 })
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
        { success: false, error: { message: 'Invalid ID' } },
        { status: 400 }
      )
    }

    const body = await request.json()
    const parsed = updateSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: { message: 'Invalid data', details: parsed.error.flatten() } },
        { status: 400 }
      )
    }

    // Sanitize template content before storing
    const sanitizedData = { ...parsed.data }
    if (sanitizedData.name) sanitizedData.name = sanitizedData.name.replace(/<[^>]*>/g, '').trim()
    if (sanitizedData.subject) sanitizedData.subject = sanitizedData.subject.replace(/<[^>]*>/g, '').trim()
    if (sanitizedData.html_body) {
      const { default: DOMPurify } = await import('isomorphic-dompurify')
      sanitizedData.html_body = DOMPurify.sanitize(sanitizedData.html_body)
    }

    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from('prospection_templates')
      .update(sanitizedData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ success: false, error: { message: 'Resource not found' } }, { status: 404 })
      }
      logger.error('Update template error', error)
      return NextResponse.json({ success: false, error: { message: 'Error during update' } }, { status: 500 })
    }
    if (!data) {
      return NextResponse.json({ success: false, error: { message: 'Resource not found' } }, { status: 404 })
    }

    await logAdminAction(authResult.admin.id, 'template.update', 'prospection_template', id, {
      updated_fields: Object.keys(parsed.data),
    })

    return NextResponse.json({ success: true, data })
  } catch (error) {
    logger.error('Patch template error', error as Error)
    return NextResponse.json({ success: false, error: { message: 'Server error' } }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requirePermission('prospection', 'write')
    if (!authResult.success || !authResult.admin) return authResult.error

    const { id } = await params
    if (!isValidUuid(id)) {
      return NextResponse.json(
        { success: false, error: { message: 'Invalid ID' } },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    const { error } = await supabase
      .from('prospection_templates')
      .update({ is_active: false })
      .eq('id', id)

    if (error) {
      logger.error('Delete template error', error)
      return NextResponse.json({ success: false, error: { message: 'Error during deletion' } }, { status: 500 })
    }

    await logAdminAction(authResult.admin.id, 'template.delete', 'prospection_template', id)

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('Delete template error', error as Error)
    return NextResponse.json({ success: false, error: { message: 'Server error' } }, { status: 500 })
  }
}
