import { Metadata } from 'next'
import Breadcrumb from '@/components/Breadcrumb'
import JsonLd from '@/components/JsonLd'
import { getBreadcrumbSchema, getFAQSchema } from '@/lib/seo/jsonld'
import { SITE_URL, SITE_NAME } from '@/lib/seo/config'
import BadgeClient from './BadgeClient'

const canonicalUrl = `${SITE_URL}/badge-artisan`

export const metadata: Metadata = {
  title: `Badge Artisan Verifie — Affichez votre certification | ${SITE_NAME}`,
  description: `Generez votre badge "Artisan Verifie" ${SITE_NAME} et integrez-le sur votre site web. Renforcez votre credibilite, obtenez des backlinks SEO et attirez plus de clients. Gratuit et sans engagement.`,
  alternates: { canonical: canonicalUrl },
  openGraph: {
    locale: 'fr_FR',
    title: `Badge Artisan Verifie — Affichez votre certification | ${SITE_NAME}`,
    description: `Generez votre badge "Artisan Verifie" et integrez-le sur votre site web. Gratuit, personnalisable et compatible tous sites.`,
    url: canonicalUrl,
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: `Badge Artisan Verifie | ${SITE_NAME}`,
    description: `Generez votre badge "Artisan Verifie" et integrez-le sur votre site web. Gratuit et sans engagement.`,
  },
}

const faqItems = [
  {
    question: "Le badge est-il gratuit ?",
    answer: `Oui, le badge ${SITE_NAME} est 100 % gratuit, sans frais caches ni abonnement. Vous pouvez l'integrer sur autant de sites que vous le souhaitez.`,
  },
  {
    question: "Le badge ralentit-il mon site ?",
    answer: "Non, le badge est une simple image SVG de moins de 3 Ko. Il se charge instantanement et n'utilise aucun JavaScript, cookie ni tracker. C'est l'un des formats les plus legers possibles.",
  },
  {
    question: "Puis-je personnaliser le badge ?",
    answer: "Oui, vous pouvez choisir entre 3 styles (Clair, Sombre, Minimal). Si votre entreprise est referencee sur ServicesArtisans, le badge affiche automatiquement votre note, vos avis et votre statut de verification en temps reel.",
  },
  {
    question: "Comment ca marche sur WordPress ?",
    answer: "Copiez le code HTML genere, puis collez-le dans un bloc \"HTML personnalise\" sur votre page ou dans un widget de la barre laterale. C'est compatible avec Elementor, Divi, Gutenberg et tous les constructeurs de pages.",
  },
  {
    question: "Le badge ameliore-t-il mon referencement Google ?",
    answer: "Oui. Le badge inclut un lien vers votre fiche artisan sur ServicesArtisans.fr, ce qui constitue un backlink de qualite. C'est bon pour votre SEO et ca renforce votre presence en ligne.",
  },
  {
    question: "Les donnees du badge se mettent-elles a jour ?",
    answer: "Oui, si vous utilisez le badge dynamique (via \"Trouver ma fiche\"), votre note moyenne, nombre d'avis et statut de verification se mettent a jour automatiquement toutes les 24 heures.",
  },
  {
    question: "Que se passe-t-il si je desactive mon compte ?",
    answer: `Le badge continuera d'afficher les dernieres informations connues. Il restera visible sur votre site tant que vous ne retirez pas le code HTML. Vous pouvez le supprimer a tout moment.`,
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
              Badge Artisan Verifie
            </h1>
            <p className="text-xl text-slate-400 max-w-3xl mx-auto">
              Generez votre badge personnalise et integrez-le sur votre site web.
              Renforcez votre credibilite et obtenez un backlink SEO gratuit.
            </p>
          </div>
        </div>
      </section>

      {/* Badge configurator (client component) */}
      <BadgeClient faqItems={faqItems} />
    </div>
  )
}
