import { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { MapPin, Users, Star, Building2, ArrowRight, BarChart3, HelpCircle } from 'lucide-react'
import Breadcrumb from '@/components/Breadcrumb'
import JsonLd from '@/components/JsonLd'
import { getBreadcrumbSchema, getFAQSchema } from '@/lib/seo/jsonld'
import { SITE_URL, SITE_NAME } from '@/lib/seo/config'
import { BAROMETRE_REGIONS, getBarometreRegionBySlug, getBarometreMetierBySlug } from '@/lib/barometre/constants'
import { getStatsByRegion } from '@/lib/barometre/queries'
import { regionalIndices } from '@/lib/data/barometre'

// ---------------------------------------------------------------------------
// Static params (13 régions métropolitaines)
// ---------------------------------------------------------------------------

export function generateStaticParams() {
  return BAROMETRE_REGIONS.map((r) => ({ region: r.slug }))
}

export const dynamicParams = false
export const revalidate = 86400

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface PageProps {
  params: Promise<{ region: string }>
}

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { region: regionSlug } = await params
  const region = getBarometreRegionBySlug(regionSlug)
  if (!region) return { title: 'Région non trouvée' }

  const title = `Artisans en ${region.name} — Baromètre et statistiques`
  const description = `Baromètre des artisans en ${region.name} : top métiers, ${region.departements.length} départements, notes moyennes et taux de vérification. Données actualisées ${SITE_NAME}.`
  const canonicalUrl = `${SITE_URL}/barometre/regions/${regionSlug}`

  return {
    title,
    description,
    alternates: { canonical: canonicalUrl },
    robots: { index: true, follow: true },
    openGraph: {
      locale: 'fr_FR',
      title,
      description,
      url: canonicalUrl,
      type: 'website',
      images: [{ url: `${SITE_URL}/opengraph-image`, width: 1200, height: 630, alt: `Artisans en ${region.name}` }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  }
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function BarometreRegionPage({ params }: PageProps) {
  const { region: regionSlug } = await params
  const region = getBarometreRegionBySlug(regionSlug)
  if (!region) notFound()

  const stats = await getStatsByRegion(regionSlug)
  const index = regionalIndices.find((r) => r.regionSlug === regionSlug)

  const totalArtisans = stats.reduce((s, r) => s + r.nb_artisans, 0)
  const ratedStats = stats.filter((r) => r.note_moyenne !== null)
  const noteMoyenne = ratedStats.length > 0
    ? Math.round(
        (ratedStats.reduce((s, r) => s + (r.note_moyenne ?? 0) * r.nb_artisans, 0) /
          ratedStats.reduce((s, r) => s + r.nb_artisans, 0)) * 10,
      ) / 10
    : null

  const maxCount = stats.length > 0 ? stats[0].nb_artisans : 1

  const faqItems = [
    {
      question: `Combien d'artisans sont référencés en ${region.name} ?`,
      answer: totalArtisans > 0
        ? `Notre annuaire recense ${totalArtisans.toLocaleString('fr-FR')} artisans actifs en ${region.name}, répartis dans ${region.departements.length} départements et couvrant plus de ${stats.length} corps de métier.`
        : `Des milliers d'artisans du bâtiment sont référencés en ${region.name} dans notre annuaire.`,
    },
    {
      question: `Quel est l'indice de prix en ${region.name} ?`,
      answer: index
        ? `L'indice de prix en ${region.name} est de ${index.index} (base 100 = moyenne nationale). ${index.index > 100 ? `Les prix sont ${index.index - 100}% au-dessus de la moyenne nationale.` : index.index < 100 ? `Les prix sont ${100 - index.index}% en dessous de la moyenne nationale.` : 'Les prix sont dans la moyenne nationale.'}`
        : `Consultez notre baromètre des prix pour connaître l'indice régional en ${region.name}.`,
    },
    {
      question: `Quels sont les métiers les plus demandés en ${region.name} ?`,
      answer: stats.length > 0
        ? `Les métiers les plus représentés en ${region.name} sont : ${stats.slice(0, 5).map((s) => s.metier).join(', ')}. Ces données reflètent la demande locale en services artisanaux.`
        : `Consultez le détail par métier pour connaître les artisans les plus représentés en ${region.name}.`,
    },
  ]

  const breadcrumbSchema = getBreadcrumbSchema([
    { name: 'Accueil', url: '/' },
    { name: 'Baromètre', url: '/barometre' },
    { name: 'Régions', url: '/barometre/regions' },
    { name: region.name, url: `/barometre/regions/${regionSlug}` },
  ])

  const faqSchema = getFAQSchema(faqItems)

  return (
    <>
      <JsonLd data={[breadcrumbSchema, faqSchema]} />

      <div className="min-h-screen bg-gray-50">
        {/* Breadcrumb */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
          <Breadcrumb
            items={[
              { label: 'Baromètre', href: '/barometre' },
              { label: 'Régions', href: '/barometre/regions' },
              { label: region.name },
            ]}
          />
        </div>

        {/* Header */}
        <header className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-12">
          <div className="max-w-3xl">
            <div className="flex items-center gap-3 mb-4">
              <MapPin className="w-8 h-8 text-emerald-600" />
              <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
                {region.name}
              </h1>
              {index && (
                <span className="text-sm font-bold px-3 py-1 rounded-full bg-blue-50 text-blue-700">
                  Indice {index.index}
                </span>
              )}
            </div>
            <p className="text-lg text-gray-600">
              Baromètre des artisans en {region.name} : {region.departements.length} départements,
              {totalArtisans > 0 ? ` ${totalArtisans.toLocaleString('fr-FR')} artisans référencés,` : ''}
              {' '}données actualisées quotidiennement.
            </p>
          </div>
        </header>

        {/* Stats cards */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl border border-gray-200 p-5 text-center">
              <Users className="w-5 h-5 text-blue-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">
                {totalArtisans > 0 ? totalArtisans.toLocaleString('fr-FR') : '--'}
              </div>
              <div className="text-xs text-gray-500 mt-1">Artisans</div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5 text-center">
              <Star className="w-5 h-5 text-amber-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">
                {noteMoyenne ? `${noteMoyenne}/5` : '--'}
              </div>
              <div className="text-xs text-gray-500 mt-1">Note moyenne</div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5 text-center">
              <BarChart3 className="w-5 h-5 text-emerald-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">{stats.length}</div>
              <div className="text-xs text-gray-500 mt-1">Métiers couverts</div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5 text-center">
              <Building2 className="w-5 h-5 text-purple-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">{region.departements.length}</div>
              <div className="text-xs text-gray-500 mt-1">Départements</div>
            </div>
          </div>
        </section>

        {/* Top métiers */}
        {stats.length > 0 && (
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Top métiers en {region.name}
            </h2>
            <div className="space-y-3">
              {stats.slice(0, 15).map((row, idx) => {
                const metier = getBarometreMetierBySlug(row.metier_slug)
                const pct = maxCount > 0 ? (row.nb_artisans / maxCount) * 100 : 0
                return (
                  <Link
                    key={row.metier_slug}
                    href={`/barometre/tarifs/${row.metier_slug}`}
                    className="group flex items-center gap-4 bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow"
                  >
                    <span className="text-xl w-8 text-center flex-shrink-0" role="img" aria-hidden="true">
                      {metier?.icon || '🔧'}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                          {idx + 1}. {row.metier}
                        </span>
                        <span className="text-sm font-medium text-gray-600">
                          {row.nb_artisans.toLocaleString('fr-FR')}
                        </span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-1.5">
                        <div
                          className="bg-emerald-500 rounded-full h-1.5"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                        {row.note_moyenne !== null && (
                          <span className="flex items-center gap-1">
                            <Star className="w-3 h-3 text-amber-500" />
                            {row.note_moyenne.toFixed(1)}/5
                          </span>
                        )}
                        <span>{row.nb_avis.toLocaleString('fr-FR')} avis</span>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-blue-500 flex-shrink-0" />
                  </Link>
                )
              })}
            </div>
          </section>
        )}

        {/* Départements */}
        <section className="bg-white py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Départements de {region.name}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {region.departements.map((dept) => (
                <Link
                  key={dept.code}
                  href={`/departements/${dept.nom.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-')}`}
                  className="flex items-center gap-3 bg-gray-50 rounded-lg border border-gray-200 p-4 hover:bg-blue-50 hover:border-blue-200 transition-colors"
                >
                  <span className="text-sm font-bold text-gray-400 w-8">{dept.code}</span>
                  <span className="text-sm font-medium text-gray-700">{dept.nom}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
              <HelpCircle className="w-5 h-5" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Questions fréquentes</h2>
          </div>
          <div className="space-y-4">
            {faqItems.map((item) => (
              <details key={item.question} className="group bg-gray-50 rounded-xl border border-gray-200">
                <summary className="flex items-center justify-between p-5 cursor-pointer list-none font-semibold text-gray-900 hover:text-blue-600 transition-colors">
                  {item.question}
                  <span className="ml-4 text-gray-400 group-open:rotate-45 transition-transform text-xl">+</span>
                </summary>
                <div className="px-5 pb-5 text-gray-600 text-sm leading-relaxed">
                  {item.answer}
                </div>
              </details>
            ))}
          </div>
        </section>
      </div>
    </>
  )
}
