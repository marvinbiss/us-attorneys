import { Metadata } from 'next'
import Link from 'next/link'
import {
  BarChart3, Users, MapPin, Star, Shield, ArrowRight,
  Code, ExternalLink, HelpCircle, BookOpen,
} from 'lucide-react'
import Breadcrumb from '@/components/Breadcrumb'
import JsonLd from '@/components/JsonLd'
import { getBreadcrumbSchema, getFAQSchema } from '@/lib/seo/jsonld'
import { SITE_URL, SITE_NAME } from '@/lib/seo/config'
import { getNationalStats, getTopMetiers, getTopVilles } from '@/lib/barometre/queries'
import { getBarometreMetierBySlug } from '@/lib/barometre/constants'

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------

const canonicalUrl = `${SITE_URL}/barometre`

export const metadata: Metadata = {
  title: `Baromètre des Artisans 2026 — Stats par métier`,
  description:
    'Baromètre des artisans en France : statistiques temps réel sur 940 000+ professionnels du bâtiment. Notes moyennes, taux de vérification, répartition par métier et par ville. Données ouvertes et API publique.',
  alternates: { canonical: canonicalUrl },
  robots: { index: true, follow: true, 'max-snippet': -1, 'max-image-preview': 'large' as const, 'max-video-preview': -1 },
  openGraph: {
    locale: 'fr_FR',
    title: `Baromètre des Artisans 2026 | ${SITE_NAME}`,
    description: 'Statistiques temps réel sur 940 000+ artisans en France. Notes, avis, taux de vérification par métier et par ville.',
    url: canonicalUrl,
    type: 'website',
    images: [{ url: `${SITE_URL}/opengraph-image`, width: 1200, height: 630, alt: `Baromètre des Artisans — ${SITE_NAME}` }],
  },
  twitter: {
    card: 'summary_large_image',
    title: `Baromètre des Artisans 2026 | ${SITE_NAME}`,
    description: 'Statistiques temps réel sur 940 000+ artisans du bâtiment en France.',
    images: [`${SITE_URL}/opengraph-image`],
  },
}

export const revalidate = 86400

// ---------------------------------------------------------------------------
// FAQ
// ---------------------------------------------------------------------------

