/**
 * Review Components — Comprehensive Unit Tests
 * Tests VerifiedBadge, TrustScore, VerificationLevelBadge, VerifiedReviewBadge,
 * KYCStatusBadge, EscrowStatusBadge, AttorneyVerificationSummary
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import {
  VerifiedBadge,
  TrustScore,
  VerificationLevelBadge,
  VerifiedReviewBadge,
  KYCStatusBadge,
  EscrowStatusBadge,
  AttorneyVerificationSummary,
} from '@/components/reviews/VerifiedBadge'

// Mock @/lib/utils
vi.mock('@/lib/utils', () => ({
  cn: (...args: unknown[]) => args.filter(Boolean).join(' '),
}))

// ---------------------------------------------------------------------------
// VerifiedBadge
// ---------------------------------------------------------------------------

describe('VerifiedBadge', () => {
  it('renders identity badge with default label', () => {
    render(<VerifiedBadge type="identity" />)
    expect(screen.getByText('Identity verified')).toBeInTheDocument()
  })

  it('renders insurance badge with default label', () => {
    render(<VerifiedBadge type="insurance" />)
    expect(screen.getByText('Insurance verified')).toBeInTheDocument()
  })

  it('renders certification badge with "Qualified" label', () => {
    render(<VerifiedBadge type="certification" />)
    expect(screen.getByText('Qualified')).toBeInTheDocument()
  })

  it('renders premium badge with correct label', () => {
    render(<VerifiedBadge type="premium" />)
    expect(screen.getByText('Premium')).toBeInTheDocument()
  })

  it('renders enterprise badge with "Listed firm" label', () => {
    render(<VerifiedBadge type="enterprise" />)
    expect(screen.getByText('Listed firm')).toBeInTheDocument()
  })

  it('renders review badge with "Authentic review" label', () => {
    render(<VerifiedBadge type="review" />)
    expect(screen.getByText('Authentic review')).toBeInTheDocument()
  })

  it('uses custom label when provided', () => {
    render(<VerifiedBadge type="identity" label="Custom Label" />)
    expect(screen.getByText('Custom Label')).toBeInTheDocument()
    expect(screen.queryByText('Identity verified')).not.toBeInTheDocument()
  })

  it('hides label text when showLabel=false', () => {
    render(<VerifiedBadge type="identity" showLabel={false} />)
    expect(screen.queryByText('Identity verified')).not.toBeInTheDocument()
  })

  it('applies title attribute with the badge label', () => {
    const { container } = render(<VerifiedBadge type="identity" />)
    const badge = container.querySelector('.verified-badge')
    expect(badge).toHaveAttribute('title', 'Identity verified')
  })

  it('applies size-specific text class for sm size', () => {
    const { container } = render(<VerifiedBadge type="identity" size="sm" />)
    const badge = container.querySelector('.verified-badge')
    expect(badge?.className).toContain('text-xs')
  })

  it('applies size-specific text class for lg size', () => {
    const { container } = render(<VerifiedBadge type="identity" size="lg" />)
    const badge = container.querySelector('.verified-badge')
    expect(badge?.className).toContain('text-sm')
  })

  it('merges custom className', () => {
    const { container } = render(<VerifiedBadge type="identity" className="mt-2" />)
    const badge = container.querySelector('.verified-badge')
    expect(badge?.className).toContain('mt-2')
  })
})

// ---------------------------------------------------------------------------
// TrustScore
// ---------------------------------------------------------------------------

describe('TrustScore', () => {
  it('renders "Excellent" label for score >= 80', () => {
    render(<TrustScore score={85} />)
    expect(screen.getByText('85% - Excellent')).toBeInTheDocument()
  })

  it('renders "Good" label for score >= 60', () => {
    render(<TrustScore score={65} />)
    expect(screen.getByText('65% - Good')).toBeInTheDocument()
  })

  it('renders "Fair" label for score >= 40', () => {
    render(<TrustScore score={45} />)
    expect(screen.getByText('45% - Fair')).toBeInTheDocument()
  })

  it('renders "Low" label for score < 40', () => {
    render(<TrustScore score={20} />)
    expect(screen.getByText('20% - Low')).toBeInTheDocument()
  })

  it('hides label when showLabel=false', () => {
    render(<TrustScore score={80} showLabel={false} />)
    expect(screen.queryByText(/Excellent/)).not.toBeInTheDocument()
  })

  it('renders a progress bar with correct width style', () => {
    const { container } = render(<TrustScore score={75} />)
    const bar = container.querySelector('.rounded-full.transition-all') as HTMLElement
    expect(bar?.style.width).toBe('75%')
  })

  it('uses green color for score >= 80', () => {
    const { container } = render(<TrustScore score={90} />)
    const bar = container.querySelector('.bg-green-500')
    expect(bar).toBeInTheDocument()
  })

  it('uses red color for score < 40', () => {
    const { container } = render(<TrustScore score={30} />)
    const bar = container.querySelector('.bg-red-500')
    expect(bar).toBeInTheDocument()
  })
})

// ---------------------------------------------------------------------------
// VerificationLevelBadge
// ---------------------------------------------------------------------------

describe('VerificationLevelBadge', () => {
  it('renders "Not listed" for none level', () => {
    render(<VerificationLevelBadge level="none" />)
    expect(screen.getByText('Not listed')).toBeInTheDocument()
  })

  it('renders "Verified" for basic level', () => {
    render(<VerificationLevelBadge level="basic" />)
    expect(screen.getByText('Verified')).toBeInTheDocument()
  })

  it('renders "Listed+" for standard level', () => {
    render(<VerificationLevelBadge level="standard" />)
    expect(screen.getByText('Listed+')).toBeInTheDocument()
  })

  it('renders "Premium" for premium level', () => {
    render(<VerificationLevelBadge level="premium" />)
    expect(screen.getByText('Premium')).toBeInTheDocument()
  })

  it('renders "Enterprise" for enterprise level', () => {
    render(<VerificationLevelBadge level="enterprise" />)
    expect(screen.getByText('Enterprise')).toBeInTheDocument()
  })
})

// ---------------------------------------------------------------------------
// VerifiedReviewBadge
// ---------------------------------------------------------------------------

describe('VerifiedReviewBadge', () => {
  it('renders nothing when isVerified=false', () => {
    const { container } = render(<VerifiedReviewBadge isVerified={false} />)
    expect(container.firstChild).toBeNull()
  })

  it('renders "Verified review" when isVerified=true', () => {
    render(<VerifiedReviewBadge isVerified={true} />)
    expect(screen.getByText('Verified review')).toBeInTheDocument()
  })

  it('has title attribute explaining the badge', () => {
    const { container } = render(<VerifiedReviewBadge isVerified={true} />)
    const badge = container.querySelector('[title]')
    expect(badge).toHaveAttribute('title', 'This review comes from a client who used the platform')
  })

  it('applies green styling', () => {
    const { container } = render(<VerifiedReviewBadge isVerified={true} />)
    const badge = container.firstChild as HTMLElement
    expect(badge.className).toContain('text-green-700')
    expect(badge.className).toContain('bg-green-50')
  })
})

// ---------------------------------------------------------------------------
// KYCStatusBadge
// ---------------------------------------------------------------------------

describe('KYCStatusBadge', () => {
  it('renders "Verified" for verified status', () => {
    render(<KYCStatusBadge status="verified" />)
    expect(screen.getByText('Verified')).toBeInTheDocument()
  })

  it('renders "Pending" for pending status', () => {
    render(<KYCStatusBadge status="pending" />)
    expect(screen.getByText('Pending')).toBeInTheDocument()
  })

  it('renders "Rejected" for rejected status', () => {
    render(<KYCStatusBadge status="rejected" />)
    expect(screen.getByText('Rejected')).toBeInTheDocument()
  })

  it('renders "Not submitted" for not_started status', () => {
    render(<KYCStatusBadge status="not_started" />)
    expect(screen.getByText('Not submitted')).toBeInTheDocument()
  })
})

// ---------------------------------------------------------------------------
// EscrowStatusBadge
// ---------------------------------------------------------------------------

describe('EscrowStatusBadge', () => {
  it('renders "Created" label', () => {
    render(<EscrowStatusBadge status="created" />)
    expect(screen.getByText('Created')).toBeInTheDocument()
  })

  it('renders "Funded" label', () => {
    render(<EscrowStatusBadge status="funded" />)
    expect(screen.getByText('Funded')).toBeInTheDocument()
  })

  it('renders "In progress" label', () => {
    render(<EscrowStatusBadge status="in_progress" />)
    expect(screen.getByText('In progress')).toBeInTheDocument()
  })

  it('renders "Disputed" label', () => {
    render(<EscrowStatusBadge status="disputed" />)
    expect(screen.getByText('Disputed')).toBeInTheDocument()
  })

  it('renders "Refunded" label', () => {
    render(<EscrowStatusBadge status="refunded" />)
    expect(screen.getByText('Refunded')).toBeInTheDocument()
  })
})

// ---------------------------------------------------------------------------
// AttorneyVerificationSummary
// ---------------------------------------------------------------------------

describe('AttorneyVerificationSummary', () => {
  it('renders verification level badge in compact mode', () => {
    render(
      <AttorneyVerificationSummary
        identity={true}
        insurance={true}
        certification={true}
        level="premium"
        compact={true}
      />
    )
    expect(screen.getByText('Premium')).toBeInTheDocument()
  })

  it('hides individual badges in compact mode', () => {
    render(
      <AttorneyVerificationSummary
        identity={true}
        insurance={true}
        certification={false}
        level="basic"
        compact={true}
      />
    )
    expect(screen.queryByText('Identity verified')).not.toBeInTheDocument()
    expect(screen.queryByText('Insurance verified')).not.toBeInTheDocument()
  })

  it('shows trust score in compact mode when >= 60', () => {
    const { container } = render(
      <AttorneyVerificationSummary
        identity={true}
        insurance={false}
        certification={false}
        level="basic"
        trustScore={75}
        compact={true}
      />
    )
    // TrustScore with showLabel=false in compact: progress bar present
    const progressBar = container.querySelector('.bg-blue-500')
    expect(progressBar).toBeInTheDocument()
  })

  it('hides trust score in compact mode when < 60', () => {
    render(
      <AttorneyVerificationSummary
        identity={true}
        insurance={false}
        certification={false}
        level="basic"
        trustScore={40}
        compact={true}
      />
    )
    // Should NOT render TrustScore bar
    expect(screen.queryByText(/Fair/)).not.toBeInTheDocument()
  })

  it('shows all individual verification badges in full mode', () => {
    render(
      <AttorneyVerificationSummary
        identity={true}
        insurance={true}
        certification={true}
        level="standard"
        compact={false}
      />
    )
    expect(screen.getByText('Identity verified')).toBeInTheDocument()
    expect(screen.getByText('Insurance verified')).toBeInTheDocument()
    expect(screen.getByText('Qualified')).toBeInTheDocument()
  })

  it('hides verification badges that are false in full mode', () => {
    render(
      <AttorneyVerificationSummary
        identity={true}
        insurance={false}
        certification={false}
        level="basic"
      />
    )
    expect(screen.getByText('Identity verified')).toBeInTheDocument()
    expect(screen.queryByText('Insurance verified')).not.toBeInTheDocument()
    expect(screen.queryByText('Qualified')).not.toBeInTheDocument()
  })

  it('shows trust score with label in full mode', () => {
    render(
      <AttorneyVerificationSummary
        identity={false}
        insurance={false}
        certification={false}
        level="none"
        trustScore={90}
      />
    )
    expect(screen.getByText('90% - Excellent')).toBeInTheDocument()
  })
})
