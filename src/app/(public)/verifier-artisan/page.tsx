import { Metadata } from "next"
import JsonLd from "@/components/JsonLd"
import { getBreadcrumbSchema } from "@/lib/seo/jsonld"
import { SITE_URL, SITE_NAME } from "@/lib/seo/config"
import Breadcrumb from "@/components/Breadcrumb"
import VerifierClient from "./VerifierClient"

export const metadata: Metadata = {
  title: "Verifier un Artisan — SIRET, RGE, Fiabilite | ServicesArtisans",
  description:
    "Verifiez gratuitement un artisan en 30 secondes. Entrez son numero SIRET pour confirmer son existence legale, son activite et sa fiabilite. Outil de verification gratuit.",
  keywords: [
    "verifier artisan",
    "verifier SIRET artisan",
    "artisan fiable",
    "verification SIRET",
    "verifier entreprise artisan",
    "SIRET artisan",
    "artisan de confiance",
    "verification artisan gratuit",
  ],
  alternates: {
    canonical: `${SITE_URL}/verifier-artisan`,
  },
  openGraph: {
    title: "Verifier un Artisan — SIRET, RGE, Fiabilite",
    description:
      "Verifiez gratuitement un artisan en 30 secondes. Entrez son numero SIRET pour confirmer son existence legale et sa fiabilite.",
    url: `${SITE_URL}/verifier-artisan`,
    type: "website",
    siteName: SITE_NAME,
    images: [
      {
        url: `${SITE_URL}/opengraph-image`,
        width: 1200,
        height: 630,
        alt: "ServicesArtisans — Verifier un artisan",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Verifier un Artisan — SIRET, RGE, Fiabilite",
    description:
      "Verifiez gratuitement un artisan en 30 secondes. Outil de verification SIRET gratuit.",
    images: [`${SITE_URL}/opengraph-image`],
  },
}

const breadcrumbSchema = getBreadcrumbSchema([
  { name: "Accueil", url: "/" },
  { name: "Verifier un artisan", url: "/verifier-artisan" },
])

const faqItems = [
  {
    question: "Qu'est-ce qu'un numero SIRET ?",
    answer:
      "Le numero SIRET (Systeme d'Identification du Repertoire des Etablissements) est un identifiant unique de 14 chiffres attribue par l'INSEE a chaque etablissement d'une entreprise en France. Il est compose du SIREN (9 chiffres identifiant l'entreprise) et du NIC (5 chiffres identifiant l'etablissement). Tout artisan exerçant legalement doit en posseder un.",
  },
  {
    question: "Comment trouver le SIRET d'un artisan ?",
    answer:
      "Vous pouvez trouver le SIRET d'un artisan de plusieurs façons : sur ses devis et factures (obligation legale d'y faire figurer le SIRET), sur sa carte de visite professionnelle, en lui demandant directement, ou en effectuant une recherche sur societe.com ou infogreffe.fr avec le nom de l'entreprise.",
  },
  {
    question: "Un artisan est-il oblige d'avoir un SIRET ?",
    answer:
      "Oui, tout artisan exerçant une activite professionnelle en France doit obligatoirement etre immatricule et posseder un numero SIRET. C'est une obligation legale. Un artisan sans SIRET exerce illegalement (travail dissimule). Verifiez toujours ce numero avant de confier des travaux.",
  },
  {
    question: "Que faire si le SIRET est invalide ?",
    answer:
      "Si le SIRET d'un artisan est invalide ou introuvable, c'est un signal d'alerte majeur. Ne confiez pas de travaux a cette personne. Vous pouvez signaler la situation a la DGCCRF (Direction generale de la concurrence) ou a l'URSSAF. Privilegiez toujours des artisans dont le SIRET est verifiable.",
  },
  {
    question: "La verification est-elle gratuite ?",
    answer:
      "Oui, notre outil de verification de SIRET est 100% gratuit et sans inscription. Il utilise les donnees publiques officielles de l'INSEE pour vous fournir des informations fiables sur n'importe quelle entreprise artisanale en France.",
  },
  {
    question: "Quelles autres verifications faire avant d'engager un artisan ?",
    answer:
      "Au-dela du SIRET, verifiez : l'attestation d'assurance responsabilite civile professionnelle (obligatoire), la garantie decennale (obligatoire pour les travaux de construction), les qualifications RGE si vous souhaitez beneficier d'aides de l'Etat, les avis clients sur plusieurs plateformes, et demandez toujours plusieurs devis comparatifs.",
  },
]

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqItems.map((item) => ({
    "@type": "Question",
    name: item.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: item.answer,
    },
  })),
}

const webAppSchema = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Verificateur d'artisan",
  url: `${SITE_URL}/verifier-artisan`,
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  description:
    "Outil gratuit de verification de SIRET pour artisans. Verifiez instantanement la fiabilite d'un artisan.",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "EUR",
  },
  publisher: {
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_URL,
  },
}

export default function VerifierArtisanPage() {
  return (
    <>
      <JsonLd data={[breadcrumbSchema, faqSchema, webAppSchema]} />
      <div className="min-h-screen bg-gray-50">
        {/* Breadcrumb */}
        <div className="bg-white border-b">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <Breadcrumb items={[{ label: "Verifier un artisan" }]} />
          </div>
        </div>

        <VerifierClient faqItems={faqItems} />
      </div>
    </>
  )
}
