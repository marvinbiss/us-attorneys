/**
 * Breadcrumb Component — Unit Tests
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import Breadcrumb, { type BreadcrumbItem } from '@/components/Breadcrumb'

describe('Breadcrumb', () => {
  it('renders the Home link', () => {
    render(<Breadcrumb items={[]} />)
    expect(screen.getByText('Home')).toBeInTheDocument()
  })

  it('renders a single item as current (no link)', () => {
    const items: BreadcrumbItem[] = [{ label: 'Attorneys' }]
    render(<Breadcrumb items={items} />)

    expect(screen.getByText('Attorneys')).toBeInTheDocument()
    // Single/last item should be a <span> (not a link)
    const el = screen.getByText('Attorneys')
    expect(el.tagName).toBe('SPAN')
    expect(el.closest('a')).toBeNull()
  })

  it('renders multiple items with links for non-last items', () => {
    const items: BreadcrumbItem[] = [
      { label: 'Practice Areas', href: '/practice-areas' },
      { label: 'Personal Injury', href: '/practice-areas/personal-injury' },
      { label: 'Houston' },
    ]
    render(<Breadcrumb items={items} />)

    // First two should be links
    const practiceLink = screen.getByText('Practice Areas').closest('a')
    expect(practiceLink).toHaveAttribute('href', '/practice-areas')

    const injuryLink = screen.getByText('Personal Injury').closest('a')
    expect(injuryLink).toHaveAttribute('href', '/practice-areas/personal-injury')

    // Last item is plain text
    const houston = screen.getByText('Houston')
    expect(houston.tagName).toBe('SPAN')
    expect(houston.closest('a')).toBeNull()
  })

  it('uses schema.org BreadcrumbList markup', () => {
    const items: BreadcrumbItem[] = [{ label: 'Attorneys' }]
    render(<Breadcrumb items={items} />)

    const ol = screen.getByRole('list')
    expect(ol).toHaveAttribute('itemtype', 'https://schema.org/BreadcrumbList')
  })

  it('sets correct position meta for each item', () => {
    const items: BreadcrumbItem[] = [
      { label: 'A', href: '/a' },
      { label: 'B', href: '/b' },
      { label: 'C' },
    ]
    const { container } = render(<Breadcrumb items={items} />)

    const positions = container.querySelectorAll('meta[itemprop="position"]')
    // Home (position 1) + 3 items (2, 3, 4) = 4 position metas
    expect(positions).toHaveLength(4)
    expect(positions[0]).toHaveAttribute('content', '1')
    expect(positions[1]).toHaveAttribute('content', '2')
    expect(positions[2]).toHaveAttribute('content', '3')
    expect(positions[3]).toHaveAttribute('content', '4')
  })

  it('applies custom className', () => {
    const { container } = render(
      <Breadcrumb items={[{ label: 'Test' }]} className="my-custom-class" />
    )
    expect(container.querySelector('nav')).toHaveClass('my-custom-class')
  })
})
