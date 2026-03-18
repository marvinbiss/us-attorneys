/**
 * Skeleton Components — Unit Tests
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import {
  Skeleton,
  CardSkeleton,
  ListSkeleton,
  GridSkeleton,
  AttorneyCardSkeleton,
  AttorneyListSkeleton,
  FormSkeleton,
  PageSkeleton,
} from '@/components/ui/Skeleton'

// Mock @/lib/utils
vi.mock('@/lib/utils', () => ({
  cn: (...args: unknown[]) => args.filter(Boolean).join(' '),
}))

describe('Skeleton', () => {
  it('renders a div with base skeleton styles', () => {
    const { container } = render(<Skeleton />)
    const el = container.firstChild as HTMLElement
    expect(el.className).toContain('bg-gray-200')
    expect(el.className).toContain('rounded-md')
  })

  it('applies shimmer effect by default', () => {
    const { container } = render(<Skeleton />)
    const el = container.firstChild as HTMLElement
    expect(el.className).toContain('after:animate-')
  })

  it('disables shimmer when shimmer=false', () => {
    const { container } = render(<Skeleton shimmer={false} />)
    const el = container.firstChild as HTMLElement
    expect(el.className).not.toContain('after:animate-')
  })

  it('applies custom className', () => {
    const { container } = render(<Skeleton className="h-10 w-full" />)
    const el = container.firstChild as HTMLElement
    expect(el.className).toContain('h-10')
    expect(el.className).toContain('w-full')
  })
})

describe('CardSkeleton', () => {
  it('renders skeleton elements inside a card layout', () => {
    const { container } = render(<CardSkeleton />)
    expect(container.querySelector('.rounded-xl')).toBeInTheDocument()
    // Should have multiple skeleton placeholders
    const skeletons = container.querySelectorAll('.bg-gray-200')
    expect(skeletons.length).toBeGreaterThan(3)
  })
})

describe('ListSkeleton', () => {
  it('renders 5 items by default', () => {
    const { container } = render(<ListSkeleton />)
    const items = container.querySelectorAll('.rounded-xl')
    expect(items).toHaveLength(5)
  })

  it('renders custom count', () => {
    const { container } = render(<ListSkeleton count={3} />)
    const items = container.querySelectorAll('.rounded-xl')
    expect(items).toHaveLength(3)
  })
})

describe('GridSkeleton', () => {
  it('renders 8 cards by default in a grid', () => {
    const { container } = render(<GridSkeleton />)
    const grid = container.firstChild as HTMLElement
    expect(grid.className).toContain('grid')
    // Default 8 CardSkeletons
    const cards = container.querySelectorAll('.rounded-xl')
    expect(cards).toHaveLength(8)
  })

  it('renders custom count of cards', () => {
    const { container } = render(<GridSkeleton count={3} />)
    const cards = container.querySelectorAll('.rounded-xl')
    expect(cards).toHaveLength(3)
  })

  it('applies 2-col grid class when cols=2', () => {
    const { container } = render(<GridSkeleton cols={2} count={2} />)
    const grid = container.firstChild as HTMLElement
    expect(grid.className).toContain('grid-cols-2')
  })

  it('applies 3-col grid class when cols=3', () => {
    const { container } = render(<GridSkeleton cols={3} count={2} />)
    const grid = container.firstChild as HTMLElement
    expect(grid.className).toContain('md:grid-cols-3')
  })

  it('applies 4-col grid class when cols=4', () => {
    const { container } = render(<GridSkeleton cols={4} count={2} />)
    const grid = container.firstChild as HTMLElement
    expect(grid.className).toContain('md:grid-cols-4')
  })

  it('falls back to 4-col grid for unsupported cols value', () => {
    const { container } = render(<GridSkeleton cols={5} count={2} />)
    const grid = container.firstChild as HTMLElement
    expect(grid.className).toContain('md:grid-cols-4')
  })
})

describe('AttorneyCardSkeleton', () => {
  it('renders with aria-busy and aria-label for accessibility', () => {
    render(<AttorneyCardSkeleton />)
    const card = screen.getByRole('article')
    expect(card).toHaveAttribute('aria-busy', 'true')
    expect(card).toHaveAttribute('aria-label', 'Loading attorney')
  })
})

describe('AttorneyListSkeleton', () => {
  it('renders default 5 attorney card skeletons', () => {
    render(<AttorneyListSkeleton />)
    const status = screen.getByRole('status')
    expect(status).toHaveAttribute('aria-label', 'Loading attorneys')
  })

  it('renders custom count', () => {
    render(<AttorneyListSkeleton count={3} />)
    const articles = screen.getAllByRole('article')
    expect(articles).toHaveLength(3)
  })

  it('has sr-only loading text', () => {
    render(<AttorneyListSkeleton />)
    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })
})

describe('FormSkeleton', () => {
  it('renders skeleton form fields', () => {
    const { container } = render(<FormSkeleton />)
    // Multiple skeleton elements for form fields
    const skeletons = container.querySelectorAll('.bg-gray-200')
    expect(skeletons.length).toBeGreaterThanOrEqual(4)
  })
})

describe('PageSkeleton', () => {
  it('renders hero and content sections', () => {
    const { container } = render(<PageSkeleton />)
    // Hero section with gradient
    expect(container.querySelector('.bg-gradient-to-r')).toBeInTheDocument()
    // Content grid
    const skeletons = container.querySelectorAll('.bg-gray-200')
    expect(skeletons.length).toBeGreaterThan(5)
  })
})
