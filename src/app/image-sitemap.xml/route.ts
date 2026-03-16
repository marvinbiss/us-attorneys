import { SITE_URL } from '@/lib/seo/config'
import { articleSlugs, allArticles } from '@/lib/data/blog/articles'
import { services } from '@/lib/data/usa'
import { getBlogImage, serviceImages, heroImage, pageImages, cityImages } from '@/lib/data/images'

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

/**
 * Image sitemap — Next.js 14 does not generate <image:image> tags with the correct namespace
 * in MetadataRoute.Sitemap. This handler produces the correct XML for Google Image Search.
 *
 * Content: homepage, services, top 20 cities, blog articles, key static pages.
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

  // 3. Top 20 cities — geographic photos
  for (const [citySlug, img] of Object.entries(cityImages)) {
    const cityName = citySlug
      .split('-')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join('-')
    urls.push(
      urlEntry(`${SITE_URL}/cities/${citySlug}`, [
        { loc: img.src, title: img.alt, caption: `Photo of ${cityName} -- find qualified attorneys in ${cityName} on US Attorneys` },
      ])
    )
  }

  // 4. Blog articles — smart slug → image matching
  for (const slug of articleSlugs) {
    const article = allArticles[slug]
    const img = getBlogImage(slug, article?.category)
    const articleTitle = article?.title || slug.replace(/-/g, ' ')
    urls.push(
      urlEntry(`${SITE_URL}/blog/${slug}`, [{ loc: img.src, title: img.alt, caption: `Illustration for the article "${articleTitle}" -- US Attorneys blog` }])
    )
  }

  // 5. Static pages with known images
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

  // Last-Modified = date of the latest article (only dynamic content in this sitemap).
  // Google uses Last-Modified to decide whether to re-fetch the file (HTTP 304).
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
