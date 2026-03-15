import { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { getAttorneyByStableId, getAttorneyBySlug, getAttorneyById, getSpecialtyBySlug, getLocationBySlug, getAttorneyCountByServiceAndLocation } from '@/lib/supabase'
import { getAttorneyUrl } from '@/lib/utils'
import { resolveProviderCity } from '@/lib/insee-resolver'
import AttorneyPageClient from '@/components/attorney/AttorneyPageClient'
import AttorneyInternalLinks from '@/components/attorney/AttorneyInternalLinks'
import { Review } from '@/components/attorney'
import type { LegacyArtisan } from '@/types/legacy'
import type { Service, Location } from '@/types'
import { getServiceImage } from '@/lib/data/images'

/** Raw provider row from select('*') — includes all DB columns the mapper reads */
interface ProviderRecord {
  id: string
  stable_id?: string | null
  slug?: string | null
  name?: string | null
  business_name?: string | null
  first_name?: string | null
  last_name?: string | null
  specialty?: string | null
  description?: string | null
  bio?: string | null
  address_street?: string | null
  address_city?: string | null
  address_postal_code?: string | null
  address_region?: string | null
  is_verified?: boolean | null
  is_active?: boolean | null
  is_center?: boolean | null
  noindex?: boolean | null
  rating_average?: number | null
  average_rating?: number | null
  review_count?: number | null
  team_size?: number | null
  available_24h?: boolean | null
  accepts_new_clients?: boolean | null
  free_quote?: boolean | null
  phone?: string | null
  phone_secondary?: string | null
  email?: string | null
  website?: string | null
  siret?: string | null
  legal_form?: string | null
  legal_form_code?: string | null
  creation_date?: string | null
  latitude?: number | null
  longitude?: number | null
  opening_hours?: Record<string, { ouvert: boolean; debut: string; fin: string }> | null
  intervention_radius_km?: number | null
  services_offered?: string[] | null
  service_prices?: Array<{ name: string; description?: string; price: string; duration?: string }> | null
  faq?: Array<{ question: string; answer: string }> | null
  created_at?: string | null
  updated_at?: string | null
  user_id?: string | null
}
import { SITE_URL } from '@/lib/seo/config'
import { hashCode } from '@/lib/seo/location-content'
import { getNeighborhoodBySlug, practiceAreas as staticPracticeAreas, cities, getStateByCode } from '@/lib/data/usa'
import ServiceQuartierPage from './ServiceQuartierPage'
import dynamic from 'next/dynamic'

const EstimationWidget = dynamic(
  () => import('@/components/estimation/EstimationWidget'),
  { ssr: false }
)

export const revalidate = 86400

// Pre-render top service×city×quartier combos for ISR warming
const TOP_CITIES_QUARTIER = 30
export function generateStaticParams() {
  const topCities = cities.slice(0, TOP_CITIES_QUARTIER)
  // Pre-render top 10 services × 30 cities × quartiers for better ISR coverage
  const topServices = staticPracticeAreas.slice(0, 10)
  return topServices.flatMap(s =>
    topCities.flatMap(v => {
      const quartiers = v.neighborhoods || []
      return quartiers.map(q => ({
        service: s.slug,
        location: v.slug,
        publicId: q.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
      }))
    })
  )
}
export const dynamicParams = true

interface PageProps {
  params: Promise<{
    service: string
    location: string
    publicId: string
  }>
}

// Convert provider data to LegacyArtisan format (sub-components still read legacy fields)
function convertToArtisan(provider: ProviderRecord, service: Service | null, location: Location | null, specialtySlug: string): LegacyArtisan {
  const specialty = service?.name || provider.specialty || 'Artisan'
  const city = location?.name || provider.address_city || ''
  const name = provider.name || provider.business_name || 'Artisan'

  // Generate description if missing or too short (WITHOUT fake ratings)
  const existingDesc = provider.description || provider.bio
  const description = (existingDesc && existingDesc.length > 50)
    ? existingDesc
    : generateDescription(name, specialty, city || 'votre région', provider, specialtySlug)

  // Only show member_since if it's a meaningful past year.
  // Providers imported in the current year (e.g. 2026 bulk import) would show
  // "Inscrit depuis 2026" which is not informative.
  const memberYear = provider.created_at ? new Date(provider.created_at).getFullYear() : null
  const currentYear = new Date().getFullYear()

  return {
    id: provider.id,
    stable_id: provider.stable_id || undefined,
    slug: provider.slug || undefined,
    business_name: name,
    first_name: provider.first_name || null,
    last_name: provider.last_name || null,
    city: city,
    postal_code: String(location?.postal_code || provider.address_postal_code || '').replace(/\.0$/, ''),
    address: provider.address_street || '',
    department: location?.department_name || undefined,
    department_code: location?.department_code || undefined,
    region: location?.region_name || undefined,
    specialty: specialty,
    specialty_slug: specialtySlug,
    city_slug: location?.slug || undefined,
    description: description,
    bio: provider.bio || undefined,
    average_rating: provider.rating_average || provider.average_rating || 0,
    review_count: provider.review_count || 0,
    is_verified: provider.is_verified || false,
    is_center: provider.is_center || false,
    team_size: provider.team_size || undefined,
    services: provider.services_offered || [],
    service_prices: (provider.service_prices && provider.service_prices.length > 0)
      ? provider.service_prices.map(sp => ({ name: sp.name, description: sp.description || '', price: sp.price, duration: sp.duration }))
      : [],
    prices_are_estimated: false,
    accepts_new_clients: provider.accepts_new_clients === true ? true : undefined,
    free_quote: provider.free_quote === true ? true : undefined,
    available_24h: provider.available_24h || false,
    phone_secondary: provider.phone_secondary || undefined,
    opening_hours: provider.opening_hours && Object.keys(provider.opening_hours).length > 0 ? provider.opening_hours : undefined,
    intervention_radius_km: provider.intervention_radius_km || undefined,
    member_since: (memberYear && memberYear < currentYear) ? memberYear.toString() : undefined,
    siret: provider.siret || undefined,
    legal_form: provider.legal_form_code || provider.legal_form || undefined,
    phone: provider.phone || undefined,
    email: provider.email || undefined,
    website: provider.website || undefined,
    latitude: provider.latitude || undefined,
    longitude: provider.longitude || undefined,
    faq: (provider.faq && provider.faq.length > 0) ? provider.faq : undefined,
    updated_at: provider.updated_at || undefined,
    // Legacy fields — undefined at runtime (columns dropped), kept for sub-component compat
    // Will be removed when each sub-component migrates to v2 Artisan type
  }
}

// Generate a rich, unique description based on all available provider data
function generateDescription(name: string, specialty: string, city: string, provider?: ProviderRecord | null, specialtySlug?: string): string {
  const spe = specialty.toLowerCase()
  const parts: string[] = []

  // Hash-varied intro templates to reduce duplicate content across similar profiles
  const introKey = `desc-${provider?.stable_id || provider?.slug || provider?.id || name}-${specialtySlug || spe}`
  const introHash = hashCode(introKey)
  const introTemplates = [
    `${name} est un professionnel spécialisé en ${spe} à ${city}.`,
    `Basé à ${city}, ${name} intervient en ${spe} pour les particuliers et professionnels.`,
    `${name} propose ses services de ${spe} à ${city} et ses environs.`,
    `Professionnel en ${spe}, ${name} exerce à ${city} auprès d'une clientèle locale.`,
    `À ${city}, ${name} met son expertise en ${spe} au service de vos projets.`,
  ]
  parts.push(introTemplates[introHash % introTemplates.length])

  // Company history and experience
  if (provider?.creation_date) {
    const year = new Date(provider.creation_date).getFullYear()
    const age = new Date().getFullYear() - year
    if (age > 1) {
      parts.push(`Fondée en ${year}, l'entreprise bénéficie de plus de ${age} ans de présence dans la région.`)
    }
  }

  // Verification
  if (provider?.siret) {
    parts.push(`Entreprise immatriculée et référencée (SIRET ${provider.siret.substring(0, 9)}...).`)
  }

  // Legal form
  if (provider?.legal_form_code || provider?.legal_form) {
    parts.push(`Forme juridique : ${provider.legal_form_code || provider.legal_form}.`)
  }

  // Rating
  const rating = provider?.rating_average || provider?.average_rating
  if (rating && rating >= 4) {
    parts.push(`Noté ${Number(rating).toFixed(1)}/5 par ses clients.`)
  }

  // Service-specific expertise (programmatic based on specialty slug)
  const serviceDescriptions: Record<string, string> = {
    'plombier': `Les prestations couvrent l'installation, la réparation et l'entretien de plomberie : robinetterie, canalisations, sanitaires, chauffe-eau et dépannage de fuites.`,
    'electricien': `Les interventions incluent la mise aux normes électriques, l'installation de tableaux, le câblage, le dépannage et la pose d'éclairage intérieur et extérieur.`,
    'chauffagiste': `Spécialiste en systèmes de chauffage : installation, entretien et dépannage de chaudières, radiateurs, planchers chauffants et pompes à chaleur.`,
    'serrurier': `Interventions en serrurerie : ouverture de portes, changement de serrures, blindage, installation de systèmes de sécurité et reproduction de clés.`,
    'menuisier': `Travaux de menuiserie intérieure et extérieure : fabrication et pose de portes, fenêtres, placards, escaliers et aménagements sur mesure.`,
    'couvreur': `Travaux de couverture : réfection de toiture, pose de tuiles et ardoises, zinguerie, étanchéité et isolation de combles.`,
    'macon': `Travaux de maçonnerie : construction, rénovation, extension, dalles, murs porteurs, fondations et ravalement de façade.`,
    'carreleur': `Pose de carrelage et faïence : sols, murs, douches à l'italienne, terrasses et mosaïques pour tous types de projets.`,
    'peintre-en-batiment': `Travaux de peinture intérieure et extérieure : préparation des surfaces, enduits, peinture décorative et ravalement.`,
    'climaticien': `Installation et maintenance de climatisation : pose de splits, gainable, réversible et contrats d'entretien annuel.`,
  }
  const svcDesc = serviceDescriptions[specialtySlug || '']
  if (svcDesc) {
    parts.push(svcDesc)
  }

  // Zone d'intervention
  parts.push(`Zone d'intervention : ${city} et communes environnantes.`)

  // CTA
  parts.push(`Contactez ${name} pour obtenir un devis gratuit et personnalisé, sans engagement.`)

  // Freshness / E-E-A-T: signal that content is data-derived
  parts.push('Informations basées sur les données professionnelles déclarées.')

  return parts.join(' ')
}

/** Row shape from the similar-artisans lightweight query */
interface SimilarAttorneyRow {
  id: string
  stable_id: string | null
  slug: string | null
  name: string | null
  specialty: string | null
  rating_average: number | null
  review_count: number | null
  address_city: string | null
  is_verified: boolean | null
}

/** Row shape from the reviews query */
interface ReviewRow {
  id: string
  rating: number
  comment: string | null
  created_at: string
  client_name: string | null
  has_media: boolean | null
}

// Fetch similar artisans (same specialty, same department)
async function getSimilarArtisans(attorneyId: string, specialty: string, postalCode?: string) {
  try {
    const { supabase } = await import('@/lib/supabase')
    const deptCode = postalCode && postalCode.length >= 2 ? postalCode.substring(0, 2) : null

    let query = supabase
      .from('attorneys')
      .select('id, stable_id, slug, name, specialty, rating_average, review_count, address_city, is_verified, phone')
      .eq('is_active', true)
      .neq('id', attorneyId)
      .order('phone', { ascending: false, nullsFirst: false })
      .order('rating_average', { ascending: false, nullsFirst: false })
      .limit(8)

    // Match exact specialty (fast — uses index)
    if (specialty) {
      query = query.eq('specialty', specialty.toLowerCase())
    }

    // Prefer same department
    if (deptCode) {
      query = query.like('address_postal_code', `${deptCode}%`)
    }

    const { data } = await query

    return ((data || []) as SimilarAttorneyRow[]).map((p) => {
      const resolved = resolveProviderCity(p)
      return {
        id: p.id,
        stable_id: p.stable_id || undefined,
        slug: p.slug || undefined,
        name: p.name || 'Artisan',
        specialty: p.specialty || specialty,
        rating: p.rating_average || 0,
        reviews: p.review_count || 0,
        city: resolved.address_city || '',
        is_verified: p.is_verified || false,
      }
    })
  } catch {
    return []
  }
}

// Fetch reviews for provider (only real reviews from database)
async function getAttorneyReviews(attorneyId: string, specialtyName?: string): Promise<Review[]> {
  try {
    const { supabase } = await import('@/lib/supabase')
    const { data: reviews } = await supabase
      .from('reviews')
      .select(`
        id,
        rating,
        comment,
        created_at,
        client_name,
        has_media
      `)
      .eq('attorney_id', attorneyId)
      .eq('status', 'published')
      .order('created_at', { ascending: false })
      .limit(100) // Increased limit to show more reviews

    if (reviews && reviews.length > 0) {
      return (reviews as ReviewRow[]).map((r) => ({
        id: r.id,
        author: r.client_name || 'Client',
        rating: r.rating,
        date: new Date(r.created_at).toLocaleDateString('fr-FR', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        }),
        comment: r.comment || '',
        dateISO: r.created_at ? r.created_at.split('T')[0] : undefined,
        service: specialtyName || '',
        verified: false,
        hasPhoto: r.has_media || false,
      }))
    }

    // No fake reviews! Return empty array if no real reviews in database
    return []
  } catch {
    // On error, return empty array (no fake reviews!)
    return []
  }
}

