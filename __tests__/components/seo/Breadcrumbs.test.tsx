/**
 * Tests — src/components/seo/Breadcrumbs.tsx
 * Visual rendering, JSON-LD structured data, aria attributes
 */
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string; [key: string]: unknown }) => (
    <a href={href} {...props}>{children}</a>
  ),
}))

vi.mock('@/lib/seo/config', () => ({
  SITE_URL: 'https://us-attorneys.com',
}))

import Breadcrumbs, { type BreadcrumbItem } from '@/components/seo/Breadcrumbs'

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------
describe('Breadcrumbs rendering', () => {
  it('always renders Home as the first item', () => {
    render(<Breadcrumbs items={[]} />)
    // Home should be present even with empty items
    expect(screen.getByText('Home')).toBeInTheDocument()
  })

  it('renders Home as a link to /', () => {
    render(<Breadcrumbs items={[{ label: 'Test' }]} />)
    const homeLink = screen.getByText('Home').closest('a')
    expect(homeLink).toHaveAttribute('href', '/')
  })

  it('renders all provided items plus Home', () => {
    const items: BreadcrumbItem[] = [
      { label: 'Practice Areas', href: '/practice-areas' },
      { label: 'Personal Injury' },
    ]
    render(<Breadcrumbs items={items} />)

    expect(screen.getByText('Home')).toBeInTheDocument()
    expect(screen.getByText('Practice Areas')).toBeInTheDocument()
    expect(screen.getByText('Personal Injury')).toBeInTheDocument()
  })

  it('renders intermediate items with href as links', () => {
    const items: BreadcrumbItem[] = [
      { label: 'Practice Areas', href: '/practice-areas' },
      { label: 'Family Law', href: '/practice-areas/family-law' },
      { label: 'Houston' },
    ]
    render(<Breadcrumbs items={items} />)

    const practiceLink = screen.getByText('Practice Areas').closest('a')
    expect(practiceLink).toHaveAttribute('href', '/practice-areas')

    const familyLink = screen.getByText('Family Law').closest('a')
    expect(familyLink).toHaveAttribute('href', '/practice-areas/family-law')
  })

  it('renders the last item as a span (not a link)', () => {
    const items: BreadcrumbItem[] = [
      { label: 'States', href: '/states' },
      { label: 'Texas' },
    ]
    render(<Breadcrumbs items={items} />)

    const texas = screen.getByText('Texas')
    expect(texas.tagName).toBe('SPAN')
    expect(texas.closest('a')).toBeNull()
  })

  it('renders separator characters between items', () => {
    const items: BreadcrumbItem[] = [
      { label: 'A', href: '/a' },
      { label: 'B' },
    ]
    const { container } = render(<Breadcrumbs items={items} />)

    // Separators are "/" spans with aria-hidden
    const separators = container.querySelectorAll('[aria-hidden="true"]')
    // Home -> A (separator) -> B (separator) = 2 separators
    expect(separators.length).toBe(2)
  })

  it('renders item without href as a plain span (not link)', () => {
    const items: BreadcrumbItem[] = [
      { label: 'Category' }, // no href, not last
      { label: 'Subcategory' },
    ]
    render(<Breadcrumbs items={items} />)

    // "Category" has no href and is not last, so should render as a gray span
    const category = screen.getByText('Category')
    expect(category.tagName).toBe('SPAN')
    expect(category.closest('a')).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// Aria attributes
// ---------------------------------------------------------------------------
describe('Breadcrumbs aria', () => {
  it('has nav with aria-label="Breadcrumb"', () => {
    render(<Breadcrumbs items={[{ label: 'Test' }]} />)
    const nav = screen.getByLabelText('Breadcrumb')
    expect(nav.tagName).toBe('NAV')
  })

  it('last item has aria-current="page"', () => {
    const items: BreadcrumbItem[] = [
      { label: 'States', href: '/states' },
      { label: 'New York' },
    ]
    render(<Breadcrumbs items={items} />)

    const lastItem = screen.getByText('New York')
    expect(lastItem).toHaveAttribute('aria-current', 'page')
  })

  it('non-last items do NOT have aria-current', () => {
    const items: BreadcrumbItem[] = [
      { label: 'States', href: '/states' },
      { label: 'New York' },
    ]
    render(<Breadcrumbs items={items} />)

    const statesLink = screen.getByText('States')
    expect(statesLink).not.toHaveAttribute('aria-current')

    const homeLink = screen.getByText('Home')
    expect(homeLink).not.toHaveAttribute('aria-current')
  })

  it('when single item (no intermediate), that item has aria-current', () => {
    render(<Breadcrumbs items={[{ label: 'About' }]} />)
    expect(screen.getByText('About')).toHaveAttribute('aria-current', 'page')
  })
})

// ---------------------------------------------------------------------------
// JSON-LD structured data
// ---------------------------------------------------------------------------
describe('Breadcrumbs JSON-LD', () => {
  it('renders a script tag with BreadcrumbList JSON-LD', () => {
    const items: BreadcrumbItem[] = [
      { label: 'Practice Areas', href: '/practice-areas' },
      { label: 'Criminal Defense' },
    ]
    const { container } = render(<Breadcrumbs items={items} />)

    const scripts = container.querySelectorAll('script[type="application/ld+json"]')
    expect(scripts).toHaveLength(1)

    // Parse the JSON-LD (need to unescape the safety replacements)
    const raw = scripts[0].innerHTML
      .replace(/\\u003c/g, '<')
      .replace(/\\u003e/g, '>')
      .replace(/\\u0026/g, '&')
    const jsonLd = JSON.parse(raw)

    expect(jsonLd['@context']).toBe('https://schema.org')
    expect(jsonLd['@type']).toBe('BreadcrumbList')
    expect(jsonLd.itemListElement).toHaveLength(3) // Home + Practice Areas + Criminal Defense
  })

  it('includes position for each item starting at 1', () => {
    const items: BreadcrumbItem[] = [
      { label: 'States', href: '/states' },
      { label: 'Texas', href: '/states/texas' },
      { label: 'Houston' },
    ]
    const { container } = render(<Breadcrumbs items={items} />)

    const script = container.querySelector('script[type="application/ld+json"]')!
    const raw = script.innerHTML
      .replace(/\\u003c/g, '<')
      .replace(/\\u003e/g, '>')
      .replace(/\\u0026/g, '&')
    const jsonLd = JSON.parse(raw)

    expect(jsonLd.itemListElement[0].position).toBe(1)
    expect(jsonLd.itemListElement[1].position).toBe(2)
    expect(jsonLd.itemListElement[2].position).toBe(3)
    expect(jsonLd.itemListElement[3].position).toBe(4)
  })

  it('includes item URL for non-last items with href', () => {
    const items: BreadcrumbItem[] = [
      { label: 'Practice Areas', href: '/practice-areas' },
      { label: 'Personal Injury' },
    ]
    const { container } = render(<Breadcrumbs items={items} />)

    const script = container.querySelector('script[type="application/ld+json"]')!
    const raw = script.innerHTML
      .replace(/\\u003c/g, '<')
      .replace(/\\u003e/g, '>')
      .replace(/\\u0026/g, '&')
    const jsonLd = JSON.parse(raw)

    // Home (position 1) has item URL
    expect(jsonLd.itemListElement[0].item).toBe('https://us-attorneys.com/')
    // Practice Areas (position 2) has item URL
    expect(jsonLd.itemListElement[1].item).toBe('https://us-attorneys.com/practice-areas')
    // Last item (Personal Injury) should NOT have item URL
    expect(jsonLd.itemListElement[2].item).toBeUndefined()
  })

  it('includes name for each item', () => {
    const items: BreadcrumbItem[] = [{ label: 'Glossary' }]
    const { container } = render(<Breadcrumbs items={items} />)

    const script = container.querySelector('script[type="application/ld+json"]')!
    const raw = script.innerHTML
      .replace(/\\u003c/g, '<')
      .replace(/\\u003e/g, '>')
      .replace(/\\u0026/g, '&')
    const jsonLd = JSON.parse(raw)

    expect(jsonLd.itemListElement[0].name).toBe('Home')
    expect(jsonLd.itemListElement[1].name).toBe('Glossary')
  })
})

// ---------------------------------------------------------------------------
// className prop
// ---------------------------------------------------------------------------
describe('Breadcrumbs className', () => {
  it('applies custom className to the nav element', () => {
    const { container } = render(
      <Breadcrumbs items={[{ label: 'Test' }]} className="mt-4 mb-2" />
    )
    const nav = container.querySelector('nav')
    expect(nav).toHaveClass('mt-4')
    expect(nav).toHaveClass('mb-2')
  })

  it('defaults to empty className', () => {
    const { container } = render(<Breadcrumbs items={[{ label: 'Test' }]} />)
    const nav = container.querySelector('nav')
    expect(nav).toHaveClass('text-sm')
  })
})
