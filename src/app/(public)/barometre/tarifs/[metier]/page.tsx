import { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Star, Users, Shield, MapPin, ArrowRight, HelpCircle } from 'lucide-react'
import Breadcrumb from '@/components/Breadcrumb'
import JsonLd from '@/components/JsonLd'
import { getBreadcrumbSchema, getFAQSchema } from '@/lib/seo/jsonld'
import { SITE_URL, SITE_NAME } from '@/lib/seo/config'
import { BAROMETRE_METIERS, getBarometreMetierBySlug, TOP_VILLES } from '@/lib/barometre/constants'
import { getStatsByMetier, getMetierTopVilles } from '@/lib/barometre/queries'
import type { BarometreStatRow } from '@/lib/barometre/queries'

// ---------------------------------------------------------------------------
// Static params (top 30 métiers)
// ---------------------------------------------------------------------------

export function generateStaticParams() {
  return BAROMETRE_METIERS.map((m) => ({ metier: m.slug }))
}

export const dynamicParams = false
export const revalidate = 86400

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface PageProps {
  params: Promise<{ metier: string }>
}

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { metier: metierSlug } = await params
  const metier = getBarometreMetierBySlug(metierSlug)
  if (!metier) return { title: 'Métier non trouvé' }

  const stats = await getStatsByMetier(metierSlug)
  const count = stats?.nb_artisans ?? 0
  const countStr = count > 0 ? `${count.toLocaleString('fr-FR')} ` : ''

  const title = `${metier.label} en France — ${countStr}artisans, stats et avis`
  const description = `Baromètre ${metier.label.toLowerCase()} : ${countStr}artisans référencés en France, note moyenne ${stats?.note_moyenne?.toFixed(1) ?? '--'}/5, ${(stats?.nb_avis ?? 0).toLocaleString('fr-FR')} avis. Statistiques par ville et département.`
  const canonicalUrl = `${SITE_URL}/barometre/tarifs/${metierSlug}`

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
      images: [{ url: `${SITE_URL}/opengraph-image`, width: 1200, height: 630, alt: `${metier.label} — Baromètre ${SITE_NAME}` }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  }
}

// ---------------------------------------------------------------------------
// FAQ auto-générée
// ---------------------------------------------------------------------------

