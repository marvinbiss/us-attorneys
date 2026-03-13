import type { Metadata } from 'next'
import Link from 'next/link'
import { SITE_URL, SITE_NAME } from '@/lib/seo/config'
import JsonLd from '@/components/JsonLd'
import Breadcrumb from '@/components/Breadcrumb'
import { calendrierTravaux } from '@/lib/data/calendrier-travaux'
import {
  Calendar,
  CheckCircle2,
  XCircle,
  Lightbulb,
  CloudSun,
  ArrowRight,
  Search,
  BookOpen,
  Snowflake,
  Flower2,
  Sun,
  Leaf,
} from 'lucide-react'

const PAGE_URL = `${SITE_URL}/calendrier-travaux`

export const metadata: Metadata = {
  title: 'Calendrier des Travaux : Guide Mois par Mois',
  description:
    'Calendrier saisonnier des travaux de la maison : quels travaux faire chaque mois, lesquels éviter et les conseils pratiques pour planifier votre rénovation au bon moment.',
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title: 'Calendrier des travaux : quand faire quoi ?',
    description:
      'Guide mois par mois pour planifier vos travaux au bon moment. Travaux recommandés, à éviter et conseils saisonniers.',
    url: PAGE_URL,
    type: 'website',
    siteName: SITE_NAME,
  },
}

export const revalidate = false

const breadcrumbItems = [{ label: 'Calendrier des travaux' }]

const seasonInfo: Record<string, { icon: typeof Sun; color: string; label: string; months: string[] }> = {
  hiver: {
    icon: Snowflake,
    color: 'blue',
    label: 'Hiver',
    months: ['Janvier', 'Février', 'Décembre'],
  },
  printemps: {
    icon: Flower2,
    color: 'green',
    label: 'Printemps',
    months: ['Mars', 'Avril', 'Mai'],
  },
  ete: {
    icon: Sun,
    color: 'amber',
    label: 'Été',
    months: ['Juin', 'Juillet', 'Août'],
  },
  automne: {
    icon: Leaf,
    color: 'orange',
    label: 'Automne',
    months: ['Septembre', 'Octobre', 'Novembre'],
  },
}

const monthColors: Record<string, { gradient: string; badge: string; badgeText: string; accent: string }> = {
  hiver: {
    gradient: 'from-blue-50 to-blue-100/50',
    badge: 'bg-blue-100',
    badgeText: 'text-blue-700',
    accent: 'border-blue-200',
  },
  printemps: {
    gradient: 'from-green-50 to-green-100/50',
    badge: 'bg-green-100',
    badgeText: 'text-green-700',
    accent: 'border-green-200',
  },
  ete: {
    gradient: 'from-amber-50 to-amber-100/50',
    badge: 'bg-amber-100',
    badgeText: 'text-amber-700',
    accent: 'border-amber-200',
  },
  automne: {
    gradient: 'from-orange-50 to-orange-100/50',
    badge: 'bg-orange-100',
    badgeText: 'text-orange-700',
    accent: 'border-orange-200',
  },
}

