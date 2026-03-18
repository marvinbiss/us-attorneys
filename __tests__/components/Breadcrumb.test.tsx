/**
 * Breadcrumb Component — Comprehensive Unit Tests
 * Tests rendering, accessibility, structured data, and edge cases
 */

import { describe, it, expect } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import Breadcrumb, { type BreadcrumbItem } from '@/components/Breadcrumb'

describe('Breadcrumb', () => {
  // --- Basic Rendering ---

  it('renders the Home link with sr-only label', () => {
    render(<Breadcrumb items={[]} />)
    const homeText = screen.getByText('Home')
    expect(homeText).toBeInTheDocument()
    expect(homeText).toHaveClass('sr-only')
  })

  it('renders a single item as current page (no link)', () => {
    const items: BreadcrumbItem[] = [{ label: 'Attorneys' }]
    render(<Breadcrumb items={items} />)

    const el = screen.getByText('Attorneys')
    expect(el.tagName).toBe('SPAN')
    expect(el.closest('a')).toBeNull()
    expect(el).toHaveClass('text-gray-900', 'font-medium')
  })

  it('renders multiple items with links for non-last items', () => {
    const items: BreadcrumbItem[] = [
      { label: 'Practice Areas', href: '/practice-areas' },
      { label: 'Personal Injury', href: '/practice-areas/personal-injury' },
      { label: 'Houston' },
    ]
    render(<Breadcrumb items={items} />)

    const practiceLink = screen.getByText('Practice Areas').closest('a')
    expect(practiceLink).toHaveAttribute('href', '/practice-areas')

    const injuryLink = screen.getByText('Personal Injury').closest('a')
    expect(injuryLink).toHaveAttribute('href', '/practice-areas/personal-injury')

    const houston = screen.getByText('Houston')
    expect(houston.tagName).toBe('SPAN')
    expect(houston.closest('a')).toBeNull()
  })

  it('renders the last item as plain text even if it has an href', () => {
    const items: BreadcrumbItem[] = [
      { label: 'Only Item', href: '/only' },
    ]
    render(<Breadcrumb items={items} />)

    // Last item should be a span, not a link, regardless of href
    const el = screen.getByText('Only Item')
    expect(el.tagName).toBe('SPAN')
    expect(el.closest('a')).toBeNull()
  })

  // --- Accessibility ---

  it('renders as a nav landmark with aria-label', () => {
    render(<Breadcrumb items={[]} />)
    const nav = screen.getByRole('navigation', { name: 'Breadcrumb' })
    expect(nav).toBeInTheDocument()
  })

  it('renders an ordered list for semantic structure', () => {
    render(<Breadcrumb items={[{ label: 'Test' }]} />)
    const list = screen.getByRole('list')
    expect(list.tagName).toBe('OL')
  })

  it('renders ChevronRight separators with aria-hidden', () => {
    const items: BreadcrumbItem[] = [
      { label: 'A', href: '/a' },
      { label: 'B' },
    ]
    const { container } = render(<Breadcrumb items={items} />)

    // Each item in the items array gets a ChevronRight separator
    const separators = container.querySelectorAll('[aria-hidden="true"]')
    expect(separators.length).toBe(items.length)
  })

  // --- Schema.org Structured Data ---

  it('uses schema.org BreadcrumbList markup on the ol element', () => {
    render(<Breadcrumb items={[{ label: 'Test' }]} />)
    const ol = screen.getByRole('list')
    expect(ol).toHaveAttribute('itemtype', 'https://schema.org/BreadcrumbList')
    expect(ol).toHaveAttribute('itemscope', '')
  })

  it('sets correct position meta for Home (1) and each subsequent item', () => {
    const items: BreadcrumbItem[] = [
      { label: 'A', href: '/a' },
      { label: 'B', href: '/b' },
      { label: 'C' },
    ]
    const { container } = render(<Breadcrumb items={items} />)

    const positions = container.querySelectorAll('meta[itemprop="position"]')
    // Home (1) + 3 items (2, 3, 4) = 4
    expect(positions).toHaveLength(4)
    expect(positions[0]).toHaveAttribute('content', '1')
    expect(positions[1]).toHaveAttribute('content', '2')
    expect(positions[2]).toHaveAttribute('content', '3')
    expect(positions[3]).toHaveAttribute('content', '4')
  })

  it('marks each list item with ListItem schema type', () => {
    const items: BreadcrumbItem[] = [{ label: 'Test' }]
    const { container } = render(<Breadcrumb items={items} />)

    const listItems = container.querySelectorAll('[itemtype="https://schema.org/ListItem"]')
    // Home + 1 item = 2
    expect(listItems).toHaveLength(2)
  })

  // --- Styling ---

  it('applies custom className to the nav element', () => {
    const { container } = render(
      <Breadcrumb items={[{ label: 'Test' }]} className="mb-4 mt-2" />
    )
    const nav = container.querySelector('nav')
    expect(nav).toHaveClass('mb-4')
    expect(nav).toHaveClass('mt-2')
  })

  it('uses empty string as default className', () => {
    const { container } = render(<Breadcrumb items={[]} />)
    const nav = container.querySelector('nav')
    // The base classes should always be present
    expect(nav).toHaveClass('flex', 'items-center')
  })

  // --- Edge Cases ---

  it('renders only Home when items array is empty', () => {
    render(<Breadcrumb items={[]} />)
    const listItems = screen.getAllByRole('listitem')
    // Only the Home item
    expect(listItems).toHaveLength(1)
    expect(screen.getByText('Home')).toBeInTheDocument()
  })

  it('renders correctly with many items (deep nesting)', () => {
    const items: BreadcrumbItem[] = [
      { label: 'Level 1', href: '/l1' },
      { label: 'Level 2', href: '/l1/l2' },
      { label: 'Level 3', href: '/l1/l2/l3' },
      { label: 'Level 4', href: '/l1/l2/l3/l4' },
      { label: 'Current Page' },
    ]
    render(<Breadcrumb items={items} />)

    // Home + 5 items = 6 list items
    const listItems = screen.getAllByRole('listitem')
    expect(listItems).toHaveLength(6)

    // First 4 items should be links
    expect(screen.getByText('Level 1').closest('a')).not.toBeNull()
    expect(screen.getByText('Level 4').closest('a')).not.toBeNull()

    // Last item should be plain text
    expect(screen.getByText('Current Page').closest('a')).toBeNull()
  })

  it('renders Home link pointing to root /', () => {
    render(<Breadcrumb items={[]} />)
    const homeLink = screen.getByText('Home').closest('a')
    expect(homeLink).toHaveAttribute('href', '/')
  })
})
