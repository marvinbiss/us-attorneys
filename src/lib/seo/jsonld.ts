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
    description: 'Find experienced attorneys across all 50 states. Compare ratings, read reviews, and connect with qualified lawyers for your legal needs.',
    ...(socialLinks.length > 0 && { sameAs: socialLinks }),
    areaServed: {
      '@type': 'Country',
      name: 'United States',
    },
    email: companyIdentity.email,
    contactPoint: {
      '@type': 'ContactPoint',
      url: `${SITE_URL}/contact`,
      contactType: 'customer service',
      availableLanguage: 'English',
      email: companyIdentity.email,
      ...(companyIdentity.phone && { telephone: companyIdentity.phone }),
    },
    ...(registered && {
      legalName: companyIdentity.legalName,
      address: {
        '@type': 'PostalAddress',
        streetAddress: companyIdentity.address,
        addressCountry: 'US',
      },
      telephone: companyIdentity.phone,
      foundingDate: companyIdentity.foundingDate,
      ...(companyIdentity.taxId && { vatID: companyIdentity.taxId }),
    }),
  }
}

// Schema.org WebSite with SearchAction
export function getWebsiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    alternateName: ['us-attorneys.com'],
    url: SITE_URL,
    publisher: { '@id': `${SITE_URL}#organization` },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE_URL}/search?q={search_term_string}`,
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
          name: 'United States',
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

/**
 * Generate programmatic FAQ items for practice area hub pages.
 * These supplement the editorial FAQs from trade-content with high-intent
 * questions that match common Google search patterns.
 */
export function getPracticeAreaFAQItems(practiceAreaName: string, opts?: {
  priceRange?: { min: number; max: number; unit: string }
  attorneyCount?: number
  cityCount?: number
}): { question: string; answer: string }[] {
  const paLower = practiceAreaName.toLowerCase()
  const faqs: { question: string; answer: string }[] = [
    {
      question: `What does a ${paLower} lawyer do?`,
      answer: `A ${paLower} lawyer specializes in legal matters related to ${paLower}. They advise clients on their rights, represent them in negotiations and court proceedings, draft legal documents, and work to achieve the best possible outcome for their case. Most ${paLower} attorneys offer a free initial consultation to evaluate your situation.`,
    },
    {
      question: `How much does a ${paLower} attorney cost?`,
      answer: opts?.priceRange
        ? `${practiceAreaName} attorney fees typically range from $${opts.priceRange.min} to $${opts.priceRange.max} ${opts.priceRange.unit}. Actual costs depend on case complexity, the attorney's experience, and your location. Many ${paLower} attorneys offer free consultations and some work on contingency (you pay only if you win).`
        : `${practiceAreaName} attorney fees vary based on case complexity, experience level, and location. Many ${paLower} lawyers offer free initial consultations, and some work on contingency — meaning you only pay if you win your case. Request quotes from multiple attorneys to compare rates.`,
    },
    {
      question: `When should I hire a ${paLower} lawyer?`,
      answer: `You should consult a ${paLower} attorney as soon as you become aware of a legal issue in this area. Early legal advice can protect your rights, preserve evidence, and prevent costly mistakes. Most ${paLower} lawyers offer free consultations, so there is no cost to getting an initial assessment of your situation.`,
    },
    {
      question: `How do I choose the best ${paLower} attorney?`,
      answer: `When selecting a ${paLower} attorney, consider their experience with cases similar to yours, their bar standing and credentials, client reviews, fee structure, and communication style. Verify they are licensed in your state and check for any disciplinary history with the state bar association.${opts?.attorneyCount ? ` US Attorneys lists ${opts.attorneyCount.toLocaleString('en-US')} verified ${paLower} attorneys` : ''} to help you compare and choose.`,
    },
  ]

  return faqs
}

/**
 * Generate programmatic FAQ items for state attorney pages.
 * Targets high-volume "lawyers in [state]" search queries.
 */
