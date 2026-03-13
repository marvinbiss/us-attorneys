import { Metadata } from 'next'
import Link from 'next/link'
import JsonLd from '@/components/JsonLd'
import Breadcrumb from '@/components/Breadcrumb'
import { getBreadcrumbSchema } from '@/lib/seo/jsonld'
import { SITE_URL } from '@/lib/seo/config'
import { companyIdentity } from '@/lib/config/company-identity'
import { getPageContent } from '@/lib/cms'
import { CmsContent } from '@/components/CmsContent'

export const revalidate = 86400

export const metadata: Metadata = {
  title: 'Mentions légales',
  description: 'Mentions légales du site ServicesArtisans.fr - Informations juridiques, éditeur, hébergeur et conditions d\'utilisation.',
  alternates: {
    canonical: `${SITE_URL}/mentions-legales`,
  },
  robots: { index: false, follow: true },
  openGraph: {
    title: 'Mentions légales',
    description: 'Informations juridiques, éditeur, hébergeur et conditions d\'utilisation.',
    url: `${SITE_URL}/mentions-legales`,
    type: 'website',
    images: [{ url: `${SITE_URL}/opengraph-image`, width: 1200, height: 630, alt: 'ServicesArtisans — Mentions légales' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Mentions légales',
    images: [`${SITE_URL}/opengraph-image`],
  },
}

export default async function MentionsLegalesPage() {
  const cmsPage = await getPageContent('mentions-legales', 'static')

  // If CMS content exists, render it instead of hardcoded content
  if (cmsPage?.content_html) {
    const breadcrumbSchema = getBreadcrumbSchema([
      { name: 'Accueil', url: '/' },
      { name: 'Mentions légales', url: '/mentions-legales' },
    ])

    return (
      <div className="min-h-screen bg-gray-50">
        <JsonLd data={breadcrumbSchema} />

        {/* Header */}
        <section className="bg-white border-b">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <Breadcrumb items={[{ label: 'Mentions légales' }]} className="mb-4" />
            <h1 className="font-heading text-3xl font-bold text-gray-900">
              {cmsPage.title}
            </h1>
          </div>
        </section>

        {/* CMS Content */}
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

  // Fallback to hardcoded content
  const isPreLaunch = companyIdentity.status === 'pre-launch'

  const breadcrumbSchema = getBreadcrumbSchema([
    { name: 'Accueil', url: '/' },
    { name: 'Mentions légales', url: '/mentions-legales' },
  ])

  return (
    <div className="min-h-screen bg-gray-50">
      <JsonLd data={breadcrumbSchema} />

      {/* Header */}
      <section className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Breadcrumb items={[{ label: 'Mentions légales' }]} className="mb-4" />
          <h1 className="font-heading text-3xl font-bold text-gray-900">
            Mentions légales
          </h1>
        </div>
      </section>

      {/* Content */}
      <section className="py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-xl shadow-sm p-8 prose prose-gray max-w-none">

            <h2>Éditeur du site</h2>
            {isPreLaunch && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 not-prose mb-4">
                <p className="text-blue-800 text-sm">
                  Le site {companyIdentity.name} est en cours de développement.
                  Les informations légales complètes (dénomination sociale, SIRET, adresse du siège)
                  seront publiées lors de l&apos;immatriculation de la société.
                </p>
                <p className="text-blue-800 text-sm mt-2">
                  Contact : <strong>{companyIdentity.email}</strong>
                </p>
              </div>
            )}
            <ul>
              {companyIdentity.legalName && (
                <li><strong>Raison sociale :</strong> {companyIdentity.legalName}</li>
              )}
              {companyIdentity.formeJuridique && (
                <li><strong>Forme juridique :</strong> {companyIdentity.formeJuridique}</li>
              )}
              {companyIdentity.capitalSocial && (
                <li><strong>Capital social :</strong> {companyIdentity.capitalSocial}</li>
              )}
              {companyIdentity.siret && (
                <li><strong>SIRET :</strong> {companyIdentity.siret}</li>
              )}
              {companyIdentity.rcs && (
                <li><strong>RCS :</strong> {companyIdentity.rcs}</li>
              )}
              {companyIdentity.tvaIntracom && (
                <li><strong>TVA intracommunautaire :</strong> {companyIdentity.tvaIntracom}</li>
              )}
              {companyIdentity.address && (
                <li><strong>Siège social :</strong> {companyIdentity.address}</li>
              )}
              {companyIdentity.phone && (
                <li><strong>Téléphone :</strong> {companyIdentity.phone}</li>
              )}
              {companyIdentity.directeurPublication && (
                <li><strong>Directeur de la publication :</strong> {companyIdentity.directeurPublication}</li>
              )}
              <li><strong>Email :</strong> {companyIdentity.email}</li>
            </ul>

            <h2>Hébergement</h2>
            <ul>
              <li><strong>Hébergeur :</strong> {companyIdentity.hosting.name}</li>
              <li><strong>Adresse :</strong> {companyIdentity.hosting.address}</li>
              <li><strong>Site web :</strong> {companyIdentity.hosting.website}</li>
            </ul>

            <h2>Propriété intellectuelle</h2>
            <p>
              L'ensemble du contenu de ce site (textes, images, logos, icônes, mise en page)
              est protégé par le droit de la propriété intellectuelle. Toute reproduction,
              représentation ou diffusion, totale ou partielle, du contenu de ce site,
              par quelque procédé que ce soit, sans l'autorisation expresse de l'éditeur,
              est interdite et constitue une contrefaçon.
            </p>

            <h2>Protection des données personnelles</h2>
            <p>
              Le traitement des données personnelles collectées sur ce site est décrit
              dans notre <a href="/confidentialite">politique de confidentialité</a>.
            </p>
            <p>
              Délégué à la protection des données (DPO) : <strong>{companyIdentity.dpoEmail}</strong>
            </p>

            <h2>Contact</h2>
            <p>
              Pour toute question relative aux mentions légales, vous pouvez nous contacter
              par email : <strong>{companyIdentity.email}</strong>
            </p>

          </div>

          {/* Cross-links: Confiance et transparence */}
          <div className="bg-white rounded-xl shadow-sm p-8 mt-8 border border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Confiance et transparence</h2>
            <p className="text-gray-600 mb-4">
              Pour en savoir plus sur nos engagements de transparence et de confiance :
            </p>
            <ul className="space-y-2">
              <li>
                <Link href="/notre-processus-de-verification" className="text-blue-600 hover:text-blue-800 hover:underline transition-colors">
                  Notre processus de vérification des artisans
                </Link>
              </li>
              <li>
                <Link href="/politique-avis" className="text-blue-600 hover:text-blue-800 hover:underline transition-colors">
                  Politique de gestion des avis
                </Link>
              </li>
              <li>
                <Link href="/mediation" className="text-blue-600 hover:text-blue-800 hover:underline transition-colors">
                  Médiation et résolution des litiges
                </Link>
              </li>
              <li>
                <Link href="/a-propos" className="text-blue-600 hover:text-blue-800 hover:underline transition-colors">
                  À propos de {companyIdentity.name}
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-blue-600 hover:text-blue-800 hover:underline transition-colors">
                  Contact
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  )
}
