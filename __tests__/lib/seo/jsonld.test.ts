/**
 * JSON-LD Schema Generators — Comprehensive Unit Tests
 *
 * Tests for all schema functions in src/lib/seo/jsonld.ts
 * Total: ~70 tests covering every function + edge cases
 */

import { describe, it, expect, vi } from 'vitest'

// Mock company-identity before importing jsonld
vi.mock('@/lib/config/company-identity', () => ({
  companyIdentity: {
    name: 'US Attorneys',
    email: 'contact@us-attorneys.com',
    phone: '(800) 555-0199',
    legalName: null,
    address: null,
    ein: null,
    taxId: null,
    foundingDate: null,
    social: {
      facebook: 'https://facebook.com/usattorneys',
      linkedin: 'https://linkedin.com/company/usattorneys',
    },
  },
  isCompanyRegistered: () => false,
  getSocialLinks: () => [
    'https://facebook.com/usattorneys',
    'https://linkedin.com/company/usattorneys',
  ],
}))

import {
  getOrganizationSchema,
  getWebsiteSchema,
  getServiceSchema,
  getBreadcrumbSchema,
  getFAQSchema,
  getHowToSchema,
  getItemListSchema,
  getAttorneySchema,
  getLegalServiceSchema,
  getServicePricingSchema,
  getEmergencyServiceSchema,
  getReviewPageSchema,
  getCostGuideSchema,
  getSpeakableSchema,
  getPlaceSchema,
  getCollectionPageSchema,
} from '@/lib/seo/jsonld'

// ─── getOrganizationSchema ─────────────────────────────────────────────

