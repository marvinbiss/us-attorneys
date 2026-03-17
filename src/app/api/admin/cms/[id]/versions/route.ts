import { NextResponse } from 'next/server'
import { requirePermission } from '@/lib/admin-auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/logger'
import { UUID_RE } from '@/lib/cms-utils'
import { createApiHandler } from '@/lib/api/handler'

export const dynamic = 'force-dynamic'

// --- GET: Version history for a page ---

export const GET = createApiHandler(async ({ params }) => {
  const auth = await requirePermission('content', 'read')
  if (!auth.success) return auth.error!

  const id = params?.id
  if (!id || !UUID_RE.test(id)) {
    return NextResponse.json(
      { success: false, error: { message: 'Invalid ID' } },
      { status: 400 }
    )
  }

  const supabase = createAdminClient()

  // Verify page exists
  const { data: pageExists } = await supabase
    .from('cms_pages')
    .select('id')
    .eq('id', id)
    .single()

  if (!pageExists) {
    return NextResponse.json(
      { success: false, error: { message: 'Page not found' } },
      { status: 404 }
    )
  }

  const { data: versions, error } = await supabase
    .from('cms_page_versions')
    .select('id, page_id, version_number, title, content_json, content_html, structured_data, meta_title, meta_description, status, created_by, created_at, change_summary')
    .eq('page_id', id)
    .order('version_number', { ascending: false })
    .limit(50)

  if (error) {
    logger.error('CMS page versions error', error)
    return NextResponse.json(
      { success: false, error: { message: 'Error retrieving versions' } },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true, data: versions || [] })
})