const faqItems = [
  {
    question: "Qu'est-ce que le Baromètre des Artisans ?",
    answer: `Le Baromètre des Artisans est un outil de ${SITE_NAME} qui agrège les données de plus de 940 000 artisans référencés en France. Il fournit des statistiques par métier, ville, département et région : nombre d'artisans, note moyenne, nombre d'avis et taux de vérification SIREN.`,
  },
  {
    question: 'Comment les données sont-elles collectées ?',
    answer: "Les données proviennent de notre annuaire, qui référence les artisans à partir des données SIREN/SIRET officielles de l'INSEE. Les notes et avis sont collectés directement sur la plateforme. Les statistiques sont agrégées quotidiennement.",
  },
  {
    question: 'Puis-je utiliser ces données ?',
    answer: `Oui, les données sont accessibles via notre API publique gratuite (/api/v1/docs). La seule condition est de mentionner la source avec un lien vers ${SITE_URL}/barometre.`,
  },
  {
    question: 'À quelle fréquence le baromètre est-il mis à jour ?',
    answer: 'Les données sont recalculées quotidiennement. Les pages sont régénérées toutes les 24 heures via ISR (Incremental Static Regeneration).',
  },
  {
    question: 'Les données sont-elles fiables ?',
    answer: "Les artisans sont référencés via les données SIREN officielles. Le taux de vérification indique la proportion d'artisans dont le SIRET a été vérifié et confirmé. Les notes proviennent d'avis clients authentifiés.",
  },
]

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function BarometrePage() {
  const [stats, topMetiers, topVilles] = await Promise.all([
    getNationalStats(),
    getTopMetiers(10),
    getTopVilles(10),
  ])

  const maxMetierCount = topMetiers.length > 0 ? topMetiers[0].nb_artisans : 1
  const maxVilleCount = topVilles.length > 0 ? topVilles[0].total : 1

  const breadcrumbSchema = getBreadcrumbSchema([
    { name: 'Accueil', url: '/' },
    { name: 'Baromètre des Artisans', url: '/barometre' },
  ])

  const faqSchema = getFAQSchema(faqItems)

  const datasetSchema = {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    name: 'Baromètre des Artisans en France 2026',
    description: `Statistiques agrégées de ${stats.totalArtisans.toLocaleString('fr-FR')} artisans du bâtiment en France : notes, avis, taux de vérification par métier et par ville.`,
    creator: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL },
    temporalCoverage: '2026',
    spatialCoverage: { '@type': 'Place', name: 'France' },
    license: 'https://creativecommons.org/licenses/by/4.0/',
    variableMeasured: [
      { '@type': 'PropertyValue', name: 'Nombre d\'artisans', unitText: 'count' },
      { '@type': 'PropertyValue', name: 'Note moyenne', unitText: 'rating (1-5)' },
      { '@type': 'PropertyValue', name: 'Taux de vérification', unitText: 'percent' },
    ],
  }

  return (
    <>
      <JsonLd data={[breadcrumbSchema, faqSchema, datasetSchema]} />

      <div className="min-h-screen bg-gray-50">
        {/* ================================================================ */}
        {/* HERO */}
        {/* ================================================================ */}
        <section className="relative bg-[#0a0f1e] text-white overflow-hidden">
          <div className="absolute inset-0">
            <div
              className="absolute inset-0"
              style={{
                background:
                  'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(37,99,235,0.18) 0%, transparent 60%), radial-gradient(ellipse 60% 60% at 80% 110%, rgba(37,99,235,0.1) 0%, transparent 50%)',
              }}
            />
            <div
              className="absolute inset-0 opacity-[0.025]"
              style={{
                backgroundImage:
                  'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
                backgroundSize: '64px 64px',
              }}
            />
            <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-gray-50 to-transparent" />
          </div>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-28 md:pt-14 md:pb-36">
            <Breadcrumb
              items={[{ label: 'Baromètre des Artisans' }]}
              className="mb-6 text-slate-400 [&_a]:text-slate-400 [&_a:hover]:text-white [&_svg]:text-slate-600"
            />
            <div className="text-center">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-500/10 text-blue-300 rounded-full text-sm font-medium mb-6 border border-blue-500/20">
                <BarChart3 className="w-4 h-4" />
                Mise à jour : mars 2026
              </div>
              <h1 className="font-heading text-4xl md:text-5xl font-extrabold mb-6 tracking-[-0.025em]">
                Baromètre des Artisans
              </h1>
              <p className="text-xl text-slate-400 max-w-3xl mx-auto">
                Statistiques temps réel sur {stats.totalArtisans > 0 ? stats.totalArtisans.toLocaleString('fr-FR') : '940 000'}+ artisans
                du bâtiment en France. Données ouvertes, API publique.
              </p>
            </div>
          </div>
        </section>

        {/* ================================================================ */}
        {/* CHIFFRES CLES */}
        {/* ================================================================ */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 relative z-10 pb-16">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-50 text-blue-600 mb-3">
                <Users className="w-6 h-6" />
              </div>
              <div className="text-3xl font-extrabold text-gray-900">
                {stats.totalArtisans > 0 ? `${Math.round(stats.totalArtisans / 1000)}k+` : '940k+'}
              </div>
              <div className="text-sm text-gray-500 mt-1">Artisans référencés</div>
            </div>
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-amber-50 text-amber-600 mb-3">
                <Star className="w-6 h-6" />
              </div>
              <div className="text-3xl font-extrabold text-gray-900">
                {stats.noteGlobale.toFixed(1)}/5
              </div>
              <div className="text-sm text-gray-500 mt-1">Note moyenne nationale</div>
            </div>
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 mb-3">
                <MapPin className="w-6 h-6" />
              </div>
              <div className="text-3xl font-extrabold text-gray-900">
                {stats.nbVilles > 0 ? stats.nbVilles.toLocaleString('fr-FR') : '2 280'}
              </div>
              <div className="text-sm text-gray-500 mt-1">Villes couvertes</div>
            </div>
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-purple-50 text-purple-600 mb-3">
                <Shield className="w-6 h-6" />
              </div>
              <div className="text-3xl font-extrabold text-gray-900">
                {stats.tauxVerifGlobal > 0 ? `${Math.round(stats.tauxVerifGlobal * 100)}%` : '--'}
              </div>
              <div className="text-sm text-gray-500 mt-1">Taux de vérification</div>
            </div>
          </div>
        </section>

        {/* ================================================================ */}
        {/* TOP 10 METIERS */}
        {/* ================================================================ */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Top 10 des métiers</h2>
              <p className="text-gray-600 mt-1">Les corps de métier les plus représentés dans notre annuaire</p>
            </div>
            <Link
              href="/barometre/tarifs"
              className="hidden sm:inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-800"
            >
              Voir tous les métiers <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="space-y-3">
            {topMetiers.map((row, idx) => {
              const metier = getBarometreMetierBySlug(row.metier_slug)
              const pct = maxMetierCount > 0 ? (row.nb_artisans / maxMetierCount) * 100 : 0
              return (
                <Link
                  key={row.metier_slug}
                  href={`/barometre/tarifs/${row.metier_slug}`}
                  className="group flex items-center gap-4 bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow"
                >
                  <span className="text-2xl w-10 text-center flex-shrink-0" role="img" aria-hidden="true">
                    {metier?.icon || '\uD83D\uDD27'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                        {idx + 1}. {row.metier}
                      </span>
                      <span className="text-sm font-medium text-gray-600">
                        {row.nb_artisans.toLocaleString('fr-FR')} artisans
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div
                        className="bg-blue-500 rounded-full h-2 transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="flex items-center gap-4 mt-1.5 text-xs text-gray-500">
                      {row.note_moyenne !== null && (
                        <span className="flex items-center gap-1">
                          <Star className="w-3 h-3 text-amber-500" />
                          {row.note_moyenne.toFixed(1)}/5
                        </span>
                      )}
                      <span>{row.nb_avis.toLocaleString('fr-FR')} avis</span>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-blue-500 transition-colors flex-shrink-0" />
                </Link>
              )
            })}
          </div>

          <div className="mt-6 sm:hidden text-center">
            <Link
              href="/barometre/tarifs"
              className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-800"
            >
              Voir tous les métiers <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>

        {/* ================================================================ */}
        {/* TOP 10 VILLES */}
        {/* ================================================================ */}
        <section className="bg-white py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Top 10 des villes</h2>
                <p className="text-gray-600 mt-1">Les villes avec le plus grand nombre d&apos;artisans</p>
              </div>
              <Link
                href="/barometre/regions"
                className="hidden sm:inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-800"
              >
                Voir par région <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {topVilles.map((v, idx) => {
                const pct = maxVilleCount > 0 ? (v.total / maxVilleCount) * 100 : 0
                return (
                  <div
                    key={v.ville_slug}
                    className="flex items-center gap-4 bg-gray-50 rounded-xl border border-gray-200 p-4"
                  >
                    <span className="text-lg font-bold text-gray-400 w-8 text-center flex-shrink-0">
                      {idx + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-gray-900">{v.ville}</span>
                        <span className="text-sm font-medium text-gray-600">
                          {v.total.toLocaleString('fr-FR')}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div
                          className="bg-emerald-500 rounded-full h-1.5 transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* ================================================================ */}
        {/* CITER CES DONNEES */}
        {/* ================================================================ */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-8 md:p-12 text-white">
            <div className="flex items-center gap-3 mb-4">
              <Code className="w-6 h-6 text-blue-400" />
              <h2 className="text-2xl font-bold">Citer ces données</h2>
            </div>
            <p className="text-slate-300 mb-6 max-w-2xl">
              Vous pouvez utiliser les données du Baromètre des Artisans dans vos articles, études ou sites web.
              Merci de toujours inclure l&apos;attribution suivante :
            </p>
            <div className="bg-slate-950/50 rounded-lg p-4 font-mono text-sm text-slate-300 mb-6 overflow-x-auto">
              <code>
                Source : &lt;a href=&quot;{SITE_URL}/barometre&quot;&gt;{SITE_NAME} — Baromètre des Artisans&lt;/a&gt;
              </code>
            </div>
            <p className="text-slate-400 text-sm">
              Licence : Creative Commons Attribution 4.0 — Usage libre avec attribution.
            </p>
          </div>
        </section>

        {/* ================================================================ */}
        {/* API PUBLIQUE */}
        {/* ================================================================ */}
        <section className="bg-white py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-blue-50 text-blue-600 mb-4">
                <ExternalLink className="w-7 h-7" />
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">API publique gratuite</h2>
              <p className="text-gray-600 mb-8">
                Intégrez les données du Baromètre dans vos applications. Pas de clé API requise,
                réponses en JSON, cache 1h.
              </p>
              <div className="bg-gray-50 rounded-xl border border-gray-200 p-6 text-left mb-6">
                <p className="font-mono text-sm text-gray-700 mb-2">
                  <span className="text-green-600 font-bold">GET</span>{' '}
                  /api/v1/tarifs?metier=plombier&amp;ville=paris
                </p>
                <p className="font-mono text-sm text-gray-700">
                  <span className="text-green-600 font-bold">GET</span>{' '}
                  /api/v1/stats?region=ile-de-france
                </p>
              </div>
              <Link
                href="/api/v1/docs"
                className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                <BookOpen className="w-5 h-5" />
                Documentation de l&apos;API
              </Link>
            </div>
          </div>
        </section>

        {/* ================================================================ */}
        {/* METHODOLOGIE */}
        {/* ================================================================ */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8 text-center">Méthodologie</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Référencement SIREN</h3>
              <p className="text-sm text-gray-600">
                Les artisans sont référencés à partir des données SIREN/SIRET officielles de l&apos;INSEE,
                complétées par les registres des métiers (CMA).
              </p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center mb-4">
                <Star className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Avis authentifiés</h3>
              <p className="text-sm text-gray-600">
                Les avis sont collectés auprès de clients ayant effectivement fait appel à l&apos;artisan.
                Chaque avis est modéré avant publication.
              </p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
                <BarChart3 className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Agrégation quotidienne</h3>
              <p className="text-sm text-gray-600">
                Les statistiques sont recalculées chaque jour à partir de l&apos;intégralité de la base.
                Les pages sont régénérées toutes les 24 heures.
              </p>
            </div>
          </div>
        </section>

        {/* ================================================================ */}
        {/* FAQ */}
        {/* ================================================================ */}
        <section className="bg-white py-16">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                <HelpCircle className="w-5 h-5" />
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Questions fréquentes</h2>
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
          </div>
        </section>

        {/* ================================================================ */}
        {/* NAVIGATION */}
        {/* ================================================================ */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Link
              href="/barometre/tarifs"
              className="flex items-center gap-4 bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow group"
            >
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                <BarChart3 className="w-6 h-6" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 group-hover:text-blue-600">Tous les métiers</p>
                <p className="text-sm text-gray-500">Stats par corps de métier</p>
              </div>
            </Link>
            <Link
              href="/barometre/regions"
              className="flex items-center gap-4 bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow group"
            >
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
                <MapPin className="w-6 h-6" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 group-hover:text-emerald-600">Par région</p>
                <p className="text-sm text-gray-500">13 régions métropolitaines</p>
              </div>
            </Link>
            <Link
              href="/barometre/tarifs"
              className="flex items-center gap-4 bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow group"
            >
              <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0">
                <BookOpen className="w-6 h-6" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 group-hover:text-amber-600">Baromètre des prix</p>
                <p className="text-sm text-gray-500">Tarifs par intervention</p>
              </div>
            </Link>
          </div>
        </section>
      </div>
    </>
  )
}
