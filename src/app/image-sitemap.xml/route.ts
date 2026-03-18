import { SITE_URL } from '@/lib/seo/config'
import { articleSlugs, allArticles } from '@/lib/data/blog/articles'
import { services, states } from '@/lib/data/usa'
import { getBlogImage, serviceImages, heroImage, pageImages, cityImages, getDepartmentImage } from '@/lib/data/images'
import { logger } from '@/lib/logger'

/** ISR: regenerate every 24 hours */
export const revalidate = 86400

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function imageTag(loc: string, title: string, caption: string): string {
  return `    <image:image>
      <image:loc>${escapeXml(loc)}</image:loc>
      <image:title>${escapeXml(title)}</image:title>
      <image:caption>${escapeXml(caption)}</image:caption>
    </image:image>`
}

function urlEntry(loc: string, images: { loc: string; title: string; caption: string }[]): string {
  return `  <url>
    <loc>${escapeXml(loc)}</loc>
${images.map((img) => imageTag(img.loc, img.title, img.caption)).join('\n')}
  </url>`
}

/** Max attorneys to include in image sitemap (keep file size reasonable for Google) */
const ATTORNEY_IMAGE_LIMIT = 1_000

/**
 * Image sitemap — Next.js 14 does not generate <image:image> tags with the correct namespace
 * in MetadataRoute.Sitemap. This handler produces the correct XML for Google Image Search.
 *
 * Content: homepage, services, states, top cities, attorney profiles (with images),
 * blog articles, key static pages.
 */
export async function GET() {
  const urls: string[] = []

  // 1. Homepage
  urls.push(
    urlEntry(SITE_URL, [{ loc: heroImage.src, title: heroImage.alt, caption: 'Find the best attorneys in the US on US Attorneys -- a platform connecting you with qualified legal professionals' }])
  )

  // 2. Service pages — one image per practice area
  for (const service of services) {
    const img = serviceImages[service.slug]
    if (img) {
      urls.push(
        urlEntry(`${SITE_URL}/practice-areas/${service.slug}`, [
          { loc: img.src, title: img.alt, caption: `${service.name} professional -- find a qualified ${service.name.toLowerCase()} near you on US Attorneys` },
        ])
      )
    }
  }

  // 3. State pages — geographic images
  for (const state of states) {
    const img = getDepartmentImage(state.code)
    // Only include if state has a distinct image (not the generic hero fallback)
    if (img && img.src !== heroImage.src) {
      urls.push(
        urlEntry(`${SITE_URL}/states/${state.slug}`, [
          { loc: img.src, title: `Attorneys in ${state.name}`, caption: `Find qualified attorneys in ${state.name} (${state.code}) -- browse all practice areas on US Attorneys` },
        ])
      )
    }
  }

  // 4. Top cities — geographic photos
  for (const [citySlug, img] of Object.entries(cityImages)) {
    const cityName = citySlug
      .split('-')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ')
    urls.push(
      urlEntry(`${SITE_URL}/cities/${citySlug}`, [
        { loc: img.src, title: img.alt, caption: `Photo of ${cityName} -- find qualified attorneys in ${cityName} on US Attorneys` },
      ])
    )
  }

  // 5. Attorney profile images — fetched from DB
  try {
    const { createAdminClient } = await import('@/lib/supabase/admin')
    const supabase = createAdminClient()

    const { data: attorneys, error } = await supabase
      .from('attorneys')
      .select('slug, stable_id, name, profile_image_url, address_city, address_state')
      .eq('is_active', true)
      .eq('noindex', false)
      .not('profile_image_url', 'is', null)
      .order('rating_average', { ascending: false, nullsFirst: false })
      .limit(ATTORNEY_IMAGE_LIMIT)

    if (error) {
      logger.error('Image sitemap: failed to fetch attorney images', error)
    } else if (attorneys && attorneys.length > 0) {
      for (const attorney of attorneys) {
        if (!attorney.profile_image_url || !attorney.name) continue
        const publicId = attorney.slug || attorney.stable_id
        if (!publicId) continue

        const locationStr = [attorney.address_city, attorney.address_state].filter(Boolean).join(', ')
        const caption = locationStr
          ? `${attorney.name}, attorney in ${locationStr} -- verified professional profile on US Attorneys`
          : `${attorney.name}, attorney -- verified professional profile on US Attorneys`

        urls.push(
          urlEntry(`${SITE_URL}/attorneys/${publicId}`, [
            {
              loc: attorney.profile_image_url,
              title: `${attorney.name} -- Attorney Profile Photo`,
              caption,
            },
          ])
        )
      }
    }
  } catch (err) {
    // DB unavailable — skip attorney images silently (static content still served)
    logger.warn('Image sitemap: DB unavailable for attorney images', { error: String(err) })
  }

  // 6. Blog articles — smart slug → image matching
  for (const slug of articleSlugs) {
    const article = allArticles[slug]
    const img = getBlogImage(slug, article?.category)
    const articleTitle = article?.title || slug.replace(/-/g, ' ')
    urls.push(
      urlEntry(`${SITE_URL}/blog/${slug}`, [{ loc: img.src, title: img.alt, caption: `Illustration for the article "${articleTitle}" -- US Attorneys blog` }])
    )
  }

  // 7. Static pages with known images
  const staticPageMap: Record<string, { url: string; captionPrefix: string }> = {
    howItWorks: { url: `${SITE_URL}/how-it-works`, captionPrefix: 'How it works' },
    about: { url: `${SITE_URL}/about`, captionPrefix: 'About US Attorneys' },
    verification: { url: `${SITE_URL}/verification-process`, captionPrefix: 'Attorney verification process' },
  }

  for (const [key, { url: pageUrl, captionPrefix }] of Object.entries(staticPageMap)) {
    const imgs = pageImages[key as keyof typeof pageImages]
    if (imgs && imgs.length > 0) {
      urls.push(
        urlEntry(
          pageUrl,
          imgs.map((img) => ({ loc: img.src, title: img.alt, caption: `${captionPrefix} — ${img.alt}` }))
        )
      )
    }
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urls.join('\n')}
</urlset>`

  // Last-Modified: latest article date or attorney fetch time
  const latestDate = articleSlugs.reduce<Date | null>((max, slug) => {
    const d = allArticles[slug]?.updatedDate || allArticles[slug]?.date
    if (!d) return max
    const parsed = new Date(d)
    return max === null || parsed > max ? parsed : max
  }, null)

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=86400',
      ...(latestDate
        ? { 'Last-Modified': latestDate.toUTCString() }
        : {}),
    },
  })
}
