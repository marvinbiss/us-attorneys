import { Metadata } from 'next'
import Link from 'next/link'
import { FileCheck, Shield, Lock, Eye, AlertTriangle, ArrowRight } from 'lucide-react'
import Breadcrumb from '@/components/Breadcrumb'
import JsonLd from '@/components/JsonLd'
import { getBreadcrumbSchema } from '@/lib/seo/jsonld'
import { SITE_URL } from '@/lib/seo/config'
import { companyIdentity } from '@/lib/config/company-identity'
import { getPageContent } from '@/lib/cms'
import { CmsContent } from '@/components/CmsContent'

export const revalidate = 86400

export const metadata: Metadata = {
  title: 'Notre processus de vérification des artisans',
  description: 'Découvrez comment ServicesArtisans vérifie chaque artisan : contrôle SIRET via l\'API SIRENE, assurance RC professionnelle, garantie décennale et suivi continu.',
  alternates: {
    canonical: `${SITE_URL}/notre-processus-de-verification`,
  },
  robots: {
    index: true,
    follow: true,
    'max-snippet': -1,
    'max-image-preview': 'large',
    'max-video-preview': -1,
  },
  openGraph: {
    title: 'Notre processus de vérification des artisans',
    description: 'Contrôle SIRET via l\'API SIRENE, assurance RC professionnelle, garantie décennale et suivi continu.',
    url: `${SITE_URL}/notre-processus-de-verification`,
    type: 'website',
    images: [{ url: `${SITE_URL}/opengraph-image`, width: 1200, height: 630, alt: 'ServicesArtisans — Vérification artisans' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Notre processus de vérification des artisans',
    images: [`${SITE_URL}/opengraph-image`],
  },
}

const verificationSteps = [
  {
    icon: FileCheck,
    title: 'Vérification SIRET via l\'API SIRENE',
    description: 'Chaque artisan souhaitant être référencé doit fournir son numéro SIRET. Nous contrôlons l\'existence et l\'activité de l\'entreprise auprès de l\'API SIRENE de l\'INSEE, le répertoire officiel des entreprises françaises. Cette vérification permet de confirmer que l\'entreprise est bien immatriculée et en activité.',
  },
  {
    icon: Shield,
    title: 'Assurance RC professionnelle',
    description: 'Nous demandons à chaque artisan de fournir une attestation d\'assurance responsabilité civile professionnelle en cours de validité. Cette assurance couvre les dommages pouvant survenir dans le cadre de l\'exercice professionnel de l\'artisan.',
  },
  {
    icon: Lock,
    title: 'Garantie décennale',
    description: 'Pour les artisans exerçant dans les métiers du bâtiment concernés par la loi Spinetta, nous vérifions la souscription à une assurance garantie décennale. Cette garantie couvre les dommages compromettant la solidité de l\'ouvrage pendant dix ans après la réception des travaux.',
  },
  {
    icon: Eye,
    title: 'Suivi continu',
    description: 'La vérification ne s\'arrête pas à l\'inscription. Nous effectuons des contrôles périodiques pour nous assurer que les documents restent à jour (validité des assurances, activité SIRET). Un artisan dont les documents expirent sans renouvellement voit son profil désactivé.',
  },
  {
    icon: AlertTriangle,
    title: 'Signalement',
    description: 'Si vous constatez un problème avec un artisan référencé sur la plateforme, vous pouvez nous le signaler. Chaque signalement est examiné et peut entraîner la suspension ou le retrait du profil de l\'artisan concerné.',
  },
]

export default async function NotreProcessusDeVerificationPage() {
  const cmsPage = await getPageContent('notre-processus-de-verification', 'static')

  if (cmsPage?.content_html) {
    return (
      <div className="min-h-screen bg-gray-50">
        <JsonLd data={getBreadcrumbSchema([
          { name: 'Accueil', url: '/' },
          { name: 'Notre processus de vérification', url: '/notre-processus-de-verification' },
        ])} />
        <section className="bg-white border-b">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <Breadcrumb items={[{ label: 'Notre processus de vérification' }]} className="mb-4" />
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

  const breadcrumbSchema = getBreadcrumbSchema([
    { name: 'Accueil', url: '/' },
    { name: 'Notre processus de vérification', url: '/notre-processus-de-verification' },
  ])

  return (
    <div className="min-h-screen bg-gray-50">
      <JsonLd data={breadcrumbSchema} />

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
            items={[{ label: 'Notre processus de vérification' }]}
            className="mb-6 text-slate-400 [&_a]:text-slate-400 [&_a:hover]:text-white [&_svg]:text-slate-600"
          />
          <div className="text-center">
          <h1 className="font-heading text-4xl md:text-5xl font-extrabold mb-6 tracking-[-0.025em]">
            Notre processus de v&eacute;rification des artisans
          </h1>
          <p className="text-xl text-slate-400 max-w-3xl mx-auto">
            Chaque artisan r&eacute;f&eacute;renc&eacute; sur {companyIdentity.name} passe par un processus
            de v&eacute;rification structur&eacute;. Voici les &eacute;tapes que nous suivons.
          </p>
          </div>
        </div>
      </section>

      {/* Étapes de vérification */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Les étapes de notre processus
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Un processus en plusieurs étapes pour s'assurer de la fiabilité
              des artisans référencés sur la plateforme.
            </p>
          </div>

          <div className="space-y-8 max-w-4xl mx-auto">
            {verificationSteps.map((step, index) => {
              const Icon = step.icon
              return (
                <div key={step.title} className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 flex items-start gap-5">
                  <div className="flex-shrink-0">
                    <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center">
                      <Icon className="w-7 h-7 text-blue-600" />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-sm font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                        Étape {index + 1}
                      </span>
                      <h3 className="text-lg font-semibold text-gray-900">{step.title}</h3>
                    </div>
                    <p className="text-gray-600">{step.description}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Ce que cela signifie pour vous */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl shadow-sm p-8 max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Ce que cela signifie pour vous
            </h2>
            <div className="space-y-4 text-gray-600">
              <p>
                En tant qu'utilisateur de la plateforme, vous savez que chaque artisan affiché
                a fait l'objet de vérifications documentaires. Cela ne constitue pas une garantie
                absolue de la qualité des prestations, mais un premier filtre vérifiable.
              </p>
              <p>
                Si une prestation ne correspond pas à vos attentes, vous disposez de plusieurs recours :
                signaler l'artisan, laisser un avis sur la plateforme, ou faire appel à notre
                processus de médiation.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Signaler un problème */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gray-50 rounded-2xl p-8 max-w-4xl mx-auto text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Signaler un problème
            </h2>
            <p className="text-gray-600 mb-6">
              Vous avez constaté un problème avec un artisan référencé ?
              Contactez-nous à <strong>{companyIdentity.email}</strong> ou
              via notre page de contact. Chaque signalement est examiné avec attention.
            </p>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center gap-2 bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Nous contacter
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Cross-links */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
              En savoir plus
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <Link
                href="/a-propos"
                className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow group"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                  À propos de {companyIdentity.name}
                </h3>
                <p className="text-gray-600 text-sm">
                  Découvrez notre mission, notre technologie et nos engagements.
                </p>
              </Link>
              <Link
                href="/politique-avis"
                className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow group"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                  Politique de gestion des avis
                </h3>
                <p className="text-gray-600 text-sm">
                  Comment les avis sont collectés, modérés et publiés sur la plateforme.
                </p>
              </Link>
              <Link
                href="/mediation"
                className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow group"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                  Médiation et résolution des litiges
                </h3>
                <p className="text-gray-600 text-sm">
                  En cas de litige, découvrez notre processus de médiation.
                </p>
              </Link>
              <Link
                href="/mentions-legales"
                className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow group"
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
                className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow group"
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
    </div>
  )
}
