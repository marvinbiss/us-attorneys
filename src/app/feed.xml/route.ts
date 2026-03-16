import { SITE_URL, SITE_NAME } from '@/lib/seo/config'
import { allArticles, articleSlugs } from '@/lib/data/blog/articles'

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

export async function GET() {
  // Sort by date descending, keep last 50 items (standard RSS practice)
  const articles = articleSlugs
    .map((slug) => ({ slug, ...allArticles[slug] }))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 50)

  // lastBuildDate = date of most recent article (NOT new Date() — that forces
  // Feedfetcher to re-fetch on every request thinking the feed is always fresh).
  const latestDate = articles[0] ? new Date(articles[0].date) : new Date()

  const items = articles.map((article) => `    <item>
      <title>${escapeXml(article.title)}</title>
      <link>${SITE_URL}/blog/${article.slug}</link>
      <guid isPermaLink="true">${SITE_URL}/blog/${article.slug}</guid>
      <description>${escapeXml(article.excerpt)}</description>
      <pubDate>${new Date(article.date).toUTCString()}</pubDate>
      <category>${escapeXml(article.category)}</category>
    </item>`)

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(SITE_NAME)} — Legal Blog &amp; Insights</title>
    <link>${SITE_URL}/blog</link>
    <description>Tips, guides, and news about legal services, attorney fees, and regulations.</description>
    <language>en</language>
    <lastBuildDate>${latestDate.toUTCString()}</lastBuildDate>
    <atom:link href="${SITE_URL}/feed.xml" rel="self" type="application/rss+xml"/>
    <image>
      <url>${SITE_URL}/apple-touch-icon.png</url>
      <title>${escapeXml(SITE_NAME)}</title>
      <link>${SITE_URL}</link>
    </image>
${items.join('\n')}
  </channel>
</rss>`

  return new Response(rss, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      'Last-Modified': latestDate.toUTCString(),
    },
  })
}
