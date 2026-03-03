import { Metadata } from 'next'
import Link from 'next/link'
import { Shield, Clock, Users, Search, FileText, CheckCircle, ChevronDown, ChevronRight, Star, ArrowUp } from 'lucide-react'
import Breadcrumb from '@/components/Breadcrumb'
import JsonLd from '@/components/JsonLd'
import { getBreadcrumbSchema, getFAQSchema } from '@/lib/seo/jsonld'
import { SITE_URL } from '@/lib/seo/config'
import DevisForm from '@/components/DevisForm'
import { getPageContent } from '@/lib/cms'
import { CmsContent } from '@/components/CmsContent'
import { tradeContent } from '@/lib/data/trade-content'
import { villes, services } from '@/lib/data/france'

export const metadata: Metadata = {
  title: 'Devis Artisan Gratuit — Comparez les Offres',
  description:
    "Demandez un devis artisan gratuit : plombier, électricien, serrurier et 50 métiers. Jusqu'à 3 devis en 24h. 100% gratuit, sans engagement.",
  alternates: {
    canonical: `${SITE_URL}/devis`,
  },
  robots: {
    index: true,
    follow: true,
    'max-snippet': -1,
    'max-image-preview': 'large',
    'max-video-preview': -1,
  },
  openGraph: {
    title: 'Devis Artisan Gratuit — Comparez les Offres',
    description: "Demandez un devis artisan gratuit. Jusqu'à 3 devis d'artisans vérifiés en 24h. 100% gratuit, sans engagement.",
    url: `${SITE_URL}/devis`,
    type: 'website',
    images: [{ url: `${SITE_URL}/opengraph-image`, width: 1200, height: 630, alt: 'ServicesArtisans — Devis gratuit' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Devis Artisan Gratuit — Comparez les Offres',
    description: "Demandez un devis artisan gratuit. Jusqu'à 3 devis d'artisans vérifiés en 24h.",
    images: [`${SITE_URL}/opengraph-image`],
  },
}

const trustBadges = [
  { icon: Shield, label: 'Gratuit', sublabel: 'Aucun frais caché' },
  { icon: Clock, label: 'Sans engagement', sublabel: 'Réponse sous 24 h' },
  { icon: Users, label: 'Artisans référencés', sublabel: 'SIREN contrôlé' },
]

const howSteps = [
  {
    number: '1',
    icon: Search,
    title: 'Décrivez votre projet',
    description:
      'Sélectionnez le type de service, indiquez votre ville et décrivez votre besoin en quelques lignes. Formulaire rapide en 2 minutes.',
  },
  {
    number: '2',
    icon: FileText,
    title: 'Recevez vos devis',
    description:
      'Votre demande est transmise aux artisans qualifiés proches de chez vous. Vous recevez jusqu’à 3 devis détaillés sous 24 à 48 h.',
  },
  {
    number: '3',
    icon: CheckCircle,
    title: 'Choisissez librement',
    description:
      'Comparez les tarifs, consultez les profils et choisissez l’artisan qui vous convient. Aucune obligation d’accepter.',
  },
]

const faqItems = [
  {
    question: 'Le service est-il vraiment gratuit ?',
    answer:
      'Oui, la demande de devis est 100 % gratuite et sans aucun engagement. Vous ne payez rien pour recevoir les propositions des artisans.',
  },
  {
    question: 'Combien de devis vais-je recevoir ?',
    answer:
      'Vous pouvez recevoir jusqu’à 3 devis d’artisans différents, selon la disponibilité dans votre zone géographique. Chaque devis est personnalisé en fonction de votre projet.',
  },
  {
    question: 'En combien de temps suis-je contacté ?',
    answer:
      'Les artisans disponibles vous contactent généralement sous 24 à 48 h après l’envoi de votre demande. En cas d’urgence, précisez-le dans le formulaire pour accélérer le traitement.',
  },
  {
    question: 'Comment les artisans sont-ils référencés ?',
    answer:
      'Tous les artisans référencés sur ServicesArtisans sont immatriculés au registre SIREN. Nous contrôlons leur numéro d’entreprise et leur activité déclarée auprès des données officielles de l’INSEE.',
  },
  {
    question: 'Suis-je obligé d’accepter un devis ?',
    answer:
      'Non, vous êtes entièrement libre. Comparez les devis reçus à votre rythme et choisissez celui qui correspond le mieux à vos attentes et à votre budget. Aucune obligation d’accepter.',
  },
  {
    question: 'Quelles données personnelles sont partagées ?',
    answer:
      'Seuls votre nom, numéro de téléphone et la description de votre projet sont transmis aux artisans sélectionnés. Votre adresse e-mail reste confidentielle et vos données ne sont jamais revendues à des tiers.',
  },
]

export default async function DevisPage() {
  const cmsPage = await getPageContent('devis', 'static')

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

  return (
    <div className="min-h-screen bg-gray-50">
      <JsonLd
        data={[
          getBreadcrumbSchema([
            { name: 'Accueil', url: '/' },
            { name: 'Demander un devis', url: '/devis' },
          ]),
          getFAQSchema(faqItems.map(item => ({ question: item.question, answer: item.answer }))),
        ]}
      />

      {/* ─── HERO ─────────────────────────────────────────────── */}
      <section className="relative bg-[#0a0f1e] text-white overflow-hidden">
        {/* Background */}
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

        <div className="relative max-w-6xl mx-auto px-4 pt-10 pb-28 md:pt-14 md:pb-36">
          {/* Breadcrumb */}
          <div className="mb-10">
            <Breadcrumb
              items={[{ label: 'Demander un devis' }]}
              className="text-slate-400 [&_a]:text-slate-400 [&_a:hover]:text-white [&_svg]:text-slate-600"
            />
          </div>

          <div className="text-center max-w-3xl mx-auto">
            <h1 className="font-heading text-3xl md:text-4xl lg:text-5xl font-extrabold mb-5 tracking-[-0.025em] leading-[1.1]">
              Recevez <span className="whitespace-nowrap">jusqu&apos;à</span>{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-blue-300 to-cyan-300 whitespace-nowrap">
                3&nbsp;devis gratuits
              </span>{' '}
              <span className="whitespace-nowrap">d&apos;artisans</span> référencés
            </h1>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed mb-10">
              Remplissez le formulaire ci-dessous et comparez les offres de professionnels
              qualifiés près de chez vous. Service 100&nbsp;% gratuit, sans engagement.
            </p>

            {/* Trust badges */}
            <div className="flex flex-wrap justify-center gap-6 md:gap-10">
              {trustBadges.map((badge) => {
                const Icon = badge.icon
                return (
                  <div key={badge.label} className="flex items-center gap-3">
                    <div className="w-11 h-11 bg-white/[0.08] backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/10">
                      <Icon className="w-5 h-5 text-blue-400" />
                    </div>
                    <div className="text-left">
                      <div className="text-sm font-semibold text-white">{badge.label}</div>
                      <div className="text-xs text-slate-500">{badge.sublabel}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ─── FORM ─────────────────────────────────────────────── */}
      <section id="formulaire" className="relative -mt-16 z-10 px-4 pb-20">
        <DevisForm />
      </section>

      {/* ─── HOW IT WORKS ─────────────────────────────────────── */}
      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-14">
            <p className="text-sm font-semibold text-blue-600 uppercase tracking-wider mb-2">Simple et rapide</p>
            <h2 className="font-heading text-2xl md:text-3xl font-bold text-slate-900 mb-3 tracking-tight">
              Comment ça marche&nbsp;?
            </h2>
            <p className="text-slate-500 max-w-lg mx-auto">
              Trois étapes suffisent pour recevoir des devis personnalisés d&apos;artisans de confiance.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-10 relative">
            {/* Connector line */}
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
                  <h3 className="font-heading text-lg font-bold text-slate-900 mb-2">
                    {item.title}
                  </h3>
                  <p className="text-slate-500 text-sm leading-relaxed max-w-xs mx-auto">
                    {item.description}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ─── FAQ ──────────────────────────────────────────────── */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-3xl mx-auto px-4">
          <div className="text-center mb-12">
            <p className="text-sm font-semibold text-blue-600 uppercase tracking-wider mb-2">FAQ</p>
            <h2 className="font-heading text-2xl md:text-3xl font-bold text-slate-900 mb-3 tracking-tight">
              Questions fréquentes
            </h2>
            <p className="text-slate-500 max-w-lg mx-auto">
              Tout ce que vous devez savoir avant de demander votre devis gratuit.
            </p>
          </div>

          <div className="space-y-4">
            {faqItems.map((item) => (
              <details
                key={item.question}
                className="group bg-white rounded-xl border border-gray-100 overflow-hidden"
              >
                <summary className="flex items-center justify-between cursor-pointer px-6 py-5 text-left hover:bg-gray-50 transition-colors [&::-webkit-details-marker]:hidden">
                  <span className="font-semibold text-slate-900 pr-4">{item.question}</span>
                  <ChevronDown className="w-5 h-5 text-gray-400 shrink-0 group-open:rotate-180 transition-transform duration-200" />
                </summary>
                <div className="px-6 pb-5 text-slate-500 leading-relaxed text-sm">
                  {item.answer}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ─── DEVIS PAR MÉTIER ─────────────────────────────────── */}
      <section className="py-16 bg-white border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="font-heading text-2xl md:text-3xl font-bold text-slate-900 mb-3 tracking-tight">
              Devis par m&eacute;tier
            </h2>
            <p className="text-slate-500 max-w-lg mx-auto">
              S&eacute;lectionnez un m&eacute;tier pour obtenir un devis adapt&eacute; &agrave; votre projet.
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {Object.entries(tradeContent).map(([slug, trade]) => (
              <Link
                key={slug}
                href={`/devis/${slug}`}
                className="bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-300 rounded-xl p-3 transition-all group text-center"
              >
                <div className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors text-sm">
                  {trade.name}
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  {trade.priceRange.min}&ndash;{trade.priceRange.max} {trade.priceRange.unit}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ─── BOTTOM CTA ───────────────────────────────────────── */}
      <section className="py-16 bg-white border-t border-gray-100">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <Star className="w-8 h-8 text-amber-400 mx-auto mb-4" />
          <h2 className="font-heading text-xl md:text-2xl font-bold text-slate-900 mb-3">
            Prêt à démarrer votre projet&nbsp;?
          </h2>
          <p className="text-slate-500 mb-6 max-w-md mx-auto">
            Comparez gratuitement les devis d&apos;artisans qualifiés et trouvez le bon professionnel pour vos travaux.
          </p>
          <a
            href="#formulaire"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3.5 rounded-xl shadow-lg shadow-blue-500/25 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300"
          >
            <ArrowUp className="w-5 h-5" />
            Remplir le formulaire
          </a>
        </div>
      </section>

      {/* ─── DEVIS PAR VILLE ──────────────────────────────────── */}
      <section className="py-12 bg-white border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-heading text-2xl font-bold text-gray-900 mb-6">
            Devis artisan par ville
          </h2>
          <div className="flex flex-wrap gap-2">
            {villes.slice(0, 20).map((ville) => (
              <Link
                key={ville.slug}
                href={`/devis/plombier/${ville.slug}`}
                className="inline-flex items-center gap-1.5 bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-300 rounded-lg px-3 py-2 text-sm text-gray-700 hover:text-blue-700 transition-colors"
              >
                {ville.name}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ─── DEVIS PAR SERVICE ET VILLE (MATRICE) ─────────────── */}
      <section className="py-12 border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-heading text-2xl font-bold text-gray-900 mb-8">
            Devis par m&eacute;tier et ville
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {services.slice(0, 8).map((service) => (
              <div key={service.slug}>
                <h3 className="font-semibold text-gray-900 mb-3">
                  Devis {service.name.toLowerCase()}
                </h3>
                <div className="space-y-1.5">
                  {villes.slice(0, 6).map((ville) => (
                    <Link
                      key={ville.slug}
                      href={`/devis/${service.slug}/${ville.slug}`}
                      className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 py-1 transition-colors"
                    >
                      <ChevronRight className="w-3 h-3" />
                      {ville.name}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── VOIR AUSSI (CROSS-INTENT) ────────────────────────── */}
      <section className="py-12 bg-gray-50 border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-heading text-xl font-bold text-gray-900 mb-6">Voir aussi</h2>
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-3">Avis artisans</h3>
              <div className="space-y-1.5">
                {services.slice(0, 8).map((s) => (
                  <Link
                    key={s.slug}
                    href={`/avis/${s.slug}`}
                    className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 py-1 transition-colors"
                  >
                    <ChevronRight className="w-3 h-3" />
                    Avis {s.name.toLowerCase()}
                  </Link>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-3">Tarifs artisans</h3>
              <div className="space-y-1.5">
                {services.slice(0, 8).map((s) => (
                  <Link
                    key={s.slug}
                    href={`/tarifs/${s.slug}`}
                    className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 py-1 transition-colors"
                  >
                    <ChevronRight className="w-3 h-3" />
                    Tarifs {s.name.toLowerCase()}
                  </Link>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-3">Urgence artisans</h3>
              <div className="space-y-1.5">
                {services.slice(0, 8).map((s) => (
                  <Link
                    key={s.slug}
                    href={`/urgence/${s.slug}`}
                    className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 py-1 transition-colors"
                  >
                    <ChevronRight className="w-3 h-3" />
                    Urgence {s.name.toLowerCase()}
                  </Link>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-3">Navigation</h3>
              <div className="space-y-1.5">
                <Link href="/services" className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 py-1 transition-colors">
                  <ChevronRight className="w-3 h-3" />
                  Tous les services
                </Link>
                <Link href="/villes" className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 py-1 transition-colors">
                  <ChevronRight className="w-3 h-3" />
                  Toutes les villes
                </Link>
                <Link href="/departements" className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 py-1 transition-colors">
                  <ChevronRight className="w-3 h-3" />
                  Tous les d&eacute;partements
                </Link>
                <Link href="/regions" className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 py-1 transition-colors">
                  <ChevronRight className="w-3 h-3" />
                  Toutes les r&eacute;gions
                </Link>
                <Link href="/blog" className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 py-1 transition-colors">
                  <ChevronRight className="w-3 h-3" />
                  Blog
                </Link>
                <Link href="/tarifs" className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 py-1 transition-colors">
                  <ChevronRight className="w-3 h-3" />
                  Tarifs artisans
                </Link>
                <Link href="/urgence" className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 py-1 transition-colors">
                  <ChevronRight className="w-3 h-3" />
                  Urgence artisans
                </Link>
                <Link href="/avis" className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 py-1 transition-colors">
                  <ChevronRight className="w-3 h-3" />
                  Avis artisans
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
