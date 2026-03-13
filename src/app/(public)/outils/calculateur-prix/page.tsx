import { Metadata } from 'next'
import Breadcrumb from '@/components/Breadcrumb'
import JsonLd from '@/components/JsonLd'
import { getBreadcrumbSchema } from '@/lib/seo/jsonld'
import { SITE_URL } from '@/lib/seo/config'
import { tradeContent } from '@/lib/data/trade-content'
import { services } from '@/lib/data/france'
import CalculateurClient from './CalculateurClient'

export const revalidate = 86400

export const metadata: Metadata = {
  title: 'Calculateur de prix artisan 2026 — Estimez vos travaux',
  description:
    'Estimez le coût de vos travaux en quelques clics : prix plombier, tarif électricien, coût serrurier, devis peintre et tous les métiers du bâtiment. Calculateur gratuit avec prix actualisés 2026.',
  alternates: {
    canonical: `${SITE_URL}/outils/calculateur-prix`,
  },
  robots: {
    index: true,
    follow: true,
    'max-snippet': -1,
    'max-image-preview': 'large',
    'max-video-preview': -1,
  },
  openGraph: {
    title: 'Calculateur de prix artisan 2026 — Estimez vos travaux',
    description:
      'Estimez le coût de vos travaux en quelques clics. Prix plombier, tarif électricien, coût serrurier. Calculateur gratuit.',
    url: `${SITE_URL}/outils/calculateur-prix`,
    type: 'website',
    locale: 'fr_FR',
    images: [
      {
        url: `${SITE_URL}/opengraph-image`,
        width: 1200,
        height: 630,
        alt: 'ServicesArtisans — Calculateur de prix artisan',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Calculateur de prix artisan 2026 — Estimez vos travaux',
    description:
      'Estimez le coût de vos travaux en quelques clics. Prix plombier, tarif électricien, coût serrurier.',
    images: [`${SITE_URL}/opengraph-image`],
  },
}

export default function CalculateurPrixPage() {
  const breadcrumbSchema = getBreadcrumbSchema([
    { name: 'Accueil', url: '/' },
    { name: 'Outils', url: '/outils/calculateur-prix' },
    { name: 'Calculateur de prix', url: '/outils/calculateur-prix' },
  ])

  // HowTo schema for the 3 steps
  const howToSchema = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: 'Comment estimer le prix de vos travaux',
    description:
      'Utilisez notre calculateur pour estimer le coût de vos travaux en 3 étapes simples.',
    step: [
      {
        '@type': 'HowToStep',
        position: 1,
        name: 'Choisissez un métier',
        text: 'Sélectionnez le type d’artisan dont vous avez besoin parmi 10 corps de métier : plombier, électricien, serrurier, chauffagiste, peintre, etc.',
      },
      {
        '@type': 'HowToStep',
        position: 2,
        name: 'Sélectionnez une prestation',
        text: 'Choisissez la prestation souhaitée parmi les interventions courantes du métier sélectionné pour obtenir un prix précis.',
      },
      {
        '@type': 'HowToStep',
        position: 3,
        name: 'Obtenez votre estimation',
        text: 'Consultez la fourchette de prix estimée, les conseils pratiques et trouvez un artisan qualifié près de chez vous.',
      },
    ],
  }

  // FAQPage schema — aggregate FAQ from all trades (first 2 questions from top 5 trades)
  const topTradeSlugs = ['plombier', 'electricien', 'serrurier', 'chauffagiste', 'peintre-en-batiment']
  const faqItems = topTradeSlugs.flatMap((slug) => {
    const trade = tradeContent[slug]
    if (!trade) return []
    return trade.faq.slice(0, 2).map((f) => ({
      '@type': 'Question' as const,
      name: f.q,
      acceptedAnswer: {
        '@type': 'Answer' as const,
        text: f.a,
      },
    }))
  })

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqItems,
  }

  // Serialize trade content for client component (only what's needed)
  const clientTradeContent: Record<string, {
    slug: string
    name: string
    priceRange: { min: number; max: number; unit: string }
    commonTasks: string[]
    tips: string[]
    faq: { q: string; a: string }[]
  }> = {}

  for (const [key, trade] of Object.entries(tradeContent)) {
    clientTradeContent[key] = {
      slug: trade.slug,
      name: trade.name,
      priceRange: trade.priceRange,
      commonTasks: trade.commonTasks,
      tips: trade.tips,
      faq: trade.faq,
    }
  }

  return (
    <>
      <JsonLd data={[breadcrumbSchema, howToSchema, faqSchema]} />

      <div className="min-h-screen bg-gray-50">
        {/* Hero */}
        <section className="relative bg-[#0a0f1e] text-white overflow-hidden">
          <div className="absolute inset-0">
            <div
              className="absolute inset-0"
              style={{
                background:
                  'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(37,99,235,0.18) 0%, transparent 60%), radial-gradient(ellipse 60% 60% at 80% 110%, rgba(37,99,235,0.1) 0%, transparent 50%), radial-gradient(ellipse 50% 40% at 10% 90%, rgba(59,130,246,0.06) 0%, transparent 50%)',
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
              items={[
                { label: 'Outils' },
                { label: 'Calculateur de prix' },
              ]}
              className="mb-6 text-slate-400 [&_a]:text-slate-400 [&_a:hover]:text-white [&_svg]:text-slate-600"
            />
            <div className="text-center">
              <h1 className="font-heading text-4xl md:text-5xl font-extrabold mb-6 tracking-[-0.025em]">
                Calculateur de prix artisan 2026
              </h1>
              <p className="text-xl text-slate-400 max-w-3xl mx-auto mb-4">
                Estimez le co&ucirc;t de vos travaux en quelques clics.
                Tarifs actualis&eacute;s pour {Object.keys(tradeContent).length} m&eacute;tiers du b&acirc;timent.
              </p>
            </div>
          </div>
        </section>

        {/* Calculator */}
        <section className="py-12 sm:py-16 -mt-16 relative z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <CalculateurClient
              services={services}
              tradeContent={clientTradeContent}
            />
          </div>
        </section>

        {/* How it works */}
        <section className="py-16 bg-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
              Comment fonctionne le calculateur ?
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center p-6">
                <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-blue-600">1</span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Choisissez un m&eacute;tier</h3>
                <p className="text-gray-600 text-sm">
                  S&eacute;lectionnez parmi 10 corps de m&eacute;tier : plombier, &eacute;lectricien, serrurier, peintre et plus.
                </p>
              </div>
              <div className="text-center p-6">
                <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-blue-600">2</span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">S&eacute;lectionnez une prestation</h3>
                <p className="text-gray-600 text-sm">
                  Choisissez l&apos;intervention souhait&eacute;e pour obtenir une estimation pr&eacute;cise du co&ucirc;t.
                </p>
              </div>
              <div className="text-center p-6">
                <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-blue-600">3</span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Obtenez votre estimation</h3>
                <p className="text-gray-600 text-sm">
                  Consultez la fourchette de prix, les conseils pratiques et trouvez un artisan qualifi&eacute;.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  )
}
