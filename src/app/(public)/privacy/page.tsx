import { Metadata } from 'next'
import JsonLd from '@/components/JsonLd'
import Breadcrumb from '@/components/Breadcrumb'
import { getBreadcrumbSchema } from '@/lib/seo/jsonld'
import { SITE_URL } from '@/lib/seo/config'
import { getPageContent } from '@/lib/cms'
import { CmsContent } from '@/components/CmsContent'

export const revalidate = 86400

export const metadata: Metadata = {
  title: 'Politique de confidentialité',
  description: 'Politique de confidentialité de ServicesArtisans - Comment nous collectons, utilisons et protégeons vos données personnelles.',
  robots: { index: false, follow: true },
  alternates: {
    canonical: `${SITE_URL}/privacy`,
  },
  openGraph: {
    title: 'Politique de confidentialité',
    description: 'Comment nous collectons, utilisons et protégeons vos données personnelles.',
    url: `${SITE_URL}/privacy`,
    type: 'website',
    images: [{ url: `${SITE_URL}/opengraph-image`, width: 1200, height: 630, alt: 'ServicesArtisans — Confidentialité' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Politique de confidentialité',
    images: [`${SITE_URL}/opengraph-image`],
  },
}

export default async function ConfidentialitePage() {
  const cmsPage = await getPageContent('confidentialite', 'static')

  if (cmsPage?.content_html) {
    return (
      <div className="min-h-screen bg-gray-50">
        <JsonLd data={getBreadcrumbSchema([
          { name: 'Accueil', url: '/' },
          { name: 'Confidentialité', url: '/privacy' },
        ])} />
        <section className="bg-white border-b">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <Breadcrumb items={[{ label: 'Confidentialité' }]} className="mb-4" />
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
        { name: 'Confidentialité', url: '/privacy' },
      ])} />
      {/* Header */}
      <section className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Breadcrumb items={[{ label: 'Confidentialité' }]} className="mb-4" />
          <h1 className="font-heading text-3xl font-bold text-gray-900">
            Politique de confidentialité
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

            <p className="lead">
              Chez ServicesArtisans, nous accordons une grande importance à la protection de vos
              données personnelles. Cette politique de confidentialité explique comment nous
              collectons, utilisons et protégeons vos informations.
            </p>

            <h2>1. Données collectées</h2>
            <p>Nous collectons les données suivantes :</p>
            <h3>Données d'identification</h3>
            <ul>
              <li>Nom et prénom</li>
              <li>Adresse email</li>
              <li>Numéro de téléphone</li>
              <li>Adresse postale</li>
            </ul>

            <h3>Données de navigation</h3>
            <ul>
              <li>Adresse IP</li>
              <li>Type de navigateur</li>
              <li>Pages visitées</li>
              <li>Durée de visite</li>
            </ul>

            <h3>Données de transaction</h3>
            <ul>
              <li>Historique des demandes de devis</li>
              <li>Échanges avec les artisans</li>
              <li>Avis et évaluations</li>
            </ul>

            <h2>2. Finalités du traitement</h2>
            <p>Vos données sont collectées pour :</p>
            <ul>
              <li>Vous mettre en relation avec des artisans qualifiés</li>
              <li>Gérer votre compte utilisateur</li>
              <li>Vous envoyer des devis et communications relatives à vos demandes</li>
              <li>Améliorer nos services et votre expérience utilisateur</li>
              <li>Réaliser des statistiques anonymisées</li>
              <li>Vous envoyer notre newsletter (avec votre consentement)</li>
              <li>Respecter nos obligations légales</li>
            </ul>

            <h2>3. Base légale</h2>
            <p>Le traitement de vos données repose sur :</p>
            <ul>
              <li><strong>L'exécution du contrat :</strong> pour vous fournir nos services</li>
              <li><strong>Votre consentement :</strong> pour l'envoi de newsletters</li>
              <li><strong>L'intérêt légitime :</strong> pour améliorer nos services</li>
              <li><strong>L'obligation légale :</strong> pour respecter la réglementation</li>
            </ul>

            <h2>4. Destinataires des données</h2>
            <p>Vos données peuvent être partagées avec :</p>
            <ul>
              <li>Les artisans partenaires (uniquement pour répondre à vos demandes)</li>
              <li>Nos sous-traitants techniques (hébergement, emailing)</li>
              <li>Les autorités compétentes (en cas d'obligation légale)</li>
            </ul>
            <p>
              Nous ne vendons jamais vos données personnelles à des tiers.
            </p>

            <h2>5. Durée de conservation</h2>
            <p>Vos données sont conservées :</p>
            <ul>
              <li><strong>Données de compte :</strong> 3 ans après votre dernière activité</li>
              <li><strong>Données de navigation :</strong> 13 mois maximum</li>
              <li><strong>Données de transaction :</strong> 5 ans (obligations comptables)</li>
            </ul>

            <h2>6. Vos droits</h2>
            <p>Conformément au RGPD, vous disposez des droits suivants :</p>
            <ul>
              <li><strong>Droit d'accès :</strong> obtenir une copie de vos données</li>
              <li><strong>Droit de rectification :</strong> corriger vos données inexactes</li>
              <li><strong>Droit à l'effacement :</strong> demander la suppression de vos données</li>
              <li><strong>Droit à la portabilité :</strong> récupérer vos données dans un format standard</li>
              <li><strong>Droit d'opposition :</strong> vous opposer à certains traitements</li>
              <li><strong>Droit à la limitation :</strong> limiter l'utilisation de vos données</li>
            </ul>
            <p>
              Pour exercer ces droits, contactez-nous à : <strong>dpo@us-attorneys.com</strong>
            </p>

            <h2>7. Cookies</h2>
            <p>Nous utilisons différents types de cookies :</p>
            <ul>
              <li><strong>Cookies essentiels :</strong> nécessaires au fonctionnement du site</li>
              <li><strong>Cookies analytiques :</strong> pour comprendre l'utilisation du site</li>
              <li><strong>Cookies marketing :</strong> pour personnaliser les publicités</li>
            </ul>
            <p>
              Vous pouvez gérer vos préférences de cookies via le bandeau de consentement
              affiché lors de votre première visite.
            </p>

            <h2>8. Sécurité</h2>
            <p>
              Nous mettons en œuvre des mesures techniques et organisationnelles appropriées
              pour protéger vos données contre tout accès non autorisé, modification, divulgation
              ou destruction. Nos serveurs sont sécurisés et les données sensibles sont chiffrées.
            </p>

            <h2>9. Transferts internationaux</h2>
            <p>
              Certaines de nos données peuvent être hébergées en dehors de l'Union Européenne
              (notamment aux États-Unis). Dans ce cas, nous nous assurons que des garanties
              appropriées sont en place (clauses contractuelles types, cadre de protection des données UE-États-Unis (EU-US Data Privacy Framework)).
            </p>

            <h2>10. Modifications</h2>
            <p>
              Nous pouvons modifier cette politique de confidentialité à tout moment.
              La date de dernière mise à jour est indiquée en haut de cette page.
              Nous vous informerons de toute modification substantielle par email ou via le site.
            </p>

            <h2>11. Contact</h2>
            <p>
              Pour toute question concernant cette politique ou vos données personnelles :
            </p>
            <ul>
              <li><strong>Email :</strong> dpo@us-attorneys.com</li>
              <li><strong>Courrier :</strong> Coordonnées du DPO disponibles sur demande via le formulaire de contact.</li>
            </ul>
            <p>
              Vous pouvez également introduire une réclamation auprès de la CNIL (www.cnil.fr).
            </p>

          </div>
        </div>
      </section>
    </div>
  )
}
