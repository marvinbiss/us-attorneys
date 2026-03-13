import { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { SITE_URL } from '@/lib/seo/config'
import { allArticlesMeta, allCategories } from '@/lib/data/blog/articles-index'
import { allArticles } from '@/lib/data/blog/articles'
import { blogCategories, categoryToSlug, normalizeCategory } from '@/lib/data/blog/categories'
import JsonLd from '@/components/JsonLd'
import { getBreadcrumbSchema } from '@/lib/seo/jsonld'
import BlogPageClient from './BlogPageClient'
import { getPageContent } from '@/lib/cms'
import { CmsContent } from '@/components/CmsContent'

export const metadata: Metadata = {
  title: 'Blog Travaux & Artisanat — Conseils 2026',
  description: `Conseils, guides et actualités sur l'artisanat, les travaux de rénovation, les prix et la réglementation. ${allArticlesMeta.length}+ articles par des experts.`,
  alternates: {
    canonical: `${SITE_URL}/blog`,
  },
  openGraph: {
    title: 'Blog Travaux & Artisanat — Conseils 2026',
    description: 'Conseils, guides et actualités sur les travaux de rénovation et l\'artisanat.',
    url: `${SITE_URL}/blog`,
    type: 'website',
    images: [{ url: `${SITE_URL}/opengraph-image`, width: 1200, height: 630, alt: 'ServicesArtisans — Blog travaux et artisanat' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Blog Travaux & Artisanat — Conseils 2026',
    description: 'Conseils, guides et actualités sur les travaux de rénovation et l\'artisanat.',
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
    isPartOf: {
      '@type': 'WebSite',
      name: 'ServicesArtisans',
      url: SITE_URL,
    },
    hasPart: allArticlesMeta.slice(0, 10).map(a => ({
      '@type': 'BlogPosting',
      headline: a.title,
      url: `${SITE_URL}/blog/${a.slug}`,
      datePublished: a.date,
      author: (() => {
        const authorName = allArticles[a.slug]?.author || 'ServicesArtisans'
        return authorName === 'ServicesArtisans'
          ? { '@type': 'Organization', name: 'Équipe éditoriale ServicesArtisans', url: `${SITE_URL}/a-propos`, '@id': `${SITE_URL}#organization` }
          : { '@type': 'Person', name: authorName }
      })(),
    })),
  }

  const breadcrumbSchema = getBreadcrumbSchema([
    { name: 'Accueil', url: '/' },
    { name: 'Blog', url: '/blog' },
  ])

  // Category article counts for the cross-link section
  const categoryCounts = blogCategories.map(c => ({
    ...c,
    count: allArticlesMeta.filter(
      a => categoryToSlug(normalizeCategory(a.category)) === c.slug
    ).length,
  }))

  const categoryColors: Record<string, string> = {
    'Conseils': 'bg-amber-100 text-amber-700',
    'Tarifs': 'bg-emerald-100 text-emerald-700',
    'Fiches métier': 'bg-blue-100 text-blue-700',
    'Guides': 'bg-purple-100 text-purple-700',
    'Réglementation': 'bg-slate-100 text-slate-700',
    'Aides & Subventions': 'bg-green-100 text-green-700',
    'Saisonnier': 'bg-lime-100 text-lime-700',
    'Sécurité': 'bg-red-100 text-red-700',
    'Énergie': 'bg-teal-100 text-teal-700',
    'DIY': 'bg-orange-100 text-orange-700',
    'Inspiration': 'bg-pink-100 text-pink-700',
  }

  return (
    <>
      <JsonLd data={[collectionSchema, breadcrumbSchema]} />
      <BlogPageClient articles={allArticlesMeta} categories={allCategories} initialTag={tag} />

      {/* Crawlable category links — server-rendered for SEO */}
      <section className="py-12 bg-white border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 border-l-4 border-blue-500 pl-4">
            Parcourir par cat&eacute;gorie
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {categoryCounts.map(c => {
              const color = categoryColors[c.label] || 'bg-gray-100 text-gray-700'
              return (
                <Link
                  key={c.slug}
                  href={`/blog/categorie/${c.slug}`}
                  className="flex items-center justify-between p-4 bg-gray-50 hover:bg-white rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all group"
                >
                  <div>
                    <span className={`inline-block ${color} px-2.5 py-0.5 rounded-full text-xs font-semibold mb-1`}>
                      {c.label}
                    </span>
                    <p className="text-sm text-gray-500 mt-1">{c.count} article{c.count > 1 ? 's' : ''}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
                </Link>
              )
            })}
          </div>
        </div>
      </section>
    </>
  )
}