describe('getOrganizationSchema', () => {
  it('returns @context https://schema.org', () => {
    const schema = getOrganizationSchema()
    expect(schema['@context']).toBe('https://schema.org')
  })

  it('returns @type Organization', () => {
    const schema = getOrganizationSchema()
    expect(schema['@type']).toBe('Organization')
  })

  it('includes name and url', () => {
    const schema = getOrganizationSchema()
    expect(schema.name).toBe('US Attorneys')
    expect(schema.url).toMatch(/^https?:\/\//)
  })

  it('includes logo ImageObject with width and height', () => {
    const schema = getOrganizationSchema()
    const logo = schema.logo as Record<string, unknown>
    expect(logo['@type']).toBe('ImageObject')
    expect(logo.url).toContain('icon-512x512.png')
    expect(logo.width).toBe(512)
    expect(logo.height).toBe(512)
  })

  it('includes contactPoint with type and email', () => {
    const schema = getOrganizationSchema()
    const cp = schema.contactPoint as Record<string, unknown>
    expect(cp['@type']).toBe('ContactPoint')
    expect(cp.contactType).toBe('customer service')
    expect(cp.email).toBe('contact@us-attorneys.com')
  })

  it('includes sameAs when social links exist', () => {
    const schema = getOrganizationSchema()
    expect(schema.sameAs).toBeDefined()
    expect(Array.isArray(schema.sameAs)).toBe(true)
  })

  it('includes areaServed United States', () => {
    const schema = getOrganizationSchema()
    const area = schema.areaServed as Record<string, unknown>
    expect(area['@type']).toBe('Country')
    expect(area.name).toBe('United States')
  })
})

// ─── getWebsiteSchema ──────────────────────────────────────────────────

describe('getWebsiteSchema', () => {
  it('returns @context https://schema.org', () => {
    const schema = getWebsiteSchema()
    expect(schema['@context']).toBe('https://schema.org')
  })

  it('returns @type WebSite', () => {
    const schema = getWebsiteSchema()
    expect(schema['@type']).toBe('WebSite')
  })

  it('includes SearchAction potentialAction', () => {
    const schema = getWebsiteSchema()
    const action = schema.potentialAction as Record<string, unknown>
    expect(action['@type']).toBe('SearchAction')
    expect(action['query-input']).toBe('required name=search_term_string')
  })

  it('includes EntryPoint with urlTemplate', () => {
    const schema = getWebsiteSchema()
    const action = schema.potentialAction as Record<string, unknown>
    const target = action.target as Record<string, unknown>
    expect(target['@type']).toBe('EntryPoint')
    expect(target.urlTemplate).toContain('{search_term_string}')
  })

  it('includes publisher reference to organization', () => {
    const schema = getWebsiteSchema()
    const publisher = schema.publisher as Record<string, unknown>
    expect(publisher['@id']).toContain('#organization')
  })
})

// ─── getServiceSchema ──────────────────────────────────────────────────

describe('getServiceSchema', () => {
  it('returns @context https://schema.org', () => {
    const schema = getServiceSchema({ name: 'DUI Defense', description: 'Expert DUI defense' })
    expect(schema['@context']).toBe('https://schema.org')
  })

  it('returns @type Service', () => {
    const schema = getServiceSchema({ name: 'DUI Defense', description: 'Expert DUI defense' })
    expect(schema['@type']).toBe('Service')
  })

  it('uses provided provider name', () => {
    const schema = getServiceSchema({
      name: 'DUI Defense',
      description: 'Expert',
      provider: 'Smith & Associates',
    })
    const provider = schema.provider as Record<string, unknown>
    expect(provider.name).toBe('Smith & Associates')
  })

  it('defaults provider to SITE_NAME when not provided', () => {
    const schema = getServiceSchema({ name: 'DUI Defense', description: 'Expert' })
    const provider = schema.provider as Record<string, unknown>
    expect(provider['@type']).toBe('Organization')
    expect(provider.name).toBe('US Attorneys')
  })

  it('uses provided areaServed', () => {
    const schema = getServiceSchema({
      name: 'DUI Defense',
      description: 'Expert',
      areaServed: 'Houston, TX',
    })
    const area = schema.areaServed as Record<string, unknown>
    expect(area['@type']).toBe('Place')
    expect(area.name).toBe('Houston, TX')
  })

  it('defaults areaServed to United States', () => {
    const schema = getServiceSchema({ name: 'DUI Defense', description: 'Expert' })
    const area = schema.areaServed as Record<string, unknown>
    expect(area['@type']).toBe('Country')
    expect(area.name).toBe('United States')
  })

  it('includes image when provided', () => {
    const schema = getServiceSchema({
      name: 'DUI Defense',
      description: 'Expert',
      image: 'https://example.com/img.jpg',
    })
    expect(schema.image).toBe('https://example.com/img.jpg')
  })

  it('omits image when not provided', () => {
    const schema = getServiceSchema({ name: 'DUI Defense', description: 'Expert' })
    expect(schema.image).toBeUndefined()
  })

  it('uses category as serviceType when provided', () => {
    const schema = getServiceSchema({
      name: 'DUI Defense',
      description: 'Expert',
      category: 'Criminal Law',
    })
    expect(schema.serviceType).toBe('Criminal Law')
  })

  it('falls back to name as serviceType', () => {
    const schema = getServiceSchema({ name: 'DUI Defense', description: 'Expert' })
    expect(schema.serviceType).toBe('DUI Defense')
  })
})

// ─── getBreadcrumbSchema ───────────────────────────────────────────────

describe('getBreadcrumbSchema', () => {
  const items = [
    { name: 'Home', url: '/' },
    { name: 'Practice Areas', url: '/practice-areas' },
    { name: 'Criminal Defense', url: '/practice-areas/criminal-defense' },
  ]

  it('returns @context https://schema.org', () => {
    const schema = getBreadcrumbSchema(items)
    expect(schema['@context']).toBe('https://schema.org')
  })

  it('returns @type BreadcrumbList', () => {
    const schema = getBreadcrumbSchema(items)
    expect(schema['@type']).toBe('BreadcrumbList')
  })

  it('creates correct number of ListItem elements', () => {
    const schema = getBreadcrumbSchema(items)
    expect(schema.itemListElement).toHaveLength(3)
  })

  it('assigns positions starting from 1', () => {
    const schema = getBreadcrumbSchema(items)
    const elements = schema.itemListElement as Array<Record<string, unknown>>
    expect(elements[0].position).toBe(1)
    expect(elements[1].position).toBe(2)
    expect(elements[2].position).toBe(3)
  })

  it('last item has no "item" property (Google compliance)', () => {
    const schema = getBreadcrumbSchema(items)
    const elements = schema.itemListElement as Array<Record<string, unknown>>
    const last = elements[elements.length - 1]
    expect(last.item).toBeUndefined()
    expect(last.name).toBe('Criminal Defense')
  })

  it('non-last items have "item" as full URL string', () => {
    const schema = getBreadcrumbSchema(items)
    const elements = schema.itemListElement as Array<Record<string, unknown>>
    expect(elements[0].item).toContain('/')
    expect(typeof elements[0].item).toBe('string')
  })
})

// ─── getFAQSchema ──────────────────────────────────────────────────────

describe('getFAQSchema', () => {
  const faqs = [
    { question: 'How much does a lawyer cost?', answer: 'It varies by practice area.' },
    { question: 'Do I need a lawyer?', answer: 'It depends on your situation.' },
  ]

  it('returns @context https://schema.org', () => {
    const schema = getFAQSchema(faqs)
    expect(schema!['@context']).toBe('https://schema.org')
  })

  it('returns @type FAQPage', () => {
    const schema = getFAQSchema(faqs)
    expect(schema!['@type']).toBe('FAQPage')
  })

  it('returns null for empty array', () => {
    expect(getFAQSchema([])).toBeNull()
  })

  it('returns null for undefined-like input', () => {
    expect(getFAQSchema(null as any)).toBeNull()
  })

  it('creates Question/Answer pairs', () => {
    const schema = getFAQSchema(faqs)
    const mainEntity = schema!.mainEntity as Array<Record<string, unknown>>
    expect(mainEntity).toHaveLength(2)
    expect(mainEntity[0]['@type']).toBe('Question')
    expect(mainEntity[0].name).toBe('How much does a lawyer cost?')
    const answer = mainEntity[0].acceptedAnswer as Record<string, unknown>
    expect(answer['@type']).toBe('Answer')
    expect(answer.text).toBe('It varies by practice area.')
  })
})

// ─── getHowToSchema ───────────────────────────────────────────────────

describe('getHowToSchema', () => {
  const steps = [
    { name: 'Search', text: 'Enter your legal issue' },
    { name: 'Compare', text: 'Review attorney profiles' },
    { name: 'Contact', text: 'Request a free consultation' },
  ]

  it('returns @context https://schema.org', () => {
    const schema = getHowToSchema(steps)
    expect(schema['@context']).toBe('https://schema.org')
  })

  it('returns @type HowTo', () => {
    const schema = getHowToSchema(steps)
    expect(schema['@type']).toBe('HowTo')
  })

  it('uses default name when no options', () => {
    const schema = getHowToSchema(steps)
    expect(schema.name).toContain('How to find an attorney')
  })

  it('uses custom name from options', () => {
    const schema = getHowToSchema(steps, { name: 'How to file a claim' })
    expect(schema.name).toBe('How to file a claim')
  })

  it('creates HowToStep elements with positions', () => {
    const schema = getHowToSchema(steps)
    const stepsOut = schema.step as Array<Record<string, unknown>>
    expect(stepsOut).toHaveLength(3)
    expect(stepsOut[0]['@type']).toBe('HowToStep')
    expect(stepsOut[0].position).toBe(1)
    expect(stepsOut[2].position).toBe(3)
  })

  it('includes image on steps when provided', () => {
    const stepsWithImg = [{ name: 'Step 1', text: 'Do this', image: 'https://example.com/img.jpg' }]
    const schema = getHowToSchema(stepsWithImg)
    const stepsOut = schema.step as Array<Record<string, unknown>>
    expect(stepsOut[0].image).toBe('https://example.com/img.jpg')
  })
})

// ─── getItemListSchema ─────────────────────────────────────────────────

describe('getItemListSchema', () => {
  const params = {
    name: 'Top DUI Attorneys in Houston',
    description: 'Best rated DUI attorneys',
    url: '/practice-areas/dui/houston',
    items: [
      { name: 'John Smith', url: '/attorneys/john-smith', position: 1 },
      { name: 'Jane Doe', url: '/attorneys/jane-doe', position: 2 },
    ],
  }

  it('returns @context https://schema.org', () => {
    const schema = getItemListSchema(params)
    expect(schema['@context']).toBe('https://schema.org')
  })

  it('returns @type ItemList', () => {
    const schema = getItemListSchema(params)
    expect(schema['@type']).toBe('ItemList')
  })

  it('includes numberOfItems matching items length', () => {
    const schema = getItemListSchema(params)
    expect(schema.numberOfItems).toBe(2)
  })

  it('creates ListItem elements with numbered positions', () => {
    const schema = getItemListSchema(params)
    const elements = schema.itemListElement as Array<Record<string, unknown>>
    expect(elements).toHaveLength(2)
    expect(elements[0].position).toBe(1)
    expect(elements[1].position).toBe(2)
  })

  it('wraps items as ProfessionalService', () => {
    const schema = getItemListSchema(params)
    const elements = schema.itemListElement as Array<Record<string, unknown>>
    const item = elements[0].item as Record<string, unknown>
    expect(item['@type']).toBe('ProfessionalService')
    expect(item.name).toBe('John Smith')
  })

  it('builds full URL for list and items', () => {
    const schema = getItemListSchema(params)
    expect(schema.url).toContain('/practice-areas/dui/houston')
    const elements = schema.itemListElement as Array<Record<string, unknown>>
    const item = elements[0].item as Record<string, unknown>
    expect(item.url).toContain('/attorneys/john-smith')
  })
})

// ─── getAttorneySchema ─────────────────────────────────────────────────

describe('getAttorneySchema', () => {
  const baseParams = {
    name: 'John Smith',
    firstName: 'John',
    lastName: 'Smith',
    url: 'https://us-attorneys.com/attorneys/john-smith',
    description: 'Experienced criminal defense attorney',
    specialty: 'Criminal Defense',
    location: 'Houston',
    state: 'Texas',
  }

  it('returns @context https://schema.org', () => {
    const schema = getAttorneySchema(baseParams)
    expect(schema['@context']).toBe('https://schema.org')
  })

  it('returns @graph with Attorney and Person entities', () => {
    const schema = getAttorneySchema(baseParams)
    expect(schema['@graph']).toBeDefined()
    const graph = schema['@graph'] as Array<Record<string, unknown>>
    expect(graph).toHaveLength(2)
  })

  it('first entity has @type including Attorney', () => {
    const schema = getAttorneySchema(baseParams)
    const graph = schema['@graph'] as Array<Record<string, unknown>>
    const types = graph[0]['@type'] as string[]
    expect(types).toContain('Attorney')
    expect(types).toContain('LegalService')
  })

  it('second entity is Person', () => {
    const schema = getAttorneySchema(baseParams)
    const graph = schema['@graph'] as Array<Record<string, unknown>>
    expect(graph[1]['@type']).toBe('Person')
  })

  it('Person has givenName and familyName', () => {
    const schema = getAttorneySchema(baseParams)
    const graph = schema['@graph'] as Array<Record<string, unknown>>
    const person = graph[1]
    expect(person.givenName).toBe('John')
    expect(person.familyName).toBe('Smith')
  })

  it('includes bar number as credential when provided', () => {
    const schema = getAttorneySchema({
      ...baseParams,
      barNumber: 'TX12345',
      barState: 'Texas',
    })
    const graph = schema['@graph'] as Array<Record<string, unknown>>
    const attorney = graph[0]
    const cred = attorney.hasCredential as Record<string, unknown>
    expect(cred['@type']).toBe('EducationalOccupationalCredential')
    expect(cred.credentialCategory).toBe('Bar Admission')
    expect(cred.identifier).toBe('TX12345')
  })

  it('includes bar number as identifier PropertyValue', () => {
    const schema = getAttorneySchema({
      ...baseParams,
      barNumber: 'TX12345',
    })
    const graph = schema['@graph'] as Array<Record<string, unknown>>
    const attorney = graph[0]
    const id = attorney.identifier as Record<string, unknown>
    expect(id['@type']).toBe('PropertyValue')
    expect(id.name).toBe('Bar Number')
    expect(id.value).toBe('TX12345')
  })

  it('omits credential when no barNumber', () => {
    const schema = getAttorneySchema(baseParams)
    const graph = schema['@graph'] as Array<Record<string, unknown>>
    expect(graph[0].hasCredential).toBeUndefined()
    expect(graph[0].identifier).toBeUndefined()
  })

  it('includes aggregateRating when rating and reviewCount provided', () => {
    const schema = getAttorneySchema({
      ...baseParams,
      rating: 4.8,
      reviewCount: 25,
    })
    const graph = schema['@graph'] as Array<Record<string, unknown>>
    const rating = graph[0].aggregateRating as Record<string, unknown>
    expect(rating['@type']).toBe('AggregateRating')
    expect(rating.ratingValue).toBe(4.8)
    expect(rating.reviewCount).toBe(25)
  })

  it('omits aggregateRating when no rating', () => {
    const schema = getAttorneySchema(baseParams)
    const graph = schema['@graph'] as Array<Record<string, unknown>>
    expect(graph[0].aggregateRating).toBeUndefined()
  })

  it('includes phone and email when provided', () => {
    const schema = getAttorneySchema({
      ...baseParams,
      phone: '(555) 123-4567',
      email: 'john@example.com',
    })
    const graph = schema['@graph'] as Array<Record<string, unknown>>
    expect(graph[0].telephone).toBe('(555) 123-4567')
    expect(graph[0].email).toBe('john@example.com')
  })

  it('includes geo coordinates when lat/lng provided', () => {
    const schema = getAttorneySchema({
      ...baseParams,
      latitude: 29.7604,
      longitude: -95.3698,
    })
    const graph = schema['@graph'] as Array<Record<string, unknown>>
    const geo = graph[0].geo as Record<string, unknown>
    expect(geo['@type']).toBe('GeoCoordinates')
    expect(geo.latitude).toBe(29.7604)
  })

  it('includes firmName as parentOrganization', () => {
    const schema = getAttorneySchema({
      ...baseParams,
      firmName: 'Smith & Associates',
    })
    const graph = schema['@graph'] as Array<Record<string, unknown>>
    const parent = graph[0].parentOrganization as Record<string, unknown>
    expect(parent['@type']).toBe('LegalService')
    expect(parent.name).toBe('Smith & Associates')
  })

  it('includes practice areas in knowsAbout (deduplicated)', () => {
    const schema = getAttorneySchema({
      ...baseParams,
      practiceAreas: ['Criminal Defense', 'DUI Defense'],
    })
    const graph = schema['@graph'] as Array<Record<string, unknown>>
    const knows = graph[0].knowsAbout as string[]
    // 'Criminal Defense' appears once (deduplicated)
    expect(knows.filter((k) => k === 'Criminal Defense')).toHaveLength(1)
    expect(knows).toContain('DUI Defense')
  })

  it('person entity includes jobTitle with specialty', () => {
    const schema = getAttorneySchema(baseParams)
    const graph = schema['@graph'] as Array<Record<string, unknown>>
    expect(graph[1].jobTitle).toBe('Criminal Defense Attorney')
  })

  it('attorney entity references person via employee', () => {
    const schema = getAttorneySchema(baseParams)
    const graph = schema['@graph'] as Array<Record<string, unknown>>
    const employee = graph[0].employee as Record<string, unknown>
    expect(employee['@id']).toContain('#person')
  })

  it('person entity references business via worksFor', () => {
    const schema = getAttorneySchema(baseParams)
    const graph = schema['@graph'] as Array<Record<string, unknown>>
    const worksFor = graph[1].worksFor as Record<string, unknown>
    expect(worksFor['@id']).toContain('#business')
  })

  it('includes languages when provided', () => {
    const schema = getAttorneySchema({
      ...baseParams,
      languages: ['English', 'Spanish'],
    })
    const graph = schema['@graph'] as Array<Record<string, unknown>>
    const langs = graph[1].knowsLanguage as Array<Record<string, unknown>>
    expect(langs).toHaveLength(2)
    expect(langs[0]['@type']).toBe('Language')
    expect(langs[0].name).toBe('English')
  })
})

// ─── getLegalServiceSchema ─────────────────────────────────────────────

describe('getLegalServiceSchema', () => {
  const params = {
    specialtyName: 'Criminal Defense',
    specialtySlug: 'criminal-defense',
    location: 'Houston',
    state: 'Texas',
    stateCode: 'TX',
    description: 'Find criminal defense attorneys in Houston',
    attorneyCount: 150,
    url: '/practice-areas/criminal-defense/houston',
  }

  it('returns @context https://schema.org', () => {
    const schema = getLegalServiceSchema(params)
    expect(schema['@context']).toBe('https://schema.org')
  })

  it('returns @type LegalService', () => {
    const schema = getLegalServiceSchema(params)
    expect(schema['@type']).toBe('LegalService')
  })

  it('includes areaServed with City and State', () => {
    const schema = getLegalServiceSchema(params)
    const area = schema.areaServed as Record<string, unknown>
    expect(area['@type']).toBe('City')
    expect(area.name).toBe('Houston')
    const state = area.containedInPlace as Record<string, unknown>
    expect(state['@type']).toBe('State')
    expect(state.name).toBe('Texas')
    expect(state.identifier).toBe('TX')
  })

  it('includes provider Organization', () => {
    const schema = getLegalServiceSchema(params)
    const provider = schema.provider as Record<string, unknown>
    expect(provider['@type']).toBe('Organization')
    expect(provider.name).toBe('US Attorneys')
  })

  it('includes aggregateRating when avgRating and reviewCount provided', () => {
    const schema = getLegalServiceSchema({
      ...params,
      avgRating: 4.5,
      reviewCount: 200,
    })
    const rating = schema.aggregateRating as Record<string, unknown>
    expect(rating['@type']).toBe('AggregateRating')
    expect(rating.ratingValue).toBe(4.5)
  })

  it('omits aggregateRating when not provided', () => {
    const schema = getLegalServiceSchema(params)
    expect(schema.aggregateRating).toBeUndefined()
  })

  it('includes priceRange when provided', () => {
    const schema = getLegalServiceSchema({ ...params, priceRange: '$$-$$$' })
    expect(schema.priceRange).toBe('$$-$$$')
  })

  it('includes availableChannel ServiceChannel', () => {
    const schema = getLegalServiceSchema(params)
    const channel = schema.availableChannel as Record<string, unknown>
    expect(channel['@type']).toBe('ServiceChannel')
    expect(channel.serviceType).toBe('Free Consultation')
  })
})

// ─── getServicePricingSchema ───────────────────────────────────────────

describe('getServicePricingSchema', () => {
  const params = {
    specialtyName: 'DUI Defense',
    specialtySlug: 'dui-defense',
    description: 'Average cost of DUI defense attorneys',
    lowPrice: 1500,
    highPrice: 15000,
    url: '/costs/dui-defense',
  }

  it('returns @context https://schema.org', () => {
    const schema = getServicePricingSchema(params)
    expect(schema['@context']).toBe('https://schema.org')
  })

  it('returns @type Product', () => {
    const schema = getServicePricingSchema(params)
    expect(schema['@type']).toBe('Product')
  })

  it('includes AggregateOffer with price range', () => {
    const schema = getServicePricingSchema(params)
    const offers = schema.offers as Record<string, unknown>
    expect(offers['@type']).toBe('AggregateOffer')
    expect(offers.lowPrice).toBe(1500)
    expect(offers.highPrice).toBe(15000)
    expect(offers.priceCurrency).toBe('USD')
  })

  it('defaults priceCurrency to USD', () => {
    const schema = getServicePricingSchema(params)
    const offers = schema.offers as Record<string, unknown>
    expect(offers.priceCurrency).toBe('USD')
  })

  it('uses custom priceCurrency when provided', () => {
    const schema = getServicePricingSchema({ ...params, priceCurrency: 'EUR' })
    const offers = schema.offers as Record<string, unknown>
    expect(offers.priceCurrency).toBe('EUR')
  })

  it('includes location in name when provided', () => {
    const schema = getServicePricingSchema({ ...params, location: 'Houston' })
    expect(schema.name).toContain('Houston')
  })

  it('uses USA suffix when no location', () => {
    const schema = getServicePricingSchema(params)
    expect(schema.name).toContain('USA')
  })

  it('includes brand Organization', () => {
    const schema = getServicePricingSchema(params)
    const brand = schema.brand as Record<string, unknown>
    expect(brand['@type']).toBe('Organization')
    expect(brand.name).toBe('US Attorneys')
  })

  it('includes aggregateRating when rating and reviewCount provided', () => {
    const schema = getServicePricingSchema({
      ...params,
      ratingValue: 4.7,
      reviewCount: 100,
    })
    expect(schema.aggregateRating).toBeDefined()
    const rating = schema.aggregateRating as Record<string, unknown>
    expect(rating.ratingValue).toBe(4.7)
  })

  it('omits aggregateRating when only ratingValue (no reviewCount)', () => {
    const schema = getServicePricingSchema({ ...params, ratingValue: 4.7 })
    expect(schema.aggregateRating).toBeUndefined()
  })

  it('includes priceValidUntil in current year', () => {
    const schema = getServicePricingSchema(params)
    const offers = schema.offers as Record<string, unknown>
    const year = new Date().getFullYear()
    expect(offers.priceValidUntil).toBe(`${year}-12-31`)
  })
})

// ─── getEmergencyServiceSchema ─────────────────────────────────────────

describe('getEmergencyServiceSchema', () => {
  const params = {
    specialtyName: 'Criminal Defense',
    location: 'Houston',
    url: '/emergency/criminal-defense/houston',
    available24h: true,
  }

  it('returns @context https://schema.org', () => {
    const schema = getEmergencyServiceSchema(params)
    expect(schema['@context']).toBe('https://schema.org')
  })

  it('returns @type LegalService', () => {
    const schema = getEmergencyServiceSchema(params)
    expect(schema['@type']).toBe('LegalService')
  })

  it('includes 24h availability when available24h is true', () => {
    const schema = getEmergencyServiceSchema(params)
    const hours = schema.hoursAvailable as Record<string, unknown>
    expect(hours['@type']).toBe('OpeningHoursSpecification')
    expect(hours.opens).toBe('00:00')
    expect(hours.closes).toBe('23:59')
    const days = hours.dayOfWeek as string[]
    expect(days).toHaveLength(7)
    expect(days).toContain('Monday')
    expect(days).toContain('Sunday')
  })

  it('omits hoursAvailable when available24h is false', () => {
    const schema = getEmergencyServiceSchema({ ...params, available24h: false })
    expect(schema.hoursAvailable).toBeUndefined()
  })

  it('includes Emergency prefix in name', () => {
    const schema = getEmergencyServiceSchema(params)
    expect(schema.name).toContain('Emergency')
    expect(schema.name).toContain('Criminal Defense')
    expect(schema.name).toContain('Houston')
  })

  it('includes additionalType EmergencyService', () => {
    const schema = getEmergencyServiceSchema(params)
    expect(schema.additionalType).toBe('http://schema.org/EmergencyService')
  })

  it('includes provider Organization', () => {
    const schema = getEmergencyServiceSchema(params)
    const provider = schema.provider as Record<string, unknown>
    expect(provider['@type']).toBe('Organization')
  })

  it('includes CommunicateAction potentialAction', () => {
    const schema = getEmergencyServiceSchema(params)
    const action = schema.potentialAction as Record<string, unknown>
    expect(action['@type']).toBe('CommunicateAction')
    expect(action.name).toContain('Emergency')
  })
})

// ─── getReviewPageSchema ───────────────────────────────────────────────

describe('getReviewPageSchema', () => {
  const params = {
    specialtyName: 'Criminal Defense',
    location: 'Houston',
    url: '/reviews/criminal-defense/houston',
    reviews: [
      { author: 'Jane Doe', rating: 5, text: 'Excellent lawyer!', date: '2025-01-15' },
      { author: 'Bob Smith', rating: 4, text: 'Very helpful.', date: '2025-02-10' },
    ],
    avgRating: 4.5,
    totalReviews: 100,
  }

  it('returns @context https://schema.org', () => {
    const schema = getReviewPageSchema(params)
    expect(schema['@context']).toBe('https://schema.org')
  })

  it('returns @type WebPage', () => {
    const schema = getReviewPageSchema(params)
    expect(schema['@type']).toBe('WebPage')
  })

  it('includes mainEntity LegalService with aggregate rating', () => {
    const schema = getReviewPageSchema(params)
    const main = schema.mainEntity as Record<string, unknown>
    expect(main['@type']).toBe('LegalService')
    const rating = main.aggregateRating as Record<string, unknown>
    expect(rating['@type']).toBe('AggregateRating')
    expect(rating.ratingValue).toBe(4.5)
    expect(rating.reviewCount).toBe(100)
  })

  it('includes reviews with author and rating', () => {
    const schema = getReviewPageSchema(params)
    const main = schema.mainEntity as Record<string, unknown>
    const reviews = main.review as Array<Record<string, unknown>>
    expect(reviews).toHaveLength(2)
    expect(reviews[0]['@type']).toBe('Review')
    const author = reviews[0].author as Record<string, unknown>
    expect(author['@type']).toBe('Person')
    expect(author.name).toBe('Jane Doe')
  })

  it('limits reviews to 10 max', () => {
    const manyReviews = Array.from({ length: 15 }, (_, i) => ({
      author: `Author ${i}`,
      rating: 4,
      text: `Review ${i}`,
      date: '2025-01-01',
    }))
    const schema = getReviewPageSchema({ ...params, reviews: manyReviews })
    const main = schema.mainEntity as Record<string, unknown>
    const reviews = main.review as Array<Record<string, unknown>>
    expect(reviews).toHaveLength(10)
  })
})

// ─── getCostGuideSchema ────────────────────────────────────────────────

describe('getCostGuideSchema', () => {
  const params = {
    specialtyName: 'Personal Injury',
    location: 'Dallas',
    state: 'Texas',
    url: '/costs/personal-injury/dallas',
    feeTypes: [
      { type: 'Contingency Fee', range: '25%-40%', description: 'No upfront cost' },
      { type: 'Hourly Rate', range: '$200-$500/hr', description: 'Billed per hour' },
    ],
    lastUpdated: '2025-03-01',
  }

  it('returns @context https://schema.org', () => {
    const schema = getCostGuideSchema(params)
    expect(schema['@context']).toBe('https://schema.org')
  })

  it('returns @type WebPage', () => {
    const schema = getCostGuideSchema(params)
    expect(schema['@type']).toBe('WebPage')
  })

  it('includes OfferCatalog in mainEntity', () => {
    const schema = getCostGuideSchema(params)
    const main = schema.mainEntity as Record<string, unknown>
    const catalog = main.hasOfferCatalog as Record<string, unknown>
    expect(catalog['@type']).toBe('OfferCatalog')
    const items = catalog.itemListElement as Array<Record<string, unknown>>
    expect(items).toHaveLength(2)
    expect(items[0].name).toBe('Contingency Fee')
    expect(items[0].position).toBe(1)
  })

  it('includes areaServed with City and State', () => {
    const schema = getCostGuideSchema(params)
    const main = schema.mainEntity as Record<string, unknown>
    const area = main.areaServed as Record<string, unknown>
    expect(area['@type']).toBe('City')
    expect(area.name).toBe('Dallas')
    const state = area.containedInPlace as Record<string, unknown>
    expect(state['@type']).toBe('State')
    expect(state.name).toBe('Texas')
  })

  it('includes speakable SpeakableSpecification', () => {
    const schema = getCostGuideSchema(params)
    const speakable = schema.speakable as Record<string, unknown>
    expect(speakable['@type']).toBe('SpeakableSpecification')
  })

  it('includes dateModified', () => {
    const schema = getCostGuideSchema(params)
    expect(schema.dateModified).toBe('2025-03-01')
  })
})

// ─── getSpeakableSchema ────────────────────────────────────────────────

describe('getSpeakableSchema', () => {
  it('returns @context https://schema.org', () => {
    const schema = getSpeakableSchema({ url: '/test', title: 'Test Page' })
    expect(schema['@context']).toBe('https://schema.org')
  })

  it('returns @type WebPage', () => {
    const schema = getSpeakableSchema({ url: '/test', title: 'Test Page' })
    expect(schema['@type']).toBe('WebPage')
  })

  it('includes SpeakableSpecification with default selectors', () => {
    const schema = getSpeakableSchema({ url: '/test', title: 'Test Page' })
    const speakable = schema.speakable as Record<string, unknown>
    expect(speakable['@type']).toBe('SpeakableSpecification')
    const selectors = speakable.cssSelector as string[]
    expect(selectors).toContain('h1')
    expect(selectors).toContain('[data-speakable="true"]')
  })

  it('uses custom CSS selectors when provided', () => {
    const schema = getSpeakableSchema({
      url: '/test',
      title: 'Test',
      speakableCssSelectors: ['.custom-selector'],
    })
    const speakable = schema.speakable as Record<string, unknown>
    expect(speakable.cssSelector).toEqual(['.custom-selector'])
  })
})

// ─── getPlaceSchema ────────────────────────────────────────────────────

describe('getPlaceSchema', () => {
  it('returns @type City', () => {
    const schema = getPlaceSchema({ name: 'Houston', slug: 'houston' })
    expect(schema['@type']).toBe('City')
    expect(schema['@context']).toBe('https://schema.org')
  })

  it('includes containedInPlace when region provided', () => {
    const schema = getPlaceSchema({ name: 'Houston', slug: 'houston', region: 'Texas' })
    const contained = schema.containedInPlace as Record<string, unknown>
    expect(contained['@type']).toBe('AdministrativeArea')
    expect(contained.name).toBe('Texas')
  })

  it('omits containedInPlace when no region', () => {
    const schema = getPlaceSchema({ name: 'Houston', slug: 'houston' })
    expect(schema.containedInPlace).toBeUndefined()
  })
})

// ─── getCollectionPageSchema ───────────────────────────────────────────

describe('getCollectionPageSchema', () => {
  it('returns @type CollectionPage with correct properties', () => {
    const schema = getCollectionPageSchema({
      name: 'Criminal Defense Attorneys',
      description: 'Browse attorneys',
      url: '/practice-areas/criminal-defense',
      itemCount: 500,
    })
    expect(schema['@context']).toBe('https://schema.org')
    expect(schema['@type']).toBe('CollectionPage')
    expect(schema.numberOfItems).toBe(500)
    const parent = schema.isPartOf as Record<string, unknown>
    expect(parent['@type']).toBe('WebSite')
  })
})