function truncateTitle(title: string, maxLen = 42): string {
  if (title.length <= maxLen) return title
  return title.slice(0, maxLen - 1).replace(/\s+\S*$/, '') + '…'
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { service: specialtySlug, location: locationSlug, publicId } = await params

  // ─── QUARTIER DETECTION ──────────────────────────────────
  const quartierMatch = getNeighborhoodBySlug(locationSlug, publicId)
  if (quartierMatch) {
    const { city: ville, neighborhoodName: quartierName } = quartierMatch
    const staticSvc = staticPracticeAreas.find(s => s.slug === specialtySlug)
    if (!staticSvc) return { title: 'Non trouvé', robots: { index: false, follow: false } }

    const svcLower = staticSvc.name.toLowerCase()
    let attorneyCount = 0
    try { attorneyCount = await getAttorneyCountByServiceAndLocation(specialtySlug, locationSlug) } catch { /* best-effort */ }
    const hasProviders = attorneyCount > 0

    const tHash = Math.abs(hashCode(`sq-title-${specialtySlug}-${locationSlug}-${publicId}`))
    const titleTemplates = hasProviders
      ? [
          `${staticSvc.name} à ${quartierName}, ${ville.name} — ${attorneyCount} pros`,
          `${attorneyCount} ${svcLower}s à ${quartierName} (${ville.name})`,
          `${staticSvc.name} ${quartierName} ${ville.name} : devis gratuit`,
          `Trouver un ${svcLower} à ${quartierName}, ${ville.name}`,
        ]
      : [
          `${staticSvc.name} à ${quartierName}, ${ville.name} — Devis gratuit`,
          `${svcLower} à ${quartierName} (${ville.name}) : artisans vérifiés`,
          `Trouver un ${svcLower} à ${quartierName}, ${ville.name}`,
        ]
    const title = truncateTitle(titleTemplates[tHash % titleTemplates.length])

    const dHash = Math.abs(hashCode(`sq-desc-${specialtySlug}-${locationSlug}-${publicId}`))
    const descTemplates = hasProviders
      ? [
          `${attorneyCount} ${svcLower}s référencés à ${quartierName}, ${ville.name} (${ville.stateCode}). Devis gratuit en ${getStateByCode(ville.stateCode)?.region || ''}.`,
          `Comparez les ${svcLower}s à ${quartierName} (${ville.name}). ${attorneyCount} artisans vérifiés SIREN. Devis gratuit.`,
        ]
      : [
          `Trouvez un ${svcLower} qualifié à ${quartierName}, ${ville.name} (${ville.stateCode}). Artisans vérifiés, devis gratuit.`,
          `${svcLower} à ${quartierName} (${ville.name}) : annuaire d'artisans référencés en ${getStateByCode(ville.stateCode)?.region || ''}. Devis gratuit.`,
        ]
    const description = descTemplates[dHash % descTemplates.length]

    return {
      title,
      description,
      // All service×quartier pages indexed — rich content exists even with few providers
      openGraph: { title, description, type: 'website', locale: 'fr_FR', url: `${SITE_URL}/practice-areas/${specialtySlug}/${locationSlug}/${publicId}`, images: [{ url: getServiceImage(specialtySlug).src, width: 1200, height: 630, alt: title }] },
      twitter: { card: 'summary_large_image', title, description, images: [getServiceImage(specialtySlug).src] },
      alternates: { canonical: `${SITE_URL}/practice-areas/${specialtySlug}/${locationSlug}/${publicId}` },
    }
  }

  // ─── PROVIDER DETAIL (existing logic) ────────────────────
  try {
    // Parallel lookups to minimize total latency
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(publicId)
    const [stableIdResult, slugResult, service] = await Promise.all([
      (isUuid ? getAttorneyById(publicId) : getAttorneyByStableId(publicId)).catch(() => null),
      (isUuid ? Promise.resolve(null) : getAttorneyBySlug(publicId)).catch(() => null),
      getSpecialtyBySlug(specialtySlug).catch(() => null),
    ])
    const rawProvider = stableIdResult || slugResult
    if (!rawProvider) return { title: 'Artisan non trouvé', robots: { index: false, follow: false } }

    // Cast to access DB columns that TS can't infer from select('*')
    const provider = rawProvider as unknown as ProviderRecord

    // Resolve provider's real city (may be INSEE code in DB)
    const resolved = resolveProviderCity(provider)
    const realCity = resolved.address_city || provider.address_city || ''
    const displayName = provider.name || provider.business_name || 'Artisan'
    const specialtyName = service?.name || 'Artisan'

    // Compute canonical from provider's REAL data, not URL segments
    const canonicalPath = getAttorneyUrl({
      stable_id: provider.stable_id,
      slug: provider.slug,
      specialty: provider.specialty,
      city: realCity,
    })
    const ratingStr = provider.rating_average && Number(provider.rating_average) >= 1
      ? ` ${Number(provider.rating_average).toFixed(1)}★`
      : ''
    const title = truncateTitle(`${displayName} - ${specialtyName} à ${realCity}${ratingStr}`)

    const descParts: string[] = []
    descParts.push(`${displayName}, ${specialtyName.toLowerCase()} à ${realCity}`)
    if (provider.review_count && provider.review_count > 0) {
      descParts.push(`${provider.review_count} avis${provider.rating_average ? ` (${Number(provider.rating_average).toFixed(1)}/5)` : ''}`)
    }
    if (provider.siret) descParts.push('SIRET vérifié')
    descParts.push('Devis gratuit')
    const rawDesc = descParts.join(' · ') + '.'
    const description = rawDesc.length > 155 ? rawDesc.slice(0, 154).replace(/\s+\S*$/, '') + '…' : rawDesc

    // Noindex only if provider is explicitly flagged by admin.
    // Non-canonical URLs are handled by redirect() in the page component + alternates.canonical.
    // Previously also checked isWrongUrl, but this caused 710+ false noindex pages because
    // the sitemap used stable_id while getAttorneyUrl preferred slug.
    const shouldNoindex = provider.noindex === true

    const serviceImage = getServiceImage(specialtySlug)
    const ogAlt = `${displayName} - ${specialtyName} à ${realCity}`
    const ogImage = serviceImage.src

    return {
      title,
      description,
      robots: shouldNoindex
        ? { index: false, follow: true }
        : { index: true, follow: true, 'max-snippet': -1 as const, 'max-image-preview': 'large' as const, 'max-video-preview': -1 as const },
      openGraph: {
        title,
        description,
        type: 'profile',
        locale: 'fr_FR',
        url: `${SITE_URL}${canonicalPath}`,
        images: [{ url: ogImage, width: 1200, height: 630, alt: ogAlt }],
      },
      twitter: {
        card: 'summary_large_image' as const,
        title,
        description,
        images: [ogImage],
      },
      alternates: {
        canonical: `${SITE_URL}${canonicalPath}`,
      },
    }
  } catch {
    // Don't noindex on transient DB errors — ISR will retry and Google will recrawl.
    // Returning index:true prevents permanent noindex from temporary failures.
    return { title: 'Artisan non trouvé' }
  }
}

