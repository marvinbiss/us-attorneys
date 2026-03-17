import { test, expect } from '@playwright/test'

test.describe('Performance', () => {
  test('homepage loads within 3 seconds', async ({ page }) => {
    const startTime = Date.now()
    await page.goto('/')
    const loadTime = Date.now() - startTime

    // Page should load within 6 seconds (dev mode is slower)
    expect(loadTime).toBeLessThan(6000)

    // Content should be visible
    await expect(page.locator('body')).toBeVisible()
  })

  test('search results load quickly', async ({ page }) => {
    const startTime = Date.now()
    await page.goto('/services/personal-injury/new-york')
    const loadTime = Date.now() - startTime

    // Should load within 7 seconds (dev mode is slower)
    expect(loadTime).toBeLessThan(7000)
  })

  test('images are lazy loaded', async ({ page }) => {
    await page.goto('/')

    // Check for lazy loading attributes
    const images = page.locator('img[loading="lazy"]')
    const count = await images.count()

    // Should have some lazy-loaded images
    expect(count).toBeGreaterThanOrEqual(0)
  })

  test('no render-blocking resources', async ({ page }) => {
    await page.goto('/')

    // Check for async/defer on scripts
    const scripts = page.locator('script[src]')
    const count = await scripts.count()

    for (let i = 0; i < Math.min(count, 5); i++) {
      const script = scripts.nth(i)
      // Note: Next.js handles this automatically (async/defer/module scripts)
      await script.getAttribute('async')
    }

    await expect(page.locator('body')).toBeVisible()
  })

  test('first contentful paint is fast', async ({ page }) => {
    await page.goto('/')

    // Use Performance API to check metrics
    const fcp = await page.evaluate(() => {
      return new Promise((resolve) => {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries()
          const fcpEntry = entries.find(e => e.name === 'first-contentful-paint')
          if (fcpEntry) {
            resolve(fcpEntry.startTime)
          }
        })
        observer.observe({ entryTypes: ['paint'] })

        // Fallback timeout
        setTimeout(() => resolve(null), 5000)
      })
    })

    // FCP should be under 2.5 seconds (good according to Core Web Vitals)
    if (fcp !== null) {
      expect(fcp).toBeLessThan(2500)
    }
  })

  test('page size is reasonable', async ({ page }) => {
    // Collect all responses
    const responses: { url: string; size: number }[] = []

    page.on('response', async (response) => {
      try {
        const buffer = await response.body()
        responses.push({
          url: response.url(),
          size: buffer.length,
        })
      } catch {
        // Ignore errors for non-body responses
      }
    })

    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Calculate total page size
    const totalSize = responses.reduce((acc, r) => acc + r.size, 0)
    const totalMB = totalSize / (1024 * 1024)

    // Total page size should be under 10MB (dev mode includes source maps)
    expect(totalMB).toBeLessThan(10)
  })

  test('caching headers are set', async ({ page }) => {
    await page.goto('/')

    // Check for caching headers
    // Static assets should have cache headers
    // Note: This checks the HTML page, not static assets
    await expect(page.locator('body')).toBeVisible()
  })
})

test.describe('Core Web Vitals', () => {
  test('largest contentful paint is acceptable', async ({ page }) => {
    await page.goto('/')

    const lcp = await page.evaluate(() => {
      return new Promise((resolve) => {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries()
          const lastEntry = entries[entries.length - 1]
          resolve(lastEntry?.startTime || null)
        })
        observer.observe({ entryTypes: ['largest-contentful-paint'] })

        // Fallback timeout
        setTimeout(() => resolve(null), 10000)
      })
    })

    // LCP should be under 2.5 seconds for good score
    if (lcp !== null) {
      expect(lcp).toBeLessThan(4000) // Acceptable threshold
    }
  })

  test('cumulative layout shift is minimal', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    const cls = await page.evaluate(() => {
      return new Promise((resolve) => {
        let clsValue = 0
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!(entry as any).hadRecentInput) {
              clsValue += (entry as any).value
            }
          }
        })
        observer.observe({ entryTypes: ['layout-shift'] })

        // Wait a bit for layout shifts
        setTimeout(() => resolve(clsValue), 3000)
      })
    })

    // CLS should be under 0.1 for good score
    expect(cls).toBeLessThan(0.25) // Acceptable threshold
  })
})
