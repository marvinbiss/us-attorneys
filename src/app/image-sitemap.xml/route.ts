import { SITE_URL } from '@/lib/seo/config'
import { articleSlugs, allArticles } from '@/lib/data/blog/articles'
import { services } from '@/lib/data/france'
import { getBlogImage, serviceImages, heroImage, pageImages, cityImages } from '@/lib/data/images'

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function imageTag(loc: string, title: string): string {
  return `    <image:image>
      <image:loc>${escapeXml(loc)}</image:loc>
      <image:title>${escapeXml(title)}</image:title>
    </image:image>`
}

function urlEntry(loc: string, images: { loc: string; title: string }[]): string {
  return `  <url>
    <loc>${escapeXml(loc)}</loc>
${images.map((img) => imageTag(img.loc, img.title)).join('\n')}
  </url>`
}

/**
 * Image sitemap — Next.js 14 ne génère pas les balises <image:image> avec le bon namespace
 * dans MetadataRoute.Sitemap. Ce handler produit le XML correct pour Google Image Search.
 *
 * Contenu : homepage, services, top 20 villes, articles de blog, pages statiques clés.
 */
export async function GET() {
  const urls: string[] = []

  // 1. Homepage
  urls.push(
    urlEntry(SITE_URL, [{ loc: heroImage.src, title: heroImage.alt }])
  )

  // 2. Pages de services — une image par métier
  for (const service of services) {
    const img = serviceImages[service.slug]
    if (img) {
      urls.push(
        urlEntry(`${SITE_URL}/services/${service.slug}`, [
          { loc: img.src, title: img.alt },
        ])
      )
    }
  }

  // 3. Top 20 villes — photos géographiques
  for (const [citySlug, img] of Object.entries(cityImages)) {
    urls.push(
      urlEntry(`${SITE_URL}/villes/${citySlug}`, [
        { loc: img.src, title: img.alt },
      ])
    )
  }

  // 4. Articles de blog — matching intelligent slug → image
  for (const slug of articleSlugs) {
    const article = allArticles[slug]
    const img = getBlogImage(slug, article?.category)
    urls.push(
      urlEntry(`${SITE_URL}/blog/${slug}`, [{ loc: img.src, title: img.alt }])
    )
  }

  // 5. Pages statiques avec images connues
  const staticPageMap: Record<string, string> = {
    howItWorks: `${SITE_URL}/comment-ca-marche`,
    about: `${SITE_URL}/a-propos`,
    verification: `${SITE_URL}/notre-processus-de-verification`,
  }

  for (const [key, pageUrl] of Object.entries(staticPageMap)) {
    const imgs = pageImages[key as keyof typeof pageImages]
    if (imgs && imgs.length > 0) {
      urls.push(
        urlEntry(
          pageUrl,
          imgs.map((img) => ({ loc: img.src, title: img.alt }))
        )
      )
    }
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urls.join('\n')}
</urlset>`

  // Last-Modified = date du dernier article (seul contenu dynamique de ce sitemap).
  // Google utilise Last-Modified pour décider s'il doit re-fetcher le fichier (HTTP 304).
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
