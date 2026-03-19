/**
 * AttorneyList Component — Unit Tests
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import type { Provider } from '@/types'

// Mock next/link
vi.mock('next/link', () => ({
  default: ({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode
    href: string
    [key: string]: unknown
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}))

// Mock FavoriteButton
vi.mock('@/components/ui/FavoriteButton', () => ({
  FavoriteButton: () => <button>Fav</button>,
}))

// Mock TrustScore
vi.mock('@/components/attorney/TrustScore', () => ({
  TrustScore: () => <span data-testid="trust-score" />,
}))

// Mock CompareButton
vi.mock('@/components/ui/CompareButton', () => ({
  CompareButton: () => <button>Compare</button>,
}))

// Mock AvailabilityBadge
vi.mock('@/components/ui/AvailabilityBadge', () => ({
  AvailabilityBadge: () => null,
}))

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  MapPin: () => <span />,
  Phone: () => <span />,
  Star: ({ className: _className, ...props }: Record<string, unknown>) => <span {...props} />,
  ChevronRight: () => <span />,
  ShieldCheck: () => <span />,
  Award: () => <span />,
  Filter: () => <span />,
  ChevronDown: () => <span />,
  X: () => <span />,
  BadgeCheck: () => <span />,
  Scale: () => <span />,
  CheckCircle: () => <span />,
  AlertCircle: () => <span />,
  AlertTriangle: () => <span />,
  Info: () => <span />,
  CalendarDays: () => <span />,
  Clock: () => <span />,
  CalendarX: () => <span />,
  Loader2: () => <span />,
}))

// Mock utils
vi.mock('@/lib/utils', () => ({
  getAttorneyUrl: () => '/attorney/test',
  getAvatarColor: () => 'from-blue-400 to-blue-600',
  cn: (...args: unknown[]) => args.filter(Boolean).join(' '),
}))

// Mock Skeleton
vi.mock('@/components/ui/Skeleton', () => ({
  AttorneyListSkeleton: ({ count }: { count: number }) => (
    <div role="status" aria-label="Loading attorneys">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} data-testid="skeleton-card" />
      ))}
    </div>
  ),
}))

import AttorneyList from '@/components/AttorneyList'

// ── Factory ─────────────────────────────────────────────────────────

function createProvider(overrides: Partial<Provider> & { id: string; name: string }): Provider {
  return {
    slug: overrides.name.toLowerCase().replace(/\s+/g, '-'),
    is_verified: false,
    is_active: true,
    noindex: false,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
    ...overrides,
  } as Provider
}

function mockProviders(): Provider[] {
  return [
    createProvider({
      id: 'p1',
      name: 'Alice Adams',
      is_verified: true,
      phone: '(555) 111-1111',
      specialty: { slug: 'family-law', name: 'Family Law' },
      address_city: 'Houston',
      rating_average: 4.9,
      review_count: 20,
    }),
    createProvider({
      id: 'p2',
      name: 'Bob Brown',
      is_verified: false,
      phone: undefined,
      specialty: { slug: 'criminal-defense', name: 'Criminal Defense' },
      address_city: 'Dallas',
      rating_average: 4.2,
      review_count: 5,
    }),
    createProvider({
      id: 'p3',
      name: 'Carol Clark',
      is_verified: true,
      phone: '(555) 333-3333',
      specialty: { slug: 'personal-injury', name: 'Personal Injury' },
      address_city: 'Austin',
      rating_average: 3.5,
      review_count: 2,
    }),
    createProvider({
      id: 'p4',
      name: 'David Diaz',
      is_verified: false,
      phone: '(555) 444-4444',
      specialty: { slug: 'immigration', name: 'Immigration' },
      address_city: 'Houston',
      rating_average: undefined,
      review_count: 0,
    }),
  ]
}

describe('AttorneyList', () => {
  // ── Basic Rendering ──────────────────────────────────────────────

  it('renders a list of providers', () => {
    render(<AttorneyList providers={mockProviders()} />)
    expect(screen.getByText('Alice Adams')).toBeInTheDocument()
    expect(screen.getByText('Bob Brown')).toBeInTheDocument()
    expect(screen.getByText('Carol Clark')).toBeInTheDocument()
    expect(screen.getByText('David Diaz')).toBeInTheDocument()
  })

  it('renders list items in a ul with role="list"', () => {
    render(<AttorneyList providers={mockProviders()} />)
    expect(screen.getByRole('list')).toBeInTheDocument()
  })

  it('renders the attorney listing region', () => {
    render(<AttorneyList providers={mockProviders()} />)
    expect(screen.getByRole('region', { name: 'Attorney listing' })).toBeInTheDocument()
  })

  // ── Loading State ────────────────────────────────────────────────

  it('shows loading skeleton when isLoading is true', () => {
    render(<AttorneyList providers={[]} isLoading={true} />)
    expect(screen.getByLabelText('Loading attorneys')).toBeInTheDocument()
    expect(screen.getAllByTestId('skeleton-card')).toHaveLength(5)
  })

  it('sets aria-busy on region when loading', () => {
    render(<AttorneyList providers={[]} isLoading={true} />)
    expect(screen.getByRole('region', { name: 'Attorney listing' })).toHaveAttribute(
      'aria-busy',
      'true'
    )
  })

  // ── Empty State ──────────────────────────────────────────────────

  it('shows empty state when no providers', () => {
    render(<AttorneyList providers={[]} />)
    expect(screen.getByText('No attorneys found matching your search')).toBeInTheDocument()
    expect(screen.getByText(/Try broadening your search/)).toBeInTheDocument()
  })

  it('shows empty state with aria-live="polite"', () => {
    render(<AttorneyList providers={[]} />)
    const statusElements = screen.getAllByRole('status')
    const emptyStatus = statusElements.find((el) => el.textContent?.includes('No attorneys found'))
    expect(emptyStatus).toHaveAttribute('aria-live', 'polite')
  })

  // ── Search Query Filtering ───────────────────────────────────────

  it('filters providers by name search query', () => {
    render(<AttorneyList providers={mockProviders()} searchQuery="alice" />)
    expect(screen.getByText('Alice Adams')).toBeInTheDocument()
    expect(screen.queryByText('Bob Brown')).not.toBeInTheDocument()
  })

  it('filters providers by specialty search query', () => {
    render(<AttorneyList providers={mockProviders()} searchQuery="family" />)
    expect(screen.getByText('Alice Adams')).toBeInTheDocument()
    expect(screen.queryByText('Bob Brown')).not.toBeInTheDocument()
  })

  it('filters providers by city search query', () => {
    render(<AttorneyList providers={mockProviders()} searchQuery="dallas" />)
    expect(screen.getByText('Bob Brown')).toBeInTheDocument()
    expect(screen.queryByText('Alice Adams')).not.toBeInTheDocument()
  })

  it('shows empty state when search query matches nothing', () => {
    render(<AttorneyList providers={mockProviders()} searchQuery="zzz-no-match" />)
    expect(screen.getByText('No attorneys found matching your search')).toBeInTheDocument()
  })

  it('search is case-insensitive', () => {
    render(<AttorneyList providers={mockProviders()} searchQuery="ALICE" />)
    expect(screen.getByText('Alice Adams')).toBeInTheDocument()
  })

  // ── Sort Order Prop ──────────────────────────────────────────────

  it('sorts by name (A-Z) when sortOrder is "name"', () => {
    render(<AttorneyList providers={mockProviders()} sortOrder="name" />)
    const items = screen.getAllByRole('listitem')
    expect(items[0]).toHaveTextContent('Alice Adams')
    expect(items[1]).toHaveTextContent('Bob Brown')
    expect(items[2]).toHaveTextContent('Carol Clark')
    expect(items[3]).toHaveTextContent('David Diaz')
  })

  it('sorts by rating (highest first) when sortOrder is "rating"', () => {
    render(<AttorneyList providers={mockProviders()} sortOrder="rating" />)
    const items = screen.getAllByRole('listitem')
    expect(items[0]).toHaveTextContent('Alice Adams') // 4.9
    expect(items[1]).toHaveTextContent('Bob Brown') // 4.2
    expect(items[2]).toHaveTextContent('Carol Clark') // 3.5
    expect(items[3]).toHaveTextContent('David Diaz') // 0 (undefined)
  })

  // ── Relevance Sort ───────────────────────────────────────────────

  it('relevance sort: providers with phone rank above those without', () => {
    const providers = [
      createProvider({ id: 'no-phone', name: 'No Phone', is_verified: true }),
      createProvider({
        id: 'has-phone',
        name: 'Has Phone',
        phone: '(555) 999-9999',
        is_verified: true,
      }),
    ]
    // default sort is relevance
    render(<AttorneyList providers={providers} />)
    const items = screen.getAllByRole('listitem')
    expect(items[0]).toHaveTextContent('Has Phone')
    expect(items[1]).toHaveTextContent('No Phone')
  })

  it('relevance sort: verified providers rank above unverified (same phone status)', () => {
    const providers = [
      createProvider({
        id: 'unverified',
        name: 'Unverified',
        phone: '(555) 111-1111',
        is_verified: false,
      }),
      createProvider({
        id: 'verified',
        name: 'Verified',
        phone: '(555) 222-2222',
        is_verified: true,
      }),
    ]
    render(<AttorneyList providers={providers} />)
    const items = screen.getAllByRole('listitem')
    expect(items[0]).toHaveTextContent('Verified')
    expect(items[1]).toHaveTextContent('Unverified')
  })

  // ── Total Count ──────────────────────────────────────────────────

  it('displays totalCount when provided', () => {
    render(<AttorneyList providers={mockProviders()} totalCount={42} />)
    expect(screen.getByText('42')).toBeInTheDocument()
    expect(screen.getByText(/attorneys found/i)).toBeInTheDocument()
  })

  it('displays provider count when totalCount is not provided', () => {
    render(<AttorneyList providers={mockProviders()} />)
    expect(screen.getByText('4')).toBeInTheDocument()
  })

  it('displays 0 count when loading', () => {
    render(<AttorneyList providers={mockProviders()} isLoading={true} />)
    // When loading, totalResults is 0
    expect(screen.getByText('0')).toBeInTheDocument()
  })

  // ── Hover Callbacks ──────────────────────────────────────────────

  it('calls onProviderHover with provider on mouse enter', () => {
    const onHover = vi.fn()
    render(<AttorneyList providers={mockProviders()} onProviderHover={onHover} />)
    const items = screen.getAllByRole('listitem')
    fireEvent.mouseEnter(items[0])
    expect(onHover).toHaveBeenCalledWith(expect.objectContaining({ id: 'p1', name: 'Alice Adams' }))
  })

  it('calls onProviderHover with null on mouse leave', () => {
    const onHover = vi.fn()
    render(<AttorneyList providers={mockProviders()} onProviderHover={onHover} />)
    const items = screen.getAllByRole('listitem')
    fireEvent.mouseEnter(items[0])
    fireEvent.mouseLeave(items[0])
    expect(onHover).toHaveBeenLastCalledWith(null)
  })

  it('calls onProviderHover on focus/blur', () => {
    const onHover = vi.fn()
    render(<AttorneyList providers={mockProviders()} onProviderHover={onHover} />)
    const items = screen.getAllByRole('listitem')
    // Focus the first item (whatever is sorted first by relevance)
    fireEvent.focus(items[0])
    expect(onHover).toHaveBeenCalledWith(expect.any(Object))
    fireEvent.blur(items[0])
    expect(onHover).toHaveBeenLastCalledWith(null)
  })

  // ── Highlighted Provider ─────────────────────────────────────────

  it('renders data-provider-id attribute on list items', () => {
    render(<AttorneyList providers={mockProviders()} />)
    const items = screen.getAllByRole('listitem')
    expect(items[0]).toHaveAttribute('data-provider-id', 'p1')
  })

  it('highlights card when highlightedProviderId matches', () => {
    // scrollIntoView is not natively supported in jsdom
    Element.prototype.scrollIntoView = vi.fn()
    render(<AttorneyList providers={mockProviders()} highlightedProviderId="p2" />)
    // The component should have called scrollIntoView
    expect(Element.prototype.scrollIntoView).toHaveBeenCalled()
  })

  // ── Multiple search results for same city ────────────────────────

  it('returns all matching providers for Houston city search', () => {
    render(<AttorneyList providers={mockProviders()} searchQuery="houston" />)
    expect(screen.getByText('Alice Adams')).toBeInTheDocument()
    expect(screen.getByText('David Diaz')).toBeInTheDocument()
    expect(screen.queryByText('Bob Brown')).not.toBeInTheDocument()
  })
})
