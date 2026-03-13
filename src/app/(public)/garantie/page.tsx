import type { Metadata } from 'next'
import Link from 'next/link'
import { Shield, CheckCircle, Lock, Clock, Search, FileCheck, Star, MessageCircle } from 'lucide-react'
import { SITE_URL } from '@/lib/seo/config'

export const metadata: Metadata = {
  title: 'Garantie ServicesArtisans — Notre engagement qualité',
  description: 'Artisans vérifiés, devis gratuits et sans engagement, données protégées. Découvrez les garanties ServicesArtisans pour vos travaux en toute confiance.',
  alternates: { canonical: `${SITE_URL}/garantie` },
  robots: { index: true, follow: true },
  openGraph: {
    title: 'Garantie ServicesArtisans — Notre engagement qualité',
    description: 'Artisans vérifiés, devis gratuits et sans engagement, données protégées.',
    url: `${SITE_URL}/garantie`,
    siteName: 'ServicesArtisans',
  },
}

const guarantees = [
  {
    icon: Shield,
    title: 'Artisans vérifiés',
    description: 'Chaque artisan référencé est contrôlé via les données officielles SIREN/SIRET. Nous vérifions que l\'entreprise est enregistrée, en activité, et correspond bien à la catégorie de métier déclarée.',
    color: 'bg-green-100 text-green-600',
  },
  {
    icon: CheckCircle,
    title: 'Devis 100% gratuits et sans engagement',
    description: 'Vous ne payez jamais pour recevoir des devis. Le service est entièrement gratuit pour les particuliers. Vous êtes libre de comparer et de choisir sans aucune obligation.',
    color: 'bg-blue-100 text-blue-600',
  },
  {
    icon: Lock,
    title: 'Données personnelles protégées',
    description: 'Vos informations ne sont transmises qu\'aux artisans que vous sollicitez. Nous ne revendons jamais vos données. Notre politique de confidentialité est conforme au RGPD.',
    color: 'bg-purple-100 text-purple-600',
  },
  {
    icon: Clock,
    title: 'Réponse rapide sous 24h',
    description: 'Votre demande est transmise en temps réel aux artisans disponibles dans votre zone. En moyenne, vous recevez une première réponse en quelques heures.',
    color: 'bg-amber-100 text-amber-600',
  },
]

const verificationSteps = [
  {
    icon: Search,
    title: 'Contrôle SIREN/SIRET',
    description: 'Vérification automatique auprès des bases INSEE que l\'entreprise est enregistrée et en activité.',
  },
  {
    icon: FileCheck,
    title: 'Validation du métier',
    description: 'Le code NAF/APE est croisé avec la catégorie de service pour confirmer la spécialité de l\'artisan.',
  },
  {
    icon: Star,
    title: 'Suivi des avis',
    description: 'Les avis clients sont vérifiés et les artisans avec des signalements répétés sont retirés de la plateforme.',
  },
  {
    icon: MessageCircle,
    title: 'Support réactif',
    description: 'Notre équipe est disponible pour traiter tout litige ou signalement dans les plus brefs délais.',
  },
]

export default function GarantiePage() {
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Accueil', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Garantie', item: `${SITE_URL}/garantie` },
    ],
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="mb-8 text-sm text-gray-500">
          <Link href="/" className="hover:text-blue-600">Accueil</Link>
          <span className="mx-2">/</span>
          <span className="text-gray-900 font-medium">Garantie</span>
        </nav>

        {/* Hero */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-green-100 mb-4">
            <Shield className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="font-heading text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            La garantie ServicesArtisans
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Nous nous engageons à vous mettre en relation avec des artisans fiables, gratuitement et en toute transparence.
          </p>
        </div>

        {/* 4 Guarantees */}
        <section className="mb-16">
          <h2 className="font-heading text-2xl font-bold text-gray-900 mb-8 text-center">
            Nos 4 engagements
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {guarantees.map((g) => (
              <div key={g.title} className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl ${g.color} mb-4`}>
                  <g.icon className="w-6 h-6" />
                </div>
                <h3 className="font-heading text-lg font-bold text-gray-900 mb-2">{g.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{g.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Verification process */}
        <section className="mb-16">
          <h2 className="font-heading text-2xl font-bold text-gray-900 mb-8 text-center">
            Comment nous vérifions les artisans
          </h2>
          <div className="space-y-6">
            {verificationSteps.map((step, i) => (
              <div key={step.title} className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <span className="text-sm font-bold text-blue-600">{i + 1}</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{step.title}</h3>
                  <p className="text-sm text-gray-600 mt-1">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Problem section */}
        <section className="mb-16 bg-gray-50 rounded-2xl p-8">
          <h2 className="font-heading text-2xl font-bold text-gray-900 mb-4">
            Un problème ? Nous sommes là.
          </h2>
          <p className="text-gray-600 mb-6">
            Si vous rencontrez un problème avec un artisan contacté via ServicesArtisans, notre équipe intervient pour vous aider à trouver une solution.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/contact"
              className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              Nous contacter
            </Link>
            <Link
              href="/politique-avis"
              className="inline-flex items-center justify-center gap-2 border-2 border-gray-200 hover:border-gray-300 text-gray-700 font-semibold px-6 py-3 rounded-xl hover:bg-white transition-colors"
            >
              Politique des avis
            </Link>
          </div>
        </section>

        {/* Final CTA */}
        <section className="text-center bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-8 md:p-12 text-white">
          <h2 className="font-heading text-2xl md:text-3xl font-bold mb-4">
            Prêt à trouver votre artisan ?
          </h2>
          <p className="text-blue-100 mb-6 max-w-lg mx-auto">
            Recevez jusqu&apos;à 3 devis gratuits d&apos;artisans vérifiés, en moins de 60 secondes.
          </p>
          <Link
            href="/devis"
            className="inline-flex items-center justify-center gap-2 bg-white text-blue-700 font-bold px-8 py-4 rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all"
          >
            Recevoir mes devis gratuits
          </Link>
        </section>
      </div>
    </>
  )
}
