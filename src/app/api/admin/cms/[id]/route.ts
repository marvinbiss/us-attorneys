import { NextResponse } from 'next/server'
import { requirePermission, logAdminAction } from '@/lib/admin-auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/logger'
import { invalidateCache } from '@/lib/cache'
import { revalidatePagePaths } from '@/lib/cms-revalidate'
import { UUID_RE, updatePageSchema, sanitizeTextFields } from '@/lib/cms-utils'

export const dynamic = 'force-dynamic'

// --- GET: Single page by ID ---

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requirePermission('content', 'read')
    if (!auth.success) return auth.error!

    const { id } = await params
    if (!UUID_RE.test(id)) {
      return NextResponse.json(
        { success: false, error: { message: 'Invalid ID' } },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    const { data: page, error } = await supabase
      .from('cms_pages')
      .select('id, slug, page_type, title, content_json, content_html, structured_data, meta_title, meta_description, og_image_url, canonical_url, excerpt, author, author_bio, category, tags, read_time, featured_image, service_slug, location_slug, status, published_at, published_by, sort_order, is_active, created_by, updated_by, created_at, updated_at')
      .eq('id', id)
      .single()

    if (error || !page) {
      return NextResponse.json(
        { success: false, error: { message: 'Page not found' } },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, data: page })
  } catch (error) {
    logger.error('CMS page get error', error)
    return NextResponse.json(
      { success: false, error: { message: 'Server error' } },
      { status: 500 }
    )
  }
}

// --- PUT: Update page ---

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requirePermission('content', 'write')
    if (!auth.success) return auth.error!

    const { id } = await params
    if (!UUID_RE.test(id)) {
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

    const parsed = updatePageSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: { message: 'Invalid data', details: parsed.error.flatten() } },
        { status: 400 }
      )
    }

    const validated = parsed.data

    // Sanitize HTML content (lazy-import to avoid JSDOM crash in serverless cold start)
    if (validated.content_html) {
      const { default: DOMPurify } = await import('isomorphic-dompurify')
      validated.content_html = DOMPurify.sanitize(validated.content_html)
    }

    // Strip HTML from text-only fields
    sanitizeTextFields(validated)

    // Guard against oversized JSON payloads
    if (validated.content_json && JSON.stringify(validated.content_json).length > 500000) {
      return NextResponse.json(
        { success: false, error: { message: 'JSON content exceeds maximum allowed size' } },
        { status: 400 }
      )
    }
    if (validated.structured_data && JSON.stringify(validated.structured_data).length > 100000) {
      return NextResponse.json(
        { success: false, error: { message: 'Structured data exceeds maximum allowed size' } },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    // Fetch old slug/type before update for stale-path revalidation
    let oldPage: { slug: string; page_type: string; service_slug: string | null; location_slug: string | null; status: string } | null = null
    if (validated.slug || validated.page_type) {
      const { data } = await supabase
        .from('cms_pages')
        .select('slug, page_type, service_slug, location_slug, status')
        .eq('id', id)
        .single()
      oldPage = data
    }

    const { data: page, error } = await supabase
      .from('cms_pages')
      .update({
        ...validated,
        updated_by: auth.admin!.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error || !page) {
      logger.error('CMS page update error', error)
      return NextResponse.json(
        { success: false, error: { message: 'Error updating page' } },
        { status: error ? 500 : 404 }
      )
    }

    // Log d'audit
    await logAdminAction(auth.admin!.id, 'cms_page.update', 'cms_page', id, { slug: page.slug, page_type: page.page_type })

    // Revalidate cached paths if the page is published
    if (page.status === 'published') {
      revalidatePagePaths(page)
      // Also revalidate old path if slug/type changed
      if (oldPage && oldPage.status === 'published' && (oldPage.slug !== page.slug || oldPage.page_type !== page.page_type)) {
        revalidatePagePaths(oldPage)
      }
    }
    invalidateCache(/^cms:/)

    return NextResponse.json({ success: true, data: page })
  } catch (error) {
    logger.error('CMS page update error', error)
    return NextResponse.json(
      { success: false, error: { message: 'Server error' } },
      { status: 500 }
    )
  }
}

// --- DELETE: Soft delete (set is_active = false) ---

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requirePermission('content', 'delete')
    if (!auth.success) return auth.error!

    const { id } = await params
    if (!UUID_RE.test(id)) {
      return NextResponse.json(
        { success: false, error: { message: 'Invalid ID' } },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    const { data: page, error } = await supabase
      .from('cms_pages')
      .update({
        is_active: false,
        updated_by: auth.admin!.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error || !page) {
      logger.error('CMS page delete error', error)
      return NextResponse.json(
        { success: false, error: { message: 'Error deleting page' } },
        { status: error ? 500 : 404 }
      )
    }

    // Log d'audit
    await logAdminAction(auth.admin!.id, 'cms_page.delete', 'cms_page', id, { slug: page.slug })

    // Revalidate public paths so the page disappears from the site
    if (page.status === 'published') {
      revalidatePagePaths(page)
    }
    invalidateCache(/^cms:/)

    return NextResponse.json({ success: true, data: page })
  } catch (error) {
    logger.error('CMS page delete error', error)
    return NextResponse.json(
      { success: false, error: { message: 'Server error' } },
      { status: 500 }
    )
  }
}
