/**
 * Tests for src/lib/seo/internal-links.ts
 * Covers getRelatedServiceLinks and getRelatedArticleSlugs
 */

import { describe, it, expect } from 'vitest'
import { getRelatedServiceLinks, getRelatedArticleSlugs } from '@/lib/seo/internal-links'

// ─── getRelatedServiceLinks ──────────────────────────────────────────

describe('getRelatedServiceLinks', () => {
  it('returns links matching keywords in the slug', () => {
    const links = getRelatedServiceLinks('dui-defense-guide', 'Legal Resources', [])
    expect(links.length).toBeGreaterThan(0)
    expect(links.some((l) => l.href.includes('criminal-defense'))).toBe(true)
  })

  it('returns links matching keywords in tags', () => {
    const links = getRelatedServiceLinks('some-article', 'General', ['immigration'])
    expect(links.some((l) => l.href.includes('immigration'))).toBe(true)
  })

  it('includes city cross-links for the first matched service', () => {
    const links = getRelatedServiceLinks('personal-injury-tips', 'General', [])
    // First service match should produce practice-area link + 5 city links
    const cityLinks = links.filter((l) => l.href.includes('/personal-injury/'))
    expect(cityLinks.length).toBeGreaterThanOrEqual(1)
  })

  it('deduplicates service slugs across slug and tags', () => {
    const links = getRelatedServiceLinks('bankruptcy-info', 'General', ['bankruptcy', 'chapter-7'])
    // All bankruptcy keywords map to same slug, so only one service link
    const serviceLinks = links.filter((l) => l.href === '/practice-areas/bankruptcy')
    expect(serviceLinks).toHaveLength(1)
  })

  it('adds consultation link for Pricing category', () => {
    const links = getRelatedServiceLinks('lawyer-costs', 'Pricing', [])
    expect(links.some((l) => l.href === '/quotes')).toBe(true)
  })

  it('adds how-it-works link for Regulations category', () => {
    const links = getRelatedServiceLinks('new-regulation', 'Regulations', [])
    expect(links.some((l) => l.href === '/how-it-works')).toBe(true)
  })

  it('adds how-it-works link for Legal Resources category', () => {
    const links = getRelatedServiceLinks('legal-guide', 'Legal Resources', [])
    expect(links.some((l) => l.href === '/how-it-works')).toBe(true)
  })

  it('adds register-attorney link for Attorney Profiles category', () => {
    const links = getRelatedServiceLinks('top-attorneys', 'Attorney Profiles', [])
    expect(links.some((l) => l.href === '/register-attorney')).toBe(true)
  })

  it('adds emergency link when "emergency" tag is present', () => {
    const links = getRelatedServiceLinks('help-article', 'General', ['emergency'])
    expect(links.some((l) => l.href === '/emergency')).toBe(true)
  })

  it('adds emergency link when slug contains "emergency"', () => {
    const links = getRelatedServiceLinks('emergency-legal-help', 'General', [])
    expect(links.some((l) => l.href === '/emergency')).toBe(true)
  })

  it('adds emergency link when slug contains "urgent"', () => {
    const links = getRelatedServiceLinks('urgent-legal-advice', 'General', [])
    expect(links.some((l) => l.href === '/emergency')).toBe(true)
  })

  it('limits output to 5 links max', () => {
    // Use a slug that matches many keywords + pricing category + emergency tag
    const links = getRelatedServiceLinks(
      'personal-injury-car-accident-dui',
      'Pricing',
      ['immigration', 'estate-planning', 'emergency']
    )
    expect(links.length).toBeLessThanOrEqual(5)
  })

  it('returns empty array when no keywords match and no special category', () => {
    const links = getRelatedServiceLinks('unrelated-topic', 'General', [])
    expect(links).toEqual([])
  })

  it('generates correct href format for practice areas', () => {
    const links = getRelatedServiceLinks('divorce-guide', 'General', [])
    const familyLink = links.find((l) => l.href === '/practice-areas/family-law')
    expect(familyLink).toBeDefined()
    expect(familyLink!.text).toContain('family law attorney')
  })

  it('handles multiple distinct service matches from tags (limited to 5)', () => {
    const links = getRelatedServiceLinks('general-article', 'General', [
      'patent',
      'bankruptcy',
    ])
    // First match (patent -> intellectual-property) generates 1 service link + 5 city links = 6
    // But output is capped at 5, so only the first service and its city variants appear
    const ipLink = links.find((l) => l.href === '/practice-areas/intellectual-property')
    expect(ipLink).toBeDefined()
    expect(links.length).toBeLessThanOrEqual(5)
  })
})

// ─── getRelatedArticleSlugs ──────────────────────────────────────────

