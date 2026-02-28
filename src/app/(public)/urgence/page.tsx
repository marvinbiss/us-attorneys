import { Metadata } from 'next'
import Link from 'next/link'
import { Phone, Zap, Shield, Clock, MapPin, ArrowRight, Star, CheckCircle, AlertTriangle, Wrench, Key, ChevronRight } from 'lucide-react'
import Breadcrumb from '@/components/Breadcrumb'
import JsonLd from '@/components/JsonLd'
import { getBreadcrumbSchema } from '@/lib/seo/jsonld'
import { getPageContent } from '@/lib/cms'
import { CmsContent } from '@/components/CmsContent'
import { SITE_URL, PHONE_TEL } from '@/lib/seo/config'
import { villes, services } from '@/lib/data/france'

export const metadata: Metadata = {
  title: 'Artisan Urgence — Dépannage Soir & Week-end',
  description: 'Artisan en urgence : plombier, électricien, serrurier. Dépannage soir et week-end partout en France. Devis gratuit, artisans vérifiés SIREN.',
  alternates: { canonical: `${SITE_URL}/urgence` },
  openGraph: {
    locale: 'fr_FR',
    title: 'Artisan Urgence — Dépannage Soir & Week-end',
    description: 'Plombier, électricien, serrurier en urgence. Dépannage soir et week-end. Devis gratuit, artisans vérifiés.',
    url: `${SITE_URL}/urgence`,
    type: 'website',
    images: [{ url: `${SITE_URL}/opengraph-image`, width: 1200, height: 630, alt: 'ServicesArtisans — Urgence artisan' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Artisan Urgence — Dépannage Soir & Week-end',
    description: 'Plombier, électricien, serrurier en urgence. Dépannage soir et week-end. Devis gratuit.',
    images: [`${SITE_URL}/opengraph-image`],
  },
}

const urgencyServices = [
  {
    name: 'Plombier urgence',
    slug: 'plombier',
    icon: Wrench,
    color: 'blue',
    bgGradient: 'from-blue-500 to-blue-600',
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
    description: 'Intervention rapide pour toutes urgences de plomberie : fuites d\'eau, dégâts des eaux, canalisations bouchées. Nos plombiers interviennent rapidement, selon disponibilité.',
    responseTime: 'Intervention rapide',
  },
  {
    name: 'Électricien urgence',
    slug: 'electricien',
    icon: Zap,
    color: 'amber',
    bgGradient: 'from-amber-500 to-amber-600',
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
    description: 'Dépannage électrique en urgence, soir & week-end. Nos électriciens qualifiés interviennent rapidement pour sécuriser votre installation électrique.',
    responseTime: 'Intervention rapide',
  },
  {
    name: 'Serrurier urgence',
    slug: 'serrurier',
    icon: Key,
    color: 'green',
    bgGradient: 'from-green-500 to-green-600',
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
    description: 'Ouverture de porte et dépannage serrurerie en urgence. Nos serruriers interviennent sans dégâts, disponibles selon les artisans de votre secteur.',
    responseTime: 'Intervention rapide',
  },
  {
    name: 'Chauffagiste urgence',
    slug: 'chauffagiste',
    icon: AlertTriangle,
    color: 'red',
    bgGradient: 'from-red-500 to-red-600',
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
    description: 'Dépannage chauffage en urgence : chaudière en panne, fuite de gaz, radiateurs défaillants. Intervention rapide par des chauffagistes qualifiés.',
    responseTime: 'Intervention rapide',
  },
]

const topEmergencyCities = villes.slice(0, 12)

const emergencySteps = [
  {
    step: 1,
    title: 'Décrivez votre urgence',
    description: 'Appelez-nous ou remplissez le formulaire avec les détails de votre problème.',
  },
  {
    step: 2,
    title: 'Mise en relation',
    description: 'Nous vous mettons en relation avec un artisan disponible dans votre secteur.',
  },
  {
    step: 3,
    title: 'Intervention rapide',
    description: 'L\'artisan intervient, résout le problème et vous fournit un devis détaillé.',
  },
]

export default async function UrgencePage() {
  const cmsPage = await getPageContent('urgence', 'static')

  if (cmsPage?.content_html) {
    return (
      <div className="min-h-screen bg-gray-50">
        <JsonLd data={getBreadcrumbSchema([
          { name: 'Accueil', url: '/' },
          { name: 'Urgence', url: '/urgence' },
        ])} />
        <section className="bg-white border-b">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <Breadcrumb items={[{ label: 'Urgence' }]} className="mb-4" />
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <Breadcrumb items={[{ label: 'Urgence soir & week-end' }]} />
        </div>
      </div>

      {/* Hero — Dark Emergency */}
      <section className="relative bg-gradient-to-br from-red-900 via-red-800 to-slate-900 text-white py-20 overflow-hidden">
        {/* Animated pulse background */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-red-500 rounded-full blur-[150px] animate-pulse" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex items-center gap-2 bg-red-500/30 backdrop-blur-sm border border-red-400/30 px-4 py-2 rounded-full">
              <div className="w-2.5 h-2.5 rounded-full bg-red-400 animate-pulse" />
              <span className="text-sm font-semibold text-red-100">Disponible soir et week-end</span>
            </div>
          </div>
          <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
            Urgence artisan ?<br />
            <span className="text-red-300">Trouvez rapidement un professionnel.</span>
          </h1>
          <p className="text-xl text-red-100/80 max-w-2xl mb-10">
            Plombier, électricien, serrurier, chauffagiste — un artisan référencé intervient
            chez vous rapidement, jour et nuit, selon disponibilité.
          </p>

          {/* Emergency CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 mb-12">
            <div className="flex flex-col items-center sm:items-start">
              <a
                href={PHONE_TEL}
                className="inline-flex items-center justify-center gap-3 bg-red-500 hover:bg-red-400 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-lg shadow-red-500/30 hover:shadow-red-400/40 transition-all"
              >
                <Phone className="w-6 h-6" />
                Appeler l&apos;assistance
              </a>
              <span className="text-sm text-red-200/70 mt-2">Service de mise en relation</span>
            </div>
            <Link
              href="/services"
              className="inline-flex items-center justify-center gap-3 bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all"
            >
              Demander un devis gratuit
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>

          {/* Trust row */}
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2 bg-white/[0.06] backdrop-blur-sm rounded-full px-4 py-2 border border-white/10">
              <Shield className="w-4 h-4 text-green-400" />
              <span className="text-sm text-white/80">Artisans référencés</span>
            </div>
            <div className="flex items-center gap-2 bg-white/[0.06] backdrop-blur-sm rounded-full px-4 py-2 border border-white/10">
              <Clock className="w-4 h-4 text-amber-400" />
              <span className="text-sm text-white/80">Intervention rapide</span>
            </div>
            <div className="flex items-center gap-2 bg-white/[0.06] backdrop-blur-sm rounded-full px-4 py-2 border border-white/10">
              <Clock className="w-4 h-4 text-amber-400" />
              <span className="text-sm text-white/80">Disponible soir et week-end</span>
            </div>
            <div className="flex items-center gap-2 bg-white/[0.06] backdrop-blur-sm rounded-full px-4 py-2 border border-white/10">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span className="text-sm text-white/80">Devis gratuit</span>
            </div>
          </div>
        </div>
      </section>

      {/* Emergency Services Grid */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-red-50 text-red-600 rounded-full text-sm font-medium mb-4">
              <Zap className="w-4 h-4" />
              Services d&apos;urgence
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-3">
              Quel type d&apos;urgence ?
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Sélectionnez votre type de problème pour être mis en relation avec un artisan spécialisé disponible dans votre secteur.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {urgencyServices.map((service) => {
              const Icon = service.icon
              return (
                <div
                  key={service.slug}
                  className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-xl hover:border-gray-300 transition-all group"
                >
                  <div className={`bg-gradient-to-r ${service.bgGradient} p-6 text-white`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                          <Icon className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold">{service.name}</h3>
                          <span className="text-sm opacity-80">Temps de réponse : {service.responseTime}</span>
                        </div>
                      </div>
                      <div className="hidden sm:flex items-center gap-1 bg-white/20 rounded-full px-3 py-1">
                        <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                        <span className="text-xs font-medium">Soir & week-end</span>
                      </div>
                    </div>
                  </div>
                  <div className="p-6">
                    <p className="text-gray-600 text-sm mb-4">{service.description}</p>
                    <div className="grid grid-cols-2 gap-2 mb-5">
                      {service.problems.map((problem) => (
                        <div
                          key={problem}
                          className={`flex items-center gap-2 text-sm ${service.lightBg} ${service.lightText} px-3 py-2 rounded-lg`}
                        >
                          <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" />
                          <span>{problem}</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <Link
                        href={`/urgence/${service.slug}`}
                        className={`inline-flex items-center gap-2 font-semibold ${service.lightText} hover:underline`}
                      >
                        {service.name} soir & week-end
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                      <Link
                        href={`/services/${service.slug}`}
                        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
                      >
                        Voir les tarifs
                      </Link>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* How Emergency Works */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-50 text-blue-600 rounded-full text-sm font-medium mb-4">
              <Clock className="w-4 h-4" />
              En 3 étapes
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-3">
              Comment ça marche ?
            </h2>
            <p className="text-gray-600 max-w-xl mx-auto">
              Un processus simple et rapide pour résoudre votre urgence.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {emergencySteps.map((step) => (
              <div key={step.step} className="relative text-center">
                <div className="w-16 h-16 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                  {step.step}
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{step.title}</h3>
                <p className="text-gray-600 text-sm">{step.description}</p>
                {step.step < 3 && (
                  <div className="hidden md:block absolute top-8 left-[60%] w-[80%] border-t-2 border-dashed border-red-200" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Cities Emergency */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-green-50 text-green-600 rounded-full text-sm font-medium mb-4">
              <MapPin className="w-4 h-4" />
              Couverture nationale
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-3">
              Urgence artisan dans votre ville
            </h2>
            <p className="text-gray-600 max-w-xl mx-auto">
              Nos artisans d&apos;urgence interviennent dans plus de 140 villes en France.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
            {topEmergencyCities.map((ville) => (
              <Link
                key={ville.slug}
                href={`/villes/${ville.slug}`}
                className="bg-gray-50 hover:bg-red-50 border border-gray-200 hover:border-red-300 rounded-xl p-4 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-100 group-hover:bg-red-200 rounded-lg flex items-center justify-center transition-colors">
                    <MapPin className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 group-hover:text-red-600 transition-colors">{ville.name}</div>
                    <div className="text-xs text-gray-500">{ville.departementCode}</div>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          <div className="text-center">
            <Link
              href="/villes"
              className="inline-flex items-center gap-2 text-red-600 hover:text-red-700 font-semibold"
            >
              Voir toutes les villes couvertes
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Emergency Services by City — Internal Links */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">Services d&apos;urgence par ville</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {topEmergencyCities.slice(0, 6).map((ville) => (
              <div key={ville.slug} className="bg-white rounded-xl border border-gray-200 p-5">
                <h3 className="font-semibold text-gray-900 mb-3">Urgence à {ville.name}</h3>
                <div className="flex flex-wrap gap-2">
                  {urgencyServices.map((service) => (
                    <Link
                      key={`${service.slug}-${ville.slug}`}
                      href={`/urgence/${service.slug}/${ville.slug}`}
                      className="text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors border border-gray-100"
                    >
                      {service.name.split(' ')[0]} à {ville.name}
                    </Link>
                  ))}
                </div>
                <Link
                  href={`/villes/${ville.slug}`}
                  className="inline-flex items-center gap-1 text-red-600 hover:text-red-700 text-sm font-medium mt-3"
                >
                  Tous les artisans <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust & Guarantee Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Pourquoi choisir ServicesArtisans ?</h2>
            <p className="text-gray-600 max-w-xl mx-auto">Des garanties concrètes pour votre tranquillité d&apos;esprit.</p>
          </div>
          <div className="grid md:grid-cols-4 gap-6">
            <div className="text-center p-6 bg-gray-50 rounded-2xl">
              <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Shield className="w-7 h-7 text-green-600" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Artisans référencés</h3>
              <p className="text-sm text-gray-600">Identité, SIRET et assurance contrôlés avant toute mise en relation.</p>
            </div>
            <div className="text-center p-6 bg-gray-50 rounded-2xl">
              <div className="w-14 h-14 bg-amber-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Star className="w-7 h-7 text-amber-600" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Avis authentiques</h3>
              <p className="text-sm text-gray-600">Tous les avis sont authentiques et publiés par de vrais clients.</p>
            </div>
            <div className="text-center p-6 bg-gray-50 rounded-2xl">
              <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-7 h-7 text-blue-600" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Devis gratuit</h3>
              <p className="text-sm text-gray-600">Recevez un devis détaillé avant toute intervention, sans engagement.</p>
            </div>
            <div className="text-center p-6 bg-gray-50 rounded-2xl">
              <div className="w-14 h-14 bg-red-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Clock className="w-7 h-7 text-red-600" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Intervention rapide</h3>
              <p className="text-sm text-gray-600">Un artisan disponible intervient chez vous rapidement, selon disponibilité.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative bg-gradient-to-br from-red-900 via-red-800 to-slate-900 text-white py-16 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-red-500 rounded-full blur-[120px]" />
        </div>
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Une urgence ? Ne perdez pas de temps.
          </h2>
          <p className="text-xl text-red-100/80 mb-8">
            Nos artisans référencés sont disponibles selon leurs horaires, y compris parfois les jours fériés pour intervenir rapidement chez vous.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <div className="flex flex-col items-center">
              <a
                href={PHONE_TEL}
                className="inline-flex items-center justify-center gap-3 bg-red-500 hover:bg-red-400 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-lg shadow-red-500/30 transition-all"
              >
                <Phone className="w-6 h-6" />
                Appeler l&apos;assistance
              </a>
              <span className="text-sm text-red-200/70 mt-2">Service de mise en relation</span>
            </div>
            <Link
              href="/services"
              className="inline-flex items-center justify-center gap-3 bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all"
            >
              Voir tous les services
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Section A: Urgence par métier et ville — Service×City matrix */}
      <section className="py-12 border-t bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-heading text-2xl font-bold text-gray-900 mb-8">Urgence par métier et ville</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {services.slice(0, 8).map((service) => (
              <div key={service.slug}>
                <h3 className="font-semibold text-gray-900 mb-3">Urgence {service.name.toLowerCase()}</h3>
                <div className="space-y-1.5">
                  {villes.slice(0, 6).map((ville) => (
                    <Link key={ville.slug} href={`/urgence/${service.slug}/${ville.slug}`}
                      className="flex items-center gap-2 text-sm text-gray-600 hover:text-red-600 py-1 transition-colors">
                      <ChevronRight className="w-3 h-3" /> {ville.name}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section B: Cross-intent "Voir aussi" */}
      <section className="py-12 bg-white border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-heading text-2xl font-bold text-gray-900 mb-8">Voir aussi</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Devis */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Demander un devis</h3>
              <div className="space-y-1.5">
                {services.slice(0, 10).map((s) => (
                  <Link key={s.slug} href={`/devis/${s.slug}`}
                    className="flex items-center gap-2 text-sm text-gray-600 hover:text-red-600 py-1 transition-colors">
                    <ChevronRight className="w-3 h-3" /> Devis {s.name.toLowerCase()}
                  </Link>
                ))}
              </div>
            </div>
            {/* Avis */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Avis clients</h3>
              <div className="space-y-1.5">
                {services.slice(0, 10).map((s) => (
                  <Link key={s.slug} href={`/avis/${s.slug}`}
                    className="flex items-center gap-2 text-sm text-gray-600 hover:text-red-600 py-1 transition-colors">
                    <ChevronRight className="w-3 h-3" /> Avis {s.name.toLowerCase()}
                  </Link>
                ))}
              </div>
            </div>
            {/* Tarifs */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Tarifs artisans</h3>
              <div className="space-y-1.5">
                {services.slice(0, 10).map((s) => (
                  <Link key={s.slug} href={`/tarifs/${s.slug}`}
                    className="flex items-center gap-2 text-sm text-gray-600 hover:text-red-600 py-1 transition-colors">
                    <ChevronRight className="w-3 h-3" /> Tarifs {s.name.toLowerCase()}
                  </Link>
                ))}
              </div>
            </div>
            {/* Navigation */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Navigation</h3>
              <div className="space-y-1.5">
                <Link href="/services" className="flex items-center gap-2 text-sm text-gray-600 hover:text-red-600 py-1 transition-colors">
                  <ChevronRight className="w-3 h-3" /> Tous les services
                </Link>
                <Link href="/villes" className="flex items-center gap-2 text-sm text-gray-600 hover:text-red-600 py-1 transition-colors">
                  <ChevronRight className="w-3 h-3" /> Toutes les villes
                </Link>
                <Link href="/departements" className="flex items-center gap-2 text-sm text-gray-600 hover:text-red-600 py-1 transition-colors">
                  <ChevronRight className="w-3 h-3" /> Tous les départements
                </Link>
                <Link href="/regions" className="flex items-center gap-2 text-sm text-gray-600 hover:text-red-600 py-1 transition-colors">
                  <ChevronRight className="w-3 h-3" /> Toutes les régions
                </Link>
                <Link href="/blog" className="flex items-center gap-2 text-sm text-gray-600 hover:text-red-600 py-1 transition-colors">
                  <ChevronRight className="w-3 h-3" /> Blog
                </Link>
                <Link href="/devis" className="flex items-center gap-2 text-sm text-gray-600 hover:text-red-600 py-1 transition-colors">
                  <ChevronRight className="w-3 h-3" /> Demander un devis
                </Link>
                <Link href="/tarifs" className="flex items-center gap-2 text-sm text-gray-600 hover:text-red-600 py-1 transition-colors">
                  <ChevronRight className="w-3 h-3" /> Tarifs artisans
                </Link>
                <Link href="/avis" className="flex items-center gap-2 text-sm text-gray-600 hover:text-red-600 py-1 transition-colors">
                  <ChevronRight className="w-3 h-3" /> Avis clients
                </Link>
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

      {/* JSON-LD Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@graph': [
              {
                '@type': 'WebPage',
                name: 'Urgence artisan soir & week-end',
                description: 'Plombier, électricien, serrurier disponibles selon les artisans de votre secteur partout en France.',
                url: `${SITE_URL}/urgence`,
              },
              {
                '@type': 'BreadcrumbList',
                itemListElement: [
                  { '@type': 'ListItem', position: 1, name: 'Accueil', item: SITE_URL },
                  { '@type': 'ListItem', position: 2, name: 'Urgence soir & week-end' },
                ],
              },
              ...urgencyServices.map((s) => ({
                '@type': 'Service',
                name: s.name,
                description: s.description,
                provider: {
                  '@type': 'Organization',
                  name: 'ServicesArtisans',
                  url: SITE_URL,
                },
                areaServed: {
                  '@type': 'Country',
                  name: 'France',
                },
                availableChannel: {
                  '@type': 'ServiceChannel',
                  serviceUrl: `${SITE_URL}/services/${s.slug}`,
                  availableLanguage: 'French',
                },
                hoursAvailable: {
                  '@type': 'OpeningHoursSpecification',
                  dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
                  opens: '00:00',
                  closes: '23:59',
                },
              })),
            ],
          }, null, 0)
            .replace(/</g, '\\u003c')
            .replace(/>/g, '\\u003e'),
        }}
      />
    </div>
  )
}
