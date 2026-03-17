import React from 'react'
import { Review, getDisplayName } from './types'
import type { LegacyAttorney } from '@/types/legacy'
import { slugify, getAttorneyUrl } from '@/lib/utils'
import { companyIdentity, getSocialLinks } from '@/lib/config/company-identity'

interface AttorneySchemaProps {
  attorney: LegacyAttorney
  reviews: Review[]
}

export function AttorneySchema({ attorney, reviews }: AttorneySchemaProps) {
  const displayName = getDisplayName(attorney)
  const baseUrl = companyIdentity.url

  // Organization Schema for US Attorneys platform
  const organizationSchema = {
    '@type': 'Organization',
    '@id': `${baseUrl}#organization`,
    name: 'US Attorneys',
    url: baseUrl,
    logo: {
      '@type': 'ImageObject',
      url: `${baseUrl}/icons/icon-512x512.png`,
      width: 512,
      height: 512,
    },
    description: 'Platform connecting individuals with qualified attorneys across the United States',
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      availableLanguage: ['English'],
      url: `${baseUrl}/contact`,
      ...(companyIdentity.phone && { telephone: companyIdentity.phone }),
    },
    ...(getSocialLinks().length > 0 && { sameAs: getSocialLinks() }),
  }

  const attorneyUrl = `${baseUrl}${getAttorneyUrl(attorney)}`

  // Individual Service Schemas for each service offered
  const serviceSchemas = attorney.service_prices.map((service, index) => ({
    '@type': 'Service',
    '@id': `${attorneyUrl}#service-${index}`,
    name: service.name,
    description: service.description || `${service.name} by ${displayName}`,
    provider: {
      '@type': 'LocalBusiness',
      '@id': `${attorneyUrl}#business`,
      name: displayName,
    },
    areaServed: {
      '@type': 'City',
      name: attorney.city,
      ...(attorney.region && { containedInPlace: { '@type': 'AdministrativeArea', name: attorney.region } }),
    },
    ...(() => {
      if (!service.price) return {}
      const numericPrice = service.price.replace(/[^0-9]/g, '')
      if (!numericPrice || numericPrice === '0' || /quotes/i.test(service.price)) return {}
      return {
        offers: {
          '@type': 'Offer',
          price: numericPrice,
          priceCurrency: 'USD',
          availability: attorney.accepts_new_clients ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
        },
      }
    })(),
    ...(service.duration && {
      estimatedDuration: service.duration,
    }),
    serviceType: attorney.specialty,
    termsOfService: `${baseUrl}/terms`,
  }))

  // Attorney Schema — use Schema.org Attorney type (subtype of LegalService)
  // This enables Google rich snippets for attorney profiles (ratings, specialties)
  const localBusinessSchema = {
    '@type': ['Attorney', 'LegalService'],
    '@id': `${attorneyUrl}#business`,
    name: displayName,
    description: attorney.description || `${displayName} - ${attorney.specialty} in ${attorney.city}`,
    image: attorney.portfolio?.[0]?.imageUrl || `${baseUrl}/opengraph-image`,
    // Add knowsAbout for E-E-A-T signals — array of practice areas for rich snippets
    knowsAbout: [
      attorney.specialty,
      ...(attorney.services || []),
      ...attorney.service_prices.map(sp => sp.name),
    ].filter((v, i, arr) => v && arr.indexOf(v) === i),
    ...(attorney.phone && attorney.phone.replace(/\D/g, '').length >= 10 && {
      telephone: attorney.phone,
    }),
    ...(attorney.email && { email: attorney.email }),
    url: attorneyUrl,
    parentOrganization: {
      '@type': 'Organization',
      '@id': `${baseUrl}#organization`,
      name: 'US Attorneys',
    },

    address: {
      '@type': 'PostalAddress',
      ...(attorney.address ? { streetAddress: attorney.address } : {}),
      addressLocality: attorney.city,
      ...(attorney.region || attorney.department ? { addressRegion: attorney.region || attorney.department } : {}),
      postalCode: attorney.postal_code,
      addressCountry: 'US',
    },

    ...(attorney.latitude && attorney.longitude && {
      geo: {
        '@type': 'GeoCoordinates',
        latitude: attorney.latitude,
        longitude: attorney.longitude,
      },
    }),

    ...(reviews.length > 0 ? {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: Number((reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)),
        reviewCount: reviews.length,
        bestRating: 5,
        worstRating: 1,
      },
    } : {}),

    ...((() => {
      const validReviews = reviews.filter(r => r.comment && r.comment.trim().length > 0).slice(0, 5)
      return validReviews.length > 0 ? {
        review: validReviews.map(r => ({
          '@type': 'Review',
          author: { '@type': 'Person', name: r.author },
          ...(r.dateISO || r.date ? { datePublished: r.dateISO || r.date } : {}),
          reviewRating: {
            '@type': 'Rating',
            ratingValue: r.rating,
            bestRating: 5,
            worstRating: 1,
          },
          reviewBody: r.comment,
          itemReviewed: {
            '@type': 'LocalBusiness',
            '@id': `${attorneyUrl}#business`,
            name: displayName,
          },
        })),
      } : {}
    })()),

    ...(attorney.service_prices.length > 0 && {
      hasOfferCatalog: {
        '@type': 'OfferCatalog',
        name: 'Services',
        itemListElement: attorney.service_prices.map((s, _i) => ({
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: s.name,
            description: s.description,
          },
          ...(() => {
            if (!s.price) return {}
            const numericPrice = s.price.replace(/[^0-9]/g, '')
            if (!numericPrice || numericPrice === '0' || /quotes/i.test(s.price)) return {}
            return {
              priceSpecification: {
                '@type': 'PriceSpecification',
                price: numericPrice,
                priceCurrency: 'USD',
              },
            }
          })(),
        })),
      },
    }),

    ...(attorney.intervention_radius_km && attorney.latitude && attorney.longitude && {
      areaServed: {
        '@type': 'GeoCircle',
        geoMidpoint: {
          '@type': 'GeoCoordinates',
          latitude: attorney.latitude,
          longitude: attorney.longitude,
        },
        geoRadius: attorney.intervention_radius_km * 1000,
      },
    }),

    ...(attorney.siret && {
      identifier: {
        '@type': 'PropertyValue',
        name: 'barNumber',
        value: attorney.siret,
      },
    }),

    ...(attorney.website && {
      sameAs: [attorney.website],
    }),

    // Additional SEO-friendly properties
    ...(attorney.creation_date ? { foundingDate: attorney.creation_date } : {}),
    priceRange: '$$',
    currenciesAccepted: 'USD',

    // Opening hours for Google Knowledge Panel
    // DB-bound: French keys from database (opening_hours JSONB column in Supabase)
    ...(attorney.opening_hours && Object.keys(attorney.opening_hours).length > 0 && {
      openingHoursSpecification: (() => {
        const dayMap: Record<string, string> = {
          lundi: 'Monday', mardi: 'Tuesday', mercredi: 'Wednesday',
          jeudi: 'Thursday', vendredi: 'Friday', samedi: 'Saturday', dimanche: 'Sunday',
        }
        return Object.entries(attorney.opening_hours)
          .filter(([, val]: [string, any]) => val?.ouvert)
          .map(([day, val]: [string, any]) => ({
            '@type': 'OpeningHoursSpecification',
            dayOfWeek: dayMap[day] || day,
            opens: val.debut || '08:00',
            closes: val.fin || '18:00',
          }))
      })(),
    }),

    // Quote request action for rich results
    potentialAction: {
      '@type': 'CommunicateAction',
      target: `${attorneyUrl}#consultation`,
      name: 'Request a free consultation',
    },
  }

  // FAQPage Schema
  const faqSchema = attorney.faq && attorney.faq.length > 0 ? {
    '@type': 'FAQPage',
    mainEntity: attorney.faq.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  } : null

  // BreadcrumbList Schema — 5 levels matching visible breadcrumb
  // Structure: Home > Practice Areas > {Service} > {City} > {Attorney name}
  const specialtySlug = slugify(attorney.specialty)
  const citySlug = slugify(attorney.city)
  const breadcrumbItems = [
    { name: 'Home', item: baseUrl },
    { name: 'Practice Areas', item: `${baseUrl}/services` },
    { name: attorney.specialty, item: `${baseUrl}/practice-areas/${specialtySlug}` },
    { name: attorney.city, item: `${baseUrl}/practice-areas/${specialtySlug}/${citySlug}` },
    { name: displayName, item: '' },
  ]

  const breadcrumbSchema = {
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbItems.map((item, index) => {
      const isLast = index === breadcrumbItems.length - 1
      return {
        '@type': 'ListItem',
        position: index + 1,
        name: item.name,
        ...(!isLast && item.item ? {
          item: {
            '@type': 'WebPage',
            '@id': item.item,
            name: item.name,
          },
        } : {}),
      }
    }),
  }

  // ProfilePage Schema (wraps the attorney profile)
  const profilePageSchema = {
    '@type': 'ProfilePage',
    '@id': `${attorneyUrl}#profile`,
    mainEntity: { '@id': `${attorneyUrl}#business` },
    ...(attorney.member_since && {
      dateCreated: `${attorney.member_since}-01-01`,
    }),
    ...(attorney.updated_at ? {
      dateModified: new Date(attorney.updated_at).toISOString(),
    } : {}),
  }

  // Combined schema graph for better SEO (single JSON-LD with @graph)
  const combinedSchema = {
    '@context': 'https://schema.org',
    '@graph': [
      organizationSchema,
      profilePageSchema,
      localBusinessSchema,
      breadcrumbSchema,
      ...(faqSchema ? [faqSchema] : []),
      ...serviceSchemas,
    ],
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(combinedSchema, null, 0)
            .replace(/</g, '\\u003c')
            .replace(/>/g, '\\u003e')
        }}
      />
    </>
  )
}
