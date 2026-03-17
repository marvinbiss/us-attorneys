import { Metadata } from 'next'
import { permanentRedirect } from 'next/navigation'
import { SITE_URL } from '@/lib/seo/config'

export async function generateMetadata({
  params,
}: {
  params: { service: string }
}): Promise<Metadata> {
  const name = params.service
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
  const title = `${name} Attorney Fees & Costs | Pricing Guide`
  const description = `How much does a ${name.toLowerCase()} lawyer cost? Compare hourly rates, flat fees, and payment options across the US.`
  return {
    title,
    description,
    alternates: { canonical: `${SITE_URL}/attorney-pricing/${params.service}` },
    openGraph: {
      title,
      description,
    },
  }
}

export default function Page({ params }: { params: { service: string } }) {
  permanentRedirect(`/pricing/${params.service}`)
}
