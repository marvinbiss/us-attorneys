export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://lawtendr.com').trim().replace(/\/+$/, '')
export const SITE_NAME = 'US Attorneys'
export const PHONE_NUMBER = '(800) 555-0199'
export const PHONE_TEL = 'tel:+18005550199'

// Spanish SEO configuration
export const SPANISH_SEO_CONFIG = {
  siteName: 'US Attorneys — Abogados en EE.UU.',
  titleTemplate: '%s | US Attorneys',
  defaultTitle: 'US Attorneys — Encuentra Abogados Verificados en EE.UU.',
  description: 'Directorio de abogados verificados en Estados Unidos. Compara perfiles, lee opiniones y solicita una consulta gratis.',
  locale: 'es_US',
}

// SEO configuration object
export const defaultSEOConfig = {
  titleTemplate: '%s | US Attorneys',
  defaultTitle: 'US Attorneys — Find Top-Rated Lawyers Near You',
  description:
    'Find experienced attorneys across all 50 states. Compare ratings, read reviews, and connect with qualified lawyers for your legal needs.',
  canonical: SITE_URL,
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: SITE_URL,
    siteName: SITE_NAME,
    images: [
      {
        url: `${SITE_URL}/opengraph-image`,
        width: 1200,
        height: 630,
        alt: 'US Attorneys - Find Top-Rated Lawyers Near You',
      },
    ],
  },
  twitter: {
    handle: '@usattorneys',
    site: '@usattorneys',
    cardType: 'summary_large_image',
  },
  additionalMetaTags: [
    {
      name: 'viewport',
      content: 'width=device-width, initial-scale=1',
    },
    {
      name: 'theme-color',
      content: '#2563eb',
    },
    {
      name: 'apple-mobile-web-app-capable',
      content: 'yes',
    },
    {
      name: 'apple-mobile-web-app-status-bar-style',
      content: 'default',
    },
    {
      httpEquiv: 'x-ua-compatible',
      content: 'IE=edge',
    },
  ],
  additionalLinkTags: [
    {
      rel: 'icon',
      href: '/favicon.ico',
    },
    {
      rel: 'apple-touch-icon',
      href: '/apple-touch-icon.png',
      sizes: '180x180',
    },
    {
      rel: 'manifest',
      href: '/manifest.json',
    },
  ],
}

// SEO for practice area pages
export function getServiceSEO(specialtyName: string, location?: string) {
  const title = location
    ? `${specialtyName} in ${location} — Find Attorneys & Free Consultation`
    : `${specialtyName} Attorneys — Licensed Lawyers Across All 50 States`

  const description = location
    ? `Find a ${specialtyName.toLowerCase()} attorney in ${location} from thousands of licensed professionals. Compare profiles, read reviews, and request a free consultation.`
    : `Directory of ${specialtyName.toLowerCase()} attorneys across all 50 states. Licensed professionals verified by bar number. Free search, no obligation.`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
    },
  }
}

// SEO for location pages
export function getLocationSEO(locationType: 'city' | 'state' | 'county', locationName: string) {
  const titles: Record<string, string> = {
    city: `Attorneys in ${locationName} — Licensed Lawyers Directory`,
    state: `Attorneys in ${locationName} — All Practice Areas`,
    county: `Attorneys in ${locationName} County — Directory & Free Consultations`,
  }

  const descriptions: Record<string, string> = {
    city: `Complete directory of attorneys in ${locationName}. Thousands of licensed professionals: personal injury, criminal defense, family law and more. 100% free.`,
    state: `Find an attorney in ${locationName} from thousands of licensed professionals. All practice areas, all counties covered.`,
    county: `Licensed attorneys in ${locationName} County. 75 practice areas covered. Free search, no obligation.`,
  }

  return {
    title: titles[locationType],
    description: descriptions[locationType],
    openGraph: {
      title: titles[locationType],
      description: descriptions[locationType],
    },
  }
}

// SEO for attorney profiles
export function getAttorneySEO(attorneyName: string, service: string, location: string, rating?: number) {
  const title = `${attorneyName} — ${service} Attorney in ${location}`
  const description = rating
    ? `${attorneyName}, ${service.toLowerCase()} attorney in ${location}. Rating: ${rating}/5. Bar-verified professional. View profile and request a free consultation.`
    : `${attorneyName}, ${service.toLowerCase()} attorney in ${location}. Bar-verified professional. Contact info, profile, and free consultation.`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'profile',
    },
  }
}
