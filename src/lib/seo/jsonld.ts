import { SITE_URL, SITE_NAME } from './config'
import { companyIdentity, isCompanyRegistered, getSocialLinks } from '@/lib/config/company-identity'

// Schema.org Organization
export function getOrganizationSchema() {
  const socialLinks = getSocialLinks()
  const registered = isCompanyRegistered()

  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${SITE_URL}#organization`,
    name: SITE_NAME,
    url: SITE_URL,
    logo: {
      '@type': 'ImageObject',
      url: `${SITE_URL}/icons/icon-512x512.png`,
      width: 512,
      height: 512,
    },
    description: 'Annuaire d\'artisans de France. Professionnels référencés via les données SIREN officielles dans 101 départements.',
    ...(socialLinks.length > 0 && { sameAs: socialLinks }),
    areaServed: {
      '@type': 'Country',
      name: 'France',
    },
    email: companyIdentity.email,
    contactPoint: {
      '@type': 'ContactPoint',
      url: `${SITE_URL}/contact`,
      contactType: 'customer service',
      availableLanguage: 'French',
      email: companyIdentity.email,
    },
    ...(registered && {
      legalName: companyIdentity.legalName,
      address: {
        '@type': 'PostalAddress',
        streetAddress: companyIdentity.address,
        addressCountry: 'FR',
      },
      telephone: companyIdentity.phone,
      foundingDate: companyIdentity.foundingDate,
      ...(companyIdentity.tvaIntracom && { vatID: companyIdentity.tvaIntracom }),
    }),
  }
}

// Schema.org WebSite with SearchAction
export function getWebsiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    alternateName: ['servicesartisans.fr'],
    url: SITE_URL,
    publisher: { '@id': `${SITE_URL}#organization` },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE_URL}/recherche?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  }
}

// Schema.org LocalBusiness for artisans
export function getLocalBusinessSchema(artisan: {
  name: string
  description: string
  address: string
  city: string
  postalCode: string
  phone?: string
  rating?: number
  reviewCount?: number
  services: string[]
  priceRange?: string
  url?: string
  image?: string
}) {
  const canonicalUrl = artisan.url || SITE_URL
  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': `${canonicalUrl}#business`,
    name: artisan.name,
    description: artisan.description,
    url: canonicalUrl,
    ...(artisan.image ? { image: artisan.image } : {}),
    address: {
      '@type': 'PostalAddress',
      streetAddress: artisan.address,
      addressLocality: artisan.city,
      postalCode: artisan.postalCode,
      addressCountry: 'FR',
    },
    telephone: artisan.phone,
    ...(artisan.priceRange ? { priceRange: artisan.priceRange } : {}),
    aggregateRating: (artisan.rating && artisan.reviewCount && artisan.reviewCount > 0)
      ? {
          '@type': 'AggregateRating',
          ratingValue: artisan.rating,
          reviewCount: artisan.reviewCount,
          bestRating: 5,
          worstRating: 1,
        }
      : undefined,
    makesOffer: artisan.services.map((service) => ({
      '@type': 'Offer',
      itemOffered: {
        '@type': 'Service',
        name: service,
      },
    })),
  }
}

// Schema.org Service
export function getServiceSchema(service: {
  name: string
  description: string
  provider?: string
  areaServed?: string
  category?: string
  image?: string
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: service.name,
    description: service.description,
    ...(service.image ? { image: service.image } : {}),
    provider: service.provider
      ? {
          '@type': 'Organization',
          name: service.provider,
        }
      : {
          '@type': 'Organization',
          name: SITE_NAME,
        },
    areaServed: service.areaServed
      ? {
          '@type': 'Place',
          name: service.areaServed,
        }
      : {
          '@type': 'Country',
          name: 'France',
        },
    serviceType: service.category || service.name,
  }
}

// Schema.org BreadcrumbList — Google-compliant format
// Last item = current page (no `item`), others use WebPage object with @id
export function getBreadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => {
      const isLast = index === items.length - 1
      return {
        '@type': 'ListItem',
        position: index + 1,
        name: item.name,
        ...(!isLast && {
          item: {
            '@type': 'WebPage',
            '@id': `${SITE_URL}${item.url}`,
            name: item.name,
          },
        }),
      }
    }),
  }
}

// Schema.org FAQPage
export function getFAQSchema(faqs: { question: string; answer: string }[]): Record<string, unknown> | null {
  if (!faqs || faqs.length === 0) return null
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
    speakable: {
      '@type': 'SpeakableSpecification',
      cssSelector: ['.faq-answer'],
    },
  }
}

