import { Metadata } from 'next'
import { SITE_URL } from '@/lib/seo/config'

export const metadata: Metadata = {
  title: 'Demander un devis gratuit | ServicesArtisans',
  description: 'Demandez un devis gratuit et recevez jusqu\'à 3 propositions d\'artisans qualifiés près de chez vous. Service 100% gratuit et sans engagement.',
  alternates: {
    canonical: `${SITE_URL}/quotes`,
  },
  openGraph: {
    title: 'Demander un devis gratuit | ServicesArtisans',
    description: 'Recevez jusqu\'à 3 devis d\'artisans qualifiés. Gratuit et sans engagement.',
    url: `${SITE_URL}/quotes`,
  },
  robots: {
    index: true,
    follow: true,
    'max-snippet': -1,
    'max-image-preview': 'large',
    'max-video-preview': -1,
  },
}

export default function DevisLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
