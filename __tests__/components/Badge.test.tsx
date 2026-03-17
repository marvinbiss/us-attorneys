/**
 * Badge / StatusBadge / SlotBadge Components — Unit Tests
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import Badge, { StatusBadge, SlotBadge } from '@/components/ui/Badge'

describe('Badge', () => {
  it('renders children text', () => {
    render(<Badge>Active</Badge>)
    expect(screen.getByText('Active')).toBeInTheDocument()
  })

  it('applies neutral variant by default', () => {
    render(<Badge>Default</Badge>)
    const badge = screen.getByText('Default')
    expect(badge.className).toContain('bg-gray-100')
    expect(badge.className).toContain('text-gray-700')
  })

  it('applies primary variant styles', () => {
    render(<Badge variant="primary">Primary</Badge>)
    const badge = screen.getByText('Primary')
    expect(badge.className).toContain('bg-blue-100')
    expect(badge.className).toContain('text-blue-700')
  })

  it('applies success variant styles', () => {
    render(<Badge variant="success">Success</Badge>)
    const badge = screen.getByText('Success')
    expect(badge.className).toContain('bg-green-100')
  })

  it('applies error variant styles', () => {
    render(<Badge variant="error">Error</Badge>)
    const badge = screen.getByText('Error')
    expect(badge.className).toContain('bg-red-100')
  })

  it('applies warning variant styles', () => {
    render(<Badge variant="warning">Warning</Badge>)
    const badge = screen.getByText('Warning')
    expect(badge.className).toContain('bg-amber-100')
  })

  it('applies size sm', () => {
    render(<Badge size="sm">Small</Badge>)
    const badge = screen.getByText('Small')
    expect(badge.className).toContain('text-xs')
    expect(badge.className).toContain('px-2')
  })

  it('applies size lg', () => {
    render(<Badge size="lg">Large</Badge>)
    const badge = screen.getByText('Large')
    expect(badge.className).toContain('text-base')
    expect(badge.className).toContain('px-3')
  })

  it('renders dot indicator when dot=true', () => {
    const { container } = render(<Badge dot variant="success">Online</Badge>)
    const dot = container.querySelector('.bg-green-500')
    expect(dot).toBeInTheDocument()
  })

  it('renders icon when provided', () => {
    render(<Badge icon={<span data-testid="badge-icon">*</span>}>With icon</Badge>)
    expect(screen.getByTestId('badge-icon')).toBeInTheDocument()
  })

  it('applies custom className', () => {
    render(<Badge className="my-class">Custom</Badge>)
    const badge = screen.getByText('Custom')
    expect(badge.className).toContain('my-class')
  })
})

describe('StatusBadge', () => {
  it('renders confirmed status', () => {
    render(<StatusBadge status="confirmed" />)
    expect(screen.getByText('Confirmed')).toBeInTheDocument()
  })

  it('renders pending status', () => {
    render(<StatusBadge status="pending" />)
    expect(screen.getByText('Pending')).toBeInTheDocument()
  })

  it('renders cancelled status', () => {
    render(<StatusBadge status="cancelled" />)
    expect(screen.getByText('Cancelled')).toBeInTheDocument()
  })

  it('renders completed status', () => {
    render(<StatusBadge status="completed" />)
    expect(screen.getByText('Completed')).toBeInTheDocument()
  })

  it('renders no_show status', () => {
    render(<StatusBadge status="no_show" />)
    expect(screen.getByText('No show')).toBeInTheDocument()
  })

  it('falls back to raw status for unknown values', () => {
    render(<StatusBadge status="unknown_status" />)
    expect(screen.getByText('unknown_status')).toBeInTheDocument()
  })
})

describe('SlotBadge', () => {
  it('renders popular slot', () => {
    render(<SlotBadge type="popular" />)
    expect(screen.getByText('High demand')).toBeInTheDocument()
  })

  it('renders recommended slot', () => {
    render(<SlotBadge type="recommended" />)
    expect(screen.getByText('Recommended')).toBeInTheDocument()
  })

  it('renders last_minute slot', () => {
    render(<SlotBadge type="last_minute" />)
    expect(screen.getByText('Last minute')).toBeInTheDocument()
  })

  it('renders available slot', () => {
    render(<SlotBadge type="available" />)
    expect(screen.getByText('Available')).toBeInTheDocument()
  })
})
