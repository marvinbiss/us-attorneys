import { NextResponse } from 'next/server'
import { requirePermission, logAdminAction } from '@/lib/admin-auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/logger'
import { invalidateCache } from '@/lib/cache'
import { revalidatePagePaths } from '@/lib/cms-revalidate'
import { z } from 'zod'
// DOMPurify lazy-imported inside POST to avoid JSDOM crash in serverless cold start
import { UUID_RE } from '@/lib/cms-utils'
import { createApiHandler } from '@/lib/api/handler'

// --- Schema ---

const restoreSchema = z.object({
  version_id: z.string().uuid('Invalid version ID'),
})

// --- POST: Restore a specific version ---

export const POST = createApiHandler(async ({ request, params }) => {
  const auth = await requirePermission('content', 'write')
  if (!auth.success) return auth.error!

  const id = params?.id
  if (!id || !UUID_RE.test(id)) {
    return NextResponse.json(
      { success: false, error: { message: 'Invalid ID' } },
      { status: 400 }
    )
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { success: false, error: { message: 'Invalid JSON request body' } },
      { status: 400 }
    )
  }

  const parsed = restoreSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: { message: 'Invalid data', details: parsed.error.flatten() } },
      { status: 400 }
    )
  }

  const { version_id } = parsed.data
  const supabase = createAdminClient()

  // Fetch the version to restore
  const { data: version, error: versionError } = await supabase
    .from('cms_page_versions')
    .select('id, page_id, version_number, title, content_json, content_html, structured_data, meta_title, meta_description, status, created_by, created_at, change_summary')
    .eq('id', version_id)
    .eq('page_id', id)
    .single()

  if (versionError || !version) {
    return NextResponse.json(
      { success: false, error: { message: 'Version not found' } },
      { status: 404 }
    )
  }

  // Update the page with the version's content (sanitize HTML)
  let sanitizedHtml = version.content_html
  if (version.content_html) {
    const { default: DOMPurify } = await import('isomorphic-dompurify')
    sanitizedHtml = DOMPurify.sanitize(version.content_html)
  }
  const { data: page, error: updateError } = await supabase
    .from('cms_pages')
    .update({
      content_json: version.content_json,
      content_html: sanitizedHtml,
      structured_data: version.structured_data,
      title: version.title,
      meta_title: version.meta_title,
      meta_description: version.meta_description,
      updated_by: auth.admin!.id,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (updateError || !page) {
    logger.error('CMS page restore error', updateError)
    return NextResponse.json(
      { success: false, error: { message: 'Error restoring version' } },
      { status: 500 }
    )
  }

  // Audit log
  await logAdminAction(auth.admin!.id, 'cms_page.restore', 'cms_page', id, { version_id, title: version.title })

  // Revalidate cached paths if the page is published
  if (page.status === 'published') {
    revalidatePagePaths(page)
  }

  // Invalidate in-memory cache
  invalidateCache(/^cms:/)

  return NextResponse.json({ success: true, data: page })
})
