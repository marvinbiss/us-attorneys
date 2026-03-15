import { Metadata } from 'next'
import { SITE_URL } from '@/lib/seo/config'

export const metadata: Metadata = {
  title: 'Careers | US Attorneys',
  description: 'Join the US Attorneys team. Discover our job openings.',
  alternates: { canonical: `${SITE_URL}/careers` },
  robots: { index: false, follow: true },
}

export default function CarrieresLayout({ children }: { children: React.ReactNode }) {
  return children
}
