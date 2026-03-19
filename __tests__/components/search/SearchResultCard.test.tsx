/**
 * SearchResultCard Component -- Unit Tests
 * Tests: renders attorney data, subscription tier badges, verified badge,
 *        rating display, practice areas, location, compare toggle
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SearchResultCard, type SearchAttorney } from '@/components/search/SearchResultCard'

// ── Mocks ────────────────────────────────────────────────────────────────

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: React.PropsWithChildren<{ href: string }>) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}))

// Mock lucide-react icons
vi.mock('lucide-react', () => {
  const iconComponent = ({ className, ...props }: Record<string, unknown>) => (
    <span data-testid="icon" className={className as string} {...props} />
  )
  return {
    Star: iconComponent,
    MapPin: iconComponent,
    Phone: iconComponent,
    Shield: iconComponent,
    Briefcase: iconComponent,
    ChevronRight: iconComponent,
    Award: iconComponent,
    GraduationCap: iconComponent,
    ChevronDown: iconComponent,
    Globe: iconComponent,
    MessageCircle: iconComponent,
    Scale: iconComponent,
  }
})

// Mock cn utility
vi.mock('@/lib/utils', () => ({
  cn: (...args: unknown[]) => args.filter(Boolean).join(' '),
}))

// Mock UI components
vi.mock('@/components/ui/AvailabilityBadge', () => ({
  AvailabilityBadge: ({ slot }: { slot: unknown }) =>
    slot ? <span data-testid="availability-badge">Available</span> : null,
}))

vi.mock('@/components/ui/VerifiedBadge', () => ({
  VerifiedAttorneyBadge: ({ isVerified }: { isVerified: boolean }) =>
    isVerified ? <span data-testid="verified-badge">Verified</span> : null,
}))

vi.mock('@/components/ui/ResponseTimeBadge', () => ({
  ResponseTimeBadge: ({ responseTimeHours }: { responseTimeHours: number }) => (
    <span data-testid="response-time-badge">{responseTimeHours}h</span>
  ),
}))

vi.mock('@/components/ui/SubscriptionBadge', () => ({
  SubscriptionBadge: ({ tier }: { tier: string }) => (
    <span data-testid="subscription-badge">{tier}</span>
  ),
}))

vi.mock('@/components/booking/ConsultationModal', () => ({
  ConsultationModal: () => null,
}))

// Mock compare provider
const mockAddToCompare = vi.fn()
const mockRemoveFromCompare = vi.fn()
vi.mock('@/components/compare/CompareProvider', () => ({
  useCompare: () => ({
    addToCompare: mockAddToCompare,
    removeFromCompare: mockRemoveFromCompare,
    isInCompare: () => false,
    isFull: false,
  }),
}))

// Mock ranking helper
vi.mock('@/lib/search/ranking', () => ({
  getSubscriptionTier: (boostLevel: number | null) => {
    if (boostLevel && boostLevel >= 2) return 'premium'
    if (boostLevel && boostLevel >= 1) return 'pro'
    return 'free'
  },
}))

// Mock availability type
vi.mock('@/lib/availability', () => ({}))
vi.mock('@/lib/billing/cpa-model', () => ({}))

// ── Helpers ──────────────────────────────────────────────────────────────

const baseAttorney: SearchAttorney = {
  id: 'att-1',
  name: 'Jane Smith',
  slug: 'jane-smith',
  specialty_slug: 'personal-injury',
  specialty_name: 'Personal Injury',
  address_city: 'New York',
  address_state: 'NY',
  address_county: 'Test County',
  is_verified: true,
  rating_average: 4.8,
  review_count: 25,
  phone: '(212) 555-1234',
  bar_number: '123456',
  is_featured: false,
  years_experience: 15,
  consultation_fee: 0,
  languages: ['English', 'Spanish'],
  response_time_hours: 2,
  practice_areas: [
    { slug: 'personal-injury', name: 'Personal Injury' },
    { slug: 'car-accidents', name: 'Car Accidents' },
    { slug: 'medical-malpractice', name: 'Medical Malpractice' },
  ],
}

beforeEach(() => {
  vi.clearAllMocks()
})

// ── Tests ────────────────────────────────────────────────────────────────

describe('SearchResultCard', () => {
  it('renders attorney name', () => {
    render(<SearchResultCard attorney={baseAttorney} index={0} />)
    expect(screen.getByText('Jane Smith')).toBeInTheDocument()
  })

  it('renders location info', () => {
    render(<SearchResultCard attorney={baseAttorney} index={0} />)
    expect(screen.getByText('New York, NY')).toBeInTheDocument()
  })

  it('renders specialty name', () => {
    render(<SearchResultCard attorney={baseAttorney} index={0} />)
    // "Personal Injury" appears as specialty_name in the info section and as a practice_area tag
    expect(screen.getAllByText('Personal Injury').length).toBeGreaterThanOrEqual(1)
  })

  it('renders rating with correct values', () => {
    render(<SearchResultCard attorney={baseAttorney} index={0} />)
    expect(screen.getByText('4.8')).toBeInTheDocument()
    expect(screen.getByText('(25 reviews)')).toBeInTheDocument()
  })

  it('renders bar number', () => {
    render(<SearchResultCard attorney={baseAttorney} index={0} />)
    expect(screen.getByText(/123456/)).toBeInTheDocument()
  })

  it('renders phone number on desktop', () => {
    render(<SearchResultCard attorney={baseAttorney} index={0} />)
    expect(screen.getByText('(212) 555-1234')).toBeInTheDocument()
  })

  it('shows "Free consultation" badge when fee is 0', () => {
    render(<SearchResultCard attorney={baseAttorney} index={0} />)
    expect(screen.getByText('Free consultation')).toBeInTheDocument()
  })

  it('does not show "Free consultation" when fee is non-zero', () => {
    const attorney = { ...baseAttorney, consultation_fee: 100 }
    render(<SearchResultCard attorney={attorney} index={0} />)
    expect(screen.queryByText('Free consultation')).not.toBeInTheDocument()
  })

  it('renders verified badge for verified attorneys', () => {
    render(<SearchResultCard attorney={baseAttorney} index={0} />)
    expect(screen.getByTestId('verified-badge')).toBeInTheDocument()
  })

  it('does not render verified badge for unverified attorneys', () => {
    const attorney = { ...baseAttorney, is_verified: false }
    render(<SearchResultCard attorney={attorney} index={0} />)
    expect(screen.queryByTestId('verified-badge')).not.toBeInTheDocument()
  })

  it('renders practice area tags (max 3 visible)', () => {
    render(<SearchResultCard attorney={baseAttorney} index={0} />)
    // "Personal Injury" appears both as specialty_name and practice_area tag
    expect(screen.getAllByText('Personal Injury').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('Car Accidents')).toBeInTheDocument()
    expect(screen.getByText('Medical Malpractice')).toBeInTheDocument()
  })

  it('shows "+N more" button when more than 3 practice areas', () => {
    const attorney = {
      ...baseAttorney,
      practice_areas: [
        ...baseAttorney.practice_areas!,
        { slug: 'wrongful-death', name: 'Wrongful Death' },
        { slug: 'slip-and-fall', name: 'Slip and Fall' },
      ],
    }
    render(<SearchResultCard attorney={attorney} index={0} />)
    expect(screen.getByText('+2 more')).toBeInTheDocument()
  })

  it('renders years experience', () => {
    render(<SearchResultCard attorney={baseAttorney} index={0} />)
    expect(screen.getByText(/15 yrs experience/)).toBeInTheDocument()
  })

  it('renders languages when more than 1', () => {
    render(<SearchResultCard attorney={baseAttorney} index={0} />)
    expect(screen.getByText(/English, Spanish/)).toBeInTheDocument()
  })

  it('does not render language list when only 1 language', () => {
    const attorney = { ...baseAttorney, languages: ['English'] }
    render(<SearchResultCard attorney={attorney} index={0} />)
    // With only 1 language, the languages section should not render
    // (the component checks languages.length > 1)
    expect(screen.queryByText('English, Spanish')).not.toBeInTheDocument()
  })

  it('renders distance when available', () => {
    const attorney = { ...baseAttorney, distance_miles: 3.5 }
    render(<SearchResultCard attorney={attorney} index={0} />)
    expect(screen.getByText('3.5 mi away')).toBeInTheDocument()
  })

  it('shows subscription badge for pro tier', () => {
    const attorney = { ...baseAttorney, subscription_tier: 'pro' as const }
    render(<SearchResultCard attorney={attorney} index={0} />)
    expect(screen.getByTestId('subscription-badge')).toBeInTheDocument()
  })

  it('shows "Featured Attorney" label for premium tier', () => {
    const attorney = { ...baseAttorney, subscription_tier: 'premium' as const }
    render(<SearchResultCard attorney={attorney} index={0} />)
    expect(screen.getByText('Featured Attorney')).toBeInTheDocument()
  })

  it('links to the correct attorney profile', () => {
    render(<SearchResultCard attorney={baseAttorney} index={0} />)
    const link = screen.getByRole('link', { name: /View profile of Jane Smith/ })
    expect(link).toHaveAttribute('href', '/attorneys/jane-smith')
  })

  it('shows initials in avatar', () => {
    render(<SearchResultCard attorney={baseAttorney} index={0} />)
    expect(screen.getByText('JS')).toBeInTheDocument()
  })

  it('renders correctly with minimal data', () => {
    const minimalAttorney: SearchAttorney = {
      id: 'att-2',
      name: 'Bob Johnson',
      slug: 'bob-johnson',
      address_city: null,
      address_state: null,
      address_county: null,
      is_verified: null,
      rating_average: null,
      review_count: null,
      phone: null,
      bar_number: null,
      is_featured: null,
    }

    render(<SearchResultCard attorney={minimalAttorney} index={1} />)
    expect(screen.getByText('Bob Johnson')).toBeInTheDocument()
  })
})