export default async function AttorneyPage({ params }: PageProps) {
  const { service: specialtySlug, location: locationSlug, publicId } = await params

  // ─── QUARTIER DETECTION ──────────────────────────────────
  const quartierMatch = getNeighborhoodBySlug(locationSlug, publicId)
  if (quartierMatch) {
    return <ServiceQuartierPage specialtySlug={specialtySlug} locationSlug={locationSlug} quartierSlug={publicId} />
  }

  // ─── PROVIDER DETAIL (existing logic) ────────────────────
  // Run ALL lookups in parallel to minimize total latency
  let provider: ProviderRecord | null = null
  let service: Service | null = null
  let location: Location | null = null

  try {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(publicId)
    const [stableIdResult, slugResult, svcResult, locResult] = await Promise.all([
      (isUuid ? getAttorneyById(publicId) : getAttorneyByStableId(publicId)).catch(() => null),
      (isUuid ? Promise.resolve(null) : getAttorneyBySlug(publicId)).catch(() => null),
      getSpecialtyBySlug(specialtySlug).catch(() => null),
      getLocationBySlug(locationSlug).catch(() => null),
    ])
    provider = (stableIdResult || slugResult) as ProviderRecord | null
    service = svcResult as Service | null
    location = locResult as Location | null
  } catch {
    // Graceful degradation
  }

  if (!provider) {
    notFound()
  }

  // Canonical redirect: if the URL segments don't match the canonical slugs, redirect
  // Use provider's REAL city (resolved from INSEE if needed), NOT the URL's location
  const resolvedProvider = resolveProviderCity(provider)
  const canonicalUrl = getAttorneyUrl({
    stable_id: provider.stable_id,
    slug: provider.slug,
    specialty: provider.specialty,
    city: resolvedProvider.address_city || provider.address_city,
  })
  const currentPath = `/practice-areas/${specialtySlug}/${locationSlug}/${publicId}`
  // Only redirect if canonical URL has a valid ID segment (avoid redirect to hub page)
  const canonicalId = canonicalUrl.split('/').pop()
  if (canonicalId && currentPath !== canonicalUrl) {
    redirect(canonicalUrl)
  }

  // Convert to Artisan format
  const artisan = convertToArtisan(provider, service, location, specialtySlug)

  // Fetch reviews and similar artisans in parallel (graceful degradation)
  let reviews: Review[] = []
  let similarArtisans: Awaited<ReturnType<typeof getSimilarArtisans>> = []
  try {
    ;[reviews, similarArtisans] = await Promise.all([
      getAttorneyReviews(provider.id, service?.name || artisan.specialty),
      getSimilarArtisans(provider.id, artisan.specialty, artisan.postal_code),
    ])
  } catch {
    // Graceful degradation — page renders without reviews/similar artisans
  }

  return (
    <>
      {/* Preload hints */}
      <link rel="dns-prefetch" href="//umjmbdbwcsxrvfqktiui.supabase.co" />

      {/* JSON-LD structured data (BreadcrumbList, LocalBusiness, ProfilePage, etc.)
           is rendered by AttorneySchema inside AttorneyPageClient — no duplicates here */}

      <AttorneyPageClient
        initialArtisan={artisan}
        initialReviews={reviews}
        attorneyId={provider.id}
        similarArtisans={similarArtisans}
        isClaimed={!!provider.user_id}
        hasSiret={!!provider.siret}
      />

      {/* ─── DEVIS CTA BANNER ────────────────────────────────── */}
      <section className="py-8 bg-gradient-to-r from-blue-50 to-blue-100 border-t border-b border-blue-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                Besoin de ce professionnel ?
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Demandez un devis gratuit et sans engagement.
              </p>
            </div>
            <Link
              href={`/quotes/${specialtySlug}/${locationSlug}`}
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-xl shadow-sm hover:shadow-md transition-all whitespace-nowrap"
            >
              Demander un devis gratuit
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* Lien retour vers le listing service+location (maillage bidirectionnel) */}
      <section className="py-6 bg-white border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link
            href={`/practice-areas/${specialtySlug}/${locationSlug}`}
            className="inline-flex items-center gap-2 px-5 py-3 bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-200 rounded-xl text-sm font-medium text-gray-700 hover:text-blue-700 transition-all"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Voir tous les {(service?.name || artisan.specialty).toLowerCase()}s à {artisan.city}
          </Link>
        </div>
      </section>

      {/* Internal Links — Maillage interne (SEO) */}
      <AttorneyInternalLinks
        specialtySlug={specialtySlug}
        locationSlug={locationSlug}
        specialtyName={service?.name || artisan.specialty}
        cityName={artisan.city}
        regionName={location?.region_name}
        departmentName={location?.department_name}
        departmentCode={location?.department_code}
      />

      {/* ─── EDITORIAL CREDIBILITY ──────────────────────────── */}
      <section className="mb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-slate-50 rounded-2xl border border-slate-200 p-6">
            <h3 className="text-sm font-semibold text-slate-700 mb-2">Informations sur ce profil</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Les informations de ce profil sont fournies par l&apos;artisan et vérifiées via l&apos;API SIRENE (INSEE). Les tarifs affichés, lorsqu&apos;ils sont renseignés, sont indicatifs et propres à cet artisan. Les avis sont collectés auprès de clients ayant fait appel à ses services. ServicesArtisans est un annuaire indépendant — nous facilitons la mise en relation mais ne garantissons pas les prestations.
            </p>
          </div>
        </div>
      </section>

      {/* Trust & Safety Links (E-E-A-T) */}
      <section className="py-8 bg-gray-50 border-t">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Confiance &amp; Sécurité
          </h2>
          <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
            <Link href="/verification-process" className="text-blue-600 hover:text-blue-800">
              Comment nous référençons les artisans
            </Link>
            <Link href="/review-policy" className="text-blue-600 hover:text-blue-800">
              Notre politique des avis
            </Link>
            <Link href="/mediation" className="text-blue-600 hover:text-blue-800">
              Service de médiation
            </Link>
          </nav>
        </div>
      </section>

      <EstimationWidget hideLauncher context={{
        metier: service?.name || artisan.specialty,
        metierSlug: specialtySlug,
        ville: artisan.city,
        departement: location?.department_code || '',
        pageUrl: `/practice-areas/${specialtySlug}/${locationSlug}/${publicId}`,
        artisan: {
          name: artisan.business_name || 'Artisan',
          slug: provider.slug || '',
          publicId: provider.stable_id || provider.slug || publicId,
        },
      }} />
    </>
  )
}