// Schema.org Review
export function getReviewSchema(review: {
  author: string
  rating: number
  reviewBody: string
  datePublished: string
  itemReviewed: {
    name: string
    type: 'LocalBusiness' | 'Service'
  }
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Review',
    author: {
      '@type': 'Person',
      name: review.author,
    },
    reviewRating: {
      '@type': 'Rating',
      ratingValue: review.rating,
      bestRating: 5,
      worstRating: 1,
    },
    reviewBody: review.reviewBody,
    datePublished: review.datePublished,
    itemReviewed: {
      '@type': review.itemReviewed.type,
      name: review.itemReviewed.name,
    },
  }
}

// Schema.org HowTo (for "Comment ça marche" page)
export function getHowToSchema(steps: { name: string; text: string; image?: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: 'Comment trouver un artisan sur ServicesArtisans',
    description: 'Guide étape par étape pour trouver et contacter un artisan qualifié.',
    step: steps.map((step, index) => ({
      '@type': 'HowToStep',
      position: index + 1,
      name: step.name,
      text: step.text,
      image: step.image,
    })),
  }
}

// Schema.org ItemList (pour les pages de listing SEO programmatique style TripAdvisor)
export function getItemListSchema(params: {
  name: string
  description: string
  url: string
  items: Array<{
    name: string
    url: string
    position: number
    image?: string
    rating?: number
    reviewCount?: number
  }>
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: params.name,
    description: params.description,
    url: `${SITE_URL}${params.url}`,
    numberOfItems: params.items.length,
    itemListElement: params.items.map((item) => ({
      '@type': 'ListItem',
      position: item.position,
      item: {
        '@type': 'LocalBusiness',
        name: item.name,
        url: `${SITE_URL}${item.url}`,
        image: item.image,
        ...(item.rating && item.reviewCount && item.reviewCount > 0 && {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: item.rating,
            reviewCount: item.reviewCount,
          },
        }),
      },
    })),
  }
}

// Schema.org City/Place (pour pages villes)
export function getPlaceSchema(city: {
  name: string
  slug: string
  region?: string
  department?: string
  description?: string
  image?: string
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'City',
    name: city.name,
    url: `${SITE_URL}/villes/${city.slug}`,
    ...(city.image ? { image: city.image } : {}),
    description: city.description || `Trouvez des artisans qualifiés à ${city.name}`,
    containedInPlace: city.region
      ? {
          '@type': 'AdministrativeArea',
          name: city.region,
        }
      : undefined,
  }
}

// Schema.org CollectionPage (pour pages de catégories de services)
export function getCollectionPageSchema(params: {
  name: string
  description: string
  url: string
  itemCount: number
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: params.name,
    description: params.description,
    url: `${SITE_URL}${params.url}`,
    numberOfItems: params.itemCount,
    isPartOf: {
      '@type': 'WebSite',
      name: SITE_NAME,
      url: SITE_URL,
    },
  }
}

// Schema.org ProfessionalService (enhanced for artisans with booking)
export function getProfessionalServiceSchema(artisan: {
  id: string
  name: string
  description: string
  address?: string
  city: string
  postalCode?: string
  phone?: string
  email?: string
  rating?: number
  reviewCount?: number
  services: string[]
  priceRange?: string
  image?: string
  availableSlots?: { date: string; times: string[] }[]
  url?: string
}) {
  const canonicalUrl = artisan.url || SITE_URL
  return {
    '@context': 'https://schema.org',
    '@type': 'ProfessionalService',
    '@id': `${canonicalUrl}#professional-service`,
    name: artisan.name,
    description: artisan.description,
    url: canonicalUrl,
    image: artisan.image || `${SITE_URL}/opengraph-image`,
    address: {
      '@type': 'PostalAddress',
      addressLocality: artisan.city,
      postalCode: artisan.postalCode || '',
      addressCountry: 'FR',
    },
    telephone: artisan.phone,
    email: artisan.email,
    ...(artisan.priceRange ? { priceRange: artisan.priceRange } : {}),
    aggregateRating: (artisan.rating && artisan.reviewCount && artisan.reviewCount > 0)
      ? {
          '@type': 'AggregateRating',
          ratingValue: Number(artisan.rating.toFixed(1)),
          reviewCount: artisan.reviewCount,
          bestRating: 5,
          worstRating: 1,
        }
      : undefined,
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Services proposés',
      itemListElement: artisan.services.map((service, index) => ({
        '@type': 'Offer',
        '@id': `${canonicalUrl}#service-${index}`,
        itemOffered: {
          '@type': 'Service',
          name: service,
        },
      })),
    },
    potentialAction: {
      '@type': 'ReserveAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${canonicalUrl}#reserver`,
        actionPlatform: [
          'http://schema.org/DesktopWebPlatform',
          'http://schema.org/MobileWebPlatform',
        ],
      },
      result: {
        '@type': 'Reservation',
        name: 'Réservation de service',
      },
    },
  }
}
