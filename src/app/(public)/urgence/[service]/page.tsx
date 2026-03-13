import { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Phone, Clock, Shield, CheckCircle, ArrowRight, AlertTriangle, MapPin } from 'lucide-react'
import Breadcrumb from '@/components/Breadcrumb'
import JsonLd from '@/components/JsonLd'
import { getBreadcrumbSchema, getFAQSchema, getHowToSchema } from '@/lib/seo/jsonld'
import { SITE_URL, PHONE_TEL } from '@/lib/seo/config'
import { tradeContent } from '@/lib/data/trade-content'
import { hashCode } from '@/lib/seo/location-content'
import { villes, services } from '@/lib/data/france'
import { getServiceImage } from '@/lib/data/images'
import { getPageContent } from '@/lib/cms'
import { CmsContent } from '@/components/CmsContent'
import CrossIntentLinks from '@/components/seo/CrossIntentLinks'
import dynamic from 'next/dynamic'

const ExitIntentPopup = dynamic(
  () => import('@/components/ExitIntentPopup'),
  { ssr: false }
)

const UrgencyCountdown = dynamic(
  () => import('@/components/UrgencyCountdown'),
  { ssr: false }
)

export const revalidate = 86400 // ISR 24h

// All services are available for emergency pages
const emergencySlugs = Object.keys(tradeContent)

// Emergency-specific display data
const emergencyMeta: Record<string, { gradient: string; lightBg: string; lightText: string; problems: string[] }> = {
  plombier: {
    gradient: 'from-blue-600 to-blue-800',
    lightBg: 'bg-blue-50',
    lightText: 'text-blue-700',
    problems: [
      'Fuite d\'eau importante',
      'Canalisation bouchée',
      'Dégât des eaux',
      'Chauffe-eau en panne',
      'WC bouché',
      'Rupture de tuyau',
    ],
  },
  electricien: {
    gradient: 'from-amber-600 to-amber-800',
    lightBg: 'bg-amber-50',
    lightText: 'text-amber-700',
    problems: [
      'Panne de courant',
      'Court-circuit',
      'Tableau électrique défaillant',
      'Prise qui chauffe',
      'Odeur de brûlé électrique',
      'Fil dénudé dangereux',
    ],
  },
  serrurier: {
    gradient: 'from-green-600 to-green-800',
    lightBg: 'bg-green-50',
    lightText: 'text-green-700',
    problems: [
      'Porte claquée',
      'Clé perdue ou volée',
      'Serrure bloquée',
      'Cambriolage (sécurisation)',
      'Changement de serrure urgent',
      'Porte blindée bloquée',
    ],
  },
  chauffagiste: {
    gradient: 'from-red-600 to-red-800',
    lightBg: 'bg-red-50',
    lightText: 'text-red-700',
    problems: [
      'Panne de chauffage',
      'Fuite de gaz',
      'Chaudière en panne',
      'Radiateur qui fuit',
      'Ballon d\'eau chaude HS',
      'Problème de thermostat',
    ],
  },
  vitrier: {
    gradient: 'from-cyan-600 to-cyan-800',
    lightBg: 'bg-cyan-50',
    lightText: 'text-cyan-700',
    problems: [
      'Vitre cassée',
      'Baie vitrée brisée',
      'Vitrine commerciale endommagée',
      'Double vitrage fissuré',
      'Effraction / cambriolage',
      'Tempête / grêle',
    ],
  },
  couvreur: {
    gradient: 'from-orange-600 to-orange-800',
    lightBg: 'bg-orange-50',
    lightText: 'text-orange-700',
    problems: [
      'Fuite de toiture urgente',
      'Toiture arrachée par le vent',
      'Infiltration après tempête',
      'Tuiles cassées après grêle',
      'Gouttière arrachée',
      'Bâche d\'urgence à poser',
    ],
  },
  climaticien: {
    gradient: 'from-indigo-600 to-indigo-800',
    lightBg: 'bg-indigo-50',
    lightText: 'text-indigo-700',
    problems: [
      'Panne de climatisation',
      'Climatisation qui ne refroidit plus',
      'Fuite de fluide frigorigène',
      'Unité extérieure en panne',
      'Bruit anormal',
      'Climatisation en panne pendant la canicule',
    ],
  },
}

