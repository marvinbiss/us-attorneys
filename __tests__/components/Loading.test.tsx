/**
 * Loading Components — Unit Tests
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Loading, LoadingPage, LoadingOverlay, LoadingInline, LoadingCard } from '@/components/ui/Loading'

describe('Loading (spinner)', () => {
  it('renders with role="status" and aria-label', () => {
    render(<Loading />)
    const status = screen.getByRole('status')
    expect(status).toHaveAttribute('aria-label', 'Loading')
  })

  it('renders sr-only "Loading..." text', () => {
    render(<Loading />)
    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('applies default md size', () => {
    const { container } = render(<Loading />)
    const spinner = container.firstChild as HTMLElement
    expect(spinner.className).toContain('w-8')
    expect(spinner.className).toContain('h-8')
  })

  it('applies sm size', () => {
    const { container } = render(<Loading size="sm" />)
    const spinner = container.firstChild as HTMLElement
    expect(spinner.className).toContain('w-4')
    expect(spinner.className).toContain('h-4')
  })

  it('applies lg size', () => {
    const { container } = render(<Loading size="lg" />)
    const spinner = container.firstChild as HTMLElement
    expect(spinner.className).toContain('w-12')
  })

  it('applies custom className', () => {
    const { container } = render(<Loading className="my-loading" />)
    const spinner = container.firstChild as HTMLElement
    expect(spinner.className).toContain('my-loading')
  })
})

describe('Loading (dots variant)', () => {
  it('renders dots with role="status"', () => {
    render(<Loading variant="dots" />)
    const status = screen.getByRole('status')
    expect(status).toHaveAttribute('aria-label', 'Loading')
  })

  it('renders 3 dot spans', () => {
    const { container } = render(<Loading variant="dots" />)
    const dots = container.querySelectorAll('.rounded-full.animate-\\[bounce_1\\.4s_ease-in-out_infinite\\]')
    expect(dots).toHaveLength(3)
  })

  it('renders sr-only text', () => {
    render(<Loading variant="dots" />)
    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })
})

describe('Loading (pulse variant)', () => {
  it('renders pulse with role="status"', () => {
    render(<Loading variant="pulse" />)
    const status = screen.getByRole('status')
    expect(status).toHaveAttribute('aria-label', 'Loading')
  })

  it('renders sr-only text', () => {
    render(<Loading variant="pulse" />)
    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })
})

describe('LoadingPage', () => {
  it('renders loading spinner and text', () => {
    render(<LoadingPage />)
    expect(screen.getByRole('status')).toBeInTheDocument()
    expect(screen.getAllByText('Loading...').length).toBeGreaterThanOrEqual(1)
  })
})

describe('LoadingOverlay', () => {
  it('renders with a message', () => {
    render(<LoadingOverlay message="Processing payment..." />)
    expect(screen.getByText('Processing payment...')).toBeInTheDocument()
  })

  it('renders without a message', () => {
    const { container } = render(<LoadingOverlay />)
    // Should still render the overlay
    expect(container.querySelector('.fixed.inset-0')).toBeInTheDocument()
  })
})

describe('LoadingInline', () => {
  it('renders default "Loading..." text', () => {
    render(<LoadingInline />)
    // Inner Loading spinner has sr-only "Loading..." + the visible span also says "Loading..."
    const matches = screen.getAllByText('Loading...')
    expect(matches.length).toBeGreaterThanOrEqual(2)
  })

  it('renders custom text', () => {
    render(<LoadingInline text="Fetching data..." />)
    expect(screen.getByText('Fetching data...')).toBeInTheDocument()
  })
})

describe('LoadingCard', () => {
  it('renders with animate-pulse', () => {
    const { container } = render(<LoadingCard />)
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument()
  })
})
