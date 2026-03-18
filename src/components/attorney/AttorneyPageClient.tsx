'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { motion } from 'framer-motion'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { AlertCircle, ArrowLeft, Heart } from 'lucide-react'
import {
  Review,
  getDisplayName,
  AttorneyHero,
  AttorneyAbout,
  AttorneyServices,
  AttorneyMobileCTA,
  AttorneySchema,
  AttorneyBreadcrumb,
} from '@/components/attorney'
import { ShareButton } from '@/components/ui/ShareButton'
import { useFavorites } from '@/hooks/useFavorites'
import { ClaimButton } from '@/components/attorney/ClaimButton'
import type { LegacyAttorney } from '@/types/legacy'
import type { AttorneyEnrichmentData } from '@/lib/attorney-enrichment'
import { BookingFunnel } from '@/lib/analytics/tracking'
import { ErrorBoundary } from '@/components/ErrorBoundary'

// Dynamic import for exit intent (not needed on first paint)
const AttorneyExitIntent = dynamic(
  () => import('@/components/attorney/AttorneyExitIntent').then(mod => ({ default: mod.AttorneyExitIntent })),
  { ssr: false }
)

// Loading skeleton for lazy-loaded sections
function SectionSkeleton({ height = 'h-64' }: { height?: string }) {
  return (
    <div className={`bg-[#FFFCF8] dark:bg-gray-800 rounded-2xl shadow-soft border border-stone-200/60 dark:border-gray-700 p-6 ${height} animate-pulse`}>
      <div className="h-6 w-40 bg-sand-300 dark:bg-gray-600 rounded-lg mb-4" />
      <div className="space-y-3">
        <div className="h-4 bg-sand-300 dark:bg-gray-600 rounded-lg w-full" />
        <div className="h-4 bg-sand-300 dark:bg-gray-600 rounded-lg w-3/4" />
        <div className="h-4 bg-sand-300 dark:bg-gray-600 rounded-lg w-1/2" />
      </div>
    </div>
  )
}

// ── Dynamic imports for heavy components (reduces initial bundle) ────────────

// Reviews section with animations
const AttorneyReviews = dynamic(
  () => import('@/components/attorney/AttorneyReviews').then(mod => ({ default: mod.AttorneyReviews })),
  { loading: () => <SectionSkeleton height="h-96" /> }
)

// Location & Contact (map + contact info + office hours)
const AttorneyMap = dynamic(
  () => import('@/components/attorney/AttorneyMap').then(mod => ({ default: mod.AttorneyMap })),
  { loading: () => <SectionSkeleton height="h-80" /> }
)

// Credentials (bar admissions, education, awards, trust score)
const AttorneyCredentials = dynamic(
  () => import('@/components/attorney/AttorneyCredentials').then(mod => ({ default: mod.AttorneyCredentials })),
  { loading: () => <SectionSkeleton height="h-64" /> }
)

// Similar attorneys carousel
const AttorneySimilar = dynamic(
  () => import('@/components/attorney/AttorneySimilar').then(mod => ({ default: mod.AttorneySimilar })),
  { loading: () => <SectionSkeleton height="h-72" /> }
)

// FAQ accordion
const AttorneyFAQ = dynamic(
  () => import('@/components/attorney/AttorneyFAQ').then(mod => ({ default: mod.AttorneyFAQ })),
  { loading: () => <SectionSkeleton height="h-64" /> }
)

// Video consultation booking widget
const BookingWidget = dynamic(
  () => import('@/components/booking/BookingWidget'),
  { loading: () => <SectionSkeleton height="h-80" /> }
)

// Peer Endorsements (for the sidebar)
const PeerEndorsements = dynamic(
  () => import('@/components/attorney/PeerEndorsements'),
  { loading: () => <SectionSkeleton height="h-48" /> }
)

// Endorse Button
const EndorseButton = dynamic(
  () => import('@/components/attorney/EndorseButton').then(mod => ({ default: mod.EndorseButton })),
  { ssr: false }
)

// Profile strength (sidebar only)
const AttorneyProfileStrength = dynamic(
  () => import('@/components/attorney/AttorneyProfileStrength').then(mod => ({ default: mod.AttorneyProfileStrength })),
  { loading: () => <SectionSkeleton height="h-32" /> }
)

