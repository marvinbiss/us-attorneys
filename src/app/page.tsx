import { Metadata } from 'next'
import { SITE_URL } from '@/lib/seo/config'
import { PopularCitiesLinks, PopularServicesLinks, PopularServiceCityLinks, GeographicNavigation } from '@/components/InternalLinks'
import { GeographicSectionWrapper } from '@/components/home/GeographicSectionWrapper'
import { ClayHomePage } from '@/components/home/ClayHomePage'
import { getPageContent } from '@/lib/cms'
import { CmsContent } from '@/components/CmsContent'
import { getSiteStats, getHomepageData, formatProviderCount } from '@/lib/data/stats'
import { getFAQSchema, getItemListSchema } from '@/lib/seo/jsonld'
import { faqItems } from '@/lib/data/faq-data'
import { popularServices } from '@/lib/constants/navigation'

export const revalidate = 3600 // Rafraîchit les stats toutes les heures

export async function generateMetadata(): Promise<Metadata> {
  const { artisanCount: count } = await getSiteStats()
  const countStr = count > 0 ? `${formatProviderCount(count)}+` : 'Des milliers d\''
  return {
    title: `ServicesArtisans — ${countStr} artisans référencés en France`,
    description:
      `Annuaire d'artisans de France basé sur les données SIREN officielles. ${countStr} professionnels référencés, 101 départements couverts. Comparez les avis, obtenez des devis gratuits. Plombiers, électriciens, menuisiers et plus.`,
    alternates: { canonical: SITE_URL },
    openGraph: {
      title: `ServicesArtisans — ${countStr} artisans référencés en France`,
      description:
        `Annuaire d'artisans de France basé sur les données SIREN officielles. ${countStr} professionnels référencés dans 101 départements. Devis gratuits.`,
      type: 'website',
      url: SITE_URL,
      images: [{ url: `${SITE_URL}/opengraph-image`, width: 1200, height: 630, alt: 'ServicesArtisans — Annuaire des artisans en France' }],
    },
    twitter: {
      card: 'summary_large_image',
      title: `ServicesArtisans — ${countStr} artisans référencés en France`,
      description:
        `Annuaire d'artisans de France basé sur les données SIREN officielles. ${countStr} professionnels référencés dans 101 départements. Devis gratuits.`,
      images: [`${SITE_URL}/opengraph-image`],
    },
  }
}

export default async function HomePage() {
  const [cmsPage, homepageData] = await Promise.all([
    getPageContent('homepage', 'homepage'),
    getHomepageData(),
  ])

  if (cmsPage?.content_html) {
    return (
      <div className="min-h-screen">
        <h1 className="sr-only">
          {cmsPage.title || "L'annuaire des artisans qualifiés en France"}
        </h1>
        <section className="py-12">
          <div className="max-w-6xl mx-auto px-4">
            <CmsContent html={cmsPage.content_html} />
          </div>
        </section>
      </div>
    )
  }

  // JSON-LD structured data for homepage
  const faqSchema = getFAQSchema(faqItems)
  const itemListSchema = getItemListSchema({
    name: 'Services artisans populaires en France',
    description: 'Les métiers du bâtiment les plus recherchés sur ServicesArtisans',
    url: '/services',
    items: popularServices.map((s, i) => ({
      name: s.name,
      url: `/services/${s.slug}`,
      position: i + 1,
    })),
  })
  const aggregateRatingSchema = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: 'ServicesArtisans',
    url: SITE_URL,
    serviceType: 'Annuaire d\'artisans',
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: homepageData.avgRating,
      reviewCount: homepageData.reviewCount,
      bestRating: 5,
      worstRating: 1,
    },
  }

  return (
    <div className="min-h-screen">
      {/* Homepage-specific JSON-LD: FAQ + ItemList + AggregateRating */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([faqSchema, itemListSchema, aggregateRatingSchema].filter(Boolean))
            .replace(/</g, '\\u003c')
            .replace(/>/g, '\\u003e')
            .replace(/&/g, '\\u0026'),
        }}
      />

      {/* Server-rendered H1 for SEO — visually hidden, ClayHomePage shows the visible version */}
      <h1 className="sr-only">
        L&apos;annuaire des artisans qualifi&eacute;s en France
      </h1>

      {/* ─── CLAY HOMEPAGE DESIGN ─────────────────────────────── */}
      <ClayHomePage
        stats={homepageData}
        serviceCounts={homepageData.serviceCounts}
        topProviders={homepageData.topProviders}
        recentReviews={homepageData.recentReviews}
      />

      {/* ─── GEOGRAPHIC COVERAGE ──────────────────────────────── */}
      <section className="py-16 bg-sand-200">
        <div className="max-w-6xl mx-auto px-4">
          <GeographicSectionWrapper>
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 text-clay-400 rounded-full text-sm font-medium mb-5" style={{ background: '#FDF1EC' }}>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></svg>
                Couverture nationale
              </div>
              <h2 className="font-heading text-2xl md:text-3xl font-bold text-stone-900 mb-2 text-center tracking-tight">
                Artisans partout en France
              </h2>
              <p className="text-stone-500 text-center max-w-lg mx-auto">
                Trouvez des professionnels dans votre r&eacute;gion, d&eacute;partement ou ville.
              </p>
            </div>
            <GeographicNavigation />
          </GeographicSectionWrapper>
        </div>
      </section>

      {/* ─── POPULAR LINKS (SEO) ──────────────────────────────── */}
      <section className="py-16 bg-slate-50 border-t border-slate-100">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-12">
            <PopularServicesLinks showTitle limit={8} />
            <PopularCitiesLinks showTitle limit={10} />
            <PopularServiceCityLinks showTitle limit={12} />
          </div>
        </div>
      </section>
    </div>
  )
}
