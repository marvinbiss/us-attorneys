import { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowRight, CheckCircle, Euro, Shield, Clock, ChevronDown, Users, Search, FileText } from 'lucide-react'
import Breadcrumb from '@/components/Breadcrumb'
import JsonLd from '@/components/JsonLd'
import { getBreadcrumbSchema, getFAQSchema } from '@/lib/seo/jsonld'
import { SITE_URL } from '@/lib/seo/config'
import { hashCode } from '@/lib/seo/location-content'
import { tradeContent, getTradesSlugs } from '@/lib/data/trade-content'
import { villes } from '@/lib/data/france'
import { getServiceImage } from '@/lib/data/images'
import { relatedServices } from '@/lib/constants/navigation'
import dynamic from 'next/dynamic'

const EstimationWidget = dynamic(
  () => import('@/components/estimation/EstimationWidget'),
  { ssr: false }
)

const tradeSlugs = getTradesSlugs()

export function generateStaticParams() {
  return tradeSlugs.map((service) => ({ service }))
}

function truncateTitle(title: string, maxLen = 42): string {
  if (title.length <= maxLen) return title
  return title.slice(0, maxLen - 1).replace(/\s+\S*$/, '') + '…'
}

export async function generateMetadata({ params }: { params: Promise<{ service: string }> }): Promise<Metadata> {
  const { service } = await params
  const trade = tradeContent[service]
  if (!trade) return {}

  const tradeLower = trade.name.toLowerCase()

  const titleHash = Math.abs(hashCode(`devis-title-${service}`))
  const titleTemplates = [
    `Devis ${tradeLower} gratuit 2026 — Comparez`,
    `Devis ${tradeLower} en ligne — Gratuit 2026`,
    `Devis ${tradeLower} gratuit — Artisans vérifiés`,
    `Devis ${tradeLower} 2026 : comparez les prix`,
    `Devis ${tradeLower} : gratuit et sans engagement`,
  ]
  const title = truncateTitle(titleTemplates[titleHash % titleTemplates.length])

  const descHash = Math.abs(hashCode(`devis-desc-${service}`))
  const descTemplates = [
    `Demandez un devis ${tradeLower} gratuit. Comparez jusqu’à 3 artisans référencés. Prix : ${trade.priceRange.min}–${trade.priceRange.max} ${trade.priceRange.unit}. 100 % gratuit.`,
    `Devis ${tradeLower} en ligne : ${trade.priceRange.min} à ${trade.priceRange.max} ${trade.priceRange.unit}. Comparez les offres de professionnels qualifiés. 100 % gratuit.`,
    `Obtenez un devis gratuit pour ${tradeLower}. ${trade.priceRange.min}–${trade.priceRange.max} ${trade.priceRange.unit}. Artisans vérifiés, sans engagement.`,
    `Devis gratuit ${tradeLower} : de ${trade.priceRange.min} à ${trade.priceRange.max} ${trade.priceRange.unit}. Jusqu’à 3 propositions d’artisans qualifiés.`,
  ]
  const description = descTemplates[descHash % descTemplates.length]

  const serviceImage = getServiceImage(service)

  return {
    title,
    description,
    alternates: { canonical: `${SITE_URL}/devis/${service}` },
    openGraph: {
      locale: 'fr_FR',
      title,
      description,
      url: `${SITE_URL}/devis/${service}`,
      type: 'website',
      images: [{ url: serviceImage.src, width: 800, height: 600, alt: `Devis ${trade.name}` }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [serviceImage.src],
    },
  }
}

const topCities = villes.slice(0, 6)

const trustBadges = [
  { icon: Shield, label: 'Gratuit', sublabel: 'Aucun frais caché' },
  { icon: Clock, label: 'Sans engagement', sublabel: 'Réponse sous 24 h' },
  { icon: Users, label: 'Artisans référencés', sublabel: 'SIREN contrôlé' },
]

const howSteps = [
  {
    number: '1',
    icon: Search,
    title: 'Décrivez votre projet',
    description: 'Sélectionnez le type de service, indiquez votre ville et décrivez votre besoin en quelques lignes.',
  },
  {
    number: '2',
    icon: FileText,
    title: 'Recevez vos devis',
    description: 'Votre demande est transmise aux artisans qualifiés proches de chez vous. Vous recevez jusqu’à 3 devis détaillés.',
  },
  {
    number: '3',
    icon: CheckCircle,
    title: 'Choisissez librement',
    description: 'Comparez les tarifs, consultez les profils et choisissez l’artisan qui vous convient. Aucune obligation.',
  },
]

export default async function DevisServicePage({ params }: { params: Promise<{ service: string }> }) {
  const { service } = await params

  const trade = tradeContent[service]
  if (!trade) notFound()

  const tradeLower = trade.name.toLowerCase()

  const breadcrumbSchema = getBreadcrumbSchema([
    { name: 'Accueil', url: '/' },
    { name: 'Devis', url: '/devis' },
    { name: `Devis ${tradeLower}`, url: `/devis/${service}` },
  ])

  const faqSchema = getFAQSchema(
    trade.faq.map((f) => ({ question: f.q, answer: f.a }))
  )

  const serviceSchema = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: `Devis ${trade.name} en France`,
    description: `Demandez un devis gratuit pour ${tradeLower}. ${trade.priceRange.min} à ${trade.priceRange.max} ${trade.priceRange.unit}. Artisans référencés.`,
    provider: {
      '@type': 'Organization',
      name: 'ServicesArtisans',
      url: SITE_URL,
    },
    areaServed: {
      '@type': 'Country',
      name: 'France',
    },
    offers: {
      '@type': 'AggregateOffer',
      priceCurrency: 'EUR',
      lowPrice: trade.priceRange.min,
      highPrice: trade.priceRange.max,
      offerCount: undefined,
    },
  }

  const collectionPageSchema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `Devis ${tradeLower} par ville`,
    description: `Demandez un devis ${tradeLower} gratuit. Comparez les artisans référencés par ville. ${trade.priceRange.min} à ${trade.priceRange.max} ${trade.priceRange.unit}.`,
    url: `${SITE_URL}/devis/${service}`,
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: topCities.map((ville, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: `Devis ${tradeLower} à ${ville.name}`,
        url: `${SITE_URL}/devis/${service}/${ville.slug}`,
      })),
    },
  }

  const relatedSlugs = relatedServices[service] || []
  const otherTrades = relatedSlugs.length > 0
    ? relatedSlugs.slice(0, 8).filter((s) => tradeContent[s])
    : tradeSlugs.filter((s) => s !== service).slice(0, 8)

  return (
    <div className="min-h-screen bg-gray-50">
      <JsonLd data={[breadcrumbSchema, faqSchema, serviceSchema, collectionPageSchema]} />

      {/* Hero */}
      <section className="relative bg-[#0a0f1e] text-white overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0" style={{
            background: 'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(37,99,235,0.18) 0%, transparent 60%), radial-gradient(ellipse 60% 60% at 80% 110%, rgba(37,99,235,0.1) 0%, transparent 50%)',
          }} />
          <div className="absolute inset-0 opacity-[0.025]" style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '64px 64px',
          }} />
          <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-gray-50 to-transparent" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-28 md:pt-14 md:pb-36">
          <Breadcrumb
            items={[
              { label: 'Devis', href: '/devis' },
              { label: `Devis ${tradeLower}` },
            ]}
            className="mb-6 text-slate-400 [&_a]:text-slate-400 [&_a:hover]:text-white [&_svg]:text-slate-600"
          />
          <div className="text-center">
            <h1 className="font-heading text-4xl md:text-5xl font-extrabold mb-6 tracking-[-0.025em]">
              {(() => {
                const h1Hash = Math.abs(hashCode(`devis-h1-${service}`))
                const h1Templates = [
                  `Devis ${tradeLower} gratuit — Comparez les artisans`,
                  `Demandez un devis ${tradeLower} en ligne`,
                  `Devis ${tradeLower} : comparez jusqu’à 3 artisans`,
                  `Devis gratuit ${tradeLower} — Sans engagement`,
                  `${trade.name} : obtenez votre devis gratuit`,
                ]
                return h1Templates[h1Hash % h1Templates.length]
              })()}
            </h1>
            <p className="text-xl text-slate-400 max-w-3xl mx-auto mb-4">
              Recevez jusqu&apos;à 3 devis gratuits de {tradeLower}s référencés.
              Prix indicatif : {trade.priceRange.min} à {trade.priceRange.max} {trade.priceRange.unit}.
            </p>
            <div className="flex flex-wrap justify-center gap-3 mt-8">
              {trustBadges.map((badge) => {
                const Icon = badge.icon
                return (
                  <div key={badge.label} className="flex items-center gap-2 bg-white/10 backdrop-blur px-4 py-2 rounded-full border border-white/10 text-sm">
                    <Icon className="w-4 h-4 text-amber-400" />
                    <span>{badge.label}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Price range overview */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-2xl p-8 text-center mb-12">
            <h2 className="text-lg font-semibold text-gray-700 mb-2">Tarif indicatif</h2>
            <div className="flex items-baseline justify-center gap-2">
              <span className="text-5xl font-bold text-blue-600">
                {trade.priceRange.min} — {trade.priceRange.max}
              </span>
              <span className="text-gray-600 text-lg">{trade.priceRange.unit}</span>
            </div>
            <p className="text-gray-500 text-sm mt-3">
              Prix moyen constaté en France métropolitaine, main-d&apos;œuvre incluse
            </p>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Prestations courantes
          </h2>
          <div className="space-y-4">
            {trade.commonTasks.map((task, i) => (
              <div key={i} className="flex items-start gap-4 bg-gray-50 rounded-xl border border-gray-200 p-5 hover:bg-blue-50 hover:border-blue-200 transition-colors">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Euro className="w-4 h-4 text-blue-600" />
                </div>
                <span className="text-gray-800">{task}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 bg-white border-t">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-14">
            <p className="text-sm font-semibold text-blue-600 uppercase tracking-wider mb-2">Simple et rapide</p>
            <h2 className="font-heading text-2xl md:text-3xl font-bold text-slate-900 mb-3 tracking-tight">
              Comment obtenir un devis {tradeLower}&nbsp;?
            </h2>
            <p className="text-slate-500 max-w-lg mx-auto">
              Trois étapes suffisent pour recevoir des devis personnalisés.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-10 relative">
            <div className="hidden md:block absolute top-14 left-[20%] right-[20%]">
              <div className="h-px border-t-2 border-dashed border-gray-200" />
            </div>
            {howSteps.map((item) => {
              const Icon = item.icon
              return (
                <div key={item.number} className="relative text-center">
                  <div className="relative z-10 mx-auto mb-6">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg mx-auto">
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-7 h-7 bg-white border-2 border-gray-200 rounded-full flex items-center justify-center shadow-sm">
                      <span className="text-xs font-bold text-slate-700">{item.number}</span>
                    </div>
                  </div>
                  <h3 className="font-heading text-lg font-bold text-slate-900 mb-2">{item.title}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed max-w-xs mx-auto">{item.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Trouver par ville */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Devis {tradeLower} par ville
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
            {topCities.map((ville) => (
              <Link
                key={ville.slug}
                href={`/devis/${service}/${ville.slug}`}
                className="bg-white hover:bg-blue-50 border border-gray-200 hover:border-blue-300 rounded-xl p-4 transition-all group text-center"
              >
                <div className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors text-sm">
                  Devis {tradeLower} à {ville.name}
                </div>
              </Link>
            ))}
          </div>
          <div className="text-center mt-6">
            <Link href={`/services/${service}`} className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold text-sm">
              Voir tous les {tradeLower}s en France
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Certifications */}
      {trade.certifications.length > 0 && (
        <section className="py-16 bg-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
              Certifications et qualifications
            </h2>
            <p className="text-gray-600 text-center mb-8">
              Vérifiez que votre {tradeLower} possède les certifications adaptées à votre projet.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              {trade.certifications.map((cert) => (
                <div key={cert} className="flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-3 rounded-xl text-sm font-medium">
                  <Shield className="w-4 h-4 flex-shrink-0" />
                  {cert}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* FAQ */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
            Questions fréquentes — Devis {trade.name}
          </h2>
          <div className="space-y-4">
            {trade.faq.map((item, i) => (
              <details key={i} className="bg-white rounded-xl border border-gray-200 group">
                <summary className="flex items-center justify-between p-6 cursor-pointer list-none">
                  <h3 className="text-base font-semibold text-gray-900 pr-4">{item.q}</h3>
                  <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0 group-open:rotate-180 transition-transform" />
                </summary>
                <div className="px-6 pb-6 text-gray-600 text-sm leading-relaxed">
                  {item.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-blue-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Prêt à recevoir votre devis {tradeLower}&nbsp;?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Commencez par choisir votre ville pour un devis adapté aux tarifs locaux.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href={`/devis/${service}/paris`}
              className="inline-flex items-center gap-2 bg-white text-blue-600 px-8 py-4 rounded-xl font-semibold hover:bg-blue-50 transition-colors text-lg"
            >
              Devis {tradeLower} à Paris
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href={`/services/${service}`}
              className="inline-flex items-center gap-2 bg-blue-500 text-white px-8 py-4 rounded-xl font-semibold hover:bg-blue-400 transition-colors text-lg border border-blue-400"
            >
              Trouver un {tradeLower}
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Devis associés */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Devis pour d&apos;autres métiers</h2>
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
            {otherTrades.map((slug) => {
              const t = tradeContent[slug]
              if (!t) return null
              return (
                <Link
                  key={slug}
                  href={`/devis/${slug}`}
                  className="bg-white hover:bg-blue-50 border border-gray-200 hover:border-blue-300 rounded-xl p-4 transition-all group"
                >
                  <div className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors text-sm">
                    Devis {t.name.toLowerCase()}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {t.priceRange.min} — {t.priceRange.max} {t.priceRange.unit}
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      {/* Voir aussi */}
      <section className="py-12 bg-white border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Voir aussi</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Ce service</h3>
              <div className="space-y-2">
                <Link href={`/services/${service}`} className="block text-sm text-gray-600 hover:text-blue-600 py-1">{trade.name} — tous les artisans</Link>
                <Link href={`/tarifs/${service}`} className="block text-sm text-gray-600 hover:text-blue-600 py-1">Tarifs {tradeLower}</Link>
                {trade.emergencyInfo && (
                  <Link href={`/urgence/${service}`} className="block text-sm text-gray-600 hover:text-blue-600 py-1">{trade.name} urgence</Link>
                )}
                {topCities.slice(0, 4).map((v) => (
                  <Link key={v.slug} href={`/devis/${service}/${v.slug}`} className="block text-sm text-gray-600 hover:text-blue-600 py-1">
                    Devis {tradeLower} à {v.name}
                  </Link>
                ))}
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Devis associés</h3>
              <div className="space-y-2">
                {otherTrades.slice(0, 6).map((slug) => {
                  const t = tradeContent[slug]
                  if (!t) return null
                  return (
                    <Link key={slug} href={`/devis/${slug}`} className="block text-sm text-gray-600 hover:text-blue-600 py-1">
                      Devis {t.name.toLowerCase()}
                    </Link>
                  )
                })}
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Informations utiles</h3>
              <div className="space-y-2">
                <Link href="/devis" className="block text-sm text-gray-600 hover:text-blue-600 py-1">Demander un devis</Link>
                <Link href="/tarifs" className="block text-sm text-gray-600 hover:text-blue-600 py-1">Guide complet des tarifs</Link>
                <Link href="/comment-ca-marche" className="block text-sm text-gray-600 hover:text-blue-600 py-1">Comment ça marche</Link>
                <Link href="/faq" className="block text-sm text-gray-600 hover:text-blue-600 py-1">FAQ</Link>
                <Link href="/notre-processus-de-verification" className="block text-sm text-gray-600 hover:text-blue-600 py-1">Processus de vérification</Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust & Safety Links (E-E-A-T) */}
      <section className="py-8 bg-white border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Confiance &amp; Sécurité
          </h2>
          <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
            <Link href="/notre-processus-de-verification" className="text-blue-600 hover:text-blue-800">
              Comment nous référençons les artisans
            </Link>
            <Link href="/politique-avis" className="text-blue-600 hover:text-blue-800">
              Notre politique des avis
            </Link>
            <Link href="/mediation" className="text-blue-600 hover:text-blue-800">
              Service de médiation
            </Link>
          </nav>
        </div>
      </section>

      {/* Editorial credibility */}
      <section className="mb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-slate-50 rounded-2xl border border-slate-200 p-6">
            <h3 className="text-sm font-semibold text-slate-700 mb-2">Transparence tarifaire</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Les prix affichés sont des fourchettes indicatives basées sur des moyennes constatées en France. Ils varient selon la région, la complexité du chantier, les matériaux et l&apos;urgence. Seul un devis personnalisé fait foi. ServicesArtisans est un annuaire indépendant.
            </p>
          </div>
        </div>
      </section>

      <EstimationWidget context={{
        metier: trade.name,
        metierSlug: service,
        ville: 'France',
        departement: '',
        pageUrl: `/devis/${service}`,
      }} />
    </div>
  )
}
