import { Metadata } from 'next'
import { permanentRedirect } from 'next/navigation'
import { SITE_URL } from '@/lib/seo/config'

export const metadata: Metadata = {
  title: 'Legal Cost Calculator — Estimate Attorney Fees',
  description:
    'Estimate your legal costs with our free calculator. Get personalized fee estimates based on practice area, location, and case complexity.',
  alternates: { canonical: `${SITE_URL}/calculator` },
}

export default function Page() {
  permanentRedirect('/tools/calculator')
}
