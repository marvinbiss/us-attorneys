'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { motion } from 'framer-motion'
import { AlertCircle, ArrowLeft, Heart } from 'lucide-react'
import {
  Review,
  getDisplayName,
  ArtisanHero,
  ArtisanStats,
  ArtisanAbout,
  ArtisanServices,
  ArtisanSidebar,
  ArtisanMobileCTA,
  ArtisanSchema,
  ArtisanBreadcrumb,
  ArtisanPhotoGridSkeleton,
} from '@/components/artisan'
import { ArtisanUrgencyBanner } from '@/components/artisan/ArtisanUrgencyBanner'
import { ArtisanWhyChoose } from '@/components/artisan/ArtisanWhyChoose'
import { ArtisanProfileStrength } from '@/components/artisan/ArtisanProfileStrength'
import { ShareButton } from '@/components/ui/ShareButton'
import { useFavorites } from '@/hooks/useFavorites'
import { ClaimButton } from '@/components/artisan/ClaimButton'
import type { LegacyArtisan } from '@/types/legacy'
import { BookingFunnel } from '@/lib/analytics/tracking'

// Dynamic import for exit intent (not needed on first paint)
const ArtisanExitIntent = dynamic(
  () => import('@/components/artisan/ArtisanExitIntent').then(mod => ({ default: mod.ArtisanExitIntent })),
  { ssr: false }
)

// Loading skeleton for lazy-loaded sections
function SectionSkeleton({ height = 'h-64' }: { height?: string }) {
  return (
    <div className={`bg-[#FFFCF8] rounded-2xl shadow-soft border border-stone-200/60 p-6 ${height} animate-pulse`}>
      <div className="h-6 w-40 bg-sand-300 rounded-lg mb-4" />
      <div className="space-y-3">
        <div className="h-4 bg-sand-300 rounded-lg w-full" />
        <div className="h-4 bg-sand-300 rounded-lg w-3/4" />
        <div className="h-4 bg-sand-300 rounded-lg w-1/2" />
      </div>
    </div>
  )
}

// Dynamic imports for heavy components - reduces initial bundle
// These components load lazily to reduce initial page bundle size

// Photo grid with lightbox (heavy - includes next/image + lightbox)
const ArtisanPhotoGrid = dynamic(
  () => import('@/components/artisan/ArtisanPhotoGrid').then(mod => ({ default: mod.ArtisanPhotoGrid })),
  { loading: () => <ArtisanPhotoGridSkeleton /> }
)

// Reviews section with animations
const ArtisanReviews = dynamic(
  () => import('@/components/artisan/ArtisanReviews').then(mod => ({ default: mod.ArtisanReviews })),
  { loading: () => <SectionSkeleton height="h-96" /> }
)

// Map component with iframe
const ArtisanMap = dynamic(
  () => import('@/components/artisan/ArtisanMap').then(mod => ({ default: mod.ArtisanMap })),
  { loading: () => <SectionSkeleton height="h-80" /> }
)

// Similar artisans carousel
const ArtisanSimilar = dynamic(
  () => import('@/components/artisan/ArtisanSimilar').then(mod => ({ default: mod.ArtisanSimilar })),
  { loading: () => <SectionSkeleton height="h-72" /> }
)

// Inline quote request form
const ArtisanQuoteForm = dynamic(
  () => import('@/components/artisan/ArtisanQuoteForm').then(mod => ({ default: mod.ArtisanQuoteForm })),
  { loading: () => <SectionSkeleton height="h-80" /> }
)

// FAQ accordion
const ArtisanFAQ = dynamic(
  () => import('@/components/artisan/ArtisanFAQ').then(mod => ({ default: mod.ArtisanFAQ })),
  { loading: () => <SectionSkeleton height="h-64" /> }
)

// Business verification card
const ArtisanBusinessCard = dynamic(
  () => import('@/components/artisan/ArtisanBusinessCard').then(mod => ({ default: mod.ArtisanBusinessCard })),
  { loading: () => <SectionSkeleton height="h-64" /> }
)

