import { Metadata } from 'next'
import { SITE_URL } from '@/lib/seo/config'
import { allArticlesMeta, allCategories } from '@/lib/data/blog/articles-index'
import { allArticles } from '@/lib/data/blog/articles'
import BlogPageClient from './BlogPageClient'
import { getPageContent } from '@/lib/cms'
import { CmsContent } from '@/components/CmsContent'

export const metadata: Metadata = {
  title: 'Blog Artisanat & Travaux',
  description: `Conseils, guides et actualités sur l'artisanat, les travaux de rénovation, les prix et la réglementation. ${allArticlesMeta.length}+ articles par des experts.`,
  alternates: {
    canonical: `${SITE_URL}/blog`,
  },
  openGraph: {
    title: 'Blog Artisanat & Travaux',
    description: 'Conseils, guides et actualités sur l\'artisanat et les travaux de rénovation.',
    url: `${SITE_URL}/blog`,
    type: 'website',
    images: [{ url: `${SITE_URL}/opengraph-image`, width: 1200, height: 630, alt: 'ServicesArtisans — Blog artisanat et travaux' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Blog Artisanat & Travaux',
    description: 'Conseils, guides et actualités sur l\'artisanat et les travaux de rénovation.',
    images: [`${SITE_URL}/opengraph-image`],
  },
}

interface PageProps {
  searchParams: Promise<{ tag?: string }>
}

export default async function BlogPage({ searchParams }: PageProps) {
  const { tag } = await searchParams

  const cmsPage = await getPageContent('blog', 'static')

  if (cmsPage?.content_html) {
    return (
      <div className="min-h-screen bg-gray-50">
        <section className="bg-white border-b">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <h1 className="font-heading text-3xl font-bold text-gray-900">
              {cmsPage.title}
            </h1>
          </div>
        </section>
        <section className="py-12">
          <div className="max-w-6xl mx-auto px-4">
            <CmsContent html={cmsPage.content_html} />
          </div>
        </section>
      </div>
    )
  }

  const collectionSchema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Blog Artisanat & Travaux',
    description: 'Conseils, guides et actualités sur l\'artisanat et les travaux de rénovation.',
    url: `${SITE_URL}/blog`,
    numberOfItems: allArticlesMeta.length,
    hasPart: allArticlesMeta.slice(0, 10).map(a => ({
      '@type': 'BlogPosting',
      headline: a.title,
      url: `${SITE_URL}/blog/${a.slug}`,
      datePublished: a.date,
      author: (() => {
        const authorName = allArticles[a.slug]?.author || 'ServicesArtisans'
        return authorName === 'ServicesArtisans'
          ? { '@type': 'Organization', name: authorName, '@id': `${SITE_URL}#organization` }
          : { '@type': 'Person', name: authorName }
      })(),
    })),
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }}
      />
      <BlogPageClient articles={allArticlesMeta} categories={allCategories} initialTag={tag} />
    </>
  )
}
