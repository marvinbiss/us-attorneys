import { Metadata } from 'next'
import Link from 'next/link'
import { BarChart3, Star, Users, ArrowRight } from 'lucide-react'
import Breadcrumb from '@/components/Breadcrumb'
import JsonLd from '@/components/JsonLd'
import { getBreadcrumbSchema } from '@/lib/seo/jsonld'
import { SITE_URL, SITE_NAME } from '@/lib/seo/config'
import { getTopMetiers } from '@/lib/barometre/queries'
import { getBarometreMetierBySlug } from '@/lib/barometre/constants'

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------

const canonicalUrl = `${SITE_URL}/barometre/tarifs`

export const metadata: Metadata = {
  title: `Statistiques par métier — Baromètre des Artisans | ${SITE_NAME}`,
  description:
    'Consultez les statistiques détaillées par corps de métier : plombier, électricien, maçon, couvreur et plus. Nombre d\'artisans, notes moyennes, avis par métier en France.',
  alternates: { canonical: canonicalUrl },
  robots: { index: true, follow: true },
  openGraph: {
    locale: 'fr_FR',
    title: `Statistiques par métier — Baromètre des Artisans | ${SITE_NAME}`,
    description: 'Stats détaillées par corps de métier du bâtiment en France.',
    url: canonicalUrl,
    type: 'website',
  },
}

export const revalidate = 86400

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function BarometreTarifsPage() {
  const metiers = await getTopMetiers(50) // All available

  const breadcrumbSchema = getBreadcrumbSchema([
    { name: 'Accueil', url: '/' },
    { name: 'Baromètre', url: '/barometre' },
    { name: 'Métiers', url: '/barometre/tarifs' },
  ])

  return (
    <>
      <JsonLd data={breadcrumbSchema} />

      <div className="min-h-screen bg-gray-50">
        {/* Breadcrumb */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
          <Breadcrumb
            items={[
              { label: 'Baromètre', href: '/barometre' },
              { label: 'Métiers' },
            ]}
          />
        </div>

        {/* Header */}
        <header className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-12">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-50 text-blue-700 rounded-full text-sm font-medium mb-6">
              <BarChart3 className="w-4 h-4" />
              {metiers.length} métiers référencés
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 tracking-tight mb-4">
              Statistiques par métier
            </h1>
            <p className="text-lg text-gray-600 leading-relaxed">
              Explorez les données détaillées pour chaque corps de métier du bâtiment :
              nombre d&apos;artisans, note moyenne et avis clients.
            </p>
          </div>
        </header>

        {/* Grid */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {metiers.map((row) => {
              const metier = getBarometreMetierBySlug(row.metier_slug)
              return (
                <Link
                  key={row.metier_slug}
                  href={`/barometre/tarifs/${row.metier_slug}`}
                  className="group bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-2xl" role="img" aria-hidden="true">
                      {metier?.icon || '\uD83D\uDD27'}
                    </span>
                    <h2 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                      {row.metier}
                    </h2>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" />
                      {row.nb_artisans.toLocaleString('fr-FR')}
                    </span>
                    {row.note_moyenne !== null && (
                      <span className="flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 text-amber-500" />
                        {row.note_moyenne.toFixed(1)}
                      </span>
                    )}
                    <span>{row.nb_avis.toLocaleString('fr-FR')} avis</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="w-full bg-gray-100 rounded-full h-1.5 mr-3">
                      <div
                        className="bg-blue-500 rounded-full h-1.5"
                        style={{
                          width: `${metiers[0] ? (row.nb_artisans / metiers[0].nb_artisans) * 100 : 0}%`,
                        }}
                      />
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-blue-500 flex-shrink-0" />
                  </div>
                </Link>
              )
            })}
          </div>
        </section>
      </div>
    </>
  )
}
