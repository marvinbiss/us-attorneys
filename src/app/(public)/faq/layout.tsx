import { Metadata } from 'next'
import JsonLd from '@/components/JsonLd'
import { getBreadcrumbSchema } from '@/lib/seo/jsonld'
import { SITE_URL } from '@/lib/seo/config'

export const metadata: Metadata = {
  title: 'FAQ - Questions fréquentes | ServicesArtisans',
  description: 'Trouvez les réponses à vos questions sur ServicesArtisans. Comment demander un devis, choisir un artisan, garanties et plus.',
  alternates: {
    canonical: `${SITE_URL}/faq`,
  },
  openGraph: {
    title: 'FAQ - Questions fréquentes | ServicesArtisans',
    description: 'Trouvez les réponses à vos questions sur ServicesArtisans.',
    url: `${SITE_URL}/faq`,
  },
  robots: {
    index: true,
    follow: true,
    'max-snippet': -1,
    'max-image-preview': 'large',
    'max-video-preview': -1,
  },
}

export default function FAQLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const breadcrumbSchema = getBreadcrumbSchema([
    { name: 'Accueil', url: '/' },
    { name: 'FAQ', url: '/faq' },
  ])

  return (
    <>
      <JsonLd data={breadcrumbSchema} />
      {children}
    </>
  )
}
