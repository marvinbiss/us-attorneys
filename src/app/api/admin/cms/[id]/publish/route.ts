import { NextResponse } from 'next/server'
import { requirePermission, logAdminAction } from '@/lib/admin-auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/logger'
import { invalidateCache } from '@/lib/cache'
import { revalidatePagePaths } from '@/lib/cms-revalidate'
import { UUID_RE } from '@/lib/cms-utils'
import { createApiHandler } from '@/lib/api/handler'

// --- POST: Publish a page ---

export const POST = createApiHandler(async ({ params }) => {
  const auth = await requirePermission('content', 'publish')
  if (!auth.success) return auth.error!

  const id = params?.id
  if (!id || !UUID_RE.test(id)) {
    return NextResponse.json(
      { success: false, error: { message: 'Invalid ID' } },
      { status: 400 }
    )
  }

  const supabase = createAdminClient()

  // Atomic publish: only update if NOT already published (prevents TOCTOU race)
  const { data: page, error } = await supabase
    .from('cms_pages')
    .update({
      status: 'published',
      published_at: new Date().toISOString(),
      published_by: auth.admin!.id,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .neq('status', 'published')
    .select()
    .single()

  if (error || !page) {
    // PGRST116 = no rows matched for .single() — either 404 or already published
    if (error?.code === 'PGRST116' || (!page && !error)) {
      const { data: existing } = await supabase
        .from('cms_pages')
        .select('status')
        .eq('id', id)
        .single()

      if (existing?.status === 'published') {
        return NextResponse.json(
          { success: false, error: { message: 'Page is already published' } },
          { status: 409 }
        )
      }
      return NextResponse.json(
        { success: false, error: { message: 'Page not found' } },
        { status: 404 }
      )
    }
    logger.error('CMS page publish error', error)
    return NextResponse.json(
      { success: false, error: { message: 'Error publishing page' } },
      { status: 500 }
    )
  }

  // Audit log
  await logAdminAction(auth.admin!.id, 'cms_page.publish', 'cms_page', id, { slug: page.slug })

  // Revalidate cached paths + invalidate in-memory cache
  revalidatePagePaths(page)
  invalidateCache(/^cms:/)

  return NextResponse.json({ success: true, data: page })
})

// --- DELETE: Unpublish (revert to draft) ---

export const DELETE = createApiHandler(async ({ params }) => {
  const auth = await requirePermission('content', 'publish')
  if (!auth.success) return auth.error!

  const id = params?.id
  if (!id || !UUID_RE.test(id)) {
    return NextResponse.json(
      { success: false, error: { message: 'Invalid ID' } },
      { status: 400 }
    )
  }

  const supabase = createAdminClient()

  // Fetch current page data first for path revalidation
  const { data: currentPage } = await supabase
    .from('cms_pages')
    .select('page_type, slug, service_slug, location_slug')
    .eq('id', id)
    .single()

  const { data: page, error } = await supabase
    .from('cms_pages')
    .update({
      status: 'draft',
      published_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error || !page) {
    logger.error('CMS page unpublish error', error)
    return NextResponse.json(
      { success: false, error: { message: 'Error unpublishing page' } },
      { status: error ? 500 : 404 }
    )
  }

  // Audit log
  await logAdminAction(auth.admin!.id, 'cms_page.unpublish', 'cms_page', id, { slug: page.slug })

  // Revalidate cached paths using data from before the update
  if (currentPage) {
    revalidatePagePaths(currentPage)
  }
  invalidateCache(/^cms:/)

  return NextResponse.json({ success: true, data: page })
})
