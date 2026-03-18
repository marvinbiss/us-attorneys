/**
 * AttorneyCard Component — Unit Tests
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string; [key: string]: unknown }) => (
    <a href={href} {...props}>{children}</a>
  ),
}))

// Mock FavoriteButton
vi.mock('@/components/ui/FavoriteButton', () => ({
  FavoriteButton: ({ attorneyName }: { attorneyName: string }) => (
    <button aria-label={`Favorite ${attorneyName}`}>Fav</button>
  ),
}))

// Mock TrustScore
vi.mock('@/components/attorney/TrustScore', () => ({
  TrustScore: ({ score }: { score: number }) => (
    <span data-testid="trust-score">Trust: {score}</span>
  ),
}))

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  MapPin: () => <span data-testid="icon-map-pin" />,
  Phone: () => <span data-testid="icon-phone" />,
  Star: () => <span data-testid="icon-star" />,
  ChevronRight: () => <span data-testid="icon-chevron-right" />,
  ShieldCheck: () => <span data-testid="icon-shield-check" />,
  Award: () => <span data-testid="icon-award" />,
}))

// Mock getAttorneyUrl and getAvatarColor
vi.mock('@/lib/utils', () => ({
  getAttorneyUrl: ({ stable_id, slug }: { stable_id?: string | null; slug?: string | null }) =>
    `/attorney/${stable_id || slug || 'unknown'}`,
  getAvatarColor: () => 'from-blue-400 to-blue-600',
}))

import AttorneyCard from '@/components/AttorneyCard'

// ── Factory ─────────────────────────────────────────────────────────

function mockProvider(overrides: Record<string, unknown> = {}) {
  return {
    id: 'prov-1',
    stable_id: 'stable-1',
    name: 'John Smith',
    slug: 'john-smith',
    is_verified: false,
    is_featured: false,
    specialty: { slug: 'criminal-defense', name: 'Criminal Defense' },
    address_city: 'Houston',
    address_line1: '123 Main St',
    address_zip: '77001',
    rating_average: 4.8,
    review_count: 25,
    phone: '(555) 123-4567',
    bar_number: 'TX123456',
    trust_score: null,
    ...overrides,
  }
}

describe('AttorneyCard', () => {
  // ── Basic Rendering ──────────────────────────────────────────────

  it('renders the attorney name', () => {
    render(<AttorneyCard provider={mockProvider()} />)
    expect(screen.getByText('John Smith')).toBeInTheDocument()
  })

  it('renders the specialty', () => {
    render(<AttorneyCard provider={mockProvider()} />)
    expect(screen.getByText('Criminal Defense')).toBeInTheDocument()
  })

  it('renders the address', () => {
    render(<AttorneyCard provider={mockProvider()} />)
    expect(screen.getByText(/123 Main St/)).toBeInTheDocument()
  })

  it('renders the rating value and review count', () => {
    render(<AttorneyCard provider={mockProvider()} />)
    expect(screen.getByText('4.8')).toBeInTheDocument()
    expect(screen.getByText('25 reviews')).toBeInTheDocument()
  })

  it('renders the bar number', () => {
    render(<AttorneyCard provider={mockProvider()} />)
    expect(screen.getByText(/TX123456/)).toBeInTheDocument()
  })

  // ── Missing / Null Data ──────────────────────────────────────────

  it('handles missing specialty gracefully', () => {
    render(<AttorneyCard provider={mockProvider({ specialty: null })} />)
    expect(screen.getByText('John Smith')).toBeInTheDocument()
    expect(screen.queryByText('Criminal Defense')).not.toBeInTheDocument()
  })

  it('handles undefined specialty gracefully', () => {
    render(<AttorneyCard provider={mockProvider({ specialty: undefined })} />)
    expect(screen.getByText('John Smith')).toBeInTheDocument()
  })

  it('shows "New" badge when rating is missing (0 reviews)', () => {
    render(
      <AttorneyCard
        provider={mockProvider({ rating_average: undefined, review_count: 0 })}
      />,
    )
    expect(screen.getByText('New')).toBeInTheDocument()
  })

  it('shows "New" badge when review_count is null', () => {
    render(
      <AttorneyCard
        provider={mockProvider({ rating_average: 4.5, review_count: null })}
      />,
    )
    expect(screen.getByText('New')).toBeInTheDocument()
  })

  it('shows "New" badge when rating_average is null', () => {
    render(
      <AttorneyCard
        provider={mockProvider({ rating_average: null, review_count: 10 })}
      />,
    )
    expect(screen.getByText('New')).toBeInTheDocument()
  })

  // ── Verified Badge ───────────────────────────────────────────────

  it('displays verified badge when is_verified is true', () => {
    render(<AttorneyCard provider={mockProvider({ is_verified: true })} />)
    expect(screen.getByLabelText('Verified Attorney')).toBeInTheDocument()
  })

  it('hides verified badge when is_verified is false', () => {
    render(<AttorneyCard provider={mockProvider({ is_verified: false })} />)
    expect(screen.queryByLabelText('Verified Attorney')).not.toBeInTheDocument()
  })

  // ── Featured Badge ───────────────────────────────────────────────

  it('shows featured badge when is_featured is true', () => {
    render(<AttorneyCard provider={mockProvider({ is_featured: true })} />)
    expect(screen.getByText('Featured')).toBeInTheDocument()
  })

  it('hides featured badge when is_featured is false', () => {
    render(<AttorneyCard provider={mockProvider({ is_featured: false })} />)
    expect(screen.queryByText('Featured')).not.toBeInTheDocument()
  })

  // ── Phone ────────────────────────────────────────────────────────

  it('displays phone call button when phone is valid (10+ digits)', () => {
    render(<AttorneyCard provider={mockProvider({ phone: '(555) 123-4567' })} />)
    const callLink = screen.getByText('Call')
    expect(callLink.closest('a')).toHaveAttribute('href', 'tel:(555) 123-4567')
  })

  it('hides phone call button when phone is null', () => {
    render(<AttorneyCard provider={mockProvider({ phone: null })} />)
    expect(screen.queryByText('Call')).not.toBeInTheDocument()
  })

  it('hides phone call button when phone is too short', () => {
    render(<AttorneyCard provider={mockProvider({ phone: '12345' })} />)
    expect(screen.queryByText('Call')).not.toBeInTheDocument()
  })

  it('hides phone call button when phone is undefined', () => {
    render(<AttorneyCard provider={mockProvider({ phone: undefined })} />)
    expect(screen.queryByText('Call')).not.toBeInTheDocument()
  })

  // ── URL Link ─────────────────────────────────────────────────────

  it('renders correct attorney profile URL', () => {
    render(<AttorneyCard provider={mockProvider()} />)
    const profileLink = screen.getByLabelText("View John Smith's profile")
    expect(profileLink).toHaveAttribute('href', '/attorney/stable-1')
  })

  it('renders consultation link with #quote anchor', () => {
    render(<AttorneyCard provider={mockProvider()} />)
    const consultLink = screen.getByText('Request a Consultation')
    expect(consultLink.closest('a')).toHaveAttribute(
      'href',
      '/attorney/stable-1#quote',
    )
  })

  // ── Hover State ──────────────────────────────────────────────────

  it('applies hover styling when isHovered is true', () => {
    const { container } = render(
      <AttorneyCard provider={mockProvider()} isHovered={true} />,
    )
    const card = container.firstChild as HTMLElement
    expect(card.className).toContain('-translate-y-1.5')
    expect(card.className).toContain('scale-[1.02]')
    expect(card.className).toContain('border-amber-200')
  })

  it('does not apply hover styling when isHovered is false', () => {
    const { container } = render(
      <AttorneyCard provider={mockProvider()} isHovered={false} />,
    )
    const card = container.firstChild as HTMLElement
    expect(card.className).not.toContain('-translate-y-1.5')
    expect(card.className).toContain('border-gray-100')
  })

  // ── Trust Score ──────────────────────────────────────────────────

  it('shows trust score when trust_score > 0', () => {
    render(<AttorneyCard provider={mockProvider({ trust_score: 85 })} />)
    expect(screen.getByTestId('trust-score')).toHaveTextContent('Trust: 85')
  })

  it('hides trust score when trust_score is null', () => {
    render(<AttorneyCard provider={mockProvider({ trust_score: null })} />)
    expect(screen.queryByTestId('trust-score')).not.toBeInTheDocument()
  })

  it('hides trust score when trust_score is 0', () => {
    render(<AttorneyCard provider={mockProvider({ trust_score: 0 })} />)
    expect(screen.queryByTestId('trust-score')).not.toBeInTheDocument()
  })

  // ── Accessibility ────────────────────────────────────────────────

  it('has accessible aria-label on profile link for mobile', () => {
    render(<AttorneyCard provider={mockProvider()} />)
    expect(screen.getByLabelText("View John Smith's profile")).toBeInTheDocument()
  })

  it('renders avatar initial from name', () => {
    render(<AttorneyCard provider={mockProvider({ name: 'Alice Jones' })} />)
    expect(screen.getByText('A')).toBeInTheDocument()
  })

  // ── 10+ Reviews Badge ────────────────────────────────────────────

  it('shows 10+ badge when review_count exceeds 10', () => {
    render(<AttorneyCard provider={mockProvider({ review_count: 15 })} />)
    expect(screen.getByText('10+')).toBeInTheDocument()
  })

  it('hides 10+ badge when review_count is 10 or less', () => {
    render(<AttorneyCard provider={mockProvider({ review_count: 8 })} />)
    expect(screen.queryByText('10+')).not.toBeInTheDocument()
  })

  // ── Address Rendering Edge Cases ─────────────────────────────────

  it('hides address section when address_line1 is missing', () => {
    render(
      <AttorneyCard
        provider={mockProvider({ address_line1: undefined })}
      />,
    )
    expect(screen.queryByTestId('icon-map-pin')).not.toBeInTheDocument()
  })

  it('hides bar number section when bar_number is missing', () => {
    render(
      <AttorneyCard provider={mockProvider({ bar_number: undefined })} />,
    )
    expect(screen.queryByText(/Bar #/)).not.toBeInTheDocument()
  })

  // ── Minimal Provider (only required fields) ──────────────────────

  it('renders with minimal provider (id + name only)', () => {
    render(
      <AttorneyCard
        provider={{ id: 'min-1', name: 'Minimal Attorney' }}
      />,
    )
    expect(screen.getByText('Minimal Attorney')).toBeInTheDocument()
    expect(screen.getByText('New')).toBeInTheDocument()
  })
})
