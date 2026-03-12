import { Metadata } from 'next'
import Breadcrumb from '@/components/Breadcrumb'
import JsonLd from '@/components/JsonLd'
import { getBreadcrumbSchema, getFAQSchema } from '@/lib/seo/jsonld'
import { SITE_URL, SITE_NAME } from '@/lib/seo/config'
import BadgeClient from './BadgeClient'

const canonicalUrl = `${SITE_URL}/badge-artisan`

export const metadata: Metadata = {
  title: `Badge Artisan Vérifié — Votre certification`,
  description: `Générez votre badge "Artisan Vérifié" ${SITE_NAME} et intégrez-le sur votre site web. Renforcez votre crédibilité, obtenez des backlinks SEO et attirez plus de clients. Gratuit et sans engagement.`,
  alternates: { canonical: canonicalUrl },
  openGraph: {
    locale: 'fr_FR',
    title: `Badge Artisan Vérifié — Votre certification`,
    description: `Générez votre badge "Artisan Vérifié" et intégrez-le sur votre site web. Gratuit, personnalisable et compatible tous sites.`,
    url: canonicalUrl,
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: `Badge Artisan Vérifié | ${SITE_NAME}`,
    description: `Générez votre badge "Artisan Vérifié" et intégrez-le sur votre site web. Gratuit et sans engagement.`,
  },
}

const faqItems = [
  {
    question: "Le badge est-il gratuit ?",
    answer: `Oui, le badge ${SITE_NAME} est 100 % gratuit, sans frais cachés ni abonnement. Vous pouvez l'intégrer sur autant de sites que vous le souhaitez.`,
  },
  {
    question: "Le badge ralentit-il mon site ?",
    answer: "Non, le badge est une simple image SVG de moins de 3 Ko. Il se charge instantanément et n'utilise aucun JavaScript, cookie ni tracker. C'est l'un des formats les plus légers possibles.",
  },
  {
    question: "Puis-je personnaliser le badge ?",
    answer: "Oui, vous pouvez choisir entre 3 styles (Clair, Sombre, Minimal). Si votre entreprise est référencée sur ServicesArtisans, le badge affiche automatiquement votre note, vos avis et votre statut de vérification en temps réel.",
  },
  {
    question: "Comment ça marche sur WordPress ?",
    answer: "Copiez le code HTML généré, puis collez-le dans un bloc \"HTML personnalisé\" sur votre page ou dans un widget de la barre latérale. C'est compatible avec Elementor, Divi, Gutenberg et tous les constructeurs de pages.",
  },
  {
    question: "Le badge améliore-t-il mon référencement Google ?",
    answer: "Oui. Le badge inclut un lien vers votre fiche artisan sur ServicesArtisans.fr, ce qui constitue un backlink de qualité. C'est bon pour votre SEO et ça renforce votre présence en ligne.",
  },
  {
    question: "Les données du badge se mettent-elles à jour ?",
    answer: "Oui, si vous utilisez le badge dynamique (via \"Trouver ma fiche\"), votre note moyenne, nombre d'avis et statut de vérification se mettent à jour automatiquement toutes les 24 heures.",
  },
  {
    question: "Que se passe-t-il si je désactive mon compte ?",
    answer: `Le badge continuera d'afficher les dernières informations connues. Il restera visible sur votre site tant que vous ne retirez pas le code HTML. Vous pouvez le supprimer à tout moment.`,
  },
]

export default function BadgeArtisanPage() {
  const breadcrumbSchema = getBreadcrumbSchema([
    { name: 'Accueil', url: '/' },
    { name: 'Badge Artisan', url: '/badge-artisan' },
  ])

  const faqSchema = getFAQSchema(
    faqItems.map((f) => ({ question: f.question, answer: f.answer }))
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <JsonLd data={[breadcrumbSchema, faqSchema]} />

      {/* Hero */}
      <section className="relative bg-[#0a0f1e] text-white overflow-hidden">
        <div className="absolute inset-0">
          <div
            className="absolute inset-0"
            style={{
              background:
                'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(37,99,235,0.18) 0%, transparent 60%), radial-gradient(ellipse 60% 60% at 80% 110%, rgba(37,99,235,0.1) 0%, transparent 50%)',
            }}
          />
          <div
            className="absolute inset-0 opacity-[0.025]"
            style={{
              backgroundImage:
                'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
              backgroundSize: '64px 64px',
            }}
          />
          <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-gray-50 to-transparent" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-28 md:pt-14 md:pb-36">
          <Breadcrumb
            items={[{ label: 'Badge Artisan' }]}
            className="mb-6 text-slate-400 [&_a]:text-slate-400 [&_a:hover]:text-white [&_svg]:text-slate-600"
          />
          <div className="text-center">
            <h1 className="font-heading text-4xl md:text-5xl font-extrabold mb-6 tracking-[-0.025em]">
              Badge Artisan Vérifié
            </h1>
            <p className="text-xl text-slate-400 max-w-3xl mx-auto">
              Générez votre badge personnalisé et intégrez-le sur votre site web.
              Renforcez votre crédibilité et obtenez un backlink SEO gratuit.
            </p>
          </div>
        </div>
      </section>

      {/* Badge configurator (client component) */}
      <BadgeClient faqItems={faqItems} />
    </div>
  )
}
