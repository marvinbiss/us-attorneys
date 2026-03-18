import { createAdminClient } from '@/lib/supabase/admin'
import { getCachedData, CACHE_TTL } from '@/lib/cache'
import { logger } from '@/lib/logger'
import type { CmsPage, CmsPageType } from '@/types/cms'

const IS_BUILD = process.env.NEXT_BUILD_SKIP_DB === '1'

/**
 * Fetch published CMS content for a given slug + type.
 * Returns null if no published record exists (caller uses hardcoded fallback).
 * Does NOT cache null results — only successful fetches are cached.
 */
export async function getPageContent(
  slug: string,
  pageType: CmsPageType,
  options?: { specialtySlug?: string; locationSlug?: string }
): Promise<CmsPage | null> {
  if (!slug || IS_BUILD) return null

  const cacheKey = `cms:${pageType}:${slug}:${options?.specialtySlug ?? ''}:${options?.locationSlug ?? ''}`

  return getCachedData(cacheKey, async () => {
    try {
      const supabase = createAdminClient()
      const query = supabase
        .from('cms_pages')
        .select('id, slug, page_type, title, content_json, content_html, structured_data, meta_title, meta_description, og_image_url, canonical_url, excerpt, author, author_bio, category, tags, read_time, featured_image, service_slug, location_slug, status, published_at, published_by, sort_order, is_active, created_by, updated_by, created_at, updated_at')
        .eq('slug', slug)
        .eq('page_type', pageType)
        .eq('status', 'published')
        .eq('is_active', true)

      if (options?.specialtySlug) {
        query.eq('service_slug', options.specialtySlug)
      }
      if (options?.locationSlug) {
        query.eq('location_slug', options.locationSlug)
      }

      const { data, error } = await query.single()
      if (error || !data) return null
      return data as CmsPage
    } catch (err: unknown) {
      logger.error('[CMS] getPageContent error', err as Error)
      return null
    }
  }, CACHE_TTL.cms, { skipNull: true })
}

/**
 * Fetch all published blog articles from CMS.
 */
export async function getCmsBlogArticles(): Promise<CmsPage[]> {
  if (IS_BUILD) return []
  return getCachedData('cms:blog:all', async () => {
    try {
      const supabase = createAdminClient()
      const { data, error } = await supabase
        .from('cms_pages')
        .select('id, slug, page_type, title, content_json, content_html, structured_data, meta_title, meta_description, og_image_url, canonical_url, excerpt, author, author_bio, category, tags, read_time, featured_image, service_slug, location_slug, status, published_at, published_by, sort_order, is_active, created_by, updated_by, created_at, updated_at')
        .eq('page_type', 'blog')
        .eq('status', 'published')
        .eq('is_active', true)
        .order('published_at', { ascending: false })

      if (error) {
        logger.error('[CMS] getCmsBlogArticles error', error)
        return []
      }
      return (data || []) as CmsPage[]
    } catch (err: unknown) {
      logger.error('[CMS] getCmsBlogArticles error', err as Error)
      return []
    }
  }, CACHE_TTL.cms, { skipNull: true })
}

/**
 * Fetch structured trade content override from CMS.
 */
export async function getTradeContentOverride(specialtySlug: string): Promise<Record<string, unknown> | null> {
  const page = await getPageContent(specialtySlug, 'service')
  if (!page?.structured_data) return null
  return page.structured_data
}