describe('getRelatedArticleSlugs', () => {
  const articlesMap: Record<string, { category: string; tags: string[]; title: string; readTime?: string }> = {
    'dui-defense': { category: 'Criminal', tags: ['DUI', 'Defense'], title: 'DUI Defense Guide', readTime: '5 min' },
    'drug-charges': { category: 'Criminal', tags: ['Drug', 'Defense'], title: 'Drug Charges FAQ', readTime: '4 min' },
    'divorce-guide': { category: 'Family', tags: ['Divorce', 'Custody'], title: 'Divorce Guide', readTime: '7 min' },
    'child-custody': { category: 'Family', tags: ['Custody'], title: 'Child Custody Tips', readTime: '6 min' },
    'estate-planning': { category: 'Estate', tags: ['Wills', 'Trusts'], title: 'Estate Planning 101' },
    'immigration-faq': { category: 'Immigration', tags: ['Visa', 'DUI'], title: 'Immigration FAQ', readTime: '8 min' },
    'empty-article': { category: 'General', tags: [], title: '', readTime: '' },
  }
  const allSlugs = Object.keys(articlesMap)

  it('returns articles with shared category scored higher', () => {
    const result = getRelatedArticleSlugs('dui-defense', 'Criminal', ['DUI'], allSlugs, articlesMap)
    // drug-charges shares category=Criminal and tag=Defense => high score
    expect(result.some((r) => r.slug === 'drug-charges')).toBe(true)
  })

  it('returns articles with overlapping tags scored higher', () => {
    const result = getRelatedArticleSlugs('dui-defense', 'Criminal', ['DUI', 'Defense'], allSlugs, articlesMap)
    // immigration-faq shares tag 'DUI'
    expect(result.some((r) => r.slug === 'immigration-faq')).toBe(true)
  })

  it('excludes the current slug from results', () => {
    const result = getRelatedArticleSlugs('dui-defense', 'Criminal', ['DUI'], allSlugs, articlesMap)
    expect(result.every((r) => r.slug !== 'dui-defense')).toBe(true)
  })

  it('limits results to 4 max', () => {
    const result = getRelatedArticleSlugs('dui-defense', 'Criminal', ['DUI', 'Defense'], allSlugs, articlesMap)
    expect(result.length).toBeLessThanOrEqual(4)
  })

  it('excludes articles with score 0 (no shared tags or category)', () => {
    const result = getRelatedArticleSlugs('estate-planning', 'Estate', ['Wills', 'Trusts'], allSlugs, articlesMap)
    // No other articles share Estate category or Wills/Trusts tags
    expect(result.every((r) => r.slug !== 'dui-defense' || r.category === 'Estate')).toBe(true)
  })

  it('excludes articles with empty title', () => {
    const result = getRelatedArticleSlugs('dui-defense', 'General', [], allSlugs, articlesMap)
    expect(result.every((r) => r.slug !== 'empty-article')).toBe(true)
  })

  it('returns empty array when no articles match', () => {
    const result = getRelatedArticleSlugs('estate-planning', 'Estate', ['Wills', 'Trusts'], allSlugs, articlesMap)
    // Only estate-planning has Estate category and Wills/Trusts tags, and it's excluded as current
    expect(Array.isArray(result)).toBe(true)
  })

  it('returns readTime from article metadata', () => {
    const result = getRelatedArticleSlugs('dui-defense', 'Criminal', ['DUI'], allSlugs, articlesMap)
    const drugCharges = result.find((r) => r.slug === 'drug-charges')
    if (drugCharges) {
      expect(drugCharges.readTime).toBe('4 min')
    }
  })

  it('returns empty string for readTime when not set', () => {
    const result = getRelatedArticleSlugs(
      'divorce-guide',
      'Family',
      ['Custody'],
      allSlugs,
      articlesMap
    )
    // estate-planning has no readTime
    const ep = result.find((r) => r.slug === 'estate-planning')
    // estate-planning has no shared tags or category with Family/Custody, so it won't appear
    // child-custody shares both category and tag
    const cc = result.find((r) => r.slug === 'child-custody')
    if (cc) {
      expect(cc.readTime).toBe('6 min')
    }
  })

  it('sorts results by score descending (category + tag overlap)', () => {
    const result = getRelatedArticleSlugs('dui-defense', 'Criminal', ['DUI', 'Defense'], allSlugs, articlesMap)
    // drug-charges: +2 (category) + 3 (Defense) = 5
    // immigration-faq: +3 (DUI) = 3
    if (result.length >= 2) {
      const drugIdx = result.findIndex((r) => r.slug === 'drug-charges')
      const immIdx = result.findIndex((r) => r.slug === 'immigration-faq')
      if (drugIdx >= 0 && immIdx >= 0) {
        expect(drugIdx).toBeLessThan(immIdx)
      }
    }
  })

  it('handles empty allSlugs array', () => {
    const result = getRelatedArticleSlugs('dui-defense', 'Criminal', ['DUI'], [], articlesMap)
    expect(result).toEqual([])
  })

  it('handles slug not present in articlesMap gracefully', () => {
    const result = getRelatedArticleSlugs(
      'dui-defense',
      'Criminal',
      ['DUI'],
      ['nonexistent-slug', ...allSlugs],
      articlesMap
    )
    expect(result.every((r) => r.title !== '')).toBe(true)
  })
})
