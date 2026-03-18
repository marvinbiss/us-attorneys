/**
 * US Attorneys - Attorney Components
 * Barrel exports for all attorney profile and interaction components
 */

// --- Types ---
export * from './types'

// --- Profile Page Sections ---
export { AttorneyHero } from './AttorneyHero'
export { AttorneyStats } from './AttorneyStats'
export { AttorneyAbout } from './AttorneyAbout'
export { AttorneyServices } from './AttorneyServices'
export { AttorneyGallery } from './AttorneyGallery'
export { AttorneyReviews } from './AttorneyReviews'
export { AttorneyFAQ } from './AttorneyFAQ'
export { AttorneyMap } from './AttorneyMap'
export { AttorneySidebar, AttorneyMobileCTA } from './AttorneySidebar'
export { AttorneySchema } from './AttorneySchema'
export { AttorneyBreadcrumb } from './AttorneyBreadcrumb'
export { AttorneySimilar } from './AttorneySimilar'
export { default as SimilarAttorneys } from './SimilarAttorneys'
export { default as AttorneyInternalLinks } from './AttorneyInternalLinks'
export { AttorneyPhotoGrid } from './AttorneyPhotoGrid'
export { AttorneyCredentials } from './AttorneyCredentials'
export { AttorneyWhyChoose } from './AttorneyWhyChoose'

// --- Cards ---
export { AttorneyBusinessCard } from './AttorneyBusinessCard'
export { AttorneyContactCard } from './AttorneyContactCard'
export { AttorneyProfileCard } from './AttorneyProfileCard'

// --- Client Page ---
export { default as AttorneyPageClient } from './AttorneyPageClient'

// --- Skeletons ---
export { AttorneyPageSkeleton, AttorneyPhotoGridSkeleton, AttorneyHeroSkeleton, AttorneySidebarSkeleton } from './AttorneySkeleton'

// --- Trust & Social Proof ---
export { TrustScore } from './TrustScore'
export { AttorneyProfileStrength } from './AttorneyProfileStrength'
export { AttorneyUrgencyBanner } from './AttorneyUrgencyBanner'
export { AttorneyExitIntent } from './AttorneyExitIntent'
export { default as PeerEndorsements } from './PeerEndorsements'

// --- Actions & CTAs ---
export { QuoteRequestModal } from './QuoteRequestModal'
export { AttorneyQuoteForm } from './AttorneyQuoteForm'
export { ClaimButton } from './ClaimButton'
export { EndorseButton } from './EndorseButton'
export { RequestConsultationButton } from './RequestConsultationButton'