export function getStateFAQItems(stateName: string, stateCode: string, opts?: {
  attorneyCount?: number
  cityCount?: number
  barAssociationUrl?: string
}): { question: string; answer: string }[] {
  const faqs: { question: string; answer: string }[] = [
    {
      question: `How do I find a lawyer in ${stateName}?`,
      answer: `You can find a lawyer in ${stateName} by searching our directory of bar-verified attorneys. Filter by practice area, city, reviews, and fees to find the right match. ${opts?.attorneyCount ? `We list ${opts.attorneyCount.toLocaleString('en-US')} verified attorneys across ${stateName}.` : `All listed attorneys are verified through the ${stateName} State Bar.`} You can also request a free consultation directly through our platform.`,
    },
    {
      question: `What are the bar requirements in ${stateName}?`,
      answer: `To practice law in ${stateName} (${stateCode}), attorneys must pass the ${stateName} Bar Exam, meet character and fitness requirements, and be admitted to the ${stateName} State Bar. All attorneys listed on US Attorneys have been verified against official bar records.${opts?.barAssociationUrl ? ` You can verify any attorney's status directly at the ${stateName} State Bar website.` : ''}`,
    },
    {
      question: `How much do lawyers charge in ${stateName}?`,
      answer: `Attorney fees in ${stateName} vary widely depending on the practice area, case complexity, and the lawyer's experience. Hourly rates in ${stateName} typically range from $150 to $500+ per hour. Many attorneys offer free initial consultations, and some practice areas (like personal injury) commonly use contingency fee arrangements where you pay nothing unless you win.`,
    },
    {
      question: `Can I get a free legal consultation in ${stateName}?`,
      answer: `Yes, many attorneys in ${stateName} offer free initial consultations. This allows you to discuss your legal issue, understand your options, and evaluate whether the attorney is a good fit — all at no cost. You can request free consultations from multiple ${stateName} attorneys through US Attorneys to compare before making a decision.`,
    },
    {
      question: `What types of lawyers are available in ${stateName}?`,
      answer: `${stateName} attorneys cover all major practice areas including personal injury, criminal defense, family law, immigration, estate planning, business law, employment law, real estate, bankruptcy, and more.${opts?.cityCount ? ` Our directory covers attorneys across ${opts.cityCount} cities in ${stateName}.` : ''} You can search by practice area to find a specialist for your specific legal need.`,
    },
  ]

  return faqs
}

// Schema.org HowTo (for "How it works" page and problem pages)
export function getHowToSchema(
  steps: { name: string; text: string; image?: string }[],
  options?: { name?: string; description?: string }
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: options?.name ?? 'How to find an attorney on US Attorneys',
    description: options?.description ?? 'Step-by-step guide to finding and contacting a qualified attorney.',
    step: steps.map((step, index) => ({
      '@type': 'HowToStep',
      position: index + 1,
      name: step.name,
      text: step.text,
      image: step.image,
    })),
  }
}

// Schema.org ItemList (for programmatic SEO listing pages)
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
        '@type': 'ProfessionalService',
        name: item.name,
        url: `${SITE_URL}${item.url}`,
        image: item.image,
      },
    })),
  }
}

// Schema.org City/Place (for city pages)
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
    url: `${SITE_URL}/cities/${city.slug}`,
    ...(city.image ? { image: city.image } : {}),
    description: city.description || `Find qualified attorneys in ${city.name}`,
    ...(city.region ? {
      containedInPlace: {
        '@type': 'AdministrativeArea',
        name: city.region,
      },
    } : {}),
  }
}

// Schema.org CollectionPage (for service category pages)
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

