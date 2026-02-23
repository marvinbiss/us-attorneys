/**
 * API pour récupérer un artisan par ID
 * Cherche dans providers (données scrapées) et profiles (utilisateurs inscrits)
 */

import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { createAdminClient } from '@/lib/supabase/admin'
import { getDepartmentName, getRegionName, getDeptCodeFromPostal } from '@/lib/geography'
import { slugify } from '@/lib/utils'
import { z } from 'zod'

export const dynamic = 'force-dynamic'
export const revalidate = 0

// Schema for artisan ID (UUID or slug)
const artisanIdSchema = z.string().min(1).max(255).regex(
  /^[a-zA-Z0-9-]+$/,
  'ID artisan invalide'
)

// Type pour les données artisan enrichies
interface ArtisanDetails {
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
  siret: string | null
  siren: string | null
  legal_form: string | null
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
    `${name} est un ${specialty.toLowerCase()} professionnel basé à ${city}. Nous garantissons un service de qualité pour tous vos travaux. Contactez-nous pour un devis gratuit.`,
    `Votre ${specialty.toLowerCase()} de confiance à ${city}. ${name} intervient rapidement pour tous vos besoins. Devis gratuit et sans engagement.`,
    `${name} - ${specialty.toLowerCase()} à ${city}. Fort de nombreuses interventions réussies, nous vous garantissons un travail soigné et professionnel.`,
  ]

  // Use provider name to pick a consistent description
  let seed = 0
  for (let i = 0; i < name.length; i++) {
    seed += name.charCodeAt(i)
  }
  return descriptions[seed % descriptions.length]
}

