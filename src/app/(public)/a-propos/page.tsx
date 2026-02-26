import { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { Shield, Search, CreditCard, Lock, Eye, ArrowRight, Database } from 'lucide-react'
import { pageImages, BLUR_PLACEHOLDER } from '@/lib/data/images'
import Breadcrumb from '@/components/Breadcrumb'
import { createAdminClient } from '@/lib/supabase/admin'
import JsonLd from '@/components/JsonLd'
import { getOrganizationSchema, getBreadcrumbSchema } from '@/lib/seo/jsonld'
import { SITE_URL } from '@/lib/seo/config'
import { companyIdentity } from '@/lib/config/company-identity'
import { getPageContent } from '@/lib/cms'
import { CmsContent } from '@/components/CmsContent'

export const metadata: Metadata = {
  title: 'À propos de ServicesArtisans',
  description: 'ServicesArtisans référence des milliers d\'artisans grâce aux données ouvertes du gouvernement. Annuaire gratuit, transparent et fiable.',
  alternates: {
    canonical: `${SITE_URL}/a-propos`,
  },
  robots: {
    index: true,
    follow: true,
    'max-snippet': -1,
    'max-image-preview': 'large',
    'max-video-preview': -1,
  },
  openGraph: {
    title: 'À propos — Annuaire d\'artisans en France',
    description: 'ServicesArtisans référence des milliers d\'artisans grâce aux données ouvertes du gouvernement. Annuaire gratuit, transparent et fiable.',
    url: `${SITE_URL}/a-propos`,
    type: 'website',
    images: [{ url: `${SITE_URL}/opengraph-image`, width: 1200, height: 630, alt: 'ServicesArtisans — Annuaire des artisans en France' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'À propos — Annuaire d\'artisans en France',
    description: 'ServicesArtisans référence des milliers d\'artisans grâce aux données ouvertes du gouvernement.',
    images: [`${SITE_URL}/opengraph-image`],
  },
}

export const revalidate = 3600

const IS_BUILD = process.env.NEXT_BUILD_SKIP_DB === '1'

// Fallback stats used when DB is unavailable during static generation
const FALLBACK_STATS = { artisanCount: 0, reviewCount: 0, cityCount: 0 }

async function getStats() {
  if (IS_BUILD) return FALLBACK_STATS
  try {
    const supabase = createAdminClient()

    // Race all queries against a 6s timeout to prevent build hangs
    const result = await Promise.race([
      Promise.all([
        supabase.from('providers').select('*', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('providers').select('review_count').eq('is_active', true).gt('review_count', 0),
        supabase.from('providers').select('address_city').eq('is_active', true)
      ]),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('getStats timeout')), 6_000)
      ),
    ])

    const [{ count: artisanCount }, { data: providerStats }, { data: cities }] = result

    const totalReviews = providerStats?.reduce((sum, p) => sum + (p.review_count || 0), 0) || 0
    const uniqueCities = new Set(cities?.map(c => c.address_city).filter(Boolean)).size

    return {
      artisanCount: artisanCount || FALLBACK_STATS.artisanCount,
      reviewCount: totalReviews || FALLBACK_STATS.reviewCount,
      cityCount: uniqueCities || FALLBACK_STATS.cityCount,
    }
  } catch {
    return FALLBACK_STATS
  }
}

const verificationSteps = [
  {
    icon: Database,
    title: 'Données SIREN officielles',
    description: 'Chaque artisan provient de l\'API Annuaire des Entreprises du gouvernement. Numéro SIREN, activité et adresse sont issus des données publiques officielles.',
  },
  {
    icon: Shield,
    title: 'Assurance RC professionnelle',
    description: 'Nous demandons une attestation d\'assurance responsabilité civile professionnelle en cours de validité.',
  },
  {
    icon: Lock,
    title: 'Garantie décennale',
    description: 'Pour les métiers du bâtiment concernés, la garantie décennale est contrôlée avant toute mise en ligne.',
  },
  {
    icon: Eye,
    title: 'Avis authentiques',
    description: 'Seuls les clients ayant fait appel à un artisan via la plateforme peuvent laisser un avis.',
  },
]

const commitments = [
  {
    title: 'Zéro information inventée',
    description: 'Aucun faux avis, aucune fausse statistique, aucun faux profil d\'artisan sur la plateforme.',
  },
  {
    title: 'Données protégées',
    description: 'Conformité RGPD, données hébergées en Europe, DPO joignable à dpo@servicesartisans.fr.',
  },
  {
    title: 'Transparence tarifaire',
    description: 'Service gratuit pour les particuliers. Tarifs artisans publics sur notre page dédiée.',
  },
  {
    title: 'Pas de revente de données',
    description: 'Vos données personnelles ne sont jamais vendues à des tiers. Jamais.',
  },
]

export default async function AProposPage() {
  const cmsPage = await getPageContent('a-propos', 'static')

  if (cmsPage?.content_html) {
    return (
      <div className="min-h-screen bg-gray-50">
        <JsonLd data={getBreadcrumbSchema([
          { name: 'Accueil', url: '/' },
          { name: 'À propos', url: '/a-propos' },
        ])} />
        <section className="bg-white border-b">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <Breadcrumb items={[{ label: 'À propos' }]} className="mb-4" />
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

  const stats = await getStats()
  const hasArtisans = stats.artisanCount > 0

  const orgSchema = getOrganizationSchema()
  const breadcrumbSchema = getBreadcrumbSchema([
    { name: 'Accueil', url: '/' },
    { name: 'À propos', url: '/a-propos' },
  ])

  return (
    <div className="min-h-screen bg-gray-50">
      <JsonLd data={[orgSchema, breadcrumbSchema]} />

      {/* Hero */}
      <section className="relative bg-[#0a0f1e] text-white overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0" style={{
            background: 'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(37,99,235,0.18) 0%, transparent 60%), radial-gradient(ellipse 60% 60% at 80% 110%, rgba(37,99,235,0.1) 0%, transparent 50%), radial-gradient(ellipse 50% 40% at 10% 90%, rgba(59,130,246,0.06) 0%, transparent 50%)',
          }} />
          <div className="absolute inset-0 opacity-[0.025]" style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '64px 64px',
          }} />
          <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-gray-50 to-transparent" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-28 md:pt-14 md:pb-36">
          <Breadcrumb
            items={[{ label: 'À propos' }]}
            className="mb-6 text-slate-400 [&_a]:text-slate-400 [&_a:hover]:text-white [&_svg]:text-slate-600"
          />
          <div className="text-center">
          <h1 className="font-heading text-4xl md:text-5xl font-extrabold mb-6 tracking-[-0.025em]">
            Annuaire des artisans de France
          </h1>
          <p className="text-xl text-slate-400 max-w-3xl mx-auto">
            Nous avons construit un annuaire d&apos;artisans en France
            en exploitant les donn&eacute;es ouvertes du gouvernement.
            {stats.artisanCount > 0 ? ` ${stats.artisanCount.toLocaleString('fr-FR')}+ professionnels r\u00e9f\u00e9renc\u00e9s,` : ' Des milliers de professionnels r\u00e9f\u00e9renc\u00e9s,'} accessibles gratuitement.
          </p>
          </div>
        </div>
      </section>

      {/* Comment nous référençons les artisans */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Comment nous référençons les artisans
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Chaque artisan référencé sur la plateforme passe par un processus
              de vérification en plusieurs étapes.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {verificationSteps.map((step) => {
              const Icon = step.icon
              return (
                <div key={step.title} className="text-center">
                  <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Icon className="w-7 h-7 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{step.title}</h3>
                  <p className="text-gray-600 text-sm">{step.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Notre technologie + modèle économique */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Technologie */}
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="relative h-48 w-full">
                <Image
                  src={pageImages.about[0].src}
                  alt={pageImages.about[0].alt}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  placeholder="blur"
                  blurDataURL={BLUR_PLACEHOLDER}
                />
              </div>
              <div className="p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Notre technologie</h2>
              <div className="space-y-4 text-gray-600">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-blue-600 text-xs font-bold">1</span>
                  </div>
                  <p>Données artisans issues de l&apos;<strong>API Annuaire des Entreprises</strong> du gouvernement (données ouvertes SIREN).</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-blue-600 text-xs font-bold">2</span>
                  </div>
                  <p>Plateforme construite avec <strong>Next.js</strong> pour des performances optimales et un référencement naturel de qualité.</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-blue-600 text-xs font-bold">3</span>
                  </div>
                  <p>Données hébergées en Europe via <strong>Supabase</strong> (PostgreSQL).</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-blue-600 text-xs font-bold">4</span>
                  </div>
                  <p>Paiements sécurisés via <strong>Stripe</strong>, certifié PCI-DSS.</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-blue-600 text-xs font-bold">5</span>
                  </div>
                  <p>Monitoring et gestion des erreurs via <strong>Sentry</strong>.</p>
                </div>
              </div>
              </div>
            </div>

            {/* Modèle économique */}
            <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl overflow-hidden text-white">
              <div className="relative h-48 w-full">
                <Image
                  src={pageImages.about[1].src}
                  alt={pageImages.about[1].alt}
                  fill
                  className="object-cover opacity-40"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  placeholder="blur"
                  blurDataURL={BLUR_PLACEHOLDER}
                />
                <div className="absolute inset-0 bg-gradient-to-b from-blue-600/60 to-blue-700/90" />
              </div>
              <div className="p-8">
              <h2 className="text-2xl font-bold mb-6">Notre modèle économique</h2>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Search className="w-5 h-5 text-blue-200 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">Gratuit pour les particuliers</p>
                    <p className="text-blue-100 text-sm">Recherche d'artisans, demandes de devis, comparaison : tout est gratuit.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CreditCard className="w-5 h-5 text-blue-200 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">Abonnements pour les artisans</p>
                    <p className="text-blue-100 text-sm">Les artisans s'abonnent pour recevoir des demandes de devis qualifiées.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Lock className="w-5 h-5 text-blue-200 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">Aucune revente de données</p>
                    <p className="text-blue-100 text-sm">Vos données personnelles ne sont jamais vendues. Notre seul revenu provient des abonnements artisans.</p>
                  </div>
                </div>
              </div>
              <div className="mt-6 pt-6 border-t border-blue-400/30">
                <Link
                  href="/tarifs"
                  className="inline-flex items-center gap-2 text-white font-semibold hover:underline"
                >
                  Voir les tarifs artisans
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Chiffres ou état de lancement */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {hasArtisans ? (
            <>
              <h2 className="text-3xl font-bold text-gray-900 mb-8">
                L&apos;annuaire en chiffres
              </h2>
              <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto">
                <div>
                  <div className="text-3xl font-bold text-blue-600">
                    {stats.artisanCount.toLocaleString('fr-FR')}
                  </div>
                  <div className="text-gray-600 mt-1">Artisans référencés</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-blue-600">
                    {stats.cityCount}
                  </div>
                  <div className="text-gray-600 mt-1">Villes couvertes</div>
                </div>
                {stats.reviewCount > 0 && (
                  <div>
                    <div className="text-3xl font-bold text-blue-600">
                      {stats.reviewCount.toLocaleString('fr-FR')}
                    </div>
                    <div className="text-gray-600 mt-1">Avis authentiques</div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="max-w-xl mx-auto">
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-3">
                  Annuaire en cours de constitution
                </h2>
                <p className="text-gray-600 mb-6">
                  Nous importons les données de l&apos;API Annuaire des Entreprises pour constituer
                  le plus grand répertoire d&apos;artisans de France. Les premiers professionnels
                  référencés seront bientôt accessibles.
                </p>
                <Link
                  href="/inscription-artisan"
                  className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                >
                  Devenir artisan partenaire
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Nos engagements */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Nos engagements
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Des engagements concrets et vérifiables.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {commitments.map((commitment) => (
              <div key={commitment.title} className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{commitment.title}</h3>
                <p className="text-gray-600 text-sm">{commitment.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* En savoir plus sur nos engagements */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
              En savoir plus sur nos engagements
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              <Link
                href="/notre-processus-de-verification"
                className="bg-gray-50 rounded-xl p-6 border border-gray-100 hover:shadow-md transition-shadow group"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                  Processus de vérification
                </h3>
                <p className="text-gray-600 text-sm">
                  Détails sur la vérification SIRET, assurances et suivi continu des artisans.
                </p>
              </Link>
              <Link
                href="/politique-avis"
                className="bg-gray-50 rounded-xl p-6 border border-gray-100 hover:shadow-md transition-shadow group"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                  Politique d'avis
                </h3>
                <p className="text-gray-600 text-sm">
                  Notre politique de collecte, modération et publication des avis clients.
                </p>
              </Link>
              <Link
                href="/mediation"
                className="bg-gray-50 rounded-xl p-6 border border-gray-100 hover:shadow-md transition-shadow group"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                  Résolution des litiges
                </h3>
                <p className="text-gray-600 text-sm">
                  Processus de réclamation et médiation en cas de différend.
                </p>
              </Link>
              <Link
                href="/mentions-legales"
                className="bg-gray-50 rounded-xl p-6 border border-gray-100 hover:shadow-md transition-shadow group"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                  Mentions légales
                </h3>
                <p className="text-gray-600 text-sm">
                  Informations juridiques, éditeur et hébergeur du site.
                </p>
              </Link>
              <Link
                href="/contact"
                className="bg-gray-50 rounded-xl p-6 border border-gray-100 hover:shadow-md transition-shadow group"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                  Contact
                </h3>
                <p className="text-gray-600 text-sm">
                  Une question ? Contactez notre équipe.
                </p>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="py-16 bg-blue-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Une question ?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Contactez-nous à <strong>{companyIdentity.email}</strong> ou via notre page de contact.
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center justify-center gap-2 bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
          >
            Nous contacter
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  )
}