// Schema.org Product + AggregateOffer (rich snippets with prices in SERP)
export function getServicePricingSchema(params: {
  specialtyName: string
  specialtySlug: string
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
  const now = new Date()
  const dateModified = now.toISOString().split('T')[0]
  const priceValidUntil = `${now.getFullYear()}-12-31`

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: params.location
      ? `${params.specialtyName} in ${params.location} — Pricing`
      : `${params.specialtyName} — Pricing USA`,
    description: params.description,
    url: params.url,
    dateModified,
    brand: {
      '@type': 'Organization',
      name: 'US Attorneys',
    },
    offers: {
      '@type': 'AggregateOffer',
      lowPrice: params.lowPrice,
      highPrice: params.highPrice,
      priceCurrency: params.priceCurrency || 'USD',
      ...(params.priceUnit && { unitText: params.priceUnit }),
      ...(params.offerCount && { offerCount: params.offerCount }),
      availability: 'https://schema.org/InStock',
      priceValidUntil,
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

// Schema.org LegalService (for attorney listing pages by specialty + location)
export function getLegalServiceSchema(params: {
  specialtyName: string
  specialtySlug: string
  location: string
  state: string
  stateCode: string
  description: string
  attorneyCount: number
  url: string
  avgRating?: number
  reviewCount?: number
  priceRange?: string
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'LegalService',
    name: `${params.specialtyName} in ${params.location}`,
    description: params.description,
    url: params.url,
    areaServed: {
      '@type': 'City',
      name: params.location,
      containedInPlace: {
        '@type': 'State',
        name: params.state,
        identifier: params.stateCode,
      },
    },
    serviceType: params.specialtyName,
    provider: {
      '@type': 'Organization',
      name: SITE_NAME,
      url: SITE_URL,
    },
    numberOfItems: params.attorneyCount,
    ...(params.avgRating && params.reviewCount && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: params.avgRating,
        reviewCount: params.reviewCount,
        bestRating: 5,
        worstRating: 1,
      },
    }),
    ...(params.priceRange && { priceRange: params.priceRange }),
    availableChannel: {
      '@type': 'ServiceChannel',
      serviceUrl: params.url,
      serviceType: 'Free Consultation',
    },
  }
}

// Schema.org Attorney + Person (for individual attorney profile pages)
// Outputs a @graph with both Attorney (LocalBusiness) and Person entities
export function getAttorneySchema(params: {
  name: string
  firstName?: string
  lastName?: string
  url: string
  image?: string
  description: string
  specialty: string
  practiceAreas?: string[]
  location: string
  state: string
  streetAddress?: string
  postalCode?: string
  barNumber?: string
  barState?: string
  rating?: number
  reviewCount?: number
  phone?: string
  email?: string
  firmName?: string
  languages?: string[]
  priceRange?: string
  website?: string
  latitude?: number
  longitude?: number
  // Enrichment fields (migration 429)
  education?: { institution: string; degree: string; graduationYear?: number | null }[]
  awards?: string[]
  barAdmissions?: { state: string; barNumber: string }[]
}) {
  const attorneyEntity = {
    '@type': ['Attorney', 'LegalService'],
    '@id': `${params.url}#business`,
    name: params.name,
    url: params.url,
    description: params.description,
    ...(params.image && { image: params.image }),
    address: {
      '@type': 'PostalAddress',
      ...(params.streetAddress && { streetAddress: params.streetAddress }),
      addressLocality: params.location,
      addressRegion: params.state,
      ...(params.postalCode && { postalCode: params.postalCode }),
      addressCountry: 'US',
    },
    ...(params.latitude && params.longitude && {
      geo: {
        '@type': 'GeoCoordinates',
        latitude: params.latitude,
        longitude: params.longitude,
      },
    }),
    ...(params.phone && { telephone: params.phone }),
    ...(params.email && { email: params.email }),
    ...(params.website && { sameAs: [params.website] }),
    // Practice areas as knowsAbout for E-E-A-T
    knowsAbout: [
      params.specialty,
      ...(params.practiceAreas || []),
    ].filter((v, i, arr) => v && arr.indexOf(v) === i),
    ...(params.barNumber && {
      identifier: {
        '@type': 'PropertyValue',
        name: 'Bar Number',
        value: params.barNumber,
      },
      hasCredential: {
        '@type': 'EducationalOccupationalCredential',
        credentialCategory: 'Bar Admission',
        recognizedBy: {
          '@type': 'Organization',
          name: `${params.barState || params.state} State Bar`,
        },
        identifier: params.barNumber,
      },
    }),
    ...(params.rating && params.reviewCount && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: params.rating,
        reviewCount: params.reviewCount,
        bestRating: 5,
        worstRating: 1,
      },
    }),
    areaServed: {
      '@type': 'AdministrativeArea',
      name: params.state,
    },
    priceRange: params.priceRange || '$$',
    employee: { '@id': `${params.url}#person` },
    ...(params.firmName && {
      parentOrganization: {
        '@type': 'LegalService',
        name: params.firmName,
      },
    }),
    potentialAction: {
      '@type': 'CommunicateAction',
      target: `${params.url}#consultation`,
      name: 'Request a free consultation',
    },
  }

  const personEntity = {
    '@type': 'Person',
    '@id': `${params.url}#person`,
    name: params.name,
    ...(params.firstName && { givenName: params.firstName }),
    ...(params.lastName && { familyName: params.lastName }),
    jobTitle: `${params.specialty} Attorney`,
    description: params.description,
    url: params.url,
    ...(params.image && { image: params.image }),
    knowsAbout: [
      params.specialty,
      ...(params.practiceAreas || []),
    ].filter((v, i, arr) => v && arr.indexOf(v) === i),
    ...(params.phone && { telephone: params.phone }),
    ...(params.email && { email: params.email }),
    ...(params.website && { sameAs: [params.website] }),
    address: {
      '@type': 'PostalAddress',
      addressLocality: params.location,
      addressRegion: params.state,
      addressCountry: 'US',
    },
    // hasCredential: bar admissions (primary + additional)
    ...(() => {
      const credentials: Record<string, unknown>[] = []
      // Primary bar admission
      if (params.barNumber) {
        credentials.push({
          '@type': 'EducationalOccupationalCredential',
          credentialCategory: 'Bar Admission',
          recognizedBy: {
            '@type': 'Organization',
            name: `${params.barState || params.state} State Bar`,
          },
          identifier: params.barNumber,
        })
      }
      // Additional bar admissions from enrichment
      if (params.barAdmissions && params.barAdmissions.length > 0) {
        for (const ba of params.barAdmissions) {
          // Skip if same as primary
          if (ba.barNumber === params.barNumber && ba.state === (params.barState || params.state)) continue
          credentials.push({
            '@type': 'EducationalOccupationalCredential',
            credentialCategory: 'Bar Admission',
            recognizedBy: {
              '@type': 'Organization',
              name: `${ba.state} State Bar`,
            },
            identifier: ba.barNumber,
          })
        }
      }
      return credentials.length > 0
        ? { hasCredential: credentials.length === 1 ? credentials[0] : credentials }
        : {}
    })(),
    // alumniOf: education records from enrichment (migration 429)
    ...(params.education && params.education.length > 0 && {
      alumniOf: params.education.map(edu => ({
        '@type': 'EducationalOrganization',
        name: edu.institution,
        ...(edu.degree && {
          hasCredential: {
            '@type': 'EducationalOccupationalCredential',
            credentialCategory: edu.degree,
            ...(edu.graduationYear && { dateCreated: `${edu.graduationYear}` }),
          },
        }),
      })),
    }),
    // award: professional recognitions from enrichment (migration 429)
    ...(params.awards && params.awards.length > 0 && {
      award: params.awards,
    }),
    ...(params.languages && params.languages.length > 0 && {
      knowsLanguage: params.languages.map(lang => ({
        '@type': 'Language',
        name: lang,
      })),
    }),
    areaServed: {
      '@type': 'AdministrativeArea',
      name: params.state,
    },
    worksFor: { '@id': `${params.url}#business` },
    ...(params.rating && params.reviewCount && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: params.rating,
        reviewCount: params.reviewCount,
        bestRating: 5,
        worstRating: 1,
      },
    }),
  }

  return {
    '@context': 'https://schema.org',
    '@graph': [attorneyEntity, personEntity],
  }
}

