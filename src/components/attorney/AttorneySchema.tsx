import React from 'react'
import { Review, getDisplayName } from './types'
import type { LegacyArtisan } from '@/types/legacy'
import { slugify, getAttorneyUrl } from '@/lib/utils'
import { companyIdentity, getSocialLinks } from '@/lib/config/company-identity'

interface AttorneySchemaProps {
  artisan: LegacyArtisan
  reviews: Review[]
}

export function AttorneySchema({ artisan, reviews }: AttorneySchemaProps) {
  const displayName = getDisplayName(artisan)
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

  const attorneyUrl = `${baseUrl}${getAttorneyUrl(artisan)}`

  // Individual Service Schemas for each service offered
  const serviceSchemas = artisan.service_prices.map((service, index) => ({
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
      name: artisan.city,
      ...(artisan.region && { containedInPlace: { '@type': 'AdministrativeArea', name: artisan.region } }),
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
          availability: artisan.accepts_new_clients ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
        },
      }
    })(),
    ...(service.duration && {
      estimatedDuration: service.duration,
    }),
    serviceType: artisan.specialty,
    termsOfService: `${baseUrl}/terms`,
  }))

  // LocalBusiness Schema — use more specific @type when possible for richer snippets
  const businessType = artisan.specialty?.toLowerCase().includes('plomb') ? 'Plumber'
    : artisan.specialty?.toLowerCase().includes('electr') ? 'Electrician'
    : 'HomeAndConstructionBusiness'

  const localBusinessSchema = {
    '@type': ['LocalBusiness', businessType],
    '@id': `${attorneyUrl}#business`,
    name: displayName,
    description: artisan.description || `${displayName} - ${artisan.specialty} in ${artisan.city}`,
    image: artisan.portfolio?.[0]?.imageUrl || `${baseUrl}/opengraph-image`,
    // Add knowsAbout for E-E-A-T signals
    knowsAbout: artisan.specialty,
    ...(artisan.phone && artisan.phone.replace(/\D/g, '').length >= 10 && {
      telephone: artisan.phone,
    }),
    ...(artisan.email && { email: artisan.email }),
    url: attorneyUrl,
    parentOrganization: {
      '@type': 'Organization',
      '@id': `${baseUrl}#organization`,
      name: 'US Attorneys',
    },

    address: {
      '@type': 'PostalAddress',
      ...(artisan.address ? { streetAddress: artisan.address } : {}),
      addressLocality: artisan.city,
      ...(artisan.region || artisan.department ? { addressRegion: artisan.region || artisan.department } : {}),
      postalCode: artisan.postal_code,
      addressCountry: 'US',
    },

    ...(artisan.latitude && artisan.longitude && {
      geo: {
        '@type': 'GeoCoordinates',
        latitude: artisan.latitude,
        longitude: artisan.longitude,
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

    ...(artisan.service_prices.length > 0 && {
      hasOfferCatalog: {
        '@type': 'OfferCatalog',
        name: 'Services',
        itemListElement: artisan.service_prices.map((s, _i) => ({
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

    ...(artisan.intervention_radius_km && artisan.latitude && artisan.longitude && {
      areaServed: {
        '@type': 'GeoCircle',
        geoMidpoint: {
          '@type': 'GeoCoordinates',
          latitude: artisan.latitude,
          longitude: artisan.longitude,
        },
        geoRadius: artisan.intervention_radius_km * 1000,
      },
    }),

    ...(artisan.siret && {
      identifier: {
        '@type': 'PropertyValue',
        name: 'SIRET',
        value: artisan.siret,
      },
    }),

    ...(artisan.website && {
      sameAs: [artisan.website],
    }),

    // Additional SEO-friendly properties
    ...(artisan.creation_date ? { foundingDate: artisan.creation_date } : {}),
    priceRange: '$$',
    currenciesAccepted: 'USD',

    // Opening hours for Google Knowledge Panel
    ...(artisan.opening_hours && Object.keys(artisan.opening_hours).length > 0 && {
      openingHoursSpecification: (() => {
        const dayMap: Record<string, string> = {
          lundi: 'Monday', mardi: 'Tuesday', mercredi: 'Wednesday',
          jeudi: 'Thursday', vendredi: 'Friday', samedi: 'Saturday', dimanche: 'Sunday',
        }
        return Object.entries(artisan.opening_hours)
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
      target: `${attorneyUrl}#devis`,
      name: 'Request a free consultation',
    },
  }

  // FAQPage Schema
  const faqSchema = artisan.faq && artisan.faq.length > 0 ? {
    '@type': 'FAQPage',
    mainEntity: artisan.faq.map(faq => ({
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
  const specialtySlug = slugify(artisan.specialty)
  const citySlug = slugify(artisan.city)
  const breadcrumbItems = [
    { name: 'Home', item: baseUrl },
    { name: 'Practice Areas', item: `${baseUrl}/services` },
    { name: artisan.specialty, item: `${baseUrl}/practice-areas/${specialtySlug}` },
    { name: artisan.city, item: `${baseUrl}/practice-areas/${specialtySlug}/${citySlug}` },
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

  // ProfilePage Schema (wraps the artisan profile)
  const profilePageSchema = {
    '@type': 'ProfilePage',
    '@id': `${attorneyUrl}#profile`,
    mainEntity: { '@id': `${attorneyUrl}#business` },
    ...(artisan.member_since && {
      dateCreated: `${artisan.member_since}-01-01`,
    }),
    ...(artisan.updated_at ? {
      dateModified: new Date(artisan.updated_at).toISOString(),
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
