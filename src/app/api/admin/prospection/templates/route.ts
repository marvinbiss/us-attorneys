import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requirePermission, logAdminAction } from '@/lib/admin-auth'
import { logger } from '@/lib/logger'
// DOMPurify lazy-imported inside POST to avoid JSDOM crash in serverless cold start
import { z } from 'zod'

const createSchema = z.object({
  name: z.string().min(1).max(200),
  channel: z.enum(['email', 'sms', 'whatsapp']),
  audience_type: z.enum(['attorney', 'client', 'municipality']).optional(),
  subject: z.string().max(200).optional(),
  body: z.string().min(1),
  html_body: z.string().optional(),
  whatsapp_template_name: z.string().optional(),
  whatsapp_template_sid: z.string().optional(),
  ai_system_prompt: z.string().optional(),
  ai_context: z.record(z.string(), z.unknown()).optional(),
  variables: z.array(z.string()).optional(),
})

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const authResult = await requirePermission('prospection', 'read')
    if (!authResult.success) return authResult.error

    const supabase = createAdminClient()
    const channel = request.nextUrl.searchParams.get('channel')
    const audience = request.nextUrl.searchParams.get('audience_type')
    const page = Math.max(parseInt(request.nextUrl.searchParams.get('page') || '1') || 1, 1)
    const limit = Math.min(Math.max(parseInt(request.nextUrl.searchParams.get('limit') || '50') || 50, 1), 100)
    const offset = (page - 1) * limit

    let query = supabase
      .from('prospection_templates')
      .select('*', { count: 'exact' })
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (channel) query = query.eq('channel', channel)
    if (audience) query = query.eq('audience_type', audience)

    query = query.range(offset, offset + limit - 1)

    const { data, count, error } = await query

    if (error) {
      logger.warn('List templates query failed, returning empty list', { code: error.code, message: error.message })
      return NextResponse.json({ success: true, data: [], pagination: { page, limit, total: 0 } })
    }

    return NextResponse.json({ success: true, data, pagination: { page, limit, total: count || 0 } })
  } catch (error) {
    logger.error('Templates GET error', error as Error)
    return NextResponse.json({ success: false, error: { message: 'Server error' } }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requirePermission('prospection', 'write')
    if (!authResult.success || !authResult.admin) return authResult.error

    const supabase = createAdminClient()
    const body = await request.json()
    const parsed = createSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: { message: 'Invalid data', details: parsed.error.flatten() } },
        { status: 400 }
      )
    }

    // Sanitize template content before storing
    const sanitizedData = { ...parsed.data }
    // Strip HTML from text-only fields
    if (sanitizedData.name) sanitizedData.name = sanitizedData.name.replace(/<[^>]*>/g, '').trim()
    if (sanitizedData.subject) sanitizedData.subject = sanitizedData.subject.replace(/<[^>]*>/g, '').trim()
    // Sanitize HTML body (allow safe HTML tags only)
    if (sanitizedData.html_body) {
      const { default: DOMPurify } = await import('isomorphic-dompurify')
      sanitizedData.html_body = DOMPurify.sanitize(sanitizedData.html_body)
    }

    const { data, error } = await supabase
      .from('prospection_templates')
      .insert({ ...sanitizedData, created_by: authResult.admin.id })
      .select()
      .single()

    if (error) {
      logger.error('Create template error', error)
      return NextResponse.json({ success: false, error: { message: 'Error during creation' } }, { status: 500 })
    }

    await logAdminAction(authResult.admin.id, 'template.create', 'prospection_template', data.id, {
      name: sanitizedData.name,
      channel: sanitizedData.channel,
      audience_type: sanitizedData.audience_type,
    })

    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (error) {
    logger.error('Templates POST error', error as Error)
    return NextResponse.json({ success: false, error: { message: 'Server error' } }, { status: 500 })
  }
}
