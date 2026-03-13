import { Metadata } from 'next'
import JsonLd from '@/components/JsonLd'
import { getBreadcrumbSchema } from '@/lib/seo/jsonld'
import { SITE_URL } from '@/lib/seo/config'
import { faqCategories } from '@/lib/data/faq-data'
import FAQPageClient from './FAQPageClient'
import { getPageContent } from '@/lib/cms'
import { CmsContent } from '@/components/CmsContent'
import Breadcrumb from '@/components/Breadcrumb'

export const metadata: Metadata = {
  title: 'Questions fréquentes (FAQ)',
  description: 'Retrouvez les réponses aux questions les plus fréquentes sur ServicesArtisans : inscription, devis, fonctionnement de l\'annuaire d\'artisans.',
  alternates: {
    canonical: `${SITE_URL}/faq`,
  },
  openGraph: {
    title: 'Questions fréquentes (FAQ)',
    description: 'Retrouvez les réponses aux questions fréquentes sur ServicesArtisans.',
    url: `${SITE_URL}/faq`,
    type: 'website',
    images: [{ url: `${SITE_URL}/opengraph-image`, width: 1200, height: 630, alt: 'ServicesArtisans — FAQ' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Questions fréquentes (FAQ)',
    description: 'Retrouvez les réponses aux questions fréquentes sur ServicesArtisans.',
    images: [`${SITE_URL}/opengraph-image`],
  },
}

export const revalidate = 86400

const breadcrumbSchema = getBreadcrumbSchema([
  { name: 'Accueil', url: '/' },
  { name: 'FAQ', url: '/faq' },
])

// Build FAQPage JSON-LD schema from all FAQ categories
const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqCategories.flatMap((category) =>
    category.questions.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.a,
      },
    }))
  ),
}

export default async function FAQPage() {
  const cmsPage = await getPageContent('faq', 'faq')

  if (cmsPage?.content_html) {
    // If CMS has structured_data, build FAQ JSON-LD from it
    const cmsJsonLd = cmsPage.structured_data
      ? {
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: (cmsPage.structured_data as unknown as Array<{ categoryName: string; items: Array<{ question: string; answer: string }> }>).flatMap((cat) =>
            cat.items.map((item) => ({
              '@type': 'Question',
              name: item.question,
              acceptedAnswer: { '@type': 'Answer', text: item.answer },
            }))
          ),
        }
      : faqJsonLd

    return (
      <div className="min-h-screen bg-gray-50">
        <JsonLd data={[cmsJsonLd, breadcrumbSchema]} />
        <section className="bg-white border-b">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <Breadcrumb items={[{ label: 'FAQ' }]} className="mb-4" />
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
    <>
      <JsonLd data={[faqJsonLd, breadcrumbSchema]} />
      <FAQPageClient />
    </>
  )
}