// REMOVED: generateSyntheticReviews function (illegal fake review generation)

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Validate artisan ID parameter
    const idValidation = artisanIdSchema.safeParse(params.id)
    if (!idValidation.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'ID artisan invalide',
            details: idValidation.error.flatten()
          }
        },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()
    const artisanId = idValidation.data

    logger.debug(`Fetching artisan: ${artisanId}`)

    let artisan: ArtisanDetails | null = null
    let reviews: Review[] = []
    let source: 'provider' | 'profile' = 'provider'

    // 1. Chercher d'abord dans la table providers (données scrapées/Pappers)
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(artisanId)

    // First, try a simple query to find the provider
    const PROVIDER_COLUMNS = 'id,name,slug,email,phone,siret,is_verified,is_active,stable_id,noindex,address_city,address_postal_code,address_street,address_region,specialty,rating_average,review_count,created_at,siren,legal_form_code,description,meta_description,website,latitude,longitude'
    let simpleQuery = supabase
      .from('providers')
      .select(PROVIDER_COLUMNS)

    if (isUUID) {
      simpleQuery = simpleQuery.eq('id', artisanId)
    } else {
      simpleQuery = simpleQuery.eq('slug', artisanId)
    }

    const { data: simpleProvider, error: simpleError } = await simpleQuery.single()

    // If not found or inactive, return early
    if (!simpleProvider || simpleError) {
      logger.debug(`Provider not found: ${artisanId}`, { code: simpleError?.code })
    }

    // Now get full data with relations (if tables exist)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- provider may include join columns (provider_services, provider_locations, portfolio_items) from the full query
    let provider: Record<string, any> | null = simpleProvider
    const providerError = simpleError

    if (simpleProvider) {
      // Try to get related data, but don't fail if relations don't exist
      try {
        const { data: fullProvider } = await supabase
          .from('providers')
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
          provider = fullProvider
        }
      } catch {
        // Use simple provider if relations fail
        logger.debug(`Using simple provider data for: ${artisanId}`)
      }
    }

    if (provider && !providerError) {
      source = 'provider'

      // Fetch reviews (provider_faq table does not exist in migrations — faq hardcoded to [])
      const { data: providerReviews } = await supabase
        .from('reviews')
        .select('id, rating, client_name, comment, created_at')
        .eq('artisan_id', provider.id)
        .order('created_at', { ascending: false })
        .limit(100)

      // Calculer la note moyenne
      let averageRating = 0
      let reviewCount = 0
      if (providerReviews && providerReviews.length > 0) {
        reviewCount = providerReviews.length
        averageRating = providerReviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount
      }

      // Extraire les services
      const services = provider.provider_services?.map((ps: { service?: { name: string } }) =>
        ps.service?.name
      ).filter(Boolean) || []

      // Extraire les zones d'intervention
      const interventionZones = provider.provider_locations?.map((pl: {
        location?: { name: string; postal_code?: string }
      }) => {
        if (pl.location?.name) {
          return pl.location.postal_code
            ? `${pl.location.name} (${pl.location.postal_code})`
            : pl.location.name
        }
        return null
      }).filter(Boolean) || []

      // Récupérer le portfolio réel (filtrer les données de démo avec images Unsplash)
      const portfolio = (provider.portfolio_items || [])
        .filter((item: { image_url?: string }) => {
          // Exclure les images de démo (Unsplash, placeholder, etc.)
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
          title: item.title || 'Réalisation',
          description: item.description || '',
          imageUrl: item.image_url || '',
          category: item.category || 'Travaux',
        }))

      // provider_faq table does not exist in migrations — return empty array
      const faq: Array<{ question: string; answer: string }> = []

      const postalCode = provider.address_postal_code || ''
      const deptCode = getDeptCodeFromPostal(postalCode)
      const departmentName = getDepartmentName(deptCode) || getDepartmentName(provider.address_department)
      const regionName = getRegionName(deptCode) || getRegionName(provider.address_region)

      const finalRating = averageRating > 0 ? averageRating : 0
      const finalReviewCount = reviewCount
      const finalSpecialty = provider.specialty || services[0] || 'Artisan'

      // Generate description if not available
      const existingDescription = provider.description || provider.meta_description
      const finalDescription = (existingDescription && existingDescription.length > 50)
        ? existingDescription
        : generateDescription(
            provider.name || 'Cet artisan',
            finalSpecialty,
            provider.address_city || 'votre région'
          )

      artisan = {
        id: provider.id,
        slug: provider.slug || undefined,
        business_name: provider.name,
        first_name: null,
        last_name: null,
        city: provider.address_city || '',
        city_slug: provider.address_city ? slugify(provider.address_city) : undefined,
        postal_code: postalCode,
        address: provider.address_street,
        department: departmentName || undefined,
        department_code: deptCode || undefined,
        region: regionName || undefined,
        specialty: finalSpecialty,
        specialty_slug: finalSpecialty ? slugify(finalSpecialty) : undefined,
        description: finalDescription,
        average_rating: Math.round(Number(finalRating) * 10) / 10,
        review_count: finalReviewCount,
        is_verified: provider.is_verified,
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
            ? `${ps.price_min}-${ps.price_max}€`
            : ps.price_min
              ? `A partir de ${ps.price_min}€`
              : 'Sur devis',
          duration: undefined
        })) || [],
        accepts_new_clients: true,
        intervention_zones: interventionZones,
        member_since: provider.created_at
          ? new Date(provider.created_at).getFullYear().toString()
          : null,
        portfolio,
        faq,
        siret: provider.siret,
        siren: provider.siren,
        legal_form: provider.legal_form_code,
        creation_date: null,
        phone: provider.phone,
        email: provider.email,
        website: provider.website,
        latitude: provider.latitude,
        longitude: provider.longitude,
      }

      // Transformer les avis réels
      if (providerReviews && providerReviews.length > 0) {
        reviews = providerReviews.map(r => ({
          id: r.id,
          author: r.client_name || 'Client',
          rating: r.rating,
          date: new Date(r.created_at).toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
          }),
          comment: r.comment || '',
          service: services[0] || 'Prestation',
          hasPhoto: false,
          photoUrl: null,
          verified: false,
        }))
      }
      // NO fake reviews! Return empty array if no real reviews in database
    }

    // 2. Si pas trouvé dans providers, chercher dans profiles (utilisateurs inscrits)
    if (!artisan) {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, full_name, email, phone_e164, average_rating, review_count, created_at, role')
        .eq('id', artisanId)
        .eq('role', 'artisan')
        .single()

      if (profile && !profileError) {
        source = 'profile'

        // Récupérer les avis pour ce profil
        const { data: profileReviews } = await supabase
          .from('reviews')
          .select('id, rating, comment, client_name, created_at')
          .eq('artisan_id', artisanId)
          .order('created_at', { ascending: false })
          .limit(20)

        // Récupérer le portfolio (filtrer les données de démo)
        const { data: portfolioData } = await supabase
          .from('portfolio_items')
          .select('id, title, description, image_url, category, created_at')
          .eq('artisan_id', artisanId)
          .order('created_at', { ascending: false })

        const portfolio = (portfolioData || [])
          .filter((item: { image_url?: string }) => {
            // Exclure les images de démo (Unsplash, placeholder, etc.)
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
            title: item.title || 'Réalisation',
            description: item.description || '',
            imageUrl: item.image_url || '',
            category: item.category || 'Travaux',
          }))

        // artisan_faq table does not exist in migrations — return empty
        const faq: Array<{ question: string; answer: string }> = []

        // Calculer la note moyenne
        let averageRating = 0
        let reviewCount = 0
        if (profileReviews && profileReviews.length > 0) {
          reviewCount = profileReviews.length
          averageRating = profileReviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount
        }

        const nameParts = profile.full_name?.split(' ') || []
        const firstName = nameParts[0] || null
        const lastName = nameParts.slice(1).join(' ') || null

        artisan = {
          id: profile.id,
          business_name: profile.full_name,
          first_name: firstName,
          last_name: lastName,
          city: '',
          postal_code: '',
          address: null,
          specialty: 'Artisan',
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
          siret: null,
          siren: null,
          legal_form: null,
          creation_date: null,
          phone: profile.phone_e164,
          email: profile.email,
          website: null,
          latitude: null,
          longitude: null,
        }

        // Transformer les avis
        reviews = (profileReviews || []).map(r => ({
          id: r.id,
          author: r.client_name || 'Client',
          rating: r.rating,
          date: new Date(r.created_at).toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
          }),
          comment: r.comment || '',
          service: 'Prestation',
          hasPhoto: false,
          photoUrl: null,
          verified: false,
        }))
      }
    }

    // 3. Si toujours pas trouvé, retourner 404
    if (!artisan) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Artisan non trouvé'
          }
        },
        { status: 404 }
      )
    }

    const response = NextResponse.json({
      success: true,
      artisan,
      reviews,
      source,
    })

    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate')
    response.headers.set('Pragma', 'no-cache')

    return response

  } catch (error) {
    logger.error('Error fetching artisan', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: 'Erreur serveur'
        }
      },
      { status: 500 }
    )
  }
}
