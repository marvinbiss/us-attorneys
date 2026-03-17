/**
 * Logo / Tagline / BrandHeader Components — Unit Tests
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import Logo, { Tagline, BrandHeader } from '@/components/ui/Logo'

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string; [key: string]: unknown }) => (
    <a href={href} {...props}>{children}</a>
  ),
}))

describe('Logo', () => {
  it('renders full variant with icon and text by default', () => {
    render(<Logo />)
    // Text should contain "US" and "Attorneys"
    expect(screen.getByText('Attorneys')).toBeInTheDocument()
    // SVG icon should be present
    const { container } = render(<Logo />)
    expect(container.querySelector('svg')).toBeInTheDocument()
  })

  it('renders as a link to "/" by default', () => {
    render(<Logo />)
    const link = screen.getByText('Attorneys').closest('a')
    expect(link).toHaveAttribute('href', '/')
  })

  it('renders as a link to custom href', () => {
    render(<Logo href="/about" />)
    const link = screen.getByText('Attorneys').closest('a')
    expect(link).toHaveAttribute('href', '/about')
  })

  it('renders without link when href is empty string', () => {
    const { container } = render(<Logo href="" />)
    expect(container.querySelector('a')).not.toBeInTheDocument()
  })

  it('renders icon-only variant', () => {
    const { container } = render(<Logo variant="icon" />)
    expect(container.querySelector('svg')).toBeInTheDocument()
    expect(screen.queryByText('Attorneys')).not.toBeInTheDocument()
  })

  it('renders text-only variant', () => {
    const { container } = render(<Logo variant="text" />)
    expect(screen.getByText('Attorneys')).toBeInTheDocument()
    expect(container.querySelector('svg')).not.toBeInTheDocument()
  })

  it('applies custom className', () => {
    const { container } = render(<Logo className="my-logo" />)
    const inner = container.querySelector('.my-logo')
    expect(inner).toBeInTheDocument()
  })
})

describe('Tagline', () => {
  it('renders the tagline text', () => {
    render(<Tagline />)
    expect(screen.getByText('Find qualified attorneys near you')).toBeInTheDocument()
  })

  it('applies custom className', () => {
    const { container } = render(<Tagline className="mt-4" />)
    const p = container.querySelector('p')
    expect(p?.className).toContain('mt-4')
  })
})

describe('BrandHeader', () => {
  it('renders logo and tagline', () => {
    render(<BrandHeader />)
    expect(screen.getByText('Attorneys')).toBeInTheDocument()
    expect(screen.getByText('Find qualified attorneys near you')).toBeInTheDocument()
  })

  it('applies centered styling when centered=true', () => {
    const { container } = render(<BrandHeader centered />)
    const wrapper = container.firstChild as HTMLElement
    expect(wrapper.className).toContain('text-center')
  })
})
