/**
 * Header Component — Unit Tests
 *
 * Covers:
 * - Logo rendering and link
 * - Navigation links (desktop)
 * - Mobile menu toggle button
 * - Favorites badge display
 * - Emergency link
 * - Free consultation CTA
 * - Sign in link
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import Header from '@/components/Header'

// --- Mocks ---

const mockSetIsMenuOpen = vi.fn()
let mockIsMenuOpen = false

vi.mock('@/contexts/MobileMenuContext', () => ({
  useMobileMenu: () => ({
    isMenuOpen: mockIsMenuOpen,
    setIsMenuOpen: mockSetIsMenuOpen,
  }),
}))

let mockFavCount = 0
vi.mock('@/hooks/useFavorites', () => ({
  useFavorites: () => ({ count: mockFavCount, favorites: [], toggle: vi.fn() }),
}))

vi.mock('@/components/search/QuickSearch', () => ({
  default: () => <div data-testid="quick-search">QuickSearch</div>,
}))

vi.mock('@/components/ui/theme-toggle', () => ({
  ThemeToggle: () => <div data-testid="theme-toggle" />,
}))

vi.mock('@/lib/analytics/tracking', () => ({
  trackEvent: vi.fn(),
}))

vi.mock('@/lib/data/usa', () => {
  const pa = Array.from({ length: 75 }, (_, i) => ({ name: `PA${i}`, slug: `pa-${i}` }))
  return {
    cities: Array.from({ length: 10 }, (_, i) => ({ name: `City${i}`, slug: `city-${i}` })),
    usRegions: Array.from({ length: 5 }, (_, i) => ({ name: `Region${i}`, slug: `region-${i}` })),
    states: Array.from({ length: 50 }, (_, i) => ({ name: `State${i}`, slug: `state-${i}` })),
    practiceAreas: pa,
    services: pa,
    getCityBySlug: vi.fn(),
    getStateBySlug: vi.fn(),
    getStateByCode: vi.fn(),
    getCitiesByState: vi.fn(),
    getNearbyCities: vi.fn(),
    getRegionBySlug: vi.fn(),
    getRegionSlugByName: vi.fn(),
    getNeighborhoodsByCity: vi.fn(),
    getNeighborhoodBySlug: vi.fn(),
  }
})

vi.mock('@/components/header/header-data', () => ({
  getLocationFromCoords: vi.fn(),
}))

vi.mock('@/components/header/DesktopMegaMenus', () => ({
  default: () => <div data-testid="desktop-mega-menus" />,
}))

vi.mock('@/components/header/MobileMenu', () => ({
  default: () => <div data-testid="mobile-menu" />,
}))

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => '/',
}))

// Mock fetch for geo menu data
globalThis.fetch = vi.fn().mockResolvedValue({
  json: () => Promise.resolve({ citiesByRegion: [], popularCities: [], metroRegions: [], domTomRegions: [] }),
})

describe('Header', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockIsMenuOpen = false
    mockFavCount = 0
  })

  it('renders the logo with link to homepage', () => {
    render(<Header />)
    const logoLink = screen.getByRole('link', { name: /USAttorneys/i })
      || screen.getAllByRole('link').find(a => a.getAttribute('href') === '/')
    expect(logoLink).toBeTruthy()
  })

  it('renders the brand text "USAttorneys"', () => {
    render(<Header />)
    expect(screen.getByText('US')).toBeInTheDocument()
    expect(screen.getByText('Attorneys')).toBeInTheDocument()
  })

  it('renders navigation trigger buttons', () => {
    render(<Header />)
    expect(screen.getByText('Services')).toBeInTheDocument()
    expect(screen.getByText('Cities')).toBeInTheDocument()
    expect(screen.getByText('States')).toBeInTheDocument()
    expect(screen.getByText('More')).toBeInTheDocument()
  })

  it('renders the sign in link', () => {
    render(<Header />)
    const signInLink = screen.getByText('Sign in')
    expect(signInLink).toBeInTheDocument()
    expect(signInLink.closest('a')).toHaveAttribute('href', '/login')
  })

  it('renders the emergency link', () => {
    render(<Header />)
    expect(screen.getByText('24/7 Emergency')).toBeInTheDocument()
  })

  it('renders the free consultation CTA', () => {
    render(<Header />)
    const cta = screen.getByText('Free consultation')
    expect(cta).toBeInTheDocument()
    expect(cta.closest('a')).toHaveAttribute('href', '/quotes')
  })

  it('renders the mobile menu toggle button', () => {
    render(<Header />)
    const button = screen.getByLabelText('Open menu')
    expect(button).toBeInTheDocument()
  })

  it('toggles mobile menu on button click', () => {
    render(<Header />)
    const button = screen.getByLabelText('Open menu')
    fireEvent.click(button)
    expect(mockSetIsMenuOpen).toHaveBeenCalledWith(true)
  })

  it('shows close label when mobile menu is open', () => {
    mockIsMenuOpen = true
    render(<Header />)
    expect(screen.getByLabelText('Close menu')).toBeInTheDocument()
  })

  it('renders favorites link', () => {
    render(<Header />)
    const favLink = screen.getByTitle('My favorites')
    expect(favLink).toBeInTheDocument()
    expect(favLink.closest('a')).toHaveAttribute('href', '/my-favorites')
  })

  it('shows favorites count badge when count > 0', () => {
    mockFavCount = 5
    render(<Header />)
    expect(screen.getByText('5')).toBeInTheDocument()
  })

  it('does not show favorites badge when count is 0', () => {
    mockFavCount = 0
    render(<Header />)
    const favLink = screen.getByTitle('My favorites')
    // No badge child with number
    expect(favLink.querySelector('span.absolute')).toBeNull()
  })

  it('caps favorites badge at 99+', () => {
    mockFavCount = 150
    render(<Header />)
    expect(screen.getByText('99+')).toBeInTheDocument()
  })

  it('renders MobileMenu when isMenuOpen is true', () => {
    mockIsMenuOpen = true
    render(<Header />)
    expect(screen.getByTestId('mobile-menu')).toBeInTheDocument()
  })

  it('does not render MobileMenu when isMenuOpen is false', () => {
    mockIsMenuOpen = false
    render(<Header />)
    expect(screen.queryByTestId('mobile-menu')).not.toBeInTheDocument()
  })
})
