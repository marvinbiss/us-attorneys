import { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { Calendar, Clock, ArrowRight, ArrowLeft } from 'lucide-react'
import Breadcrumb from '@/components/Breadcrumb'
import JsonLd from '@/components/JsonLd'
import { SITE_URL } from '@/lib/seo/config'
import { allArticlesMeta } from '@/lib/data/blog/articles-index'
import { allArticles } from '@/lib/data/blog/articles'
import { blogCategories, getCategoryBySlug, categoryToSlug, normalizeCategory } from '@/lib/data/blog/categories'
import { getBlogImage, BLUR_PLACEHOLDER } from '@/lib/data/images'

// Pre-render all category pages at build time
export function generateStaticParams() {
  return blogCategories.map(c => ({ category: c.slug }))
}

export const dynamicParams = false

interface PageProps {
  params: Promise<{ category: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { category: categorySlug } = await params
  const cat = getCategoryBySlug(categorySlug)
  if (!cat) return { title: 'Catégorie non trouvée' }

  return {
    title: cat.metaTitle,
    description: cat.metaDescription,
    alternates: { canonical: `${SITE_URL}/blog/categorie/${categorySlug}` },
    robots: { index: true, follow: true, 'max-snippet': -1 as const, 'max-image-preview': 'large' as const },
    openGraph: {
      title: cat.metaTitle,
      description: cat.metaDescription,
      url: `${SITE_URL}/blog/categorie/${categorySlug}`,
      type: 'website',
      locale: 'fr_FR',
    },
    twitter: {
      card: 'summary_large_image',
      title: cat.metaTitle,
      description: cat.metaDescription,
    },
  }
}

export default async function BlogCategoryPage({ params }: PageProps) {
  const { category: categorySlug } = await params
  const cat = getCategoryBySlug(categorySlug)
  if (!cat) notFound()

  const articles = allArticlesMeta.filter(
    a => categoryToSlug(normalizeCategory(a.category)) === categorySlug
  )

  // Other categories for cross-linking
  const otherCategories = blogCategories.filter(c => c.slug !== categorySlug)

  // JSON-LD CollectionPage
  const collectionSchema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: cat.label,
    description: cat.description,
    url: `${SITE_URL}/blog/categorie/${categorySlug}`,
    numberOfItems: articles.length,
    isPartOf: {
      '@type': 'Blog',
      name: 'Blog ServicesArtisans',
      url: `${SITE_URL}/blog`,
    },
    hasPart: articles.slice(0, 10).map(a => ({
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

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Accueil', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: `${SITE_URL}/blog` },
      { '@type': 'ListItem', position: 3, name: cat.label, item: `${SITE_URL}/blog/categorie/${categorySlug}` },
    ],
  }

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

  const badgeColor = categoryColors[cat.label] || 'bg-blue-100 text-blue-700'

  return (
    <>
      <JsonLd data={collectionSchema} />
      <JsonLd data={breadcrumbSchema} />

      <div className="min-h-screen bg-gray-50">
        {/* Hero */}
        <section className="relative bg-[#0a0f1e] text-white overflow-hidden">
          <div className="absolute inset-0">
            <div className="absolute inset-0" style={{
              background: 'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(37,99,235,0.18) 0%, transparent 60%)',
            }} />
            <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-gray-50 to-transparent" />
          </div>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-28 md:pt-14 md:pb-36">
            <Breadcrumb
              items={[
                { label: 'Blog', href: '/blog' },
                { label: cat.label },
              ]}
              className="mb-6 text-slate-400 [&_a]:text-slate-400 [&_a:hover]:text-white [&_svg]:text-slate-600"
            />
            <div className="text-center">
              <span className={`inline-block ${badgeColor} px-4 py-1.5 rounded-full text-sm font-semibold mb-4`}>
                {cat.label}
              </span>
              <h1 className="font-heading text-4xl md:text-5xl font-extrabold mb-4 tracking-[-0.025em]">
                {cat.metaTitle.split('—')[0].trim()}
              </h1>
              <p className="text-xl text-slate-400 max-w-2xl mx-auto">
                {cat.description}
              </p>
              <p className="text-sm text-slate-500 mt-3">
                {articles.length} article{articles.length > 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </section>

        {/* Articles */}
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {articles.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-gray-500 text-lg">Aucun article dans cette catégorie pour le moment.</p>
                <Link href="/blog" className="inline-flex items-center gap-2 mt-4 text-blue-600 font-medium hover:text-blue-800">
                  <ArrowLeft className="w-4 h-4" />
                  Retour au blog
                </Link>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {articles.map((article, index) => {
                  const isFeatured = index === 0

                  return (
                    <Link
                      key={article.slug}
                      href={`/blog/${article.slug}`}
                      className={`bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-xl hover:-translate-y-2 transition-all duration-300 group ${
                        isFeatured ? 'md:col-span-2 lg:col-span-3' : ''
                      }`}
                    >
                      <div className={`relative overflow-hidden ${isFeatured ? 'h-64 md:h-80' : 'h-48'}`}>
                        <Image
                          src={getBlogImage(article.slug, article.category).src}
                          alt={getBlogImage(article.slug, article.category).alt}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                          sizes={isFeatured
                            ? '(max-width: 768px) 100vw, (max-width: 1200px) 66vw, 100vw'
                            : '(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw'}
                          placeholder="blur"
                          blurDataURL={BLUR_PLACEHOLDER}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                        <span className={`absolute top-4 left-4 z-10 ${badgeColor} px-3 py-1 rounded-full text-xs font-semibold`}>
                          {cat.label}
                        </span>
                      </div>
                      <div className="p-6">
                        <h2 className={`font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors duration-200 ${
                          isFeatured ? 'text-2xl md:text-3xl font-heading' : 'text-lg'
                        }`}>
                          {article.title}
                        </h2>
                        <p className={`text-gray-600 mb-4 ${isFeatured ? 'text-base max-w-3xl' : 'text-sm'}`}>
                          {article.excerpt}
                        </p>
                        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span className="flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5" />
                              {new Date(article.date).toLocaleDateString('fr-FR', {
                                day: 'numeric', month: 'short', year: 'numeric',
                              })}
                            </span>
                            <span className="flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5" />
                              {article.readTime}
                            </span>
                          </div>
                          <span className="text-blue-600 font-semibold text-sm flex items-center gap-1 group-hover:gap-2 transition-all duration-200">
                            Lire <ArrowRight className="w-4 h-4" />
                          </span>
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        </section>

        {/* Other categories — cross-linking */}
        <section className="py-12 bg-white border-t">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-8 border-l-4 border-blue-500 pl-4">
              Autres catégories
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {otherCategories.map(c => {
                const count = allArticlesMeta.filter(
                  a => categoryToSlug(normalizeCategory(a.category)) === c.slug
                ).length
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
                      <p className="text-sm text-gray-500 mt-1">{count} article{count > 1 ? 's' : ''}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
                  </Link>
                )
              })}
            </div>
          </div>
        </section>

        {/* Back to blog */}
        <section className="py-8 bg-gray-50 border-t">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 text-blue-600 font-medium hover:text-blue-800 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Tous les articles
            </Link>
          </div>
        </section>
      </div>
    </>
  )
}
