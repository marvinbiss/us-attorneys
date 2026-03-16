'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { motion } from 'framer-motion'
import { AlertCircle, ArrowLeft, Heart } from 'lucide-react'
import {
  Review,
  getDisplayName,
  AttorneyHero,
  AttorneyStats,
  AttorneyAbout,
  AttorneyServices,
  AttorneySidebar,
  AttorneyMobileCTA,
  AttorneySchema,
  AttorneyBreadcrumb,
  AttorneyPhotoGridSkeleton,
} from '@/components/attorney'
import { AttorneyUrgencyBanner } from '@/components/attorney/AttorneyUrgencyBanner'
import { AttorneyWhyChoose } from '@/components/attorney/AttorneyWhyChoose'
import { AttorneyProfileStrength } from '@/components/attorney/AttorneyProfileStrength'
import { ShareButton } from '@/components/ui/ShareButton'
import { useFavorites } from '@/hooks/useFavorites'
import { ClaimButton } from '@/components/attorney/ClaimButton'
import type { LegacyArtisan } from '@/types/legacy'
import { BookingFunnel } from '@/lib/analytics/tracking'

// Dynamic import for exit intent (not needed on first paint)
const AttorneyExitIntent = dynamic(
  () => import('@/components/attorney/AttorneyExitIntent').then(mod => ({ default: mod.AttorneyExitIntent })),
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
const AttorneyPhotoGrid = dynamic(
  () => import('@/components/attorney/AttorneyPhotoGrid').then(mod => ({ default: mod.AttorneyPhotoGrid })),
  { loading: () => <AttorneyPhotoGridSkeleton /> }
)

// Reviews section with animations
const AttorneyReviews = dynamic(
  () => import('@/components/attorney/AttorneyReviews').then(mod => ({ default: mod.AttorneyReviews })),
  { loading: () => <SectionSkeleton height="h-96" /> }
)

// Map component with iframe
const AttorneyMap = dynamic(
  () => import('@/components/attorney/AttorneyMap').then(mod => ({ default: mod.AttorneyMap })),
  { loading: () => <SectionSkeleton height="h-80" /> }
)

// Similar attorneys carousel
const AttorneySimilar = dynamic(
  () => import('@/components/attorney/AttorneySimilar').then(mod => ({ default: mod.AttorneySimilar })),
  { loading: () => <SectionSkeleton height="h-72" /> }
)

// Inline quote request form
const AttorneyQuoteForm = dynamic(
  () => import('@/components/attorney/AttorneyQuoteForm').then(mod => ({ default: mod.AttorneyQuoteForm })),
  { loading: () => <SectionSkeleton height="h-80" /> }
)

// FAQ accordion
const AttorneyFAQ = dynamic(
  () => import('@/components/attorney/AttorneyFAQ').then(mod => ({ default: mod.AttorneyFAQ })),
  { loading: () => <SectionSkeleton height="h-64" /> }
)

// Business verification card
const AttorneyBusinessCard = dynamic(
  () => import('@/components/attorney/AttorneyBusinessCard').then(mod => ({ default: mod.AttorneyBusinessCard })),
  { loading: () => <SectionSkeleton height="h-64" /> }
)

// Contact card (sticky sidebar on desktop, section on mobile)
const AttorneyContactCard = dynamic(
  () => import('@/components/attorney/AttorneyContactCard').then(mod => ({ default: mod.AttorneyContactCard })),
  { loading: () => <SectionSkeleton height="h-72" /> }
)

interface SimilarAttorney {
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

interface AttorneyPageClientProps {
  initialArtisan: LegacyArtisan | null
  initialReviews: Review[]
  attorneyId: string
  similarAttorneys?: SimilarAttorney[]
  isClaimed?: boolean
  hasSiret?: boolean
}

export default function AttorneyPageClient({
  initialArtisan,
  initialReviews,
  attorneyId,
  similarAttorneys,
  isClaimed = true,
  hasSiret = false,
}: AttorneyPageClientProps) {
  const artisan = initialArtisan
  const reviews = initialReviews
  const { isFavorite, toggleFavorite } = useFavorites()

  // Track profile view
  useEffect(() => {
    if (artisan) {
      BookingFunnel.viewProfile(attorneyId, artisan.business_name || '', 'profile_page')
    }
  }, [artisan, attorneyId])

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
          <h1 className="text-2xl font-bold text-gray-900 font-heading mb-2">Attorney not found</h1>
          <p className="text-slate-600 mb-6">This attorney does not exist or is no longer available.</p>
          <Link
            href="/search"
            className="inline-flex items-center gap-2 px-6 py-3 bg-clay-400 text-white rounded-xl font-medium hover:bg-clay-600 transition-colors shadow-md shadow-glow-clay"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to search
          </Link>
        </motion.div>
      </div>
    )
  }

  const displayName = getDisplayName(artisan)

  return (
    <>
      {/* Schema.org JSON-LD */}
      <AttorneySchema artisan={artisan} reviews={reviews} />

      {/* Sticky trust proof bar */}

      {/* Skip links for keyboard navigation */}
      <nav aria-label="Quick links" className="sr-only focus-within:not-sr-only">
        <a
          href="#main-content"
          className="absolute top-4 left-4 z-50 bg-clay-400 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-white"
        >
          Skip to main content
        </a>
        <a
          href="#contact-sidebar"
          className="absolute top-4 left-4 z-50 bg-clay-400 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-white"
        >
          Skip to contact information
        </a>
      </nav>

      {/* pb-44 on mobile = CTA bar (~72px at bottom-16) + bottom nav (64px) + margin */}
      <div className="min-h-screen bg-sand-100 pb-44 md:pb-8">
        {/* Header */}
        <header className="bg-[#FFFCF8]/95 backdrop-blur-lg border-b border-stone-200/40 sticky top-0 z-40 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 py-3.5">
            <div className="flex items-center justify-between">
              <Link
                href="/search"
                className="inline-flex items-center gap-2 text-slate-600 hover:text-gray-900 transition-colors focus:outline-none focus:ring-2 focus:ring-clay-400 focus:ring-offset-2 rounded-lg px-2 py-1.5 -ml-2 hover:bg-sand-100"
                aria-label="Back to search"
              >
                <ArrowLeft className="w-5 h-5" aria-hidden="true" />
                <span className="hidden sm:inline font-medium text-sm">Back</span>
              </Link>

              <div className="flex items-center gap-2">
                <ShareButton
                  url={typeof window !== 'undefined' ? window.location.href : ''}
                  title={`Discover ${displayName}, attorney on US Attorneys`}
                  description={`${displayName} — ${artisan.specialty} in ${artisan.city}. View their profile on US Attorneys.`}
                  variant="icon"
                />
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => toggleFavorite(attorneyId)}
                  className={`p-2.5 rounded-full border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-clay-400 focus:ring-offset-2 ${
                    isFavorite(attorneyId)
                      ? 'bg-red-50 text-red-500 border-red-200 hover:bg-red-100'
                      : 'bg-gray-50 text-slate-600 border-gray-100 hover:bg-sand-200'
                  }`}
                  aria-label={isFavorite(attorneyId) ? 'Remove from favorites' : 'Add to favorites'}
                  aria-pressed={isFavorite(attorneyId)}
                >
                  <Heart className={`w-4.5 h-4.5 ${isFavorite(attorneyId) ? 'fill-current' : ''}`} aria-hidden="true" />
                </motion.button>
              </div>
            </div>
          </div>
        </header>

        {/* Main content */}
        <main id="main-content" className="max-w-7xl mx-auto px-4 py-6" aria-label={`${displayName}'s profile`}>
          {/* Breadcrumb */}
          <nav className="mb-6" aria-label="Breadcrumb">
            <AttorneyBreadcrumb artisan={artisan} />
          </nav>

          {/* Photo Grid - Airbnb style (full width, only if portfolio exists) */}
          {artisan.portfolio && artisan.portfolio.length > 0 && (
            <section className="mb-8" aria-label="Photo gallery">
              <AttorneyPhotoGrid artisan={artisan} />
            </section>
          )}

          {/* Grid layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left column - Main content */}
            <div className="lg:col-span-2 space-y-6">
              <section aria-label="Main information">
                <AttorneyHero artisan={artisan} />
              </section>
              <section aria-label="Availability and benefits">
                <AttorneyUrgencyBanner artisan={artisan} />
              </section>
              <section aria-label="Statistics">
                <AttorneyStats artisan={artisan} />
              </section>
              <section aria-label="About">
                <AttorneyAbout artisan={artisan} />
              </section>
              <section aria-label="Why choose this attorney">
                <AttorneyWhyChoose artisan={artisan} />
              </section>
              <section aria-label="Business card">
                <AttorneyBusinessCard artisan={artisan} />
              </section>
              {/* Mobile-only contact section (hidden on desktop where sidebar is visible) */}
              <section className="lg:hidden" aria-label="Contact this attorney">
                <AttorneyContactCard artisan={artisan} />
              </section>
              {!isClaimed && (
                <section className="lg:hidden" aria-label="Claim this profile">
                  <ClaimButton attorneyId={attorneyId} attorneyName={artisan.business_name || displayName} hasSiret={hasSiret} />
                </section>
              )}
              <section id="services" aria-label="Services and fees">
                <AttorneyServices artisan={artisan} />
              </section>
              <section id="consultation" aria-label="Request a consultation">
                <AttorneyQuoteForm artisan={artisan} />
              </section>
              <section id="reviews" aria-label="Client reviews">
                <AttorneyReviews artisan={artisan} reviews={reviews} />
              </section>
              <section aria-label="Frequently asked questions">
                <AttorneyFAQ artisan={artisan} />
              </section>
              <section aria-label="Location">
                <AttorneyMap artisan={artisan} />
              </section>
              <section aria-label="Similar attorneys">
                <AttorneySimilar artisan={artisan} similarAttorneys={similarAttorneys} />
              </section>
            </div>

            {/* Right column - Sticky sidebar */}
            <aside id="contact-sidebar" className="hidden lg:block" aria-label="Contact information">
              <div className="space-y-6 sticky top-20">
                <AttorneySidebar artisan={artisan} />
                <AttorneyProfileStrength artisan={artisan} />
                {!isClaimed && (
                  <ClaimButton attorneyId={attorneyId} attorneyName={artisan.business_name || displayName} hasSiret={hasSiret} />
                )}
              </div>
            </aside>
          </div>
        </main>

        {/* Mobile CTA */}
        <AttorneyMobileCTA artisan={artisan} />
      </div>

      {/* Exit intent slide-in */}
      <AttorneyExitIntent
        artisan={artisan}
        onOpenEstimation={() => window.dispatchEvent(new Event('sa:open-estimation'))}
      />
    </>
  )
}
