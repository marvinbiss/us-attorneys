import { test, expect } from '@playwright/test'

test.describe('SEO — Meta Tags', () => {
  test('homepage has meta description', async ({ page }) => {
    await page.goto('/')
    const metaDescription = await page.$('meta[name="description"]')
    expect(metaDescription).not.toBeNull()
    const content = await metaDescription?.getAttribute('content')
    expect(content).toBeTruthy()
    expect(content!.length).toBeGreaterThan(50)
  })

  test('homepage has Open Graph tags', async ({ page }) => {
    await page.goto('/')
    const ogTitle = await page.$('meta[property="og:title"]')
    expect(ogTitle).not.toBeNull()
    const ogDescription = await page.$('meta[property="og:description"]')
    expect(ogDescription).not.toBeNull()
  })

  test('homepage has lang="en" attribute', async ({ page }) => {
    await page.goto('/')
    const lang = await page.$eval('html', (el) => el.getAttribute('lang'))
    expect(lang).toBe('en')
  })

  test('homepage has exactly one h1', async ({ page }) => {
    await page.goto('/')
    const h1Count = await page.$$eval('h1', (els) => els.length)
    expect(h1Count).toBe(1)
  })

  test('all images have alt attributes', async ({ page }) => {
    await page.goto('/')
    const images = await page.$$('img')
    for (const img of images) {
      const alt = await img.getAttribute('alt')
      expect(alt).not.toBeNull()
    }
  })
})

test.describe('SEO — Technical Endpoints', () => {
  test('robots.txt is accessible', async ({ request }) => {
    const response = await request.get('/robots.txt')
    expect(response.status()).toBe(200)
    const body = await response.text()
    expect(body).toContain('User-agent')
  })

  test('sitemap.xml returns 200', async ({ request }) => {
    const response = await request.get('/sitemap.xml')
    expect(response.status()).toBe(200)
    const body = await response.text()
    expect(body).toContain('<?xml')
  })
})

test.describe('SEO — Structured Data', () => {
  test('homepage has JSON-LD', async ({ page }) => {
    await page.goto('/')
    const jsonLd = await page.$('script[type="application/ld+json"]')
    if (jsonLd) {
      const content = await jsonLd.textContent()
      const data = JSON.parse(content!)
      expect(data['@type']).toBeTruthy()
    }
  })
})
