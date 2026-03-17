import { Metadata } from 'next'
import { permanentRedirect } from 'next/navigation'
import { SITE_URL } from '@/lib/seo/config'

export async function generateMetadata({
  params,
}: {
  params: { service: string; city: string }
}): Promise<Metadata> {
  const serviceName = params.service
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
  const cityName = params.city
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
  return {
    title: `${serviceName} Attorney Fees in ${cityName} | Pricing Guide`,
    description: `How much does a ${serviceName.toLowerCase()} lawyer cost in ${cityName}? Compare local hourly rates, flat fees, and payment options.`,
    alternates: {
      canonical: `${SITE_URL}/attorney-pricing/${params.service}/${params.city}`,
    },
  }
}

export default function Page({ params }: { params: { service: string; city: string } }) {
  permanentRedirect(`/pricing/${params.service}/${params.city}`)
}
