import { Metadata } from 'next'
import { permanentRedirect } from 'next/navigation'
import { SITE_URL } from '@/lib/seo/config'

export const metadata: Metadata = {
  title: 'Attorney Pricing Guide — How Much Do Lawyers Cost?',
  description:
    'Compare attorney fees across all practice areas. Hourly rates, flat fees, contingency arrangements, and cost-saving tips.',
  alternates: { canonical: `${SITE_URL}/attorney-pricing` },
}

export default function Page() {
  permanentRedirect('/pricing')
}
