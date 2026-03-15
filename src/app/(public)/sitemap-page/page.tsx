import { Metadata } from 'next'
import Link from 'next/link'
import { services, cities, states, usRegions, getNeighborhoodsByCity } from '@/lib/data/usa'
import { SITE_URL } from '@/lib/seo/config'
import Breadcrumb from '@/components/Breadcrumb'
import { getBreadcrumbSchema } from '@/lib/seo/jsonld'
import { tradeContent } from '@/lib/data/trade-content'
import { allArticlesMeta } from '@/lib/data/blog/articles-index'
import { getPageContent } from '@/lib/cms'
import { CmsContent } from '@/components/CmsContent'

export const revalidate = 86400

export const metadata: Metadata = {
  title: 'Plan du site',
  description: 'Plan du site complet de ServicesArtisans. Accédez à tous nos services, cities, départements et régions.',
  robots: { index: false, follow: true },
  alternates: { canonical: `${SITE_URL}/sitemap-page` },
  openGraph: {
    title: 'Plan du site',
    description: 'Plan du site complet de ServicesArtisans. Accédez à tous nos services, cities, départements et régions.',
    url: `${SITE_URL}/sitemap-page`,
    siteName: 'ServicesArtisans',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Plan du site',
    description: 'Plan du site complet de ServicesArtisans. Accédez à tous nos services, cities, départements et régions.',
  },
}