function generateFAQ(metier: { label: string; slug: string }, stats: BarometreStatRow | null) {
  const label = metier.label.toLowerCase()
  return [
    {
      question: `Combien de ${label}s sont référencés en France ?`,
      answer: stats
        ? `Notre annuaire recense ${stats.nb_artisans.toLocaleString('fr-FR')} ${label}s actifs en France, répartis dans toutes les régions métropolitaines. Ce chiffre est mis à jour quotidiennement.`
        : `Des milliers de ${label}s sont référencés dans notre annuaire, couvrant l'ensemble du territoire français.`,
    },
    {
      question: `Quelle est la note moyenne des ${label}s ?`,
      answer: stats?.note_moyenne
        ? `La note moyenne des ${label}s sur ${SITE_NAME} est de ${stats.note_moyenne.toFixed(1)}/5, basée sur ${stats.nb_avis.toLocaleString('fr-FR')} avis clients vérifiés.`
        : `Les ${label}s sont évalués par les clients après chaque intervention. Consultez les fiches individuelles pour voir les notes détaillées.`,
    },
    {
      question: `Comment trouver un ${label} vérifié près de chez moi ?`,
      answer: `Utilisez notre moteur de recherche sur ${SITE_NAME} : entrez "${metier.label}" et votre ville. Les artisans vérifiés (SIRET confirmé) sont clairement identifiés avec un badge.`,
    },
    {
      question: `Les données du baromètre ${label} sont-elles fiables ?`,
      answer: `Oui. Les artisans sont référencés via les données SIREN/SIRET officielles. Les notes proviennent d'avis clients authentifiés et modérés. Les statistiques sont recalculées quotidiennement.`,
    },
  ]
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function BarometreMetierPage({ params }: PageProps) {
  const { metier: metierSlug } = await params
  const metier = getBarometreMetierBySlug(metierSlug)
  if (!metier) notFound()

  const [stats, villeStats] = await Promise.all([
    getStatsByMetier(metierSlug),
    getMetierTopVilles(metierSlug, TOP_VILLES),
  ])

  const faqItems = generateFAQ(metier, stats)

  const breadcrumbSchema = getBreadcrumbSchema([
    { name: 'Accueil', url: '/' },
    { name: 'Baromètre', url: '/barometre' },
    { name: 'Métiers', url: '/barometre/tarifs' },
    { name: metier.label, url: `/barometre/tarifs/${metierSlug}` },
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
              { label: 'Métiers', href: '/barometre/tarifs' },
              { label: metier.label },
            ]}
          />
        </div>

        {/* Header */}
        <header className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-12">
          <div className="max-w-3xl">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-4xl" role="img" aria-hidden="true">{metier.icon}</span>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
                {metier.label} en France
              </h1>
            </div>
            <p className="text-lg text-gray-600">
              Statistiques détaillées des {metier.label.toLowerCase()}s référencés sur {SITE_NAME}.
              Données agrégées à partir de notre base de 940 000+ artisans.
            </p>
          </div>
        </header>

        {/* Stats cards */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl border border-gray-200 p-5 text-center">
              <Users className="w-5 h-5 text-blue-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">
                {stats ? stats.nb_artisans.toLocaleString('fr-FR') : '--'}
              </div>
              <div className="text-xs text-gray-500 mt-1">Artisans référencés</div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5 text-center">
              <Star className="w-5 h-5 text-amber-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">
                {stats?.note_moyenne ? `${stats.note_moyenne.toFixed(1)}/5` : '--'}
              </div>
              <div className="text-xs text-gray-500 mt-1">Note moyenne</div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5 text-center">
              <MapPin className="w-5 h-5 text-emerald-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">
                {stats ? stats.nb_avis.toLocaleString('fr-FR') : '--'}
              </div>
              <div className="text-xs text-gray-500 mt-1">Avis clients</div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5 text-center">
              <Shield className="w-5 h-5 text-purple-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">
                {stats ? `${Math.round(stats.taux_verification * 100)}%` : '--'}
              </div>
              <div className="text-xs text-gray-500 mt-1">Taux vérification</div>
            </div>
          </div>
        </section>

        {/* Tableau des villes */}
        {villeStats.length > 0 && (
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              {metier.label} par ville
            </h2>
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-left">
                      <th className="px-6 py-3 font-semibold text-gray-700">Ville</th>
                      <th className="px-4 py-3 font-semibold text-gray-700 text-right">Artisans</th>
                      <th className="px-4 py-3 font-semibold text-gray-700 text-right">Note</th>
                      <th className="px-4 py-3 font-semibold text-gray-700 text-right">Avis</th>
                      <th className="px-4 py-3 font-semibold text-gray-700 text-right">Vérifiés</th>
                      <th className="px-4 py-3 font-semibold text-gray-700"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {villeStats.map((row, idx) => (
                      <tr
                        key={row.ville_slug}
                        className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}
                      >
                        <td className="px-6 py-3 font-medium text-gray-900">{row.ville}</td>
                        <td className="px-4 py-3 text-right text-gray-700">
                          {row.nb_artisans.toLocaleString('fr-FR')}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {row.note_moyenne !== null ? (
                            <span className="inline-flex items-center gap-1 text-amber-600">
                              <Star className="w-3 h-3" />
                              {row.note_moyenne.toFixed(1)}
                            </span>
                          ) : (
                            <span className="text-gray-400">--</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right text-gray-700">
                          {row.nb_avis.toLocaleString('fr-FR')}
                        </td>
                        <td className="px-4 py-3 text-right text-gray-700">
                          {Math.round(row.taux_verification * 100)}%
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Link
                            href={`/services/${metierSlug}/${row.ville_slug}`}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <ArrowRight className="w-4 h-4" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {/* Liens rapides */}
        <section className="bg-white py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Trouver un {metier.label.toLowerCase()}
            </h2>
            <div className="flex flex-wrap gap-2">
              {TOP_VILLES.slice(0, 10).map((ville) => (
                <Link
                  key={ville}
                  href={`/services/${metierSlug}/${ville.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-')}`}
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-full text-sm text-gray-700 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 transition-colors"
                >
                  <MapPin className="w-3 h-3" />
                  {metier.label} à {ville}
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
