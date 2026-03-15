/**
 * US Attorneys - UI Components
 * World-class branded components
 */

export { default as Button } from './Button'
export type { ButtonProps } from './Button'

export { default as Badge, StatusBadge, SlotBadge } from './Badge'
export type { BadgeProps } from './Badge'

export { default as Logo, Tagline, BrandHeader } from './Logo'
export type { LogoProps } from './Logo'

export { default as Input } from './Input'
export type { InputProps } from './Input'

export { default as Textarea } from './Textarea'
export type { TextareaProps } from './Textarea'

export { default as Select } from './Select'
export type { SelectProps, SelectOption } from './Select'

export { Skeleton, CardSkeleton, ListSkeleton, GridSkeleton, PageSkeleton, FormSkeleton } from './Skeleton'

export { default as Card, CardHeader, CardContent, CardFooter } from './Card'
export type { CardProps, CardHeaderProps, CardContentProps, CardFooterProps } from './Card'

export { Modal, ConfirmModal } from './Modal'
export type { ModalProps, ConfirmModalProps } from './Modal'

export { default as Avatar, AvatarGroup } from './Avatar'
export type { AvatarProps, AvatarGroupProps } from './Avatar'

export { Toast, ToastContainer } from './Toast'

export { Pagination } from './Pagination'

export { Loading, LoadingPage, LoadingOverlay, LoadingButton } from './Loading'

// Trust & Social Proof (2026 design patterns)
export {
  TrustBadges,
  CertificationBadge,
  SocialProofCounter,
  AvailabilityBadge,
  VerifiedBadge,
  RatingStars,
} from './TrustBadges'

// Search (Doctolib-style)
export { SearchBar } from './SearchBar'

// Artisan Cards (Airbnb-style)
export { AttorneyCard, ArtisanGrid } from './AttorneyCard'

// Autocomplete (World-class, Stripe/Doctolib-style)
export { VilleAutocomplete } from './VilleAutocomplete'
// AdresseAutocomplete removed (French data.gouv.fr API)
// SiretAutocomplete removed (French SIRET validation)
export { MetierAutocomplete } from './MetierAutocomplete'

// Scroll-triggered animations (Framer Motion)
export { ScrollReveal } from './ScrollReveal'
export { StaggerGrid, StaggerItem } from './StaggerGrid'

// Layout
export { SectionDivider } from './SectionDivider'