export default async function PlanDuSitePage() {
  const cmsPage = await getPageContent('plan-du-site', 'static')

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
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white rounded-xl shadow-sm p-8">
              <CmsContent html={cmsPage.content_html} />
            </div>
          </div>
        </section>
      </div>
    )
  }

  const breadcrumbSchema = getBreadcrumbSchema([
    { name: 'Accueil', url: '/' },
    { name: 'Plan du site', url: '/sitemap-page' },
  ])

  // Group cities by department for structured display
  const citiesByDept = states
    .map(dept => ({
      dept,
      cities: cities.filter(v => v.stateCode === dept.code),
    }))
    .filter(g => g.cities.length > 0)

  return (
    <div className="min-h-screen bg-gray-50">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <Breadcrumb items={[{ label: 'Plan du site' }]} />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="font-heading text-3xl font-bold text-gray-900 mb-2">Plan du site</h1>
        <p className="text-gray-500 mb-10">
          Retrouvez l&apos;ensemble des pages de ServicesArtisans pour trouver votre artisan.
        </p>

        {/* Services */}
        <section className="mb-12">
          <h2 className="text-xl font-bold text-gray-900 mb-4 border-l-4 border-amber-500 pl-4">
            Services ({services.length})
          </h2>
          <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-3">
            {services.map(s => (
              <Link
                key={s.slug}
                href={`/practice-areas/${s.slug}`}
                className="text-sm text-blue-600 hover:text-blue-800 py-1"
              >
                {s.name}
              </Link>
            ))}
          </div>
        </section>

        {/* Régions */}
        <section className="mb-12">
          <h2 className="text-xl font-bold text-gray-900 mb-4 border-l-4 border-amber-500 pl-4">
            Régions ({usRegions.length})
          </h2>
          <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-3">
            {usRegions.map(r => (
              <Link
                key={r.slug}
                href={`/regions/${r.slug}`}
                className="text-sm text-blue-600 hover:text-blue-800 py-1"
              >
                {r.name}
              </Link>
            ))}
          </div>
        </section>

        {/* Départements avec cities */}
        <section className="mb-12">
          <h2 className="text-xl font-bold text-gray-900 mb-4 border-l-4 border-amber-500 pl-4">
            Départements et cities ({states.length} départements, {cities.length} cities)
          </h2>
          <div className="space-y-6">
            {citiesByDept.map(({ dept, cities }) => (
              <div key={dept.code}>
                <h3 className="font-semibold text-gray-900 mb-2">
                  <Link href={`/states/${dept.slug}`} className="hover:text-blue-600 transition-colors">
                    {dept.name} ({dept.code})
                  </Link>
                </h3>
                <div className="flex flex-wrap gap-x-4 gap-y-1 ml-4">
                  {cities.slice(0, 15).map(c => (
                    <Link
                      key={c.slug}
                      href={`/cities/${c.slug}`}
                      className="text-sm text-gray-600 hover:text-blue-600"
                    >
                      {c.name}
                    </Link>
                  ))}
                  {cities.length > 15 && (
                    <Link
                      href={`/states/${dept.slug}`}
                      className="text-sm text-blue-600 font-medium"
                    >
                      +{cities.length - 15} cities
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Services par ville (matrice) */}
        <section className="mb-12">
          <h2 className="text-xl font-bold text-gray-900 mb-4 border-l-4 border-amber-500 pl-4">
            Services par ville
          </h2>
          <div className="space-y-6">
            {services.map(s => (
              <div key={s.slug}>
                <h3 className="font-semibold text-gray-900 mb-2">{s.name}</h3>
                <div className="flex flex-wrap gap-x-4 gap-y-1 ml-4">
                  {cities.slice(0, 20).map(v => (
                    <Link
                      key={`${s.slug}-${v.slug}`}
                      href={`/practice-areas/${s.slug}/${v.slug}`}
                      className="text-sm text-gray-600 hover:text-blue-600"
                    >
                      {s.name} à {v.name}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Urgences par service */}
        <section className="mb-12">
          <h2 className="text-xl font-bold text-gray-900 mb-4 border-l-4 border-amber-500 pl-4">
            Urgences par service
          </h2>
          <div className="grid md:grid-cols-3 lg:grid-cols-6 gap-3">
            {Object.keys(tradeContent).map(slug => (
              <Link
                key={slug}
                href={`/emergency/${slug}`}
                className="text-sm text-blue-600 hover:text-blue-800 py-1"
              >
                {tradeContent[slug].name} urgence
              </Link>
            ))}
          </div>
        </section>

        {/* Tarifs par service */}
        <section className="mb-12">
          <h2 className="text-xl font-bold text-gray-900 mb-4 border-l-4 border-amber-500 pl-4">
            Tarifs par service ({Object.keys(tradeContent).length})
          </h2>
          <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-3">
            {Object.values(tradeContent).map(trade => (
              <Link
                key={trade.slug}
                href={`/pricing/${trade.slug}`}
                className="text-sm text-blue-600 hover:text-blue-800 py-1"
              >
                Tarifs {trade.name.toLowerCase()}
              </Link>
            ))}
          </div>
        </section>

        {/* Quartiers des grandes cities */}
        <section className="mb-12">
          <h2 className="text-xl font-bold text-gray-900 mb-4 border-l-4 border-amber-500 pl-4">
            Quartiers des grandes cities
          </h2>
          <div className="space-y-6">
            {cities.slice(0, 20).map(v => {
              const quartiers = getNeighborhoodsByCity(v.slug)
              if (quartiers.length === 0) return null
              return (
                <div key={v.slug}>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    <Link href={`/cities/${v.slug}`} className="hover:text-blue-600 transition-colors">
                      {v.name}
                    </Link>
                    {' '}({quartiers.length} quartiers)
                  </h3>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 ml-4">
                    {quartiers.map(q => (
                      <Link
                        key={q.slug}
                        href={`/cities/${v.slug}/${q.slug}`}
                        className="text-sm text-gray-600 hover:text-blue-600"
                      >
                        {q.name}
                      </Link>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {/* Blog articles */}
        <section className="mb-12">
          <h2 className="text-xl font-bold text-gray-900 mb-4 border-l-4 border-amber-500 pl-4">
            Articles du blog ({allArticlesMeta.length})
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
            {allArticlesMeta.map(article => (
              <Link
                key={article.slug}
                href={`/blog/${article.slug}`}
                className="text-sm text-blue-600 hover:text-blue-800 py-1"
              >
                {article.title}
              </Link>
            ))}
          </div>
        </section>

        {/* Pages utiles */}
        <section className="mb-12">
          <h2 className="text-xl font-bold text-gray-900 mb-4 border-l-4 border-amber-500 pl-4">
            Pages utiles
          </h2>
          <div className="grid md:grid-cols-3 gap-3">
            {[
              { href: '/about', label: 'À propos' },
              { href: '/contact', label: 'Contact' },
              { href: '/faq', label: 'FAQ' },
              { href: '/how-it-works', label: 'Comment ça marche' },
              { href: '/quotes', label: 'Demander un devis' },
              { href: '/emergency', label: 'Urgence 24h/24' },
              { href: '/blog', label: 'Blog' },
              { href: '/pricing', label: 'Tarifs artisans' },
              { href: '/search', label: 'Recherche' },
              { href: '/verification-process', label: 'Processus de vérification' },
              { href: '/legal', label: 'Mentions légales' },
              { href: '/privacy', label: 'Confidentialité' },
              { href: '/terms', label: 'CGV' },
              { href: '/accessibility', label: 'Accessibilité' },
              { href: '/mediation', label: 'Médiation' },
              { href: '/review-policy', label: 'Politique d\'avis' },
            ].map(p => (
              <Link
                key={p.href}
                href={p.href}
                className="text-sm text-blue-600 hover:text-blue-800 py-1"
              >
                {p.label}
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