export default function CalendrierTravauxPage() {
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Accueil',
        item: SITE_URL,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Calendrier des travaux',
      },
    ],
  }

  return (
    <>
      <JsonLd data={[breadcrumbSchema]} />

      <div className="min-h-screen bg-gradient-to-b from-amber-50/60 to-white">
        {/* Breadcrumb */}
        <div className="max-w-6xl mx-auto px-4 pt-6">
          <Breadcrumb items={breadcrumbItems} />
        </div>

        {/* Hero */}
        <section className="max-w-6xl mx-auto px-4 py-12 md:py-16 text-center">
          <div className="inline-flex items-center gap-2 bg-amber-100 text-amber-800 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Calendar className="w-4 h-4" />
            Guide saisonnier
          </div>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-gray-900 mb-6 font-heading leading-tight">
            {'Calendrier des travaux : quand faire quoi ?'}
          </h1>
          <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            {
              'Chaque saison a ses travaux. Ce guide mois par mois vous aide à planifier vos travaux au bon moment pour un résultat optimal et des économies réelles.'
            }
          </p>
        </section>

        {/* Season navigation */}
        <section className="max-w-6xl mx-auto px-4 pb-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(seasonInfo).map(([key, info]) => {
              const Icon = info.icon
              return (
                <a
                  key={key}
                  href={`#${key}`}
                  className={`flex items-center gap-3 bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition-all group`}
                >
                  <div
                    className={`w-10 h-10 bg-${info.color}-100 rounded-lg flex items-center justify-center`}
                  >
                    <Icon className={`w-5 h-5 text-${info.color}-600`} />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">
                      {info.label}
                    </div>
                    <div className="text-xs text-gray-500">{info.months.join(', ')}</div>
                  </div>
                </a>
              )
            })}
          </div>
        </section>

        {/* Month-by-month quick jump */}
        <section className="max-w-6xl mx-auto px-4 pb-8">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 md:p-6">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Accès rapide par mois
            </h2>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
              {calendrierTravaux.map((mois) => (
                <a
                  key={mois.slug}
                  href={`#mois-${mois.slug}`}
                  className="flex items-center justify-center bg-gray-50 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                >
                  {mois.mois}
                </a>
              ))}
            </div>
          </div>
        </section>

        {/* Season sections */}
        {Object.entries(seasonInfo).map(([seasonKey, season]) => {
          const seasonMonths = calendrierTravaux.filter((m) =>
            season.months.includes(m.mois)
          )
          // Sort in month order
          const monthOrder = [
            'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
            'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
          ]
          seasonMonths.sort(
            (a, b) => monthOrder.indexOf(a.mois) - monthOrder.indexOf(b.mois)
          )

          const SeasonIcon = season.icon
          const colors = monthColors[seasonKey]

          return (
            <div key={seasonKey} id={seasonKey} className="scroll-mt-20">
              {/* Season header */}
              <section className="max-w-6xl mx-auto px-4 pt-12 pb-6">
                <div className="flex items-center gap-4">
                  <div
                    className={`w-14 h-14 ${colors.badge} rounded-2xl flex items-center justify-center`}
                  >
                    <SeasonIcon className={`w-7 h-7 ${colors.badgeText}`} />
                  </div>
                  <div>
                    <h2 className="text-2xl md:text-3xl font-bold text-gray-900 font-heading">
                      {season.label}
                    </h2>
                    <p className="text-gray-500">{season.months.join(' - ')}</p>
                  </div>
                  <div className="flex-1 h-px bg-gray-200 ml-4" />
                </div>
              </section>

              {/* Month cards */}
              {seasonMonths.map((mois) => (
                <section
                  key={mois.slug}
                  id={`mois-${mois.slug}`}
                  className="max-w-6xl mx-auto px-4 pb-10 scroll-mt-20"
                >
                  <div
                    className={`bg-gradient-to-br ${colors.gradient} rounded-2xl border ${colors.accent} overflow-hidden`}
                  >
                    {/* Month header */}
                    <div className="p-6 md:p-8 border-b border-gray-200/50">
                      <div className="flex items-center gap-3 mb-2">
                        <span
                          className={`${colors.badge} ${colors.badgeText} px-3 py-1 rounded-full text-sm font-semibold`}
                        >
                          {mois.mois}
                        </span>
                      </div>

                      {/* Climate note */}
                      <div className="flex items-start gap-2 mt-4 bg-white/70 rounded-lg p-3">
                        <CloudSun className="w-5 h-5 text-gray-500 mt-0.5 shrink-0" />
                        <p className="text-sm text-gray-600">{mois.climatNote}</p>
                      </div>
                    </div>

                    <div className="p-6 md:p-8 space-y-8">
                      {/* Travaux recommandés */}
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                          <CheckCircle2 className="w-5 h-5 text-green-600" />
                          Travaux recommandés
                        </h3>
                        <div className="grid md:grid-cols-2 gap-4">
                          {mois.travauxRecommandes.map((travail, idx) => (
                            <div
                              key={idx}
                              className="bg-white rounded-xl shadow-sm border border-gray-100 p-5"
                            >
                              <h4 className="font-bold text-gray-900 mb-2">{travail.titre}</h4>
                              <p className="text-sm text-gray-600 leading-relaxed mb-3">
                                {travail.description}
                              </p>
                              <Link
                                href={`/services/${travail.service}`}
                                className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
                              >
                                Trouver un artisan
                                <ArrowRight className="w-3.5 h-3.5" />
                              </Link>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Travaux à éviter */}
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                          <XCircle className="w-5 h-5 text-red-500" />
                          {'Travaux à éviter ce mois-ci'}
                        </h3>
                        <div className="bg-white/80 rounded-xl border border-red-100 p-5">
                          <ul className="space-y-2">
                            {mois.travauxAEviter.map((item, idx) => (
                              <li
                                key={idx}
                                className="flex items-start gap-3 text-sm text-gray-700"
                              >
                                <XCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      {/* Conseil du mois */}
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                          <Lightbulb className="w-5 h-5 text-amber-500" />
                          Conseil du mois
                        </h3>
                        <div className="bg-amber-50 rounded-xl border border-amber-200 p-5">
                          <p className="text-sm text-gray-700 leading-relaxed">
                            {mois.conseilDuMois}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>
              ))}
            </div>
          )
        })}

        {/* Cross-links */}
        <section className="max-w-6xl mx-auto px-4 py-10">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6 font-heading">
            Ressources complémentaires
          </h2>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
            <Link
              href="/glossaire"
              className="flex items-center gap-3 bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:border-blue-300 hover:shadow-md transition-all group"
            >
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                <BookOpen className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <span className="font-semibold text-gray-900 group-hover:text-blue-700 transition-colors text-sm">
                  Glossaire du bâtiment
                </span>
                <p className="text-xs text-gray-500">150+ termes expliqués</p>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-400 ml-auto group-hover:text-blue-600 transition-colors" />
            </Link>
            <Link
              href="/guides/artisan-rge"
              className="flex items-center gap-3 bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:border-green-300 hover:shadow-md transition-all group"
            >
              <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center group-hover:bg-green-100 transition-colors">
                <BookOpen className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <span className="font-semibold text-gray-900 group-hover:text-green-700 transition-colors text-sm">
                  Guide artisan RGE
                </span>
                <p className="text-xs text-gray-500">Certification et aides</p>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-400 ml-auto group-hover:text-green-600 transition-colors" />
            </Link>
            <Link
              href="/faq"
              className="flex items-center gap-3 bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:border-amber-300 hover:shadow-md transition-all group"
            >
              <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center group-hover:bg-amber-100 transition-colors">
                <BookOpen className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <span className="font-semibold text-gray-900 group-hover:text-amber-700 transition-colors text-sm">
                  FAQ
                </span>
                <p className="text-xs text-gray-500">Questions fréquentes</p>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-400 ml-auto group-hover:text-amber-600 transition-colors" />
            </Link>
          </div>
        </section>

        {/* CTA */}
        <section className="max-w-6xl mx-auto px-4 py-12">
          <div className="bg-gradient-to-r from-amber-600 to-orange-600 rounded-2xl p-8 md:p-12 text-center text-white">
            <h2 className="text-2xl md:text-3xl font-bold mb-4 font-heading">
              {'Prêt à lancer vos travaux ?'}
            </h2>
            <p className="text-amber-100 text-lg mb-8 max-w-2xl mx-auto">
              {
                'Trouvez un artisan qualifié près de chez vous et demandez un devis gratuit pour vos travaux, quelle que soit la saison.'
              }
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/services"
                className="inline-flex items-center justify-center gap-2 bg-white text-amber-700 px-8 py-3.5 rounded-xl font-bold hover:bg-amber-50 transition-colors"
              >
                <Search className="w-5 h-5" />
                Trouver un artisan
              </Link>
              <Link
                href="/devis"
                className="inline-flex items-center justify-center gap-2 bg-amber-500 text-white px-8 py-3.5 rounded-xl font-bold hover:bg-amber-400 transition-colors border border-amber-400"
              >
                Demander un devis gratuit
              </Link>
            </div>
          </div>
        </section>
      </div>
    </>
  )
}
