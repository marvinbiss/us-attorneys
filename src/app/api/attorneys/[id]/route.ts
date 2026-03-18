/**
 * API to retrieve an attorney by ID
 * Searches in providers (scraped data) and profiles (registered users)
 */

import { NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { createAdminClient } from '@/lib/supabase/admin'
import { createApiHandler } from '@/lib/api/handler'
import { getDepartmentName, getRegionName, getDeptCodeFromPostal } from '@/lib/geography'
import { slugify } from '@/lib/utils'
import { z } from 'zod'
import { rateLimit, RATE_LIMITS } from '@/lib/rate-limiter'

export const revalidate = 300 // ISR - revalidate every 5 minutes

// Schema for attorney ID (UUID or slug)
const attorneyIdSchema = z.string().min(1).max(255).regex(
  /^[a-zA-Z0-9-]+$/,
  'Invalid attorney ID'
)

/** Provider row shape — base columns + optional join relations from the full query */
interface ProviderRow {
  id: string
  name: string
  slug: string | null
  email: string | null
  phone: string | null
  bar_number: string | null
  is_verified: boolean | null
  is_active: boolean | null
  stable_id: string | null
  noindex: boolean | null
  address_city: string | null
  address_zip: string | null
  address_line1: string | null
  address_state: string | null
  address_county?: string | null
  specialty: string | null
  rating_average: number | null
  review_count: number | null
  created_at: string | null
  description: string | null
  meta_description: string | null
  website: string | null
  latitude: number | null
  longitude: number | null
  // Optional join columns (present only when full query succeeds)
  provider_services?: Array<{
    service_id: string
    price_min?: number
    price_max?: number
    price_unit?: string
    service?: { id: string; name: string; slug: string }
  }>
  provider_locations?: Array<{
    radius_km?: number
    location?: { id: string; name: string; slug: string; postal_code?: string }
  }>
  portfolio_items?: Array<{
    id: string
    title?: string
    description?: string
    image_url?: string
    category?: string
  }>
}

// Type for enriched attorney data
interface AttorneyDetails {
  id: string
  slug?: string
  business_name: string | null
  first_name: string | null
  last_name: string | null
  city: string
  city_slug?: string
  postal_code: string
  address: string | null
  department?: string
  department_code?: string
  region?: string
  specialty: string
  specialty_slug?: string
  description: string | null
  average_rating: number
  review_count: number
  is_verified: boolean
  is_center: boolean
  team_size: number | null
  services: string[]
  service_prices: Array<{
    name: string
    description: string
    price: string
    duration?: string
  }>
  accepts_new_clients: boolean
  intervention_zones: string[]
  member_since: string | null
  portfolio: Array<{
    id: string
    title: string
    description: string
    imageUrl: string
    category: string
  }>
  faq: Array<{
    question: string
    answer: string
  }>
  bar_number: string | null
  creation_date: string | null
  phone: string | null
  email: string | null
  website: string | null
  latitude: number | null
  longitude: number | null
}

interface Review {
  id: string
  author: string
  rating: number
  date: string
  comment: string
  service: string
  hasPhoto: boolean
  photoUrl: string | null
  verified: boolean
}

// REMOVED: Fake review generation templates (illegal and unethical)

// Generate a description for a provider based on their data (WITHOUT fake ratings)
function generateDescription(name: string, specialty: string, city: string): string {
  const descriptions = [
    `${name} is a professional ${specialty.toLowerCase()} based in ${city}. We guarantee quality service for all your legal needs. Contact us for a free consultation.`,
    `Your trusted ${specialty.toLowerCase()} in ${city}. ${name} provides prompt service for all your needs. Free consultation, no obligation.`,
    `${name} - ${specialty.toLowerCase()} in ${city}. With numerous successful cases, we guarantee thorough and professional work.`,
  ]

  // Use provider name to pick a consistent description
  let seed = 0
  for (let i = 0; i < name.length; i++) {
    seed += name.charCodeAt(i)
  }
  return descriptions[seed % descriptions.length]
}

// REMOVED: generateSyntheticReviews function (illegal fake review generation)

export const GET = createApiHandler(async ({ request, params }) => {
    const rateLimitResult = await rateLimit(request, RATE_LIMITS.api)
    if (!rateLimitResult.success) {
      return NextResponse.json({ success: false, error: { code: 'RATE_LIMITED', message: 'Too many requests' } }, { status: 429 })
    }

    // Validate attorney ID parameter
    const idValidation = attorneyIdSchema.safeParse(params?.id)
    if (!idValidation.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid attorney ID',
            details: idValidation.error.flatten()
          }
        },
        { status: 400 }
      )
    }

    // adminClient justified: public endpoint, no user session — RLS would block anonymous reads
    const supabase = createAdminClient()
    const attorneyId = idValidation.data

    logger.debug(`Fetching attorney: ${attorneyId}`)

    let attorney: AttorneyDetails | null = null
    let reviews: Review[] = []
    let source: 'provider' | 'profile' = 'provider'

    // 1. First search in the providers table (scraped/Pappers data)
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(attorneyId)

    // First, try a simple query to find the provider
    const PROVIDER_COLUMNS = 'id,name,slug,email,phone,bar_number,is_verified,is_active,stable_id,noindex,address_city,address_zip,address_line1,address_state,specialty,rating_average,review_count,created_at,description,meta_description,website,latitude,longitude'
    let simpleQuery = supabase
      .from('attorneys')
      .select(PROVIDER_COLUMNS)

    if (isUUID) {
      simpleQuery = simpleQuery.eq('id', attorneyId)
    } else {
      simpleQuery = simpleQuery.eq('slug', attorneyId)
    }

    const { data: simpleProvider, error: simpleError } = await simpleQuery.single()

    // If not found or inactive, return early
    if (!simpleProvider || simpleError) {
      logger.debug(`Provider not found: ${attorneyId}`, { code: simpleError?.code })
    }

    // Now get full data with relations (if tables exist)
    // Supabase select() returns row matching ProviderRow shape by column list
    let provider: ProviderRow | null = simpleProvider as ProviderRow | null
    const attorneyError = simpleError

    if (simpleProvider) {
      // Try to get related data, but don't fail if relations don't exist
      try {
        const { data: fullProvider } = await supabase
          .from('attorneys')
          .select(`
            ${PROVIDER_COLUMNS},
            provider_services (
              service_id, price_min, price_max, price_unit,
              service:services (id, name, slug)
            ),
            provider_locations (
              radius_km,
              location:locations (id, name, slug, postal_code)
            ),
            portfolio_items (id, title, description, image_url, category)
          `)
          .eq('id', simpleProvider.id)
          .single()

        if (fullProvider) {
          // Supabase TS types model nested joins (service, location) as arrays,
          // but single FK joins resolve to objects at runtime. Cast via unknown required.
          provider = fullProvider as unknown as ProviderRow
        }
      } catch {
        // Use simple provider if relations fail
        logger.debug(`Using simple provider data for: ${attorneyId}`)
      }
    }

    if (provider && !attorneyError) {
      source = 'provider'

      // Fetch reviews (provider_faq table does not exist in migrations — faq hardcoded to [])
      const { data: providerReviews } = await supabase
        .from('reviews')
        .select('id, rating, client_name, comment, created_at')
        .eq('attorney_id', provider.id)
        .order('created_at', { ascending: false })
        .limit(100)

      // Calculate the average rating
      let averageRating = 0
      let reviewCount = 0
      if (providerReviews && providerReviews.length > 0) {
        reviewCount = providerReviews.length
        averageRating = providerReviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount
      }

      // Extract services
      const services = (provider.provider_services?.map((ps: { service?: { name: string } }) =>
        ps.service?.name
      ).filter((name): name is string => Boolean(name))) || []

      // Extract coverage areas
      const interventionZones = provider.provider_locations?.map((pl: {
        location?: { name: string; postal_code?: string }
      }) => {
        if (pl.location?.name) {
          return pl.location.postal_code
            ? `${pl.location.name} (${pl.location.postal_code})`
            : pl.location.name
        }
        return null
      }).filter((zone): zone is string => Boolean(zone)) || []

      // Retrieve the real portfolio (filter demo data with Unsplash images)
      const portfolio = (provider.portfolio_items || [])
        .filter((item: { image_url?: string }) => {
          // Exclude demo images (Unsplash, placeholder, etc.)
          const imageUrl = item.image_url || ''
          return !imageUrl.includes('unsplash.com') &&
                 !imageUrl.includes('placeholder') &&
                 !imageUrl.includes('picsum.photos') &&
                 imageUrl.length > 0
        })
        .map((item: {
          id: string
          title?: string
          description?: string
          image_url?: string
          category?: string
        }) => ({
          id: item.id,
          title: item.title || 'Case Result',
          description: item.description || '',
          imageUrl: item.image_url || '',
          category: item.category || 'Project',
        }))

      // provider_faq table does not exist in migrations — return empty array
      const faq: Array<{ question: string; answer: string }> = []

      const postalCode = provider.address_zip || ''
      const deptCode = getDeptCodeFromPostal(postalCode)
      const departmentName = getDepartmentName(deptCode) || getDepartmentName(provider.address_county)
      const regionName = getRegionName(deptCode) || getRegionName(provider.address_state)

      const finalRating = averageRating > 0 ? averageRating : 0
      const finalReviewCount = reviewCount
      const finalSpecialty = provider.specialty || services[0] || 'Attorney'

      // Generate description if not available
      const existingDescription = provider.description || provider.meta_description
      const finalDescription = (existingDescription && existingDescription.length > 50)
        ? existingDescription
        : generateDescription(
            provider.name || 'This attorney',
            finalSpecialty,
            provider.address_city || 'your area'
          )

      attorney = {
        id: provider.id,
        slug: provider.slug || undefined,
        business_name: provider.name,
        first_name: null,
        last_name: null,
        city: provider.address_city || '',
        city_slug: provider.address_city ? slugify(provider.address_city) : undefined,
        postal_code: postalCode,
        address: provider.address_line1,
        department: departmentName || undefined,
        department_code: deptCode || undefined,
        region: regionName || undefined,
        specialty: finalSpecialty,
        specialty_slug: finalSpecialty ? slugify(finalSpecialty) : undefined,
        description: finalDescription,
        average_rating: Math.round(Number(finalRating) * 10) / 10,
        review_count: finalReviewCount,
        is_verified: provider.is_verified ?? false,
        is_center: false,
        team_size: null,
        services: services.length > 0 ? services : [finalSpecialty],
        service_prices: provider.provider_services?.map((ps: {
          service?: { name: string }
          price_min?: number
          price_max?: number
          price_unit?: string
        }) => ({
          name: ps.service?.name || 'Service',
          description: '',
          price: ps.price_min && ps.price_max
            ? `${ps.price_min}-${ps.price_max}$`
            : ps.price_min
              ? `Starting from ${ps.price_min}$`
              : 'By consultation',
          duration: undefined
        })) || [],
        accepts_new_clients: true,
        intervention_zones: interventionZones,
        member_since: provider.created_at
          ? new Date(provider.created_at).getFullYear().toString()
          : null,
        portfolio,
        faq,
        bar_number: provider.bar_number,
        creation_date: null,
        phone: provider.phone,
        email: provider.email,
        website: provider.website,
        latitude: provider.latitude,
        longitude: provider.longitude,
      }

      // Transform real reviews
      if (providerReviews && providerReviews.length > 0) {
        reviews = providerReviews.map(r => ({
          id: r.id,
          author: r.client_name || 'Client',
          rating: r.rating,
          date: new Date(r.created_at).toLocaleDateString('en-US', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
          }),
          comment: r.comment || '',
          service: services[0] || 'Service',
          hasPhoto: false,
          photoUrl: null,
          verified: false,
        }))
      }
      // NO fake reviews! Return empty array if no real reviews in database
    }

    // 2. If not found in providers, search in profiles (registered users)
    if (!attorney) {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, full_name, email, phone_e164, average_rating, review_count, created_at, role')
        .eq('id', attorneyId)
        .eq('role', 'attorney')
        .single()

      if (profile && !profileError) {
        source = 'profile'

        // Retrieve reviews for this profile
        const { data: profileReviews } = await supabase
          .from('reviews')
          .select('id, rating, comment, client_name, created_at')
          .eq('attorney_id', attorneyId)
          .order('created_at', { ascending: false })
          .limit(20)

        // Retrieve the portfolio (filter demo data)
        const { data: portfolioData } = await supabase
          .from('portfolio_items')
          .select('id, title, description, image_url, category, created_at')
          .eq('attorney_id', attorneyId)
          .order('created_at', { ascending: false })

        const portfolio = (portfolioData || [])
          .filter((item: { image_url?: string }) => {
            // Exclude demo images (Unsplash, placeholder, etc.)
            const imageUrl = item.image_url || ''
            return !imageUrl.includes('unsplash.com') &&
                   !imageUrl.includes('placeholder') &&
                   !imageUrl.includes('picsum.photos') &&
                   imageUrl.length > 0
          })
          .map((item: {
            id: string
            title?: string
            description?: string
            image_url?: string
            category?: string
          }) => ({
            id: item.id,
            title: item.title || 'Case Result',
            description: item.description || '',
            imageUrl: item.image_url || '',
            category: item.category || 'Project',
          }))

        // attorney_faq table does not exist in migrations — return empty
        const faq: Array<{ question: string; answer: string }> = []

        // Calculate the average rating
        let averageRating = 0
        let reviewCount = 0
        if (profileReviews && profileReviews.length > 0) {
          reviewCount = profileReviews.length
          averageRating = profileReviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount
        }

        const nameParts = profile.full_name?.split(' ') || []
        const firstName = nameParts[0] || null
        const lastName = nameParts.slice(1).join(' ') || null

        attorney = {
          id: profile.id,
          business_name: profile.full_name,
          first_name: firstName,
          last_name: lastName,
          city: '',
          postal_code: '',
          address: null,
          specialty: 'Attorney',
          description: null,
          average_rating: Math.round(averageRating * 10) / 10,
          review_count: reviewCount,
          is_verified: false,
          is_center: false,
          team_size: null,
          services: [],
          service_prices: [],
          accepts_new_clients: true,
          intervention_zones: [],
          member_since: profile.created_at
            ? new Date(profile.created_at).getFullYear().toString()
            : null,
          portfolio,
          faq,
          bar_number: null,
          creation_date: null,
          phone: profile.phone_e164,
          email: profile.email,
          website: null,
          latitude: null,
          longitude: null,
        }

        // Transform the reviews
        reviews = (profileReviews || []).map(r => ({
          id: r.id,
          author: r.client_name || 'Client',
          rating: r.rating,
          date: new Date(r.created_at).toLocaleDateString('en-US', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
          }),
          comment: r.comment || '',
          service: 'Service',
          hasPhoto: false,
          photoUrl: null,
          verified: false,
        }))
      }
    }

    // 3. If still not found, return 404
    if (!attorney) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Attorney not found'
          }
        },
        { status: 404 }
      )
    }

    const response = NextResponse.json({
      success: true,
      attorney,
      reviews,
      source,
    })

    response.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600')

    return response
}, {})
