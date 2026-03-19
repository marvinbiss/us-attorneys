/**
 * US Attorneys - UI Components
 * Barrel exports for all reusable UI components
 */

// --- Core Form Elements ---
export { default as Button } from './Button'
export type { ButtonProps } from './Button'

export { default as Input } from './Input'
export type { InputProps } from './Input'

export { default as Textarea } from './Textarea'
export type { TextareaProps } from './Textarea'

export { default as Select } from './Select'
export type { SelectProps, SelectOption } from './Select'

// --- Display Components ---
export { default as Badge, StatusBadge, SlotBadge } from './Badge'
export type { BadgeProps } from './Badge'

export { default as Logo, Tagline, BrandHeader } from './Logo'
export type { LogoProps } from './Logo'

export { default as Avatar, AvatarGroup } from './Avatar'
export type { AvatarProps, AvatarGroupProps } from './Avatar'

export { default as Card, CardHeader, CardContent, CardFooter } from './Card'
export type { CardProps, CardHeaderProps, CardContentProps, CardFooterProps } from './Card'

export { Modal, ConfirmModal } from './Modal'
export type { ModalProps, ConfirmModalProps } from './Modal'

export { Toast, ToastContainer } from './Toast'

export { Pagination } from './Pagination'
export { PaginationNav } from './PaginationNav'

// --- Loading & Skeleton ---
export { Loading, LoadingPage, LoadingOverlay, LoadingButton } from './Loading'

export { Skeleton, CardSkeleton, ListSkeleton, GridSkeleton, PageSkeleton, FormSkeleton } from './Skeleton'

// --- Empty & Error States ---
export { default as EmptyState } from './EmptyState'
export type { EmptyStateProps } from './EmptyState'

// --- Trust & Social Proof ---
export {
  TrustBadges,
  CertificationBadge,
  SocialProofCounter,
  AvailabilityBadge,
  VerifiedBadge,
  RatingStars,
} from './TrustBadges'

// --- Search ---
export { SearchBar } from './SearchBar'

// --- Attorney Cards ---
export { AttorneyCard, AttorneyGrid } from './AttorneyCard'

// --- Autocomplete ---
export { CityAutocomplete } from './VilleAutocomplete'
export { SpecialtyAutocomplete } from './SpecialtyAutocomplete'

// --- Animations (Framer Motion) ---
export { default as AnimateOnScroll } from './AnimateOnScroll'
export { default as PageTransition } from './PageTransition'
export { ScrollReveal } from './ScrollReveal'
export { StaggerGrid, StaggerItem } from './StaggerGrid'

// --- Interactive Buttons ---
export { CompareButton } from './CompareButton'
export { FavoriteButton } from './FavoriteButton'
export { ShareButton } from './ShareButton'

// --- Layout ---
export { SectionDivider } from './SectionDivider'

// --- Theme ---
export { ThemeToggle } from './theme-toggle'
