/**
 * UI Components — Unit Tests
 * StickyMobileCTA, TrustGuarantee, DemandIndicator
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

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

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  FileText: ({ className }: { className?: string }) => (
    <span data-testid="icon-file-text" className={className} />
  ),
  X: ({ className }: { className?: string }) => <span data-testid="icon-x" className={className} />,
  Shield: ({ className }: { className?: string }) => (
    <span data-testid="icon-shield" className={className} />
  ),
  CheckCircle: ({ className }: { className?: string }) => (
    <span data-testid="icon-check-circle" className={className} />
  ),
  Lock: ({ className }: { className?: string }) => (
    <span data-testid="icon-lock" className={className} />
  ),
  Clock: ({ className }: { className?: string }) => (
    <span data-testid="icon-clock" className={className} />
  ),
  TrendingUp: ({ className }: { className?: string }) => (
    <span data-testid="icon-trending-up" className={className} />
  ),
  Users: ({ className }: { className?: string }) => (
    <span data-testid="icon-users" className={className} />
  ),
  Eye: ({ className }: { className?: string }) => (
    <span data-testid="icon-eye" className={className} />
  ),
}))

// Mock analytics tracking
vi.mock('@/lib/analytics/tracking', () => ({
  trackEvent: vi.fn(),
}))

// Mock sessionStorage
const sessionStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key]
    }),
    clear: vi.fn(() => {
      store = {}
    }),
  }
})()
Object.defineProperty(window, 'sessionStorage', { value: sessionStorageMock })

// ---------------------------------------------------------------------------
// StickyMobileCTA
// ---------------------------------------------------------------------------
import StickyMobileCTA from '@/components/StickyMobileCTA'

describe('StickyMobileCTA', () => {
  beforeEach(() => {
    sessionStorageMock.clear()
    sessionStorageMock.getItem.mockReturnValue(null)
  })

  it('renders CTA button with default text', () => {
    render(<StickyMobileCTA />)
    expect(screen.getByText('Get my free consultations')).toBeInTheDocument()
  })

  it('renders custom CTA text', () => {
    render(<StickyMobileCTA ctaText="Contact Now" />)
    expect(screen.getByText('Contact Now')).toBeInTheDocument()
  })

  it('links to /quotes by default (no slugs)', () => {
    render(<StickyMobileCTA />)
    const link = screen.getByText('Get my free consultations').closest('a')
    expect(link).toHaveAttribute('href', '/quotes')
  })

  it('builds href from specialtySlug only', () => {
    render(<StickyMobileCTA specialtySlug="personal-injury" />)
    const link = screen.getByText('Get my free consultations').closest('a')
    expect(link).toHaveAttribute('href', '/quotes/personal-injury')
  })

  it('builds href from specialtySlug + citySlug', () => {
    render(<StickyMobileCTA specialtySlug="family-law" citySlug="houston" />)
    const link = screen.getByText('Get my free consultations').closest('a')
    expect(link).toHaveAttribute('href', '/quotes/family-law/houston')
  })

  it('uses custom href override when provided', () => {
    render(<StickyMobileCTA href="/custom-path" specialtySlug="test" citySlug="city" />)
    const link = screen.getByText('Get my free consultations').closest('a')
    expect(link).toHaveAttribute('href', '/custom-path')
  })

  it('shows attorney count when provided', () => {
    render(<StickyMobileCTA attorneyCount={12} />)
    expect(screen.getByText('12 attorneys available in your area')).toBeInTheDocument()
  })

  it('shows singular attorney when count is 1', () => {
    render(<StickyMobileCTA attorneyCount={1} />)
    expect(screen.getByText('1 attorney available in your area')).toBeInTheDocument()
  })

  it('does not show attorney count when 0', () => {
    render(<StickyMobileCTA attorneyCount={0} />)
    expect(screen.queryByText(/attorney.*available/)).not.toBeInTheDocument()
  })

  it('does not show attorney count when not provided', () => {
    render(<StickyMobileCTA />)
    expect(screen.queryByText(/attorney.*available/)).not.toBeInTheDocument()
  })

  it('has a close button with aria-label', () => {
    render(<StickyMobileCTA />)
    const closeBtn = screen.getByLabelText('Close')
    expect(closeBtn).toBeInTheDocument()
    expect(closeBtn.tagName).toBe('BUTTON')
  })

  it('hides when close button is clicked', () => {
    render(<StickyMobileCTA />)
    const closeBtn = screen.getByLabelText('Close')
    fireEvent.click(closeBtn)
    // After dismissal, CTA text should no longer be visible
    expect(screen.queryByText('Get my free consultations')).not.toBeInTheDocument()
  })

  it('sets sessionStorage on dismiss', () => {
    render(<StickyMobileCTA />)
    const closeBtn = screen.getByLabelText('Close')
    fireEvent.click(closeBtn)
    expect(sessionStorageMock.setItem).toHaveBeenCalledWith('stickyMobileCTA_dismissed', '1')
  })

  it('does not render if previously dismissed in session', () => {
    sessionStorageMock.getItem.mockReturnValue('1')
    render(<StickyMobileCTA />)
    expect(screen.queryByText('Get my free consultations')).not.toBeInTheDocument()
  })

  it('shows guarantee footer text', () => {
    render(<StickyMobileCTA />)
    expect(screen.getByText(/Free.*No obligation.*Response within 24h/)).toBeInTheDocument()
  })
})

// ---------------------------------------------------------------------------
// TrustGuarantee
// ---------------------------------------------------------------------------
import TrustGuarantee from '@/components/TrustGuarantee'

describe('TrustGuarantee', () => {
  describe('banner variant (default)', () => {
    it('renders the guarantee heading', () => {
      render(<TrustGuarantee />)
      expect(screen.getByText('The US Attorneys Guarantee')).toBeInTheDocument()
    })

    it('renders all 4 trust guarantees', () => {
      render(<TrustGuarantee />)
      expect(screen.getByText('Verified Attorneys')).toBeInTheDocument()
      expect(screen.getByText('100% Free Consultations')).toBeInTheDocument()
      expect(screen.getByText('Data Protected')).toBeInTheDocument()
      expect(screen.getByText('Response within 24h')).toBeInTheDocument()
    })

    it('renders descriptions for each guarantee', () => {
      render(<TrustGuarantee />)
      expect(screen.getByText('Bar number verified, credentials checked')).toBeInTheDocument()
      expect(screen.getByText('No obligation, no hidden fees')).toBeInTheDocument()
      expect(screen.getByText('Your information remains confidential')).toBeInTheDocument()
      expect(screen.getByText('Up to 3 attorneys contact you')).toBeInTheDocument()
    })

    it('renders a link to /guarantee', () => {
      render(<TrustGuarantee />)
      const link = screen.getByText('Discover our quality commitment')
      expect(link.closest('a')).toHaveAttribute('href', '/guarantee')
    })

    it('renders as a 4-col grid on desktop', () => {
      const { container } = render(<TrustGuarantee />)
      expect(container.querySelector('.md\\:grid-cols-4')).toBeInTheDocument()
    })
  })

  describe('compact variant', () => {
    it('renders all 4 guarantee titles', () => {
      render(<TrustGuarantee variant="compact" />)
      expect(screen.getByText('Verified Attorneys')).toBeInTheDocument()
      expect(screen.getByText('100% Free Consultations')).toBeInTheDocument()
      expect(screen.getByText('Data Protected')).toBeInTheDocument()
      expect(screen.getByText('Response within 24h')).toBeInTheDocument()
    })

    it('does NOT render descriptions in compact mode', () => {
      render(<TrustGuarantee variant="compact" />)
      expect(screen.queryByText('Bar number verified, credentials checked')).not.toBeInTheDocument()
    })

    it('does NOT render the heading in compact mode', () => {
      render(<TrustGuarantee variant="compact" />)
      expect(screen.queryByText('The US Attorneys Guarantee')).not.toBeInTheDocument()
    })

    it('renders a "Learn more" link to /guarantee', () => {
      render(<TrustGuarantee variant="compact" />)
      const link = screen.getByText('Learn more')
      expect(link.closest('a')).toHaveAttribute('href', '/guarantee')
    })
  })
})

// ---------------------------------------------------------------------------
// DemandIndicator (deprecated — renders null, dark pattern removed)
// ---------------------------------------------------------------------------
import DemandIndicator from '@/components/DemandIndicator'

describe('DemandIndicator', () => {
  describe('inline variant (default)', () => {
    it('renders nothing (component deprecated)', () => {
      const { container } = render(<DemandIndicator specialtySlug="personal-injury" />)
      expect(container.innerHTML).toBe('')
    })

    it('renders nothing for any slug', () => {
      const { container: c1 } = render(<DemandIndicator specialtySlug="family-law" />)
      const { container: c2 } = render(<DemandIndicator specialtySlug="slug-b" />)
      expect(c1.innerHTML).toBe('')
      expect(c2.innerHTML).toBe('')
    })
  })

  describe('banner variant', () => {
    it('renders nothing in banner variant without cityName', () => {
      const { container } = render(<DemandIndicator specialtySlug="tax-law" variant="banner" />)
      expect(container.innerHTML).toBe('')
    })

    it('renders nothing in banner variant with cityName', () => {
      const { container } = render(
        <DemandIndicator specialtySlug="tax-law" variant="banner" cityName="Houston" />
      )
      expect(container.innerHTML).toBe('')
    })
  })
})
