/**
 * Skeleton Components — Comprehensive Unit Tests
 * Tests all skeleton variants: Skeleton, CardSkeleton, ListSkeleton,
 * GridSkeleton, PageSkeleton, FormSkeleton, AttorneyCardSkeleton, AttorneyListSkeleton
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

// ---------------------------------------------------------------------------
// Skeleton (base)
// ---------------------------------------------------------------------------

describe('Skeleton', () => {
  it('renders a div element', () => {
    const { container } = render(<Skeleton />)
    expect(container.firstChild?.nodeName).toBe('DIV')
  })

  it('has base skeleton styles (rounded, bg-gray-200)', () => {
    const { container } = render(<Skeleton />)
    const el = container.firstChild as HTMLElement
    expect(el.className).toContain('rounded-md')
    expect(el.className).toContain('bg-gray-200')
  })

  it('shows shimmer animation by default', () => {
    const { container } = render(<Skeleton />)
    const el = container.firstChild as HTMLElement
    expect(el.className).toContain('after:animate-')
  })

  it('hides shimmer animation when shimmer=false', () => {
    const { container } = render(<Skeleton shimmer={false} />)
    const el = container.firstChild as HTMLElement
    expect(el.className).not.toContain('after:animate-')
  })

  it('merges custom className with base styles', () => {
    const { container } = render(<Skeleton className="h-10 w-full" />)
    const el = container.firstChild as HTMLElement
    expect(el.className).toContain('h-10')
    expect(el.className).toContain('w-full')
    expect(el.className).toContain('bg-gray-200')
  })

  it('applies overflow-hidden for shimmer containment', () => {
    const { container } = render(<Skeleton />)
    const el = container.firstChild as HTMLElement
    expect(el.className).toContain('overflow-hidden')
  })
})

// ---------------------------------------------------------------------------
// CardSkeleton
// ---------------------------------------------------------------------------

describe('CardSkeleton', () => {
  it('renders a card container with rounded border', () => {
    const { container } = render(<CardSkeleton />)
    expect(container.querySelector('.rounded-xl')).toBeInTheDocument()
    expect(container.querySelector('.border-gray-200')).toBeInTheDocument()
  })

  it('renders multiple skeleton placeholders for avatar, title, and body', () => {
    const { container } = render(<CardSkeleton />)
    const skeletons = container.querySelectorAll('.bg-gray-200')
    // Avatar (1) + name (1) + subtitle (1) + body lines (2) + tags (2) = 7
    expect(skeletons.length).toBeGreaterThanOrEqual(5)
  })

  it('renders a circular avatar placeholder', () => {
    const { container } = render(<CardSkeleton />)
    expect(container.querySelector('.rounded-full')).toBeInTheDocument()
  })
})

// ---------------------------------------------------------------------------
// ListSkeleton
// ---------------------------------------------------------------------------

describe('ListSkeleton', () => {
  it('renders 5 items by default', () => {
    const { container } = render(<ListSkeleton />)
    const items = container.querySelectorAll('.rounded-xl')
    expect(items).toHaveLength(5)
  })

  it('renders custom count of items', () => {
    const { container } = render(<ListSkeleton count={3} />)
    const items = container.querySelectorAll('.rounded-xl')
    expect(items).toHaveLength(3)
  })

  it('renders 0 items when count=0', () => {
    const { container } = render(<ListSkeleton count={0} />)
    const items = container.querySelectorAll('.rounded-xl')
    expect(items).toHaveLength(0)
  })

  it('each item contains skeleton placeholders', () => {
    const { container } = render(<ListSkeleton count={1} />)
    const skeletons = container.querySelectorAll('.bg-gray-200')
    // Icon (1) + title (1) + subtitle (1) + button (1) = 4 minimum
    expect(skeletons.length).toBeGreaterThanOrEqual(3)
  })
})

// ---------------------------------------------------------------------------
// GridSkeleton
// ---------------------------------------------------------------------------

describe('GridSkeleton', () => {
  it('renders in a CSS grid layout', () => {
    const { container } = render(<GridSkeleton />)
    const grid = container.firstChild as HTMLElement
    expect(grid.className).toContain('grid')
  })

  it('renders 8 cards by default', () => {
    const { container } = render(<GridSkeleton />)
    const cards = container.querySelectorAll('.rounded-xl')
    expect(cards).toHaveLength(8)
  })

  it('renders custom count of cards', () => {
    const { container } = render(<GridSkeleton count={4} />)
    const cards = container.querySelectorAll('.rounded-xl')
    expect(cards).toHaveLength(4)
  })

  it('applies 2-col grid class when cols=2', () => {
    const { container } = render(<GridSkeleton cols={2} count={1} />)
    const grid = container.firstChild as HTMLElement
    expect(grid.className).toContain('grid-cols-2')
  })

  it('applies 3-col responsive grid when cols=3', () => {
    const { container } = render(<GridSkeleton cols={3} count={1} />)
    const grid = container.firstChild as HTMLElement
    expect(grid.className).toContain('md:grid-cols-3')
  })

  it('applies 4-col responsive grid when cols=4', () => {
    const { container } = render(<GridSkeleton cols={4} count={1} />)
    const grid = container.firstChild as HTMLElement
    expect(grid.className).toContain('md:grid-cols-4')
  })

  it('falls back to 4-col grid for unsupported cols value', () => {
    const { container } = render(<GridSkeleton cols={6} count={1} />)
    const grid = container.firstChild as HTMLElement
    expect(grid.className).toContain('md:grid-cols-4')
  })
})

// ---------------------------------------------------------------------------
// AttorneyCardSkeleton
// ---------------------------------------------------------------------------

describe('AttorneyCardSkeleton', () => {
  it('renders with role="article" for semantic meaning', () => {
    render(<AttorneyCardSkeleton />)
    expect(screen.getByRole('article')).toBeInTheDocument()
  })

  it('has aria-busy="true" to indicate loading', () => {
    render(<AttorneyCardSkeleton />)
    expect(screen.getByRole('article')).toHaveAttribute('aria-busy', 'true')
  })

  it('has aria-label describing the loading state', () => {
    render(<AttorneyCardSkeleton />)
    expect(screen.getByRole('article')).toHaveAttribute('aria-label', 'Loading attorney')
  })

  it('renders skeleton placeholders for attorney card layout', () => {
    const { container } = render(<AttorneyCardSkeleton />)
    const skeletons = container.querySelectorAll('.bg-gray-200')
    // Badge + name + rating + address icon + address + phone + email + 2 CTA buttons
    expect(skeletons.length).toBeGreaterThanOrEqual(6)
  })
})

// ---------------------------------------------------------------------------
// AttorneyListSkeleton
// ---------------------------------------------------------------------------

describe('AttorneyListSkeleton', () => {
  it('renders with role="status" for screen readers', () => {
    render(<AttorneyListSkeleton />)
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('has aria-label="Loading attorneys"', () => {
    render(<AttorneyListSkeleton />)
    expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Loading attorneys')
  })

  it('renders 5 attorney card skeletons by default', () => {
    render(<AttorneyListSkeleton />)
    const articles = screen.getAllByRole('article')
    expect(articles).toHaveLength(5)
  })

  it('renders custom count of attorney cards', () => {
    render(<AttorneyListSkeleton count={2} />)
    const articles = screen.getAllByRole('article')
    expect(articles).toHaveLength(2)
  })

  it('includes sr-only "Loading..." text for screen readers', () => {
    render(<AttorneyListSkeleton />)
    const srText = screen.getByText('Loading...')
    expect(srText).toBeInTheDocument()
    expect(srText).toHaveClass('sr-only')
  })
})

// ---------------------------------------------------------------------------
// FormSkeleton
// ---------------------------------------------------------------------------

describe('FormSkeleton', () => {
  it('renders skeleton placeholders for form labels and fields', () => {
    const { container } = render(<FormSkeleton />)
    const skeletons = container.querySelectorAll('.bg-gray-200')
    // 3 labels + 3 fields + 1 submit button = 7
    expect(skeletons.length).toBeGreaterThanOrEqual(7)
  })

  it('renders rounded-lg elements for input field placeholders', () => {
    const { container } = render(<FormSkeleton />)
    const rounded = container.querySelectorAll('.rounded-lg')
    expect(rounded.length).toBeGreaterThanOrEqual(3)
  })
})

// ---------------------------------------------------------------------------
// PageSkeleton
// ---------------------------------------------------------------------------

describe('PageSkeleton', () => {
  it('renders a hero section with gradient background', () => {
    const { container } = render(<PageSkeleton />)
    expect(container.querySelector('.bg-gradient-to-r')).toBeInTheDocument()
  })

  it('renders content section with grid of cards', () => {
    const { container } = render(<PageSkeleton />)
    const grid = container.querySelector('.grid')
    expect(grid).toBeInTheDocument()
  })

  it('renders within a min-h-screen container', () => {
    const { container } = render(<PageSkeleton />)
    expect(container.querySelector('.min-h-screen')).toBeInTheDocument()
  })

  it('renders multiple skeleton elements across hero and content', () => {
    const { container } = render(<PageSkeleton />)
    const skeletons = container.querySelectorAll('.bg-gray-200')
    // Hero (2) + section title (1) + grid cards (8 * ~7 each) = many
    expect(skeletons.length).toBeGreaterThan(10)
  })
})
