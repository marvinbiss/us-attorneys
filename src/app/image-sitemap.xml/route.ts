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
 * Image sitemap — Next.js 14 ne génère pas les balises <image:image> avec le bon namespace
 * dans MetadataRoute.Sitemap. Ce handler produit le XML correct pour Google Image Search.
 *
 * Contenu : homepage, services, top 20 cities, articles de blog, pages statiques clés.
 */
export async function GET() {
  const urls: string[] = []

  // 1. Homepage
  urls.push(
    urlEntry(SITE_URL, [{ loc: heroImage.src, title: heroImage.alt, caption: 'Trouvez les meilleurs artisans en France sur ServicesArtisans — plateforme de mise en relation avec des professionnels qualifiés' }])
  )

  // 2. Pages de services — une image par métier
  for (const service of services) {
    const img = serviceImages[service.slug]
    if (img) {
      urls.push(
        urlEntry(`${SITE_URL}/practice-areas/${service.slug}`, [
          { loc: img.src, title: img.alt, caption: `Photo de ${service.name} professionnel — trouvez un ${service.name.toLowerCase()} qualifié près de chez vous sur ServicesArtisans` },
        ])
      )
    }
  }

  // 3. Top 20 cities — photos géographiques
  for (const [citySlug, img] of Object.entries(cityImages)) {
    const cityName = citySlug
      .split('-')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join('-')
    urls.push(
      urlEntry(`${SITE_URL}/cities/${citySlug}`, [
        { loc: img.src, title: img.alt, caption: `Photo de ${cityName} — trouvez des artisans qualifiés à ${cityName} sur ServicesArtisans` },
      ])
    )
  }

  // 4. Articles de blog — matching intelligent slug → image
  for (const slug of articleSlugs) {
    const article = allArticles[slug]
    const img = getBlogImage(slug, article?.category)
    const articleTitle = article?.title || slug.replace(/-/g, ' ')
    urls.push(
      urlEntry(`${SITE_URL}/blog/${slug}`, [{ loc: img.src, title: img.alt, caption: `Illustration de l'article « ${articleTitle} » — blog ServicesArtisans` }])
    )
  }

  // 5. Pages statiques avec images connues
  const staticPageMap: Record<string, { url: string; captionPrefix: string }> = {
    howItWorks: { url: `${SITE_URL}/how-it-works`, captionPrefix: 'Comment ça marche' },
    about: { url: `${SITE_URL}/about`, captionPrefix: 'À propos de ServicesArtisans' },
    verification: { url: `${SITE_URL}/verification-process`, captionPrefix: 'Processus de vérification des artisans' },
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