export function generateStaticParams() {
  return emergencySlugs.map((service) => ({ service }))
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

  const titleHash = Math.abs(hashCode(`urgence-title-${service}`))
  const titleTemplates = [
    `${trade.name} urgence — Intervention rapide`,
    `${trade.name} d'urgence — Soir & week-end`,
    `Urgence ${tradeLower} — Dépannage rapide`,
    `${trade.name} urgence — Devis gratuit`,
    `Dépannage ${tradeLower} urgent — 24h/24`,
  ]
  const title = truncateTitle(titleTemplates[titleHash % titleTemplates.length])

  const descHash = Math.abs(hashCode(`urgence-desc-${service}`))
  const descTemplates = [
    `Besoin d'un ${tradeLower} en urgence ? Disponible selon les artisans de votre secteur partout en France. ${trade.averageResponseTime}. Artisans référencés.`,
    `${trade.name} urgence : dépannage rapide jour et nuit. ${trade.averageResponseTime}. Devis gratuit, artisans vérifiés SIREN.`,
    `Urgence ${tradeLower} ? Trouvez un professionnel disponible dans votre secteur. Intervention rapide, artisans qualifiés, devis gratuit.`,
    `Dépannage ${tradeLower} en urgence, y compris le week-end. Artisans référencés par SIREN, intervention sous ${trade.averageResponseTime}. Gratuit.`,
    `${trade.name} d'urgence soir & week-end : artisans disponibles partout en France. Devis rapide, intervention ${trade.averageResponseTime}.`,
  ]
  const description = descTemplates[descHash % descTemplates.length]
  const serviceImage = getServiceImage(service)

  return {
    title,
    description,
    alternates: { canonical: `${SITE_URL}/urgence/${service}` },
    openGraph: {
      locale: 'fr_FR',
      title,
      description,
      url: `${SITE_URL}/urgence/${service}`,
      type: 'website',
      images: [{ url: serviceImage.src, width: 800, height: 600, alt: `${trade.name} urgence` }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [serviceImage.src],
    },
  }
}

const topCities = villes.slice(0, 20)

export default async function UrgenceServicePage({ params }: { params: Promise<{ service: string }> }) {
  const { service } = await params

  const cmsPage = await getPageContent(service + '-urgence', 'static')

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

  const trade = tradeContent[service]
  if (!trade) notFound()

  const meta = emergencyMeta[service] || emergencyMeta.plombier
  const otherEmergencies = emergencySlugs.filter((s) => s !== service)

  const breadcrumbSchema = getBreadcrumbSchema([
    { name: 'Accueil', url: '/' },
    { name: 'Urgence', url: '/urgence' },
    { name: `${trade.name} urgence`, url: `/urgence/${service}` },
  ])

  const tradeLowerFaq = trade.name.toLowerCase()
  const emergencyFaqItems = [
    { question: `Combien coûte un ${tradeLowerFaq} en urgence la nuit ?`, answer: `Les interventions d'urgence de nuit (après 20h) sont majorées de 50 à 100% par rapport aux tarifs de journée. Pour un ${tradeLowerFaq}, comptez environ ${Math.round((trade.priceRange?.min || 60) * 1.5)} à ${Math.round((trade.priceRange?.max || 90) * 2)} €/h en urgence nocturne. Demandez toujours un devis avant intervention.` },
    { question: `Quel est le délai d'intervention d'un ${tradeLowerFaq} en urgence ?`, answer: `${trade.averageResponseTime}. Les artisans d'urgence pouvant intervenir le soir et le week-end. Le délai varie selon votre localisation et la disponibilité des professionnels.` },
    { question: `Que faire en attendant le ${tradeLowerFaq} d'urgence ?`, answer: `En attendant l'arrivée du professionnel : sécurisez la zone, coupez l'arrivée d'eau ou le disjoncteur si nécessaire, et ne tentez pas de réparation vous-même. Protégez vos biens des dégâts éventuels.` },
    { question: `Un ${tradeLowerFaq} d'urgence est-il assuré ?`, answer: `Tout ${tradeLowerFaq} professionnel doit disposer d'une assurance responsabilité civile professionnelle (RC Pro). Pour les travaux de bâtiment concernés par la loi Spinetta (art. 1792 du Code civil), une garantie décennale est également obligatoire. Exigez les attestations d'assurance avant le début des travaux, même en urgence.` },
  ]

  const allFaqItems = [
    ...emergencyFaqItems.map((f) => ({ question: f.question, answer: f.answer })),
    ...trade.faq.map((f) => ({ question: f.q, answer: f.a })),
  ]

  const faqSchema = getFAQSchema(allFaqItems)

  const tradeLowerHowTo = trade.name.toLowerCase()
  const howToSchema = getHowToSchema(
    [
      {
        name: 'Sécuriser la zone',
        text: `En cas d'urgence ${tradeLowerHowTo}, commencez par sécuriser la zone : coupez l'arrivée d'eau, le disjoncteur ou le gaz selon la situation. Éloignez les personnes et les objets de valeur.`,
      },
      {
        name: 'Évaluer la gravité',
        text: `Déterminez s'il s'agit d'une urgence vitale (fuite de gaz, risque d'électrocution) nécessitant les pompiers (18 ou 112), ou d'une urgence technique nécessitant un ${tradeLowerHowTo}.`,
      },
      {
        name: `Contacter un ${tradeLowerHowTo} d'urgence`,
        text: `Recherchez un ${tradeLowerHowTo} d'urgence disponible dans votre secteur. Privilégiez les artisans référencés avec un SIRET vérifié. Décrivez précisément le problème pour obtenir un diagnostic rapide.`,
      },
      {
        name: 'Demander un devis avant intervention',
        text: `Même en urgence, exigez un devis écrit ou une estimation tarifaire avant le début des travaux. Vérifiez les majorations éventuelles (nuit, week-end, jours fériés).`,
      },
      {
        name: 'Conserver les justificatifs',
        text: `Gardez la facture détaillée et les photos des dégâts pour votre assurance. En cas de dégât des eaux ou de sinistre, déclarez à votre assureur dans les 5 jours ouvrés.`,
      },
    ],
    {
      name: `Comment gérer une urgence ${tradeLowerHowTo}`,
      description: `Les étapes essentielles pour réagir efficacement face à une urgence ${tradeLowerHowTo} : sécurisation, contact professionnel et démarches.`,
    }
  )

  const collectionPageSchema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `${trade.name} urgence par ville`,
    description: `Trouvez un ${trade.name.toLowerCase()} d'urgence dans votre ville. ${trade.averageResponseTime}. Artisans référencés disponibles soir et week-end.`,
    url: `${SITE_URL}/urgence/${service}`,
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: topCities.map((ville, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: `${trade.name} urgence à ${ville.name}`,
        url: `${SITE_URL}/urgence/${service}/${ville.slug}`,
      })),
    },
  }

  // Related services for cross-linking
  const relatedServices = services.filter((s) => s.slug !== service).slice(0, 4)

  return (
    <div className="min-h-screen bg-gray-50">
      <JsonLd data={[breadcrumbSchema, faqSchema, howToSchema, collectionPageSchema, {
        '@context': 'https://schema.org',
        '@type': 'Service',
        name: `${trade.name} urgence soir & week-end`,
        description: trade.emergencyInfo,
        provider: { '@type': 'Organization', name: 'ServicesArtisans', url: SITE_URL },
        areaServed: { '@type': 'Country', name: 'France' },
        hoursAvailable: {
          '@type': 'OpeningHoursSpecification',
          dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
          opens: '00:00',
          closes: '23:59',
        },
      }]} />

      {/* Breadcrumb */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <Breadcrumb items={[
            { label: 'Urgence', href: '/urgence' },
            { label: `${trade.name} urgence` },
          ]} />
        </div>
      </div>

      {/* Hero */}
      <section className={`relative bg-gradient-to-br ${meta.gradient} text-white py-16 md:py-20 overflow-hidden`}>
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-white rounded-full blur-[150px] animate-pulse" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 mb-6">
            <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm border border-white/20 px-4 py-2 rounded-full">
              <div className="w-2.5 h-2.5 rounded-full bg-white animate-pulse" />
              <span className="text-sm font-semibold">Disponible soir et week-end</span>
            </div>
          </div>
          <h1 className="font-heading text-4xl md:text-5xl font-bold mb-6 leading-tight">
            {(() => {
              const h1Hash = Math.abs(hashCode(`urgence-h1-${service}`))
              const h1Templates = [
                `${trade.name} urgence`,
                `Urgence ${trade.name.toLowerCase()} soir & week-end`,
                `Dépannage ${trade.name.toLowerCase()} urgent`,
                `${trade.name} d'urgence — y compris le week-end`,
                `Intervention ${trade.name.toLowerCase()} en urgence`,
              ]
              return h1Templates[h1Hash % h1Templates.length]
            })()}<br />
            <span className="opacity-80">Trouvez rapidement un professionnel.</span>
          </h1>
          <p className="text-xl opacity-90 max-w-2xl mb-8">
            {trade.emergencyInfo}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <div className="flex flex-col items-center sm:items-start">
              <a
                href={PHONE_TEL}
                className="inline-flex items-center justify-center gap-3 bg-white text-gray-900 px-8 py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all"
              >
                <Phone className="w-6 h-6" />
                Appeler l&apos;assistance
              </a>
              <span className="text-sm text-white/60 mt-2">Service de mise en relation</span>
            </div>
            <Link
              href={`/services/${service}`}
              className="inline-flex items-center justify-center gap-3 bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all"
            >
              Intervention rapide — Devis gratuit
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 border border-white/10">
              <Clock className="w-4 h-4" />
              <span className="text-sm">{trade.averageResponseTime}</span>
            </div>
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 border border-white/10">
              <Shield className="w-4 h-4" />
              <span className="text-sm">Artisans référencés</span>
            </div>
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 border border-white/10">
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm">Devis gratuit</span>
            </div>
          </div>
        </div>
      </section>

      {/* Urgency Countdown */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <UrgencyCountdown serviceName={trade.name} />
      </div>

      {/* Problems */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">
              Urgences {trade.name.toLowerCase()} les plus courantes
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Les {trade.name.toLowerCase()}s d&apos;urgence référencés interviennent rapidement pour tous ces problèmes.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {meta.problems.map((problem) => (
              <div
                key={problem}
                className={`flex items-center gap-3 ${meta.lightBg} ${meta.lightText} px-5 py-4 rounded-xl`}
              >
                <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                <span className="font-medium">{problem}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-3 text-center">
            Tarifs {trade.name.toLowerCase()} urgence
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto text-center mb-10">
            Prix indicatifs pour les interventions d&apos;urgence. Tarif horaire standard : {trade.priceRange.min} à {trade.priceRange.max} {trade.priceRange.unit}.
            Les majorations d&apos;urgence varient de +50% à +100%.
          </p>
          <div className="grid md:grid-cols-2 gap-4 max-w-4xl mx-auto">
            {trade.commonTasks.map((task, i) => (
              <div key={i} className="flex items-start gap-3 bg-white rounded-xl border border-gray-200 p-4">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700 text-sm">{task}</span>
              </div>
            ))}
          </div>
          <div className="text-center mt-8">
            <Link
              href="/tarifs"
              className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold"
            >
              Guide complet des tarifs
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Certifications */}
      {trade.certifications.length > 0 && (
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
              Certifications à vérifier
            </h2>
            <div className="flex flex-wrap justify-center gap-3">
              {trade.certifications.map((cert) => (
                <div key={cert} className="flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-lg text-sm font-medium">
                  <Shield className="w-4 h-4" />
                  {cert}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Urgence par ville */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            {trade.name} urgence par ville
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {topCities.map((ville) => (
              <Link
                key={ville.slug}
                href={`/urgence/${service}/${ville.slug}`}
                className="bg-white hover:bg-red-50 border border-gray-200 hover:border-red-300 rounded-xl p-4 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-100 group-hover:bg-red-100 rounded-lg flex items-center justify-center transition-colors">
                    <MapPin className="w-5 h-5 text-gray-600 group-hover:text-red-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 group-hover:text-red-600 transition-colors text-sm">
                      {trade.name} à {ville.name}
                    </div>
                    <div className="text-xs text-gray-500">Urgence soir & week-end</div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
          <div className="text-center mt-6">
            <Link href="/villes" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold text-sm">
              Toutes les villes <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Questions fréquentes — {trade.name} urgence
          </h2>
          <div className="space-y-4">
            {allFaqItems.map((item, i) => (
              <details key={i} className="bg-gray-50 rounded-xl border border-gray-200 group">
                <summary className="flex items-center justify-between p-5 cursor-pointer list-none">
                  <h3 className="text-base font-semibold text-gray-900 pr-4">{item.question}</h3>
                  <ArrowRight className="w-4 h-4 text-gray-400 flex-shrink-0 group-open:rotate-90 transition-transform" />
                </summary>
                <div className="px-5 pb-5 text-gray-600 text-sm leading-relaxed">
                  {item.answer}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Tips */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Conseils pratiques
          </h2>
          <div className="space-y-4">
            {trade.tips.slice(0, 3).map((tip, i) => (
              <div key={i} className="flex items-start gap-4 bg-white rounded-xl border border-gray-200 p-5">
                <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-amber-600 font-bold text-sm">{i + 1}</span>
                </div>
                <p className="text-gray-700 text-sm leading-relaxed">{tip}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Other emergencies */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Autres urgences</h2>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {otherEmergencies.map((slug) => {
              const t = tradeContent[slug]
              return (
                <Link
                  key={slug}
                  href={`/urgence/${slug}`}
                  className="bg-gray-50 hover:bg-red-50 border border-gray-200 hover:border-red-300 rounded-xl p-4 transition-all group text-center"
                >
                  <div className="font-semibold text-gray-900 group-hover:text-red-600 transition-colors text-sm">
                    {t.name} urgence
                  </div>
                  <div className="text-xs text-gray-500 mt-1">{t.averageResponseTime}</div>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      {/* Voir aussi */}
      <section className="py-12 bg-gray-50 border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Voir aussi</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Services associés</h3>
              <div className="space-y-2">
                <Link href={`/services/${service}`} className="block text-sm text-gray-600 hover:text-blue-600 py-1">{trade.name} — page principale</Link>
                <Link href={`/tarifs/${service}`} className="block text-sm text-gray-600 hover:text-blue-600 py-1">Tarifs {trade.name.toLowerCase()}</Link>
                {relatedServices.map((s) => (
                  <Link key={s.slug} href={`/services/${s.slug}`} className="block text-sm text-gray-600 hover:text-blue-600 py-1">{s.name}</Link>
                ))}
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">{trade.name} par ville</h3>
              <div className="space-y-2">
                {topCities.slice(0, 6).map((v) => (
                  <Link key={v.slug} href={`/urgence/${service}/${v.slug}`} className="block text-sm text-gray-600 hover:text-blue-600 py-1">
                    {trade.name} à {v.name}
                  </Link>
                ))}
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Informations utiles</h3>
              <div className="space-y-2">
                <Link href="/urgence" className="block text-sm text-gray-600 hover:text-blue-600 py-1">Toutes les urgences</Link>
                <Link href="/comment-ca-marche" className="block text-sm text-gray-600 hover:text-blue-600 py-1">Comment ça marche</Link>
                <Link href="/tarifs" className="block text-sm text-gray-600 hover:text-blue-600 py-1">Guide des tarifs</Link>
                <Link href="/faq" className="block text-sm text-gray-600 hover:text-blue-600 py-1">FAQ</Link>
                <Link href="/notre-processus-de-verification" className="block text-sm text-gray-600 hover:text-blue-600 py-1">Processus de vérification</Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── EDITORIAL CREDIBILITY ──────────────────────────── */}
      <section className="mb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-slate-50 rounded-2xl border border-slate-200 p-6">
            <h3 className="text-sm font-semibold text-slate-700 mb-2">Information importante</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Les délais d&apos;intervention sont des estimations basées sur la disponibilité habituelle des artisans et peuvent varier. ServicesArtisans est un annuaire — nous mettons en relation mais ne réalisons pas les interventions. En cas d&apos;urgence vitale, appelez le 18 (pompiers) ou le 112.
            </p>
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

      {/* Cross-intent links */}
      <CrossIntentLinks
        service={service}
        serviceName={trade.name}
        currentIntent="urgence"
      />

      {/* Final CTA */}
      <section className={`bg-gradient-to-br ${meta.gradient} text-white py-16 overflow-hidden`}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Besoin d&apos;un {trade.name.toLowerCase()} en urgence ?
          </h2>
          <p className="text-xl opacity-90 mb-8">
            Les {trade.name.toLowerCase()}s référencés sur ServicesArtisans sont disponibles selon leurs horaires, y compris parfois les jours fériés.
          </p>
          <div className="flex flex-col items-center">
            <a
              href={PHONE_TEL}
              className="inline-flex items-center justify-center gap-3 bg-white text-gray-900 px-8 py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all"
            >
              <Phone className="w-6 h-6" />
              Appeler l&apos;assistance
            </a>
            <span className="text-sm text-white/60 mt-2">Service de mise en relation</span>
          </div>
        </div>
      </section>

      <ExitIntentPopup
        sessionKey="sa:exit-urgence"
        title="Besoin d'aide urgente ?"
        description="Un artisan qualifié peut intervenir rapidement. Demandez un devis maintenant."
        ctaText="Demander une intervention"
        ctaHref={`/devis/${service}`}
      />
    </div>
  )
}
