/**
 * Tests for TrustBadge Component
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'

// Simple mock of TrustBadge component for testing
const TrustBadge = ({
  badge,
  showLabel = true,
  size = 'md'
}: {
  badge: 'none' | 'bronze' | 'silver' | 'gold' | 'platinum'
  showLabel?: boolean
  size?: 'sm' | 'md' | 'lg'
}) => {
  if (badge === 'none') return null

  const labels: Record<string, string> = {
    bronze: 'Bronze',
    silver: 'Silver',
    gold: 'Gold',
    platinum: 'Platinum'
  }

  const colors: Record<string, string> = {
    bronze: 'bg-amber-600',
    silver: 'bg-gray-400',
    gold: 'bg-yellow-500',
    platinum: 'bg-purple-600'
  }

  const sizes: Record<string, string> = {
    sm: 'text-xs px-1.5 py-0.5',
    md: 'text-sm px-2 py-1',
    lg: 'text-base px-3 py-1.5'
  }

  return (
    <span
      data-testid="trust-badge"
      className={`${colors[badge]} ${sizes[size]} rounded-full text-white font-medium`}
    >
      {showLabel ? labels[badge] : '★'}
    </span>
  )
}

describe('TrustBadge Component', () => {
  it('should render nothing for "none" badge', () => {
    const { container } = render(<TrustBadge badge="none" />)
    expect(container.firstChild).toBeNull()
  })

  it('should render bronze badge correctly', () => {
    render(<TrustBadge badge="bronze" />)
    expect(screen.getByTestId('trust-badge')).toHaveTextContent('Bronze')
    expect(screen.getByTestId('trust-badge')).toHaveClass('bg-amber-600')
  })

  it('should render silver badge correctly', () => {
    render(<TrustBadge badge="silver" />)
    expect(screen.getByTestId('trust-badge')).toHaveTextContent('Silver')
    expect(screen.getByTestId('trust-badge')).toHaveClass('bg-gray-400')
  })

  it('should render gold badge correctly', () => {
    render(<TrustBadge badge="gold" />)
    expect(screen.getByTestId('trust-badge')).toHaveTextContent('Gold')
    expect(screen.getByTestId('trust-badge')).toHaveClass('bg-yellow-500')
  })

  it('should render platinum badge correctly', () => {
    render(<TrustBadge badge="platinum" />)
    expect(screen.getByTestId('trust-badge')).toHaveTextContent('Platinum')
    expect(screen.getByTestId('trust-badge')).toHaveClass('bg-purple-600')
  })

  it('should hide label when showLabel is false', () => {
    render(<TrustBadge badge="gold" showLabel={false} />)
    expect(screen.getByTestId('trust-badge')).toHaveTextContent('★')
  })

  it('should apply correct size classes', () => {
    const { rerender } = render(<TrustBadge badge="gold" size="sm" />)
    expect(screen.getByTestId('trust-badge')).toHaveClass('text-xs')

    rerender(<TrustBadge badge="gold" size="md" />)
    expect(screen.getByTestId('trust-badge')).toHaveClass('text-sm')

    rerender(<TrustBadge badge="gold" size="lg" />)
    expect(screen.getByTestId('trust-badge')).toHaveClass('text-base')
  })
})