// Schema.org ReviewPage (for review listing pages)
export function getReviewPageSchema(params: {
  specialtyName: string
  location: string
  url: string
  reviews: { author: string; rating: number; text: string; date: string }[]
  avgRating: number
  totalReviews: number
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: `${params.specialtyName} Reviews in ${params.location}`,
    url: params.url,
    mainEntity: {
      '@type': 'LegalService',
      name: `${params.specialtyName} in ${params.location}`,
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: params.avgRating,
        reviewCount: params.totalReviews,
        bestRating: 5,
        worstRating: 1,
      },
      review: params.reviews.slice(0, 10).map(review => ({
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
        reviewBody: review.text,
        datePublished: review.date,
      })),
    },
  }
}

// Schema.org CostGuide (for pricing/cost pages — extends ServicePricing)
export function getCostGuideSchema(params: {
  specialtyName: string
  location: string
  state: string
  url: string
  feeTypes: { type: string; range: string; description: string }[]
  lastUpdated: string
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: `${params.specialtyName} Cost Guide — ${params.location}, ${params.state}`,
    url: params.url,
    dateModified: params.lastUpdated,
    mainEntity: {
      '@type': 'Service',
      name: `${params.specialtyName} in ${params.location}`,
      areaServed: {
        '@type': 'City',
        name: params.location,
        containedInPlace: {
          '@type': 'State',
          name: params.state,
        },
      },
      hasOfferCatalog: {
        '@type': 'OfferCatalog',
        name: `${params.specialtyName} Fee Types`,
        itemListElement: params.feeTypes.map((fee, index) => ({
          '@type': 'OfferCatalog',
          position: index + 1,
          name: fee.type,
          description: `${fee.description}. Typical range: ${fee.range}`,
        })),
      },
      provider: {
        '@type': 'Organization',
        name: SITE_NAME,
        url: SITE_URL,
      },
    },
    speakable: {
      '@type': 'SpeakableSpecification',
      cssSelector: ['h1', '.cost-summary', '[data-speakable="true"]'],
    },
  }
}

// Schema.org EmergencyService (for /emergency/ pages)
export function getEmergencyServiceSchema(params: {
  specialtyName: string
  location: string
  url: string
  available24h: boolean
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'LegalService',
    name: `Emergency ${params.specialtyName} in ${params.location}`,
    url: params.url,
    areaServed: {
      '@type': 'City',
      name: params.location,
    },
    serviceType: `Emergency ${params.specialtyName}`,
    isAvailableGenerically: true,
    ...(params.available24h && {
      hoursAvailable: {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: [
          'Monday', 'Tuesday', 'Wednesday', 'Thursday',
          'Friday', 'Saturday', 'Sunday',
        ],
        opens: '00:00',
        closes: '23:59',
      },
    }),
    provider: {
      '@type': 'Organization',
      name: SITE_NAME,
      url: SITE_URL,
    },
    potentialAction: {
      '@type': 'CommunicateAction',
      name: 'Request Emergency Consultation',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: params.url,
        actionPlatform: [
          'http://schema.org/DesktopWebPlatform',
          'http://schema.org/MobileWebPlatform',
        ],
      },
    },
    additionalType: 'http://schema.org/EmergencyService',
  }
}