// Contact card (sticky sidebar on desktop, section on mobile)
const ArtisanContactCard = dynamic(
  () => import('@/components/artisan/ArtisanContactCard').then(mod => ({ default: mod.ArtisanContactCard })),
  { loading: () => <SectionSkeleton height="h-72" /> }
)

interface SimilarArtisan {
  id: string
  stable_id?: string
  slug?: string
  name: string
  specialty: string
  rating: number
  reviews: number
  city: string
  is_verified?: boolean
}

interface ArtisanPageClientProps {
  initialArtisan: LegacyArtisan | null
  initialReviews: Review[]
  artisanId: string
  similarArtisans?: SimilarArtisan[]
  isClaimed?: boolean
  hasSiret?: boolean
}

export default function ArtisanPageClient({
  initialArtisan,
  initialReviews,
  artisanId,
  similarArtisans,
  isClaimed = true,
  hasSiret = false,
}: ArtisanPageClientProps) {
  const artisan = initialArtisan
  const reviews = initialReviews
  const { isFavorite, toggleFavorite } = useFavorites()

  // Track profile view
  useEffect(() => {
    if (artisan) {
      BookingFunnel.viewProfile(artisanId, artisan.business_name || '', 'profile_page')
    }
  }, [artisan, artisanId])

  // Not found state
  if (!artisan) {
    return (
      <div className="min-h-screen bg-sand-100 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center p-8"
        >
          <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 font-heading mb-2">Artisan non trouvé</h1>
          <p className="text-slate-600 mb-6">Cet artisan n&apos;existe pas ou n&apos;est plus disponible.</p>
          <Link
            href="/recherche"
            className="inline-flex items-center gap-2 px-6 py-3 bg-clay-400 text-white rounded-xl font-medium hover:bg-clay-600 transition-colors shadow-md shadow-glow-clay"
          >
            <ArrowLeft className="w-5 h-5" />
            Retour à la recherche
          </Link>
        </motion.div>
      </div>
    )
  }

  const displayName = getDisplayName(artisan)

  return (
    <>
      {/* Schema.org JSON-LD */}
      <ArtisanSchema artisan={artisan} reviews={reviews} />

      {/* Sticky trust proof bar */}

      {/* Skip links for keyboard navigation */}
      <nav aria-label="Liens rapides" className="sr-only focus-within:not-sr-only">
        <a
          href="#main-content"
          className="absolute top-4 left-4 z-50 bg-clay-400 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-white"
        >
          Aller au contenu principal
        </a>
        <a
          href="#contact-sidebar"
          className="absolute top-4 left-4 z-50 bg-clay-400 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-white"
        >
          Aller aux informations de contact
        </a>
      </nav>

      {/* pb-44 on mobile = CTA bar (~72px at bottom-16) + bottom nav (64px) + margin */}
      <div className="min-h-screen bg-sand-100 pb-44 md:pb-8">
        {/* Header */}
        <header className="bg-[#FFFCF8]/95 backdrop-blur-lg border-b border-stone-200/40 sticky top-0 z-40 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 py-3.5">
            <div className="flex items-center justify-between">
              <Link
                href="/recherche"
                className="inline-flex items-center gap-2 text-slate-600 hover:text-gray-900 transition-colors focus:outline-none focus:ring-2 focus:ring-clay-400 focus:ring-offset-2 rounded-lg px-2 py-1.5 -ml-2 hover:bg-sand-100"
                aria-label="Retour à la recherche"
              >
                <ArrowLeft className="w-5 h-5" aria-hidden="true" />
                <span className="hidden sm:inline font-medium text-sm">Retour</span>
              </Link>

              <div className="flex items-center gap-2">
                <ShareButton
                  url={typeof window !== 'undefined' ? window.location.href : ''}
                  title={`D\u00e9couvrez ${displayName}, artisan sur ServicesArtisans`}
                  description={`${displayName} \u2014 ${artisan.specialty} \u00e0 ${artisan.city}. Consultez son profil sur ServicesArtisans.`}
                  variant="icon"
                />
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => toggleFavorite(artisanId)}
                  className={`p-2.5 rounded-full border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-clay-400 focus:ring-offset-2 ${
                    isFavorite(artisanId)
                      ? 'bg-red-50 text-red-500 border-red-200 hover:bg-red-100'
                      : 'bg-gray-50 text-slate-600 border-gray-100 hover:bg-sand-200'
                  }`}
                  aria-label={isFavorite(artisanId) ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                  aria-pressed={isFavorite(artisanId)}
                >
                  <Heart className={`w-4.5 h-4.5 ${isFavorite(artisanId) ? 'fill-current' : ''}`} aria-hidden="true" />
                </motion.button>
              </div>
            </div>
          </div>
        </header>

        {/* Main content */}
        <main id="main-content" className="max-w-7xl mx-auto px-4 py-6" aria-label={`Profil de ${displayName}`}>
          {/* Breadcrumb */}
          <nav className="mb-6" aria-label="Fil d'Ariane">
            <ArtisanBreadcrumb artisan={artisan} />
          </nav>

          {/* Photo Grid - Airbnb style (full width, only if portfolio exists) */}
          {artisan.portfolio && artisan.portfolio.length > 0 && (
            <section className="mb-8" aria-label="Galerie photos">
              <ArtisanPhotoGrid artisan={artisan} />
            </section>
          )}

          {/* Grid layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left column - Main content */}
            <div className="lg:col-span-2 space-y-6">
              <section aria-label="Informations principales">
                <ArtisanHero artisan={artisan} />
              </section>
              <section aria-label="Disponibilité et avantages">
                <ArtisanUrgencyBanner artisan={artisan} />
              </section>
              <section aria-label="Statistiques">
                <ArtisanStats artisan={artisan} />
              </section>
              <section aria-label="À propos">
                <ArtisanAbout artisan={artisan} />
              </section>
              <section aria-label="Pourquoi choisir cet artisan">
                <ArtisanWhyChoose artisan={artisan} />
              </section>
              <section aria-label="Fiche entreprise">
                <ArtisanBusinessCard artisan={artisan} />
              </section>
              {/* Mobile-only contact section (hidden on desktop where sidebar is visible) */}
              <section className="lg:hidden" aria-label="Contacter cet artisan">
                <ArtisanContactCard artisan={artisan} />
              </section>
              {!isClaimed && (
                <section className="lg:hidden" aria-label="Revendiquer cette fiche">
                  <ClaimButton providerId={artisanId} providerName={artisan.business_name || displayName} hasSiret={hasSiret} />
                </section>
              )}
              <section id="services" aria-label="Services et tarifs">
                <ArtisanServices artisan={artisan} />
              </section>
              <section id="devis" aria-label="Demande de devis">
                <ArtisanQuoteForm artisan={artisan} />
              </section>
              <section id="reviews" aria-label="Avis clients">
                <ArtisanReviews artisan={artisan} reviews={reviews} />
              </section>
              <section aria-label="Questions fréquentes">
                <ArtisanFAQ artisan={artisan} />
              </section>
              <section aria-label="Localisation">
                <ArtisanMap artisan={artisan} />
              </section>
              <section aria-label="Artisans similaires">
                <ArtisanSimilar artisan={artisan} similarArtisans={similarArtisans} />
              </section>
            </div>

            {/* Right column - Sticky sidebar */}
            <aside id="contact-sidebar" className="hidden lg:block" aria-label="Informations de contact">
              <div className="space-y-6 sticky top-20">
                <ArtisanSidebar artisan={artisan} />
                <ArtisanProfileStrength artisan={artisan} />
                {!isClaimed && (
                  <ClaimButton providerId={artisanId} providerName={artisan.business_name || displayName} hasSiret={hasSiret} />
                )}
              </div>
            </aside>
          </div>
        </main>

        {/* Mobile CTA */}
        <ArtisanMobileCTA artisan={artisan} />
      </div>

      {/* Exit intent slide-in */}
      <ArtisanExitIntent
        artisan={artisan}
        onOpenEstimation={() => window.dispatchEvent(new Event('sa:open-estimation'))}
      />
    </>
  )
}
