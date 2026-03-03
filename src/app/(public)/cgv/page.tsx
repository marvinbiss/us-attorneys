import { Metadata } from 'next'
import JsonLd from '@/components/JsonLd'
import Breadcrumb from '@/components/Breadcrumb'
import { getBreadcrumbSchema } from '@/lib/seo/jsonld'
import { SITE_URL } from '@/lib/seo/config'
import { getPageContent } from '@/lib/cms'
import { CmsContent } from '@/components/CmsContent'

export const metadata: Metadata = {
  title: 'Conditions Générales de Vente',
  description: 'Conditions générales de vente et d\'utilisation du service ServicesArtisans.',
  robots: { index: false, follow: true },
  alternates: {
    canonical: `${SITE_URL}/cgv`,
  },
  openGraph: {
    title: 'Conditions Générales de Vente',
    description: 'Conditions générales de vente et d\'utilisation du service ServicesArtisans.',
    url: `${SITE_URL}/cgv`,
    type: 'website',
    images: [{ url: `${SITE_URL}/opengraph-image`, width: 1200, height: 630, alt: 'ServicesArtisans — CGV' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Conditions Générales de Vente',
    images: [`${SITE_URL}/opengraph-image`],
  },
}

export default async function CGVPage() {
  const cmsPage = await getPageContent('cgv', 'static')

  if (cmsPage?.content_html) {
    return (
      <div className="min-h-screen bg-gray-50">
        <JsonLd data={getBreadcrumbSchema([
          { name: 'Accueil', url: '/' },
          { name: 'CGV', url: '/cgv' },
        ])} />
        <section className="bg-white border-b">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <Breadcrumb items={[{ label: 'CGV' }]} className="mb-4" />
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
      <JsonLd data={getBreadcrumbSchema([
        { name: 'Accueil', url: '/' },
        { name: 'CGV', url: '/cgv' },
      ])} />
      {/* Header */}
      <section className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Breadcrumb items={[{ label: 'CGV' }]} className="mb-4" />
          <h1 className="font-heading text-3xl font-bold text-gray-900">
            Conditions Générales de Vente et d'Utilisation
          </h1>
          <p className="text-gray-600 mt-2">
            Dernière mise à jour : Janvier 2026
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-xl shadow-sm p-8 prose prose-gray max-w-none">

            <h2>1. Objet</h2>
            <p>
              Les présentes Conditions Générales de Vente et d'Utilisation (CGVU) régissent
              l'utilisation du site servicesartisans.fr et des services proposés par
              ServicesArtisans.
            </p>
            <p>
              En utilisant notre plateforme, vous acceptez sans réserve les présentes CGVU.
            </p>

            <h2>2. Description des services</h2>
            <p>
              ServicesArtisans est une plateforme de mise en relation entre :
            </p>
            <ul>
              <li>Des particuliers ou professionnels recherchant des artisans (les "Utilisateurs")</li>
              <li>Des artisans et entreprises du bâtiment (les "Artisans Partenaires")</li>
            </ul>
            <p>
              Notre service permet aux Utilisateurs de :
            </p>
            <ul>
              <li>Rechercher des artisans par métier et localisation</li>
              <li>Consulter les fiches des artisans (coordonnées, avis, certifications)</li>
              <li>Demander des devis gratuits</li>
              <li>Comparer les offres reçues</li>
            </ul>

            <h2>3. Gratuité du service</h2>
            <p>
              L'utilisation de la plateforme est <strong>entièrement gratuite</strong> pour les particuliers et les artisans.
              Les demandes de devis sont gratuites et sans engagement.
            </p>

            <h2>4. Inscription des artisans</h2>
            <p>
              Les artisans souhaitant apparaître sur la plateforme doivent :
            </p>
            <ul>
              <li>Créer un compte professionnel</li>
              <li>Fournir les justificatifs demandés (SIRET, assurances, qualifications)</li>
              <li>Accepter les présentes CGVU et la charte qualité</li>
            </ul>
            <p>
              ServicesArtisans se réserve le droit de refuser ou suspendre toute inscription
              ne respectant pas nos critères de qualité.
            </p>

            <h2>5. Rôle d'intermédiaire</h2>
            <p>
              ServicesArtisans agit exclusivement en qualité d'intermédiaire. Nous ne sommes pas
              partie aux contrats conclus entre les Utilisateurs et les Artisans Partenaires.
            </p>
            <p>
              En conséquence, ServicesArtisans :
            </p>
            <ul>
              <li>Ne garantit pas la disponibilité des artisans</li>
              <li>N'est pas responsable de la qualité des prestations réalisées</li>
              <li>N'intervient pas dans la fixation des prix</li>
              <li>N'est pas responsable des litiges entre Utilisateurs et Artisans</li>
            </ul>

            <h2>6. Obligations des Utilisateurs</h2>
            <p>Les Utilisateurs s'engagent à :</p>
            <ul>
              <li>Fournir des informations exactes et complètes</li>
              <li>Ne pas utiliser le service à des fins frauduleuses</li>
              <li>Respecter les artisans et maintenir une communication courtoise</li>
              <li>Ne pas publier de faux avis</li>
            </ul>

            <h2>7. Obligations des Artisans Partenaires</h2>
            <p>Les Artisans Partenaires s'engagent à :</p>
            <ul>
              <li>Disposer de toutes les autorisations et assurances nécessaires</li>
              <li>Répondre aux demandes de devis dans un délai raisonnable</li>
              <li>Fournir des devis clairs et détaillés</li>
              <li>Respecter les engagements pris envers les clients</li>
              <li>Maintenir leurs informations à jour sur la plateforme</li>
            </ul>

            <h2>8. Avis et notations</h2>
            <p>
              Les Utilisateurs peuvent laisser des avis sur les artisans après une prestation.
              Ces avis doivent être sincères, factuels et respectueux.
            </p>
            <p>
              ServicesArtisans se réserve le droit de modérer ou supprimer les avis :
            </p>
            <ul>
              <li>Contenant des propos injurieux ou diffamatoires</li>
              <li>Sans rapport avec une prestation réelle</li>
              <li>Manifestement faux ou de mauvaise foi</li>
            </ul>

            <h2>9. Propriété intellectuelle</h2>
            <p>
              L'ensemble des éléments du site (textes, images, logos, base de données) sont
              la propriété de ServicesArtisans et sont protégés par le droit de la
              propriété intellectuelle.
            </p>

            <h2>10. Protection des données</h2>
            <p>
              Le traitement des données personnelles est régi par notre
              <a href="/confidentialite"> Politique de Confidentialité</a>.
            </p>

            <h2>11. Limitation de responsabilité</h2>
            <p>
              ServicesArtisans ne pourra être tenu responsable :
            </p>
            <ul>
              <li>Des dommages résultant de l'utilisation ou de l'impossibilité d'utiliser le service</li>
              <li>Des contenus publiés par les utilisateurs ou artisans</li>
              <li>Des relations contractuelles entre Utilisateurs et Artisans</li>
              <li>Des interruptions temporaires du service</li>
            </ul>

            <h2>12. Modification des CGVU</h2>
            <p>
              ServicesArtisans se réserve le droit de modifier les présentes CGVU à tout moment.
              Les utilisateurs seront informés de toute modification substantielle.
            </p>

            <h2>13. Droit applicable et juridiction</h2>
            <p>
              Les présentes CGVU sont soumises au droit français. En cas de litige, les tribunaux
              de Paris seront seuls compétents.
            </p>

            <h2>14. Contact</h2>
            <p>
              Pour toute question concernant ces CGVU :
            </p>
            <ul>
              <li>Email : contact@servicesartisans.fr</li>
              <li>Courrier : Coordonnées disponibles sur la page mentions légales.</li>
            </ul>

          </div>
        </div>
      </section>
    </div>
  )
}
