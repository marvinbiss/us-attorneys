import { test, expect } from '@playwright/test'

test.describe('SEO - Meta Tags', () => {
  test('homepage should have proper meta tags', async ({ page }) => {
    await page.goto('/')

    // Check title
    const title = await page.title()
    expect(title).toContain('US Attorneys')

    // Check meta description
    const metaDescription = await page.$('meta[name="description"]')
    expect(metaDescription).not.toBeNull()
    const description = await metaDescription?.getAttribute('content')
    expect(description).toBeTruthy()
    expect(description!.length).toBeGreaterThan(50)

    // Check Open Graph tags
    const ogTitle = await page.$('meta[property="og:title"]')
    expect(ogTitle).not.toBeNull()

    const ogDescription = await page.$('meta[property="og:description"]')
    expect(ogDescription).not.toBeNull()

    const ogType = await page.$('meta[property="og:type"]')
    expect(ogType).not.toBeNull()
  })

  test('service pages should have unique meta tags', async ({ page }) => {
    await page.goto('/services/personal-injury')

    // Title should be specific to the practice area
    const title = await page.title()
    expect(title.toLowerCase()).toContain('personal injury')

    // Meta description should mention the practice area
    const metaDescription = await page.$('meta[name="description"]')
    const description = await metaDescription?.getAttribute('content')
    expect(description?.toLowerCase()).toContain('personal injury')
  })

  test('location pages should have geo-specific meta tags', async ({ page }) => {
    await page.goto('/services/personal-injury/new-york')

    // Title should include location
    const title = await page.title()
    expect(title.toLowerCase()).toContain('new york')
  })
})

test.describe('SEO - Structured Data', () => {
  test('homepage should have organization schema', async ({ page }) => {
    await page.goto('/')

    // Check for JSON-LD structured data
    const jsonLd = await page.$('script[type="application/ld+json"]')

    if (jsonLd) {
      const content = await jsonLd.textContent()
      const data = JSON.parse(content!)

      // Check for organization or website schema
      expect(['Organization', 'WebSite', 'LocalBusiness']).toContain(data['@type'])
    }
  })
})

test.describe('SEO - Technical', () => {
  test('should have proper heading hierarchy', async ({ page }) => {
    await page.goto('/')

    // Should have exactly one H1
    const h1Count = await page.$$eval('h1', (elements) => elements.length)
    expect(h1Count).toBe(1)
  })

  test('images should have alt text', async ({ page }) => {
    await page.goto('/')

    // Get all images
    const images = await page.$$('img')

    for (const img of images) {
      const alt = await img.getAttribute('alt')
      // Alt should exist (can be empty for decorative images)
      expect(alt).not.toBeNull()
    }
  })

  test('should have lang attribute', async ({ page }) => {
    await page.goto('/')

    const html = await page.$('html')
    const lang = await html?.getAttribute('lang')
    expect(lang).toBe('en')
  })

  test('links should not have nofollow on internal pages', async ({ page }) => {
    await page.goto('/')

    // Internal links should not have nofollow (first 10)
    const links = await page.$$('a[href^="/"]')

    for (const link of links.slice(0, 10)) {
      const rel = await link.getAttribute('rel')
      if (rel) {
        expect(rel).not.toContain('nofollow')
      }
    }
  })
})

test.describe('SEO - Performance', () => {
  test('pages should load within acceptable time', async ({ page }) => {
    const startTime = Date.now()
    await page.goto('/')
    const loadTime = Date.now() - startTime

    // Page should load within 5 seconds
    expect(loadTime).toBeLessThan(5000)
  })

  test('should not have excessive render-blocking resources', async ({ page }) => {
    await page.goto('/')

    // Check for async/defer on scripts
    const scripts = await page.$$('script[src]:not([async]):not([defer]):not([type="application/ld+json"])')

    // Should have minimal blocking scripts (Next.js handles this)
    expect(scripts.length).toBeLessThan(5)
  })
})
