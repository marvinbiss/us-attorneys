/**
 * Breadcrumbs Component — Comprehensive Unit Tests
 *
 * Tests for src/components/seo/Breadcrumbs.tsx
 * Covers: semantic nav, JSON-LD, Home prepend, last item no link, accessibility
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

// Mock next/link to render a simple anchor
vi.mock('next/link', () => ({
  default: ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) => (
    <a href={href} className={className}>{children}</a>
  ),
}))

import Breadcrumbs from '@/components/seo/Breadcrumbs'

describe('Breadcrumbs component', () => {
  const items = [
    { label: 'Practice Areas', href: '/practice-areas' },
    { label: 'Criminal Defense', href: '/practice-areas/criminal-defense' },
    { label: 'Houston' },
  ]

  it('renders a nav element with aria-label="Breadcrumb"', () => {
    const { container } = render(<Breadcrumbs items={items} />)
    const nav = container.querySelector('nav[aria-label="Breadcrumb"]')
    expect(nav).not.toBeNull()
  })

  it('prepends Home as the first breadcrumb item', () => {
    const { container } = render(<Breadcrumbs items={items} />)
    const listItems = container.querySelectorAll('li')
    // Home + 3 items = 4
    expect(listItems).toHaveLength(4)
    // First item should be Home link
    const homeLink = listItems[0].querySelector('a')
    expect(homeLink).not.toBeNull()
    expect(homeLink!.textContent).toBe('Home')
    expect(homeLink!.getAttribute('href')).toBe('/')
  })

  it('renders intermediate items as links', () => {
    const { container } = render(<Breadcrumbs items={items} />)
    const links = container.querySelectorAll('a')
    // Home + Practice Areas + Criminal Defense = 3 links
    expect(links.length).toBe(3)
    expect(links[1].textContent).toBe('Practice Areas')
    expect(links[1].getAttribute('href')).toBe('/practice-areas')
  })

  it('renders last item as current page (no link)', () => {
    render(<Breadcrumbs items={items} />)
    const current = screen.getByText('Houston')
    expect(current.tagName).not.toBe('A')
    expect(current.getAttribute('aria-current')).toBe('page')
  })

  it('last item has font-medium styling', () => {
    render(<Breadcrumbs items={items} />)
    const current = screen.getByText('Houston')
    expect(current.className).toContain('font-medium')
  })

  it('renders JSON-LD BreadcrumbList script tag', () => {
    const { container } = render(<Breadcrumbs items={items} />)
    const script = container.querySelector('script[type="application/ld+json"]')
    expect(script).not.toBeNull()
    const content = script!.innerHTML
      .replace(/\u003c/g, '<')
      .replace(/\u003e/g, '>')
      .replace(/\u0026/g, '&')
    const jsonLd = JSON.parse(content)
    expect(jsonLd['@context']).toBe('https://schema.org')
    expect(jsonLd['@type']).toBe('BreadcrumbList')
  })

  it('JSON-LD has correct number of items (including Home)', () => {
    const { container } = render(<Breadcrumbs items={items} />)
    const script = container.querySelector('script[type="application/ld+json"]')
    const content = script!.innerHTML
      .replace(/\u003c/g, '<')
      .replace(/\u003e/g, '>')
      .replace(/\u0026/g, '&')
    const jsonLd = JSON.parse(content)
    expect(jsonLd.itemListElement).toHaveLength(4)
  })

  it('JSON-LD last item has no "item" property', () => {
    const { container } = render(<Breadcrumbs items={items} />)
    const script = container.querySelector('script[type="application/ld+json"]')
    const content = script!.innerHTML
      .replace(/\u003c/g, '<')
      .replace(/\u003e/g, '>')
      .replace(/\u0026/g, '&')
    const jsonLd = JSON.parse(content)
    const lastItem = jsonLd.itemListElement[jsonLd.itemListElement.length - 1]
    expect(lastItem.item).toBeUndefined()
    expect(lastItem.name).toBe('Houston')
    expect(lastItem.position).toBe(4)
  })

  it('JSON-LD non-last items have "item" as full URL', () => {
    const { container } = render(<Breadcrumbs items={items} />)
    const script = container.querySelector('script[type="application/ld+json"]')
    const content = script!.innerHTML
      .replace(/\u003c/g, '<')
      .replace(/\u003e/g, '>')
      .replace(/\u0026/g, '&')
    const jsonLd = JSON.parse(content)
    // Home (has href /)
    expect(jsonLd.itemListElement[0].item).toBeDefined()
    expect(jsonLd.itemListElement[0].item).toContain('/')
    // Practice Areas
    expect(jsonLd.itemListElement[1].item).toContain('/practice-areas')
  })

  it('renders separator slashes between items', () => {
    const { container } = render(<Breadcrumbs items={items} />)
    const separators = container.querySelectorAll('[aria-hidden="true"]')
    // 3 separators (between 4 items)
    expect(separators).toHaveLength(3)
    expect(separators[0].textContent).toBe('/')
  })

  it('applies custom className', () => {
    const { container } = render(<Breadcrumbs items={items} className="mt-4" />)
    const nav = container.querySelector('nav')
    expect(nav!.className).toContain('mt-4')
  })

  it('renders ordered list (ol) for proper semantics', () => {
    const { container } = render(<Breadcrumbs items={items} />)
    const ol = container.querySelector('ol')
    expect(ol).not.toBeNull()
  })

  it('renders item without href as plain text (not a link)', () => {
    // Items without href that are not last should render as span
    const itemsNoHref = [
      { label: 'Category' }, // no href, not last
      { label: 'Page' },    // no href, last
    ]
    const { container } = render(<Breadcrumbs items={itemsNoHref} />)
    const listItems = container.querySelectorAll('li')
    // Home + 2 = 3 items
    expect(listItems).toHaveLength(3)
    // "Category" (index 1, not last) should be a span (no link since no href)
    const categoryLi = listItems[1]
    const link = categoryLi.querySelector('a')
    expect(link).toBeNull()
    // "Page" (last) should have aria-current
    const lastSpan = screen.getByText('Page')
    expect(lastSpan.getAttribute('aria-current')).toBe('page')
  })
})
