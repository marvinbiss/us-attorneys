import { Metadata } from "next"
import JsonLd from "@/components/JsonLd"
import { getBreadcrumbSchema, getFAQSchema } from "@/lib/seo/jsonld"
import { SITE_URL, SITE_NAME } from "@/lib/seo/config"
import CalculateurClient from "./CalculateurClient"

export const metadata: Metadata = {
  title: "Calculateur de Prix Travaux 2026 — Estimez le Coût de vos Travaux",
  description:
    "Estimez gratuitement le coût de vos travaux en quelques clics. Plomberie, électricité, peinture, rénovation... Prix ajustés par région et surface. Devis gratuit.",
  alternates: {
    canonical: `${SITE_URL}/calculateur`,
  },
  openGraph: {
    title: "Calculateur de Prix Travaux 2026 — Estimez le Coût de vos Travaux",
    description:
      "Estimez gratuitement le coût de vos travaux en quelques clics. Prix ajustés par région et surface.",
    url: `${SITE_URL}/calculateur`,
    siteName: SITE_NAME,
    type: "website",
    locale: "fr_FR",
  },
}

const breadcrumbSchema = getBreadcrumbSchema([
  { name: "Accueil", url: SITE_URL },
  { name: "Calculateur de prix", url: `${SITE_URL}/calculateur` },
])

const faqSchema = getFAQSchema([
  {
    question: "Comment fonctionne le calculateur de prix travaux ?",
    answer:
      "Notre calculateur estime le coût de vos travaux en 4 étapes : vous sélectionnez le type de travaux, la nature de l'intervention, la surface concernée et votre ville. Le prix est calculé en fonction des tarifs moyens du marché, ajustés selon votre région et l'ampleur du chantier.",
  },
  {
    question: "Les prix affichés sont-ils garantis ?",
    answer:
      "Les prix affichés sont des estimations basées sur les tarifs moyens constatés en France en 2026. Le coût réel peut varier selon l'artisan, la complexité du chantier, les matériaux choisis et les conditions d'accès. Demandez toujours un devis détaillé à un professionnel pour obtenir un prix ferme.",
  },
  {
    question: "Pourquoi les prix varient-ils selon la région ?",
    answer:
      "Les tarifs des artisans varient selon la région en raison du coût de la vie, de la densité de professionnels disponibles et de la demande locale. L'Île-de-France et la Côte d'Azur affichent des tarifs 15 à 25 % supérieurs à la moyenne nationale, tandis que certaines régions sont 5 à 10 % en dessous.",
  },
  {
    question: "Le calculateur prend-il en compte la TVA ?",
    answer:
      "Oui, les résultats incluent une estimation de la TVA. Pour les travaux de rénovation dans un logement de plus de 2 ans, la TVA réduite à 10 % s'applique sur la main-d'oeuvre et les matériaux fournis par l'artisan. Pour les travaux d'amélioration énergétique, la TVA peut être de 5,5 %.",
  },
  {
    question: "Comment obtenir un devis précis après l'estimation ?",
    answer:
      "Après avoir obtenu votre estimation, cliquez sur \"Demander un devis gratuit\" pour être mis en relation avec des artisans qualifiés de votre ville. Vous recevrez jusqu'à 3 devis détaillés et personnalisés, sans engagement de votre part.",
  },
])

export default function CalculateurPage() {
  return (
    <>
      <JsonLd data={[breadcrumbSchema, faqSchema]} />
      <CalculateurClient />
    </>
  )
}