// Sidebar contact card
const AttorneySidebar = dynamic(
  () => import('@/components/attorney/AttorneySidebar').then(mod => ({ default: mod.AttorneySidebar })),
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

interface AttorneySpecialty {
  id: string
  name: string
  slug: string
}

interface AttorneyPageClientProps {
  initialAttorney: LegacyAttorney | null
  initialReviews: Review[]
  attorneyId: string
  similarAttorneys?: SimilarAttorney[]
  isClaimed?: boolean
  hasBarNumber?: boolean
  trustScore?: number
  trustScoreBreakdown?: Record<string, number>
  endorsementCount?: number
  attorneySpecialties?: AttorneySpecialty[]
  enrichment?: AttorneyEnrichmentData
}

export default function AttorneyPageClient({
  initialAttorney,
  initialReviews,
  attorneyId,
  similarAttorneys,
  isClaimed = true,
  hasBarNumber = false,
  trustScore = 0,
  trustScoreBreakdown,
  endorsementCount = 0,
  attorneySpecialties = [],
  enrichment,
}: AttorneyPageClientProps) {
  const reducedMotion = useReducedMotion()
  const attorney = initialAttorney
  const reviews = initialReviews
  const { isFavorite, toggleFavorite } = useFavorites()

  // Track profile view
  useEffect(() => {
    if (attorney) {
      BookingFunnel.viewProfile(attorneyId, attorney.business_name || '', 'profile_page')
    }
  }, [attorney, attorneyId])

  // Not found state
  if (!attorney) {
    return (
      <div className="min-h-screen bg-sand-100 dark:bg-gray-900 flex items-center justify-center">
        <motion.div
          initial={reducedMotion ? false : { opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={reducedMotion ? { duration: 0 } : undefined}
          className="text-center p-8"
        >
          <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 font-heading mb-2">Attorney not found</h1>
          <p className="text-slate-600 dark:text-gray-400 mb-6">This attorney does not exist or is no longer available.</p>
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

  const displayName = getDisplayName(attorney)

  // Check if credentials section has any data to show
  const hasEnrichment = enrichment && (
    enrichment.education.length > 0 ||
    enrichment.awards.length > 0 ||
    enrichment.publications.length > 0 ||
    enrichment.disciplinary.length > 0
  )
  const hasBusinessData = !!attorney.bar_number || !!attorney.creation_date || !!attorney.legal_form || (attorney.team_size != null && attorney.team_size >= 0)
  const hasCredentials = hasEnrichment || hasBusinessData || trustScore > 0

  return (
    <>
      {/* Schema.org JSON-LD */}
      <AttorneySchema attorney={attorney} reviews={reviews} />

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
      <div className="min-h-screen bg-sand-100 dark:bg-gray-900 pb-44 md:pb-8">
        {/* Header */}
        <header className="bg-[#FFFCF8]/95 dark:bg-gray-800/95 backdrop-blur-lg border-b border-stone-200/40 dark:border-gray-700 sticky top-0 z-40 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 py-3.5">
            <div className="flex items-center justify-between">
              <Link
                href="/search"
                className="inline-flex items-center gap-2 text-slate-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-clay-400 focus:ring-offset-2 rounded-lg px-2 py-1.5 -ml-2 hover:bg-sand-100 dark:hover:bg-gray-700"
                aria-label="Back to search"
              >
                <ArrowLeft className="w-5 h-5" aria-hidden="true" />
                <span className="hidden sm:inline font-medium text-sm">Back</span>
              </Link>

              <div className="flex items-center gap-2">
                <ShareButton
                  url={typeof window !== 'undefined' ? window.location.href : ''}
                  title={`Discover ${displayName}, attorney on US Attorneys`}
                  description={`${displayName} — ${attorney.specialty} in ${attorney.city}. View their profile on US Attorneys.`}
                  variant="icon"
                />
                <motion.button
                  whileHover={reducedMotion ? undefined : { scale: 1.05 }}
                  whileTap={reducedMotion ? undefined : { scale: 0.95 }}
                  onClick={() => toggleFavorite(attorneyId)}
                  className={`p-2.5 rounded-full border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-clay-400 focus:ring-offset-2 ${
                    isFavorite(attorneyId)
                      ? 'bg-red-50 text-red-500 border-red-200 hover:bg-red-100'
                      : 'bg-gray-50 dark:bg-gray-700 text-slate-600 dark:text-gray-400 border-gray-100 dark:border-gray-600 hover:bg-sand-200 dark:hover:bg-gray-600'
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
            <AttorneyBreadcrumb attorney={attorney} />
          </nav>

          {/* ────────────────────────────────────────────────────────────
              8-SECTION LAYOUT (Doctolib-inspired)
              Grid: main content (2/3) + sticky sidebar (1/3)
              ──────────────────────────────────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left column - Main content (8 sections) */}
            <div className="lg:col-span-2 space-y-6">

              {/* ── SECTION 1: HERO ──────────────────────────────────── */}
              {/* Photo + Name + "Next available" badge + primary CTA + verified badge + rating stars */}
              <section aria-label="Attorney profile overview">
                <AttorneyHero attorney={attorney} />
              </section>

              {/* ── SECTION 2: ABOUT ─────────────────────────────────── */}
              {/* Bio + years of experience + "Why choose" cards */}
              <section aria-label="About this attorney">
                <AttorneyAbout attorney={attorney} />
              </section>

              {/* ── SECTION 3: PRACTICE AREAS ────────────────────────── */}
              {/* Tags/chips of specialties with links + fee schedule */}
              <section id="services" aria-label="Practice areas and fees">
                <AttorneyServices attorney={attorney} />
              </section>

              {/* ── SECTION 4: REVIEWS ───────────────────────────────── */}
              {/* Structured reviews with composite score */}
              <section id="reviews" aria-label="Client reviews">
                <AttorneyReviews attorney={attorney} reviews={reviews} />
              </section>

              {/* ── SECTION 5: LOCATION & CONTACT ────────────────────── */}
              {/* Address + map + phone + email + office hours */}
              <section aria-label="Location and contact information">
                <AttorneyMap attorney={attorney} />
              </section>

              {/* ── SECTION 6: CREDENTIALS ───────────────────────────── */}
              {/* Bar admissions + certifications + trust score + education + awards */}
              {hasCredentials && (
                <section aria-label="Credentials and bar admissions">
                  <AttorneyCredentials
                    enrichment={enrichment || { education: [], awards: [], publications: [], disciplinary: [] }}
                    attorney={attorney}
                    trustScore={trustScore}
                    trustScoreBreakdown={trustScoreBreakdown}
                  />
                </section>
              )}

              {/* ── SECTION 7: SIMILAR ATTORNEYS ─────────────────────── */}
              {/* 4-6 cards of similar attorneys */}
              <section aria-label="Similar attorneys">
                <AttorneySimilar attorney={attorney} similarAttorneys={similarAttorneys} />
              </section>

              {/* ── SECTION 8: FAQ ───────────────────────────────────── */}
              {/* Practice-area specific FAQs with schema markup */}
              <section aria-label="Frequently asked questions">
                <AttorneyFAQ attorney={attorney} />
              </section>
            </div>

            {/* Right column - Sticky sidebar */}
            <aside id="contact-sidebar" className="hidden lg:block" aria-label="Contact information">
              <div className="space-y-6 sticky top-20">
                <AttorneySidebar attorney={attorney} />
                <ErrorBoundary fallback={null}>
                  <BookingWidget
                    attorneyId={attorneyId}
                    attorneyName={attorney.business_name || displayName}
                    specialty={attorney.specialty}
                  />
                </ErrorBoundary>
                <PeerEndorsements
                  attorneyId={attorneyId}
                  endorsementCount={endorsementCount}
                />
                <div>
                  <EndorseButton
                    endorsedAttorneyId={attorneyId}
                    endorsedAttorneyName={displayName}
                    specialties={attorneySpecialties}
                  />
                </div>
                <AttorneyProfileStrength attorney={attorney} />
                {!isClaimed && (
                  <ClaimButton attorneyId={attorneyId} attorneyName={attorney.business_name || displayName} hasBarNumber={hasBarNumber} />
                )}
              </div>
            </aside>
          </div>

          {/* Mobile-only: Booking widget + Claim button (visible below main content) */}
          <div className="lg:hidden mt-6 space-y-4">
            <ErrorBoundary fallback={null}>
              <BookingWidget
                attorneyId={attorneyId}
                attorneyName={attorney.business_name || displayName}
                specialty={attorney.specialty}
              />
            </ErrorBoundary>
            {!isClaimed && (
              <ClaimButton attorneyId={attorneyId} attorneyName={attorney.business_name || displayName} hasBarNumber={hasBarNumber} />
            )}
          </div>
        </main>

        {/* Mobile CTA */}
        <AttorneyMobileCTA attorney={attorney} />
      </div>

      {/* Exit intent slide-in */}
      <AttorneyExitIntent
        attorney={attorney}
        onOpenEstimation={() => window.dispatchEvent(new Event('sa:open-estimation'))}
      />
    </>
  )
}
