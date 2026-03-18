/**
 * JsonLd Component — Comprehensive Unit Tests
 *
 * Tests for src/components/JsonLd.tsx
 * Covers: script tag rendering, XSS escaping, single/array schemas, null filtering
 */

import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'

import JsonLd from '@/components/JsonLd'

describe('JsonLd component', () => {
  it('renders a script tag with type="application/ld+json"', () => {
    const data = { '@context': 'https://schema.org', '@type': 'Organization', name: 'Test' }
    const { container } = render(<JsonLd data={data} />)
    const script = container.querySelector('script[type="application/ld+json"]')
    expect(script).not.toBeNull()
  })

  it('renders valid JSON content inside script tag', () => {
    const data = { '@context': 'https://schema.org', '@type': 'Organization', name: 'Test' }
    const { container } = render(<JsonLd data={data} />)
    const script = container.querySelector('script[type="application/ld+json"]')
    const content = script!.innerHTML
    // Content should be parseable after unescaping
    const unescaped = content
      .replace(/\\u003c/g, '<')
      .replace(/\\u003e/g, '>')
      .replace(/\\u0026/g, '&')
    const parsed = JSON.parse(unescaped)
    expect(parsed['@context']).toBe('https://schema.org')
    expect(parsed.name).toBe('Test')
  })

  it('escapes < and > characters to prevent XSS', () => {
    const data = {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: '<script>alert("xss")</script>',
    }
    const { container } = render(<JsonLd data={data} />)
    const script = container.querySelector('script[type="application/ld+json"]')
    const content = script!.innerHTML
    // Raw < and > should not appear
    expect(content).not.toContain('<script>')
    expect(content).not.toContain('</script>')
    // Should contain escaped versions
    expect(content).toContain('\\u003c')
    expect(content).toContain('\\u003e')
  })

  it('escapes & characters', () => {
    const data = {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'Smith & Associates',
    }
    const { container } = render(<JsonLd data={data} />)
    const script = container.querySelector('script[type="application/ld+json"]')
    const content = script!.innerHTML
    expect(content).toContain('\\u0026')
    expect(content).not.toMatch(/(?<!\\u00)&(?!amp;)/)
  })

  it('handles a single schema object', () => {
    const data = { '@context': 'https://schema.org', '@type': 'WebSite', name: 'Test' }
    const { container } = render(<JsonLd data={data} />)
    const scripts = container.querySelectorAll('script[type="application/ld+json"]')
    expect(scripts).toHaveLength(1)
  })

  it('handles an array of schemas', () => {
    const data = [
      { '@context': 'https://schema.org', '@type': 'Organization', name: 'Org' },
      { '@context': 'https://schema.org', '@type': 'WebSite', name: 'Site' },
    ]
    const { container } = render(<JsonLd data={data} />)
    const scripts = container.querySelectorAll('script[type="application/ld+json"]')
    expect(scripts).toHaveLength(2)
  })

  it('filters out null and undefined items from array', () => {
    const data = [
      { '@context': 'https://schema.org', '@type': 'Organization', name: 'Org' },
      null,
      undefined,
      { '@context': 'https://schema.org', '@type': 'WebSite', name: 'Site' },
    ]
    const { container } = render(<JsonLd data={data} />)
    const scripts = container.querySelectorAll('script[type="application/ld+json"]')
    expect(scripts).toHaveLength(2)
  })

  it('passes nonce attribute to script tag', () => {
    const data = { '@context': 'https://schema.org', '@type': 'Organization', name: 'Test' }
    const { container } = render(<JsonLd data={data} nonce="abc123" />)
    const script = container.querySelector('script[type="application/ld+json"]')
    expect(script!.getAttribute('nonce')).toBe('abc123')
  })

  it('renders empty fragment when array has only nulls', () => {
    const data = [null, undefined]
    const { container } = render(<JsonLd data={data} />)
    const scripts = container.querySelectorAll('script[type="application/ld+json"]')
    expect(scripts).toHaveLength(0)
  })
})
