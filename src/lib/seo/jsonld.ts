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
      ...(companyIdentity.phone && { telephone: companyIdentity.phone }),
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
          item: `${SITE_URL}${item.url}`,
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
  }
}

// Schema.org HowTo (for "Comment ça marche" page and problem pages)
export function getHowToSchema(
  steps: { name: string; text: string; image?: string }[],
  options?: { name?: string; description?: string }
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: options?.name ?? 'Comment trouver un artisan sur ServicesArtisans',
    description: options?.description ?? 'Guide étape par étape pour trouver et contacter un artisan qualifié.',
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
        priceRange: '€€',
        ...(item.rating && item.reviewCount && item.reviewCount > 0 && {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: item.rating,
            reviewCount: item.reviewCount,
            bestRating: 5,
            worstRating: 1,
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
    ...(city.region ? {
      containedInPlace: {
        '@type': 'AdministrativeArea',
        name: city.region,
      },
    } : {}),
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
      ...(artisan.postalCode ? { postalCode: artisan.postalCode } : {}),
      addressCountry: 'FR',
    },
    ...(artisan.phone ? { telephone: artisan.phone } : {}),
    ...(artisan.email ? { email: artisan.email } : {}),
    ...(artisan.priceRange ? { priceRange: artisan.priceRange } : {}),
    ...((artisan.rating && artisan.reviewCount && artisan.reviewCount > 0) ? {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: Number(artisan.rating.toFixed(1)),
        reviewCount: artisan.reviewCount,
        bestRating: 5,
        worstRating: 1,
      },
    } : {}),
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

// Schema.org Product + AggregateOffer (rich snippets with prices in SERP)
export function getServicePricingSchema(params: {
  serviceName: string
  serviceSlug: string
  description: string
  lowPrice: number
  highPrice: number
  priceCurrency?: string
  priceUnit?: string
  offerCount?: number
  ratingValue?: number
  reviewCount?: number
  location?: string
  url: string
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: params.location
      ? `${params.serviceName} à ${params.location} — Tarifs`
      : `${params.serviceName} — Tarifs France`,
    description: params.description,
    url: params.url,
    brand: {
      '@type': 'Organization',
      name: 'ServicesArtisans',
    },
    offers: {
      '@type': 'AggregateOffer',
      lowPrice: params.lowPrice,
      highPrice: params.highPrice,
      priceCurrency: params.priceCurrency || 'EUR',
      ...(params.priceUnit && { unitText: params.priceUnit }),
      ...(params.offerCount && { offerCount: params.offerCount }),
      availability: 'https://schema.org/InStock',
    },
    ...(params.ratingValue && params.reviewCount && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: params.ratingValue,
        reviewCount: params.reviewCount,
        bestRating: 5,
        worstRating: 1,
      },
    }),
    review: {
      '@type': 'Review',
      reviewRating: {
        '@type': 'Rating',
        ratingValue: params.ratingValue || 4.7,
        bestRating: 5,
      },
      author: {
        '@type': 'Organization',
        name: 'ServicesArtisans',
      },
      reviewBody: params.location
        ? `Tarifs ${params.serviceName.toLowerCase()} à ${params.location} vérifiés et mis à jour régulièrement par ServicesArtisans.`
        : `Tarifs ${params.serviceName.toLowerCase()} en France vérifiés et mis à jour régulièrement par ServicesArtisans.`,
    },
  }
}

// Schema.org Offer for individual service tasks with price specifications
export function getTaskOfferSchema(params: {
  taskName: string
  lowPrice: number
  highPrice: number
  priceCurrency?: string
  serviceName: string
  url: string
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Offer',
    itemOffered: {
      '@type': 'Service',
      name: params.taskName,
      provider: {
        '@type': 'Organization',
        name: 'ServicesArtisans',
      },
    },
    priceSpecification: {
      '@type': 'PriceSpecification',
      minPrice: params.lowPrice,
      maxPrice: params.highPrice,
      priceCurrency: params.priceCurrency || 'EUR',
    },
    url: params.url,
    availability: 'https://schema.org/InStock',
  }
}

// Schema.org SpeakableSpecification (voice AI optimization)
export function getSpeakableSchema(params: {
  url: string
  title: string
  speakableCssSelectors?: string[]
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: params.title,
    url: params.url,
    speakable: {
      '@type': 'SpeakableSpecification',
      cssSelector: params.speakableCssSelectors || [
        'h1',
        '[data-speakable="true"]',
        '.speakable-summary',
      ],
    },
  }
}

// Schema.org QAPage (single question with accepted answer — distinct from FAQPage)
export function getQAPageSchema(params: {
  question: string
  answer: string
  url: string
  dateCreated?: string
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'QAPage',
    mainEntity: {
      '@type': 'Question',
      name: params.question,
      text: params.question,
      answerCount: 1,
      ...(params.dateCreated && { dateCreated: params.dateCreated }),
      acceptedAnswer: {
        '@type': 'Answer',
        text: params.answer,
        url: params.url,
      },
    },
  }
}

// Schema.org FAQPage with SpeakableSpecification (voice AI optimization for FAQ pages)
export function getSpeakableFAQSchema(params: {
  url: string
  title: string
  description: string
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    name: params.title,
    url: params.url,
    description: params.description,
    speakable: {
      '@type': 'SpeakableSpecification',
      cssSelector: ['h1', '.faq-question', '.faq-answer', '[data-speakable="true"]'],
    },
  }
}
