import { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { Search, CheckCircle, ArrowRight, Shield, Star, FileText, Phone, MapPin, ChevronDown } from 'lucide-react'
import { pageImages, BLUR_PLACEHOLDER } from '@/lib/data/images'
import Breadcrumb from '@/components/Breadcrumb'
import { PopularServicesLinks, PopularCitiesLinks } from '@/components/InternalLinks'
import JsonLd from '@/components/JsonLd'
import { getHowToSchema, getBreadcrumbSchema, getFAQSchema } from '@/lib/seo/jsonld'
import { SITE_URL } from '@/lib/seo/config'
import { getPageContent } from '@/lib/cms'
import { CmsContent } from '@/components/CmsContent'

export const metadata: Metadata = {
  title: 'Comment ça marche — Trouvez un artisan',
  description: 'Recherchez, comparez et contactez un artisan en 3 étapes. Des milliers de professionnels référencés dans 101 départements. 100% gratuit, sans inscription.',
  alternates: {
    canonical: `${SITE_URL}/comment-ca-marche`,
  },
  robots: {
    index: true,
    follow: true,
    'max-snippet': -1,
    'max-image-preview': 'large',
    'max-video-preview': -1,
  },
  openGraph: {
    title: 'Comment ça marche — Trouvez un artisan',
    description: 'Recherchez, comparez et contactez un artisan en 3 étapes. 100% gratuit, sans inscription.',
    url: `${SITE_URL}/comment-ca-marche`,
    type: 'website',
    images: [{ url: `${SITE_URL}/opengraph-image`, width: 1200, height: 630, alt: 'ServicesArtisans — Comment ça marche' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Comment ça marche — Trouvez un artisan',
    description: 'Recherchez, comparez et contactez un artisan en 3 étapes. 100% gratuit.',
    images: [`${SITE_URL}/opengraph-image`],
  },
}

const steps = [
  {
    number: '1',
    icon: Search,
    title: 'Recherchez',
    description: 'Trouvez le bon professionnel en quelques secondes dans notre annuaire d\'artisans. Recherchez par type de service et par ville dans les 101 départements français.',
    details: [
      'Des milliers d\'artisans référencés en France',
      'Recherche par métier : plombier, électricien, couvreur...',
      'Filtrage par ville et département',
      'Résultats instantanés et à jour',
    ],
    gradient: 'from-blue-500 to-blue-700',
  },
  {
    number: '2',
    icon: CheckCircle,
    title: 'Comparez',
    description: 'Consultez les profils détaillés des artisans avec leurs données officielles. Comparez les entreprises en toute transparence grâce aux données SIREN gouvernementales.',
    details: [
      'Profils référencés avec numéro SIRET',
      'Données issues de l\'API gouvernementale SIREN',
      'Certifications et qualifications affichées',
      'Informations sur l\'entreprise (date de création, statut)',
    ],
    gradient: 'from-emerald-500 to-emerald-700',
  },
  {
    number: '3',
    icon: Phone,
    title: 'Contactez',
    description: 'Contactez directement les artisans qui vous intéressent. Demandez des devis, appelez-les ou consultez leurs coordonnées complètes sans intermédiaire.',
    details: [
      'Contact direct sans intermédiaire',
      'Demande de devis en ligne gratuite',
      'Coordonnées et informations officielles',
      'Aucune commission, aucun frais caché',
    ],
    gradient: 'from-purple-500 to-purple-700',
  },
]

const trustReasons = [
  {
    icon: Shield,
    title: 'Données SIREN officielles',
    description: 'Chaque artisan est référencé via l\'API officielle SIREN de l\'État. Numéro SIRET, statut d\'activité, date de création : des données fiables et à jour.',
  },
  {
    icon: MapPin,
    title: 'Des milliers d\'artisans dans 101 départements',
    description: 'Un annuaire d\'artisans référencés via les données SIREN officielles. Trouvez un professionnel près de chez vous, partout en France métropolitaine et outre-mer.',
  },
  {
    icon: Star,
    title: '100% gratuit, sans inscription',
    description: 'Accédez à toutes les informations sans créer de compte. Pas de frais cachés, pas d\'abonnement, pas de commission sur les travaux.',
  },
  {
    icon: FileText,
    title: 'Données officielles vérifiables',
    description: 'Nous affichons uniquement des données vérifiables issues des registres officiels de l\'État français (API SIREN, INSEE).',
  },
]

const faqs = [
  {
    question: 'Est-ce que ServicesArtisans est vraiment gratuit ?',
    answer: 'Oui, ServicesArtisans est 100% gratuit pour les particuliers. Vous pouvez rechercher des artisans, consulter leurs profils et les contacter sans aucun frais ni inscription. Nous ne prenons aucune commission sur les travaux.',
  },
  {
    question: 'D\'où viennent les données des artisans ?',
    answer: 'Les données proviennent de l\'API SIREN de l\'INSEE, la base de données officielle du gouvernement français qui recense toutes les entreprises. Chaque artisan est identifié par son numéro SIRET, ce qui garantit la fiabilité des informations.',
  },
  {
    question: 'Comment savoir si un artisan est toujours en activité ?',
    answer: 'Les données SIREN incluent le statut d\'activité de l\'entreprise. Nous affichons uniquement les entreprises dont le statut est actif. Les informations sont régulièrement mises à jour grâce à l\'API gouvernementale.',
  },
  {
    question: 'Puis-je demander un devis directement sur le site ?',
    answer: 'Oui, vous pouvez remplir notre formulaire de demande de devis gratuit. Votre demande sera transmise aux artisans correspondant à votre besoin et à votre localisation. Vous recevrez des devis détaillés sans engagement.',
  },
  {
    question: 'Quelle est la différence avec les autres annuaires d\'artisans ?',
    answer: 'ServicesArtisans se distingue par l\'utilisation des données officielles de l\'API SIREN gouvernementale, l\'absence de faux avis, la gratuité totale sans inscription, et la couverture des 101 départements français.',
  },
  {
    question: 'Comment sont sélectionnés les artisans affichés ?',
    answer: 'Nous n\'effectuons pas de sélection subjective. Tous les artisans présents sur ServicesArtisans sont des entreprises inscrites aux registres officiels avec un code APE correspondant à une activité artisanale. La transparence est notre priorité.',
  },
]

export default async function CommentCaMarchePage() {
  const cmsPage = await getPageContent('comment-ca-marche', 'static')

  if (cmsPage?.content_html) {
    return (
      <div className="min-h-screen bg-gray-50">
        <JsonLd data={getBreadcrumbSchema([
          { name: 'Accueil', url: '/' },
          { name: 'Comment ça marche', url: '/comment-ca-marche' },
        ])} />
        <section className="bg-white border-b">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <Breadcrumb items={[{ label: 'Comment ça marche' }]} className="mb-4" />
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

  const howToSchema = getHowToSchema([
    { name: 'Recherchez', text: 'Trouvez le bon professionnel dans notre annuaire d\'artisans. Recherchez par type de service et par ville dans les 101 départements français.' },
    { name: 'Comparez', text: 'Consultez les profils détaillés avec données SIREN officielles. Comparez les entreprises en toute transparence grâce aux données gouvernementales.' },
    { name: 'Contactez', text: 'Contactez directement les artisans. Demandez des devis, appelez-les ou consultez leurs coordonnées complètes sans intermédiaire.' },
  ])

  const breadcrumbSchema = getBreadcrumbSchema([
    { name: 'Accueil', url: '/' },
    { name: 'Comment ça marche', url: '/comment-ca-marche' },
  ])

  const faqSchema = getFAQSchema(faqs)

  return (
    <>
      <JsonLd data={[howToSchema, breadcrumbSchema, faqSchema]} />
    <div className="min-h-screen bg-gray-50">
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
          {/* Breadcrumb */}
          <Breadcrumb
            items={[{ label: 'Comment ça marche' }]}
            className="mb-6 text-slate-400 [&_a]:text-slate-400 [&_a:hover]:text-white [&_svg]:text-slate-600"
          />
          <div className="text-center">
            <h1 className="font-heading text-4xl md:text-5xl font-extrabold mb-6 tracking-[-0.025em]">
              Trouvez un artisan r&eacute;f&eacute;renc&eacute; en 3 &eacute;tapes
            </h1>
            <p className="text-xl text-slate-400 max-w-3xl mx-auto mb-4">
              Recherchez, comparez et contactez des artisans r&eacute;f&eacute;renc&eacute;s gr&acirc;ce aux donn&eacute;es officielles SIREN.
              Service 100% gratuit, sans inscription.
            </p>
            <div className="flex flex-wrap justify-center gap-4 mt-8">
              <Link
                href="/services"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-white font-semibold px-8 py-3.5 rounded-xl shadow-lg shadow-amber-500/25 hover:shadow-xl hover:shadow-amber-500/35 hover:-translate-y-0.5 transition-all duration-300"
              >
                <Search className="w-5 h-5" />
                Parcourir les services
              </Link>
              <Link
                href="/devis"
                className="inline-flex items-center gap-2 text-slate-300 hover:text-white font-medium px-6 py-3 transition-colors"
              >
                <FileText className="w-5 h-5" />
                Demander un devis gratuit
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Steps */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Comment trouver un artisan sur ServicesArtisans ?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Un processus simple et transparent pour accéder aux meilleurs professionnels de votre région
            </p>
          </div>

          <div className="space-y-16">
            {steps.map((step, index) => {
              const Icon = step.icon
              const isEven = index % 2 === 1
              return (
                <div
                  key={step.number}
                  className={`flex flex-col ${isEven ? 'lg:flex-row-reverse' : 'lg:flex-row'} items-center gap-12`}
                >
                  {/* Image/Icon */}
                  <div className="flex-1 w-full">
                    <div className={`relative bg-gradient-to-br ${step.gradient} rounded-2xl p-12 text-white text-center overflow-hidden`}>
                      {pageImages.howItWorks[index] && (
                        <>
                          <Image
                            src={pageImages.howItWorks[index].src}
                            alt={pageImages.howItWorks[index].alt}
                            fill
                            className="object-cover opacity-30"
                            sizes="(max-width: 1024px) 100vw, 50vw"
                            placeholder="blur"
                            blurDataURL={BLUR_PLACEHOLDER}
                          />
                          <div className="absolute inset-0 bg-gradient-to-br from-black/40 to-transparent" />
                        </>
                      )}
                      <div className="relative z-10">
                        <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6">
                          <Icon className="w-12 h-12" />
                        </div>
                        <div className="text-6xl font-bold opacity-50">
                          {step.number}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 font-bold text-xl">
                        {step.number}
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900">
                        {step.title}
                      </h3>
                    </div>
                    <p className="text-lg text-gray-600 mb-6">
                      {step.description}
                    </p>
                    <ul className="space-y-3">
                      {step.details.map((detail, i) => (
                        <li key={i} className="flex items-center gap-3">
                          <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                          <span className="text-gray-700">{detail}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Pourquoi nous faire confiance */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Pourquoi nous faire confiance ?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              ServicesArtisans s&apos;appuie sur les données officielles de l&apos;État pour vous garantir des informations fiables
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {trustReasons.map((item) => {
              const Icon = item.icon
              return (
                <div key={item.title} className="text-center p-6 rounded-xl bg-gray-50 hover:bg-blue-50 transition-colors">
                  <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Icon className="w-8 h-8 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {item.title}
                  </h3>
                  <p className="text-gray-600 text-sm">{item.description}</p>
                </div>
              )
            })}
          </div>

          {/* Stats bar */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8 bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl p-8 text-white text-center">
            <div>
              <div className="text-3xl md:text-4xl font-bold">18</div>
              <div className="text-blue-200 text-sm mt-1">Régions couvertes</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold">101</div>
              <div className="text-blue-200 text-sm mt-1">Départements couverts</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold">100%</div>
              <div className="text-blue-200 text-sm mt-1">Gratuit</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold">0</div>
              <div className="text-blue-200 text-sm mt-1">Faux avis</div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Questions fréquentes
            </h2>
            <p className="text-xl text-gray-600">
              Tout ce que vous devez savoir sur ServicesArtisans
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <details
                key={index}
                className="bg-white rounded-xl border border-gray-200 group"
              >
                <summary className="flex items-center justify-between p-6 cursor-pointer list-none">
                  <h3 className="text-lg font-semibold text-gray-900 pr-4">
                    {faq.question}
                  </h3>
                  <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0 group-open:rotate-180 transition-transform" />
                </summary>
                <div className="px-6 pb-6 text-gray-600 leading-relaxed">
                  {faq.answer}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Contextual Links */}
      <section className="py-12 bg-white border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">
            En savoir plus
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Link
              href="/services"
              className="bg-gray-50 p-6 rounded-xl hover:bg-blue-50 transition-colors border border-gray-200"
            >
              <h3 className="font-semibold text-gray-900 mb-2">Tous les services</h3>
              <p className="text-gray-600 text-sm mb-3">
                Parcourez tous les métiers d&apos;artisans disponibles sur ServicesArtisans.
              </p>
              <span className="text-blue-600 text-sm font-medium inline-flex items-center gap-1">
                Voir les services <ArrowRight className="w-4 h-4" />
              </span>
            </Link>
            <Link
              href="/devis"
              className="bg-gray-50 p-6 rounded-xl hover:bg-blue-50 transition-colors border border-gray-200"
            >
              <h3 className="font-semibold text-gray-900 mb-2">Demander un devis</h3>
              <p className="text-gray-600 text-sm mb-3">
                Recevez des devis gratuits et sans engagement de la part d&apos;artisans référencés.
              </p>
              <span className="text-blue-600 text-sm font-medium inline-flex items-center gap-1">
                Demander un devis <ArrowRight className="w-4 h-4" />
              </span>
            </Link>
            <Link
              href="/tarifs"
              className="bg-gray-50 p-6 rounded-xl hover:bg-blue-50 transition-colors border border-gray-200"
            >
              <h3 className="font-semibold text-gray-900 mb-2">Guide des prix</h3>
              <p className="text-gray-600 text-sm mb-3">
                Consultez les tarifs moyens par métier pour estimer votre budget travaux.
              </p>
              <span className="text-blue-600 text-sm font-medium inline-flex items-center gap-1">
                Voir les tarifs <ArrowRight className="w-4 h-4" />
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-blue-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Prêt à trouver votre artisan ?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Des milliers d&apos;artisans référencés vous attendent sur ServicesArtisans
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/services"
              className="inline-flex items-center gap-2 bg-white text-blue-600 px-8 py-4 rounded-xl font-semibold hover:bg-blue-50 transition-colors text-lg"
            >
              Trouver un artisan
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/devis"
              className="inline-flex items-center gap-2 bg-blue-500 text-white px-8 py-4 rounded-xl font-semibold hover:bg-blue-400 transition-colors text-lg border border-blue-400"
            >
              Demander un devis gratuit
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Related Links Section */}
      <section className="bg-gray-50 py-12 border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">
            Trouvez un artisan près de chez vous
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <PopularServicesLinks />
            <PopularCitiesLinks />
          </div>
        </div>
      </section>
    </div>
    </>
  )
}
