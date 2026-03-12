import { Metadata } from "next"
import JsonLd from "@/components/JsonLd"
import { getBreadcrumbSchema } from "@/lib/seo/jsonld"
import { SITE_URL, SITE_NAME } from "@/lib/seo/config"
import Breadcrumb from "@/components/Breadcrumb"
import VerifierClient from "./VerifierClient"

export const metadata: Metadata = {
  title: "Vérifier un Artisan — SIRET, RGE et Fiabilité",
  description:
    "Vérifiez gratuitement un artisan en 30 secondes. Entrez son numéro SIRET pour confirmer son existence légale, son activité et sa fiabilité. Outil de vérification gratuit.",
  keywords: [
    "vérifier artisan",
    "vérifier SIRET artisan",
    "artisan fiable",
    "vérification SIRET",
    "vérifier entreprise artisan",
    "SIRET artisan",
    "artisan de confiance",
    "vérification artisan gratuit",
  ],
  alternates: {
    canonical: `${SITE_URL}/verifier-artisan`,
  },
  openGraph: {
    title: "Vérifier un Artisan — SIRET, RGE, Fiabilité",
    description:
      "Vérifiez gratuitement un artisan en 30 secondes. Entrez son numéro SIRET pour confirmer son existence légale et sa fiabilité.",
    url: `${SITE_URL}/verifier-artisan`,
    type: "website",
    siteName: SITE_NAME,
    images: [
      {
        url: `${SITE_URL}/opengraph-image`,
        width: 1200,
        height: 630,
        alt: "ServicesArtisans — Vérifier un artisan",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Vérifier un Artisan — SIRET, RGE, Fiabilité",
    description:
      "Vérifiez gratuitement un artisan en 30 secondes. Outil de vérification SIRET gratuit.",
    images: [`${SITE_URL}/opengraph-image`],
  },
}

const breadcrumbSchema = getBreadcrumbSchema([
  { name: "Accueil", url: "/" },
  { name: "Vérifier un artisan", url: "/verifier-artisan" },
])

const faqItems = [
  {
    question: "Qu'est-ce qu'un numéro SIRET ?",
    answer:
      "Le numéro SIRET (Système d'Identification du Répertoire des Établissements) est un identifiant unique de 14 chiffres attribué par l'INSEE à chaque établissement d'une entreprise en France. Il est composé du SIREN (9 chiffres identifiant l'entreprise) et du NIC (5 chiffres identifiant l'établissement). Tout artisan exerçant légalement doit en posséder un.",
  },
  {
    question: "Comment trouver le SIRET d'un artisan ?",
    answer:
      "Vous pouvez trouver le SIRET d'un artisan de plusieurs façons : sur ses devis et factures (obligation légale d'y faire figurer le SIRET), sur sa carte de visite professionnelle, en lui demandant directement, ou en effectuant une recherche sur societe.com ou infogreffe.fr avec le nom de l'entreprise.",
  },
  {
    question: "Un artisan est-il obligé d'avoir un SIRET ?",
    answer:
      "Oui, tout artisan exerçant une activité professionnelle en France doit obligatoirement être immatriculé et posséder un numéro SIRET. C'est une obligation légale. Un artisan sans SIRET exerce illégalement (travail dissimulé). Vérifiez toujours ce numéro avant de confier des travaux.",
  },
  {
    question: "Que faire si le SIRET est invalide ?",
    answer:
      "Si le SIRET d'un artisan est invalide ou introuvable, c'est un signal d'alerte majeur. Ne confiez pas de travaux à cette personne. Vous pouvez signaler la situation à la DGCCRF (Direction générale de la concurrence) ou à l'URSSAF. Privilégiez toujours des artisans dont le SIRET est vérifiable.",
  },
  {
    question: "La vérification est-elle gratuite ?",
    answer:
      "Oui, notre outil de vérification de SIRET est 100% gratuit et sans inscription. Il utilise les données publiques officielles de l'INSEE pour vous fournir des informations fiables sur n'importe quelle entreprise artisanale en France.",
  },
  {
    question: "Quelles autres vérifications faire avant d'engager un artisan ?",
    answer:
      "Au-delà du SIRET, vérifiez : l'attestation d'assurance responsabilité civile professionnelle (obligatoire), la garantie décennale (obligatoire pour les travaux de construction), les qualifications RGE si vous souhaitez bénéficier d'aides de l'État, les avis clients sur plusieurs plateformes, et demandez toujours plusieurs devis comparatifs.",
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
  name: "Vérificateur d'artisan",
  url: `${SITE_URL}/verifier-artisan`,
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  description:
    "Outil gratuit de vérification de SIRET pour artisans. Vérifiez instantanément la fiabilité d'un artisan.",
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
            <Breadcrumb items={[{ label: "Vérifier un artisan" }]} />
          </div>
        </div>

        <VerifierClient faqItems={faqItems} />
      </div>
    </>
  )
}
