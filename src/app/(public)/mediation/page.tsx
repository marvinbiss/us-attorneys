import { Metadata } from 'next'
import Link from 'next/link'
import { MessageCircle, Users, Scale, Clock, Mail, ArrowRight } from 'lucide-react'
import Breadcrumb from '@/components/Breadcrumb'
import JsonLd from '@/components/JsonLd'
import { getBreadcrumbSchema } from '@/lib/seo/jsonld'
import { SITE_URL } from '@/lib/seo/config'
import { companyIdentity } from '@/lib/config/company-identity'
import { getPageContent } from '@/lib/cms'
import { CmsContent } from '@/components/CmsContent'

export const revalidate = 86400

export const metadata: Metadata = {
  title: 'Médiation et résolution des litiges',
  description: 'Processus de médiation de ServicesArtisans : réclamation, médiation interne et externe, délais de traitement. Résolution amiable des litiges.',
  alternates: {
    canonical: `${SITE_URL}/mediation`,
  },
  robots: {
    index: true,
    follow: true,
    'max-snippet': -1,
    'max-image-preview': 'large',
    'max-video-preview': -1,
  },
  openGraph: {
    title: 'Médiation et résolution des litiges',
    description: 'Processus de médiation : réclamation, médiation interne et externe, résolution amiable des litiges.',
    url: `${SITE_URL}/mediation`,
    type: 'website',
    images: [{ url: `${SITE_URL}/opengraph-image`, width: 1200, height: 630, alt: 'ServicesArtisans — Médiation' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Médiation et résolution des litiges',
    images: [`${SITE_URL}/opengraph-image`],
  },
}

const steps = [
  {
    icon: MessageCircle,
    title: 'Processus de réclamation',
    content: [
      'Si vous rencontrez un problème avec une prestation effectuée par un artisan référencé sur la plateforme, la première étape consiste à nous adresser une réclamation écrite.',
      'Vous pouvez nous contacter par email à ' + companyIdentity.supportEmail + ' en décrivant la situation, la prestation concernée et le résultat souhaité. Nous accusons réception de chaque réclamation.',
    ],
  },
  {
    icon: Users,
    title: 'Médiation interne',
    content: [
      'À la réception de votre réclamation, notre équipe prend contact avec les deux parties (client et artisan) pour comprendre la situation et tenter de trouver une solution amiable.',
      'Cette étape vise à faciliter le dialogue entre le client et l\'artisan. Nous ne sommes pas un tribunal et n\'avons pas le pouvoir d\'imposer une solution, mais nous accompagnons les parties dans la recherche d\'un accord.',
    ],
  },
  {
    icon: Scale,
    title: 'Médiation externe',
    content: [
      'Si la médiation interne n\'aboutit pas à une solution satisfaisante, vous pouvez faire appel à un médiateur de la consommation conformément aux dispositions du Code de la consommation (articles L.611-1 et suivants).',
      'Le recours au médiateur de la consommation est gratuit pour le consommateur. Les coordonnées du médiateur compétent seront communiquées lors de l\'immatriculation de la société, conformément à l\'obligation légale.',
    ],
  },
  {
    icon: Clock,
    title: 'Délais de traitement',
    content: [
      'Nous nous efforçons d\'accuser réception de chaque réclamation dans un délai de 48 heures ouvrées.',
      'Le processus de médiation interne vise à proposer une solution dans un délai raisonnable après réception de l\'ensemble des éléments nécessaires. Ce délai dépend de la complexité du dossier et de la réactivité des parties.',
    ],
  },
]

export default async function MediationPage() {
  const cmsPage = await getPageContent('mediation', 'static')

  if (cmsPage?.content_html) {
    return (
      <div className="min-h-screen bg-gray-50">
        <JsonLd data={getBreadcrumbSchema([
          { name: 'Accueil', url: '/' },
          { name: 'Médiation', url: '/mediation' },
        ])} />
        <section className="bg-white border-b">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <Breadcrumb items={[{ label: 'Médiation' }]} className="mb-4" />
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
    { name: 'Médiation', url: '/mediation' },
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
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-28 md:pt-14 md:pb-36 text-center">
          <div className="mb-10">
            <Breadcrumb
              items={[{ label: 'Médiation' }]}
              className="text-slate-400 [&_a]:text-slate-400 [&_a:hover]:text-white [&_svg]:text-slate-600"
            />
          </div>
          <h1 className="font-heading text-4xl md:text-5xl font-extrabold mb-6 tracking-[-0.025em]">
            M&eacute;diation et r&eacute;solution des litiges
          </h1>
          <p className="text-xl text-slate-400 max-w-3xl mx-auto">
            En cas de litige, {companyIdentity.name} met en place un processus
            de m&eacute;diation pour faciliter la r&eacute;solution amiable des diff&eacute;rends.
          </p>
        </div>
      </section>

      {/* Étapes */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          {steps.map((step, index) => {
            const Icon = step.icon
            return (
              <div key={step.title} className="bg-white rounded-xl shadow-sm p-8 border border-gray-100">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                    <Icon className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                      Étape {index + 1}
                    </span>
                    <h2 className="text-2xl font-bold text-gray-900">{step.title}</h2>
                  </div>
                </div>
                <div className="space-y-4">
                  {step.content.map((paragraph, i) => (
                    <p key={i} className="text-gray-600 leading-relaxed">{paragraph}</p>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* Contact */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-8 text-center">
            <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Mail className="w-7 h-7 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Contact pour les réclamations
            </h2>
            <div className="space-y-2 text-gray-600 mb-6">
              <p>
                Pour toute réclamation : <strong>{companyIdentity.supportEmail}</strong>
              </p>
              <p>
                Pour toute autre question : <strong>{companyIdentity.email}</strong>
              </p>
            </div>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center gap-2 bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Page de contact
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Cross-links */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Pages associées
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <Link
              href="/verification-process"
              className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow group"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                Notre processus de vérification
              </h3>
              <p className="text-gray-600 text-sm">
                Comment nous référençons les artisans avant leur référencement sur la plateforme.
              </p>
            </Link>
            <Link
              href="/review-policy"
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
              href="/about"
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
              href="/legal"
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
      </section>
    </div>
  )
}
