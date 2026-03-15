import { Metadata } from 'next'
import { SITE_URL } from '@/lib/seo/config'

export const metadata: Metadata = {
  title: 'Carrières | ServicesArtisans',
  description: 'Rejoignez l\'équipe ServicesArtisans. Découvrez nos offres d\'emploi.',
  alternates: { canonical: `${SITE_URL}/careers` },
  robots: { index: false, follow: true },
}

export default function CarrieresLayout({ children }: { children: React.ReactNode }) {
  return children
}
