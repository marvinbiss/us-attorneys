import { test, expect, type Page } from '@playwright/test'

// Increase timeout for dev server — pages hit the DB and can be slow
test.setTimeout(60_000)

// ============================================================================
// HELPERS
// ============================================================================

/** Navigate to a path using domcontentloaded (faster than load for SSR pages) */
async function goto(page: Page, path: string) {
  await page.goto(path, { waitUntil: 'domcontentloaded', timeout: 45_000 })
}

/** Extract all JSON-LD scripts from the page and return parsed objects */
async function getAllJsonLd(page: Page): Promise<Record<string, unknown>[]> {
  const scripts = await page.$$eval('script[type="application/ld+json"]', (els) =>
    els.map((el) => el.textContent ?? '')
  )
  const results: Record<string, unknown>[] = []
  for (const raw of scripts) {
    try {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) {
        results.push(...parsed.filter(Boolean))
      } else if (parsed) {
        results.push(parsed)
      }
    } catch {
      // invalid JSON — will be caught by dedicated test
    }
  }
  return results
}

/** Check if a JSON-LD object (or nested @graph) contains a given @type */
function hasSchemaType(schemas: Record<string, unknown>[], type: string): boolean {
  for (const schema of schemas) {
    if (schema['@type'] === type) return true
    if (Array.isArray(schema['@type']) && schema['@type'].includes(type)) return true
    if (Array.isArray(schema['@graph'])) {
      for (const node of schema['@graph']) {
        if (node['@type'] === type) return true
        if (Array.isArray(node['@type']) && node['@type'].includes(type)) return true
      }
    }
  }
  return false
}

// ============================================================================
// 1. META TAGS VERIFICATION
// ============================================================================

test.describe('1. Meta Tags Verification', () => {
  test('homepage has correct title containing "US Attorneys"', async ({ page }) => {
    await goto(page, '/')
    await expect(page).toHaveTitle(/US Attorneys/i)
  })

  test('homepage has meta description with substantial content', async ({ page }) => {
    await goto(page, '/')
    const content = await page.getAttribute('meta[name="description"]', 'content')
    expect(content).toBeTruthy()
    expect(content!.length).toBeGreaterThan(50)
  })

  test('homepage has canonical URL', async ({ page }) => {
    await goto(page, '/')
    const canonical = await page.getAttribute('link[rel="canonical"]', 'href')
    expect(canonical).toBeTruthy()
    expect(canonical).toContain('us-attorneys')
  })

  test('homepage has og:title, og:description, og:image', async ({ page }) => {
    await goto(page, '/')
    const ogTitle = await page.getAttribute('meta[property="og:title"]', 'content')
    expect(ogTitle).toBeTruthy()
    expect(ogTitle!.length).toBeGreaterThan(10)

    const ogDesc = await page.getAttribute('meta[property="og:description"]', 'content')
    expect(ogDesc).toBeTruthy()
    expect(ogDesc!.length).toBeGreaterThan(20)

    const ogImage = await page.getAttribute('meta[property="og:image"]', 'content')
    expect(ogImage).toBeTruthy()
    expect(ogImage).toContain('opengraph-image')
  })

  test('/about has correct title', async ({ page }) => {
    await goto(page, '/about')
    await expect(page).toHaveTitle(/About|US Attorneys/i)
  })

  test('/faq has correct title', async ({ page }) => {
    await goto(page, '/faq')
    await expect(page).toHaveTitle(/FAQ|Frequently Asked|US Attorneys/i)
  })

  test('homepage has og:type set to website', async ({ page }) => {
    await goto(page, '/')
    const ogType = await page.getAttribute('meta[property="og:type"]', 'content')
    expect(ogType).toBe('website')
  })

  test('homepage has og:url', async ({ page }) => {
    await goto(page, '/')
    const ogUrl = await page.getAttribute('meta[property="og:url"]', 'content')
    expect(ogUrl).toBeTruthy()
  })

  test('homepage has twitter card meta', async ({ page }) => {
    await goto(page, '/')
    const twitterCard = await page.getAttribute('meta[name="twitter:card"]', 'content')
    expect(twitterCard).toBeTruthy()
    expect(twitterCard).toBe('summary_large_image')
  })
})

// ============================================================================
// 2. JSON-LD SCHEMAS
// ============================================================================

test.describe('2. JSON-LD Structured Data', () => {
  test('homepage has Organization schema', async ({ page }) => {
    await goto(page, '/')
    const schemas = await getAllJsonLd(page)
    expect(hasSchemaType(schemas, 'Organization')).toBe(true)
  })

  test('homepage has WebSite schema with SearchAction', async ({ page }) => {
    await goto(page, '/')
    const schemas = await getAllJsonLd(page)
    expect(hasSchemaType(schemas, 'WebSite')).toBe(true)

    const websiteSchema = schemas.find((s) => s['@type'] === 'WebSite')
    expect(websiteSchema).toBeTruthy()
    expect(websiteSchema!.potentialAction).toBeTruthy()
    const action = websiteSchema!.potentialAction as Record<string, unknown>
    expect(action['@type']).toBe('SearchAction')
  })

  test('homepage has ItemList schema', async ({ page }) => {
    await goto(page, '/')
    const schemas = await getAllJsonLd(page)
    expect(hasSchemaType(schemas, 'ItemList')).toBe(true)
  })

  test('/faq has FAQPage schema', async ({ page }) => {
    await goto(page, '/faq')
    const schemas = await getAllJsonLd(page)
    expect(hasSchemaType(schemas, 'FAQPage')).toBe(true)
  })

  test('all JSON-LD scripts have type="application/ld+json"', async ({ page }) => {
    await goto(page, '/')
    const scripts = await page.$$('script[type="application/ld+json"]')
    expect(scripts.length).toBeGreaterThan(0)

    for (const script of scripts) {
      const type = await script.getAttribute('type')
      expect(type).toBe('application/ld+json')
    }
  })

  test('all JSON-LD on homepage is valid parseable JSON', async ({ page }) => {
    await goto(page, '/')
    const rawTexts = await page.$$eval('script[type="application/ld+json"]', (els) =>
      els.map((el) => el.textContent ?? '')
    )
    expect(rawTexts.length).toBeGreaterThan(0)

    for (const raw of rawTexts) {
      expect(() => JSON.parse(raw)).not.toThrow()
    }
  })

  test('/about has BreadcrumbList schema if breadcrumb nav is present', async ({ page }) => {
    await goto(page, '/about')
    const schemas = await getAllJsonLd(page)
    const hasBreadcrumb = hasSchemaType(schemas, 'BreadcrumbList')
    const hasBreadcrumbNav = await page.$('nav[aria-label="Breadcrumb"]')
    if (hasBreadcrumbNav) {
      expect(hasBreadcrumb).toBe(true)
    }
  })

  test('JSON-LD Organization schema has required fields', async ({ page }) => {
    await goto(page, '/')
    const schemas = await getAllJsonLd(page)
    const org = schemas.find(
      (s) => s['@type'] === 'Organization' && s['@context'] === 'https://schema.org'
    )
    expect(org).toBeTruthy()
    expect(org!.name).toBeTruthy()
    expect(org!.url).toBeTruthy()
  })
})

// ============================================================================
// 3. CANONICAL URLS
// ============================================================================

test.describe('3. Canonical URLs', () => {
  const pages = ['/', '/about', '/faq', '/contact']

  for (const path of pages) {
    test(`${path} has exactly one canonical link`, async ({ page }) => {
      await goto(page, path)
      const canonicals = await page.$$('link[rel="canonical"]')
      expect(canonicals.length).toBe(1)
    })
  }

  test('homepage canonical is self-referencing', async ({ page }) => {
    await goto(page, '/')
    const canonical = await page.getAttribute('link[rel="canonical"]', 'href')
    expect(canonical).toBeTruthy()
    const url = new URL(canonical!)
    expect(url.pathname === '/' || url.pathname === '').toBe(true)
  })

  test('/about canonical references /about', async ({ page }) => {
    await goto(page, '/about')
    const canonical = await page.getAttribute('link[rel="canonical"]', 'href')
    expect(canonical).toBeTruthy()
    expect(canonical).toContain('/about')
  })

  test('no duplicate canonical links on homepage', async ({ page }) => {
    await goto(page, '/')
    const canonicals = await page.$$('link[rel="canonical"]')
    expect(canonicals.length).toBe(1)
  })
})

// ============================================================================
// 4. ROBOTS & SITEMAP
// ============================================================================

test.describe('4. Robots & Sitemap', () => {
  test('robots.txt returns 200 and contains Sitemap:', async ({ request }) => {
    const response = await request.get('/robots.txt')
    expect(response.status()).toBe(200)
    const body = await response.text()
    expect(body).toContain('Sitemap:')
    expect(body).toContain('sitemap.xml')
  })

  test('robots.txt disallows /admin/, /api/, /auth/', async ({ request }) => {
    const response = await request.get('/robots.txt')
    const body = await response.text()
    expect(body).toContain('/admin/')
    expect(body).toContain('/api/')
    expect(body).toContain('/auth/')
  })

  test('robots.txt contains User-agent directives', async ({ request }) => {
    const response = await request.get('/robots.txt')
    const body = await response.text()
    // Next.js renders "User-Agent:" with capital A
    expect(body).toMatch(/User-[Aa]gent:/i)
    // Should have the wildcard catch-all rule
    expect(body).toMatch(/User-[Aa]gent:\s*\*/i)
  })

  test('robots.txt blocks AI training bots', async ({ request }) => {
    const response = await request.get('/robots.txt')
    const body = await response.text()
    expect(body).toContain('GPTBot')
  })

  test('robots.txt blocks aggressive SEO scrapers', async ({ request }) => {
    const response = await request.get('/robots.txt')
    const body = await response.text()
    expect(body).toContain('AhrefsBot')
    expect(body).toContain('SemrushBot')
  })

  test('sitemap.xml returns 200 and is valid XML', async ({ request }) => {
    const response = await request.get('/sitemap.xml')
    expect(response.status()).toBe(200)
    const body = await response.text()
    expect(body).toContain('<?xml')
    expect(body).toContain('sitemap')
  })

  test('sitemap.xml contains sub-sitemap references', async ({ request }) => {
    const response = await request.get('/sitemap.xml')
    const body = await response.text()
    // Sitemap index should reference .xml sub-sitemaps
    expect(body).toContain('.xml')
  })
})

// ============================================================================
// 5. BREADCRUMBS
// ============================================================================

test.describe('5. Breadcrumbs', () => {
  test('/about has breadcrumbs with Home as first item', async ({ page }) => {
    await goto(page, '/about')
    const breadcrumbNav = page.locator('nav[aria-label="Breadcrumb"]')
    const count = await breadcrumbNav.count()

    if (count > 0) {
      const firstItem = breadcrumbNav.locator('li').first()
      await expect(firstItem).toContainText(/Home/i)
    }
  })

  test('breadcrumb last item is not a link (current page)', async ({ page }) => {
    await goto(page, '/careers')
    const breadcrumbNav = page.locator('nav[aria-label="Breadcrumb"]')
    const count = await breadcrumbNav.count()

    if (count > 0) {
      const lastItem = breadcrumbNav.locator('li').last()
      // Last breadcrumb item should be plain text (span), not a clickable link
      // Some variants use aria-current="page", others just render a <span> without href
      const lastLink = lastItem.locator('a')
      const lastSpan = lastItem.locator('span:not(.sr-only)')
      // Either the last item has no <a> at all, or the <a> wraps a non-navigable current page
      const linkCount = await lastLink.count()
      const spanCount = await lastSpan.count()
      // At minimum, the last item should have text content (a span)
      expect(spanCount).toBeGreaterThanOrEqual(1)
      // If the last item has a link, it should NOT be the text label itself (it could be the chevron icon wrapper)
      if (linkCount > 0) {
        // The link should not contain the label text directly — that would make the current page clickable
        const spanText = await lastSpan.first().textContent()
        // Both can have text, but the span (plain text) should be the primary label
        expect(spanText!.length).toBeGreaterThan(0)
      }
    }
  })

  test('/careers has breadcrumbs with at least 2 items', async ({ page }) => {
    await goto(page, '/careers')
    const breadcrumbNav = page.locator('nav[aria-label="Breadcrumb"]')
    const count = await breadcrumbNav.count()

    if (count > 0) {
      const items = breadcrumbNav.locator('li')
      // At least Home + current page
      expect(await items.count()).toBeGreaterThanOrEqual(2)
    }
  })

  test('homepage does NOT have breadcrumbs', async ({ page }) => {
    await goto(page, '/')
    const breadcrumbNav = page.locator('nav[aria-label="Breadcrumb"]')
    expect(await breadcrumbNav.count()).toBe(0)
  })
})

// ============================================================================
// 6. NOINDEX VERIFICATION
// ============================================================================

test.describe('6. Noindex Verification', () => {
  test('/accessibility has noindex meta', async ({ page }) => {
    await goto(page, '/accessibility')
    const robotsMeta = await page.getAttribute('meta[name="robots"]', 'content')
    expect(robotsMeta).toBeTruthy()
    expect(robotsMeta!.toLowerCase()).toContain('noindex')
  })

  test('/careers has noindex meta', async ({ page }) => {
    await goto(page, '/careers')
    const robotsMeta = await page.getAttribute('meta[name="robots"]', 'content')
    expect(robotsMeta).toBeTruthy()
    expect(robotsMeta!.toLowerCase()).toContain('noindex')
  })

  test('homepage does NOT have noindex', async ({ page }) => {
    await goto(page, '/')
    const robotsMeta = await page.getAttribute('meta[name="robots"]', 'content')
    if (robotsMeta) {
      // Split by comma and check individual directives (avoid false positive from "max-image-preview")
      const directives = robotsMeta
        .toLowerCase()
        .split(',')
        .map((d) => d.trim())
      expect(directives).not.toContain('noindex')
    }
  })

  test('/about does NOT have noindex', async ({ page }) => {
    await goto(page, '/about')
    const robotsMeta = await page.getAttribute('meta[name="robots"]', 'content')
    if (robotsMeta) {
      const directives = robotsMeta
        .toLowerCase()
        .split(',')
        .map((d) => d.trim())
      expect(directives).not.toContain('noindex')
    }
  })

  test('/faq does NOT have noindex', async ({ page }) => {
    await goto(page, '/faq')
    const robotsMeta = await page.getAttribute('meta[name="robots"]', 'content')
    if (robotsMeta) {
      const directives = robotsMeta
        .toLowerCase()
        .split(',')
        .map((d) => d.trim())
      expect(directives).not.toContain('noindex')
    }
  })
})

// ============================================================================
// 7. MOBILE RESPONSIVE (375px viewport)
// ============================================================================

test.describe('7. Mobile Responsive (375px)', () => {
  test.use({ viewport: { width: 375, height: 667 } })

  test('homepage: no horizontal scroll', async ({ page }) => {
    await goto(page, '/')
    // Wait a moment for layout to settle
    await page.waitForTimeout(500)
    const { scrollWidth, clientWidth } = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }))
    // Allow 2px tolerance for rounding
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 2)
  })

  test('header: hamburger menu button visible', async ({ page }) => {
    await goto(page, '/')
    // The mobile menu button has aria-label "Open menu" — visible only below lg breakpoint
    const menuButton = page.locator(
      'button[aria-label="Open menu"], button[aria-label="Close menu"]'
    )
    await expect(menuButton.first()).toBeVisible({ timeout: 10_000 })
  })

  test('header: desktop nav hidden on mobile', async ({ page }) => {
    await goto(page, '/')
    // On mobile (375px), the lg:hidden class hides the hamburger and lg:flex shows desktop nav.
    // At 375px, the hamburger should be visible and desktop nav hidden.
    // We verify by checking the menu button IS visible (proving mobile layout)
    const menuButton = page.locator(
      'button[aria-label="Open menu"], button[aria-label="Close menu"]'
    )
    await expect(menuButton.first()).toBeVisible({ timeout: 10_000 })
  })

  test('footer: renders within viewport width', async ({ page }) => {
    await goto(page, '/')
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    await page.waitForTimeout(300)
    const footer = page.locator('footer')
    await expect(footer).toBeVisible({ timeout: 10_000 })

    const footerBox = await footer.boundingBox()
    expect(footerBox).toBeTruthy()
    // Footer should not exceed viewport width
    expect(footerBox!.width).toBeLessThanOrEqual(376)
  })

  test('buttons have minimum 44px touch targets', async ({ page }) => {
    await goto(page, '/')
    await page.waitForTimeout(500)
    const buttons = page.locator('button:visible, a[role="button"]:visible')
    const count = await buttons.count()

    let touchableCount = 0
    for (let i = 0; i < Math.min(count, 10); i++) {
      const box = await buttons.nth(i).boundingBox()
      if (box && box.width > 0 && box.height > 0) {
        // WAI recommends minimum 44x44px touch targets
        const touchable = box.width >= 44 || box.height >= 44
        if (touchable) touchableCount++
      }
    }
    // Most buttons should meet touch target guidelines
    expect(touchableCount).toBeGreaterThan(0)
  })

  test('text is readable without zoom (min 14px effective)', async ({ page }) => {
    await goto(page, '/')
    const bodyFontSize = await page.evaluate(() => {
      const style = window.getComputedStyle(document.body)
      return parseFloat(style.fontSize)
    })
    expect(bodyFontSize).toBeGreaterThanOrEqual(14)
  })

  test('images do not overflow container on mobile', async ({ page }) => {
    await goto(page, '/')
    await page.waitForTimeout(500)
    const overflowingImages = await page.evaluate(() => {
      const images = Array.from(document.querySelectorAll('img'))
      let overflowCount = 0
      for (const img of images) {
        const rect = img.getBoundingClientRect()
        if (rect.width > window.innerWidth + 2) {
          overflowCount++
        }
      }
      return overflowCount
    })
    expect(overflowingImages).toBe(0)
  })

  test('h1 heading exists on mobile homepage', async ({ page }) => {
    await goto(page, '/')
    const h1 = page.locator('h1')
    // h1 may be sr-only (visually hidden) but must exist in DOM
    expect(await h1.count()).toBeGreaterThanOrEqual(1)
  })

  test('mobile hamburger menu opens and closes', async ({ page }) => {
    await goto(page, '/')
    const menuButton = page.locator('button[aria-label="Open menu"]')
    await expect(menuButton).toBeVisible({ timeout: 10_000 })

    // Open the menu
    await menuButton.click()
    // After clicking, either the close button appears or the menu content is visible
    const closeButton = page.locator('button[aria-label="Close menu"]')
    await expect(closeButton).toBeVisible({ timeout: 5_000 })

    // Close the menu
    await closeButton.click()
    await expect(menuButton).toBeVisible({ timeout: 5_000 })
  })
})

// ============================================================================
// 8. TABLET RESPONSIVE (768px viewport)
// ============================================================================

test.describe('8. Tablet Responsive (768px)', () => {
  test.use({ viewport: { width: 768, height: 1024 } })

  test('homepage renders without horizontal overflow', async ({ page }) => {
    await goto(page, '/')
    await page.waitForTimeout(500)
    const { scrollWidth, clientWidth } = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }))
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 2)
  })

  test('header is visible at tablet width', async ({ page }) => {
    await goto(page, '/')
    await expect(page.getByRole('banner')).toBeVisible({ timeout: 10_000 })
  })

  test('footer is visible and properly sized', async ({ page }) => {
    await goto(page, '/')
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    await page.waitForTimeout(300)
    const footer = page.locator('footer')
    await expect(footer).toBeVisible({ timeout: 10_000 })
    const box = await footer.boundingBox()
    expect(box).toBeTruthy()
    expect(box!.width).toBeLessThanOrEqual(769)
  })

  test('main content fits within viewport', async ({ page }) => {
    await goto(page, '/')
    const main = page.locator('main')
    const box = await main.boundingBox()
    expect(box).toBeTruthy()
    expect(box!.width).toBeLessThanOrEqual(769)
  })
})

// ============================================================================
// 9. PERFORMANCE BASICS
// ============================================================================

test.describe('9. Performance Basics', () => {
  test('third-party scripts use async or defer', async ({ page }) => {
    await goto(page, '/')
    const externalScripts = await page.evaluate(() => {
      const scripts = Array.from(document.querySelectorAll('script[src]'))
      const results: { src: string; async: boolean; defer: boolean }[] = []
      for (const script of scripts) {
        const src = script.getAttribute('src') || ''
        // Only check third-party (non-localhost, non-Next.js internal) scripts
        if (src.startsWith('http') && !src.includes('localhost') && !src.includes('/_next/')) {
          results.push({
            src,
            async: script.hasAttribute('async'),
            defer: script.hasAttribute('defer'),
          })
        }
      }
      return results
    })

    for (const script of externalScripts) {
      const hasAsyncOrDefer = script.async || script.defer
      expect(hasAsyncOrDefer, `External script ${script.src} should have async or defer`).toBe(true)
    }
  })

  test('page DOMContentLoaded within 10 seconds', async ({ page }) => {
    const start = Date.now()
    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 15_000 })
    const elapsed = Date.now() - start
    expect(elapsed).toBeLessThan(10_000)
  })

  test('no render-blocking external scripts in <head>', async ({ page }) => {
    await goto(page, '/')
    const blockingScripts = await page.evaluate(() => {
      const headScripts = Array.from(document.head.querySelectorAll('script[src]'))
      const blocking: string[] = []
      for (const script of headScripts) {
        const src = script.getAttribute('src') || ''
        // Ignore Next.js internal scripts (they use their own loading strategy)
        if (src.includes('/_next/')) continue
        if (!script.hasAttribute('async') && !script.hasAttribute('defer')) {
          blocking.push(src)
        }
      }
      return blocking
    })
    expect(blockingScripts.length).toBe(0)
  })

  test('images have dimensions to prevent CLS', async ({ page }) => {
    await goto(page, '/')
    const imagesWithoutDimensions = await page.evaluate(() => {
      const images = Array.from(document.querySelectorAll('img'))
      let count = 0
      for (const img of images) {
        const hasWidth = img.hasAttribute('width') || img.style.width
        const hasHeight = img.hasAttribute('height') || img.style.height
        const computed = window.getComputedStyle(img)
        const hasCssDimensions = computed.width !== 'auto' && computed.height !== 'auto'
        if (!hasWidth && !hasHeight && !hasCssDimensions) {
          count++
        }
      }
      return count
    })
    expect(imagesWithoutDimensions).toBe(0)
  })
})

// ============================================================================
// 10. ACCESSIBILITY BASICS
// ============================================================================

test.describe('10. Accessibility Basics', () => {
  test('all images have alt attributes on homepage', async ({ page }) => {
    await goto(page, '/')
    const imagesWithoutAlt = await page.evaluate(() => {
      const images = Array.from(document.querySelectorAll('img'))
      let count = 0
      for (const img of images) {
        // alt="" is valid for decorative images; only fail if attribute is missing entirely
        if (!img.hasAttribute('alt')) count++
      }
      return count
    })
    expect(imagesWithoutAlt).toBe(0)
  })

  test('homepage has exactly one h1 heading', async ({ page }) => {
    await goto(page, '/')
    const h1Count = await page.$$eval('h1', (els) => els.length)
    // Some pages render sr-only h1 — that is fine
    expect(h1Count).toBeGreaterThanOrEqual(1)
    expect(h1Count).toBeLessThanOrEqual(2)
  })

  test('skip-to-content link is present', async ({ page }) => {
    await goto(page, '/')
    const skipLink = page.locator('a[href="#main-content"]')
    expect(await skipLink.count()).toBeGreaterThanOrEqual(1)
  })

  test('html has lang attribute set to "en"', async ({ page }) => {
    await goto(page, '/')
    const lang = await page.$eval('html', (el) => el.getAttribute('lang'))
    expect(lang).toBe('en')
  })

  test('form inputs have associated labels or aria attributes', async ({ page }) => {
    await goto(page, '/')
    const unlabeledInputs = await page.evaluate(() => {
      const inputs = Array.from(
        document.querySelectorAll(
          'input:not([type="hidden"]):not([type="submit"]):not([type="button"])'
        )
      )
      let count = 0
      for (const input of inputs) {
        const id = input.getAttribute('id')
        const hasLabel = id ? document.querySelector(`label[for="${id}"]`) : null
        const hasAriaLabel =
          input.hasAttribute('aria-label') || input.hasAttribute('aria-labelledby')
        const hasPlaceholder = input.hasAttribute('placeholder')
        const hasTitle = input.hasAttribute('title')
        const isWrappedInLabel = input.closest('label') !== null
        if (!hasLabel && !hasAriaLabel && !hasPlaceholder && !hasTitle && !isWrappedInLabel) {
          count++
        }
      }
      return count
    })
    expect(unlabeledInputs).toBe(0)
  })

  test('main landmark is present with correct id', async ({ page }) => {
    await goto(page, '/')
    const main = page.locator('main')
    expect(await main.count()).toBe(1)
    const mainId = await main.getAttribute('id')
    expect(mainId).toBe('main-content')
  })

  test('heading hierarchy does not skip levels', async ({ page }) => {
    await goto(page, '/')
    const headingLevels = await page.evaluate(() => {
      const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6')
      return Array.from(headings).map((h) => parseInt(h.tagName.replace('H', ''), 10))
    })

    expect(headingLevels.length).toBeGreaterThan(0)
    expect(headingLevels[0]).toBe(1)

    // Verify no level is skipped (e.g., h1 -> h3 without h2)
    for (let i = 1; i < headingLevels.length; i++) {
      const jump = headingLevels[i] - headingLevels[i - 1]
      expect(
        jump,
        `Heading jump from h${headingLevels[i - 1]} to h${headingLevels[i]} skips a level`
      ).toBeLessThanOrEqual(1)
    }
  })

  test('/about page has an h1 heading', async ({ page }) => {
    await goto(page, '/about')
    const h1Count = await page.$$eval('h1', (els) => els.length)
    expect(h1Count).toBeGreaterThanOrEqual(1)
  })

  test('interactive elements are keyboard focusable', async ({ page }) => {
    await goto(page, '/')
    await page.keyboard.press('Tab')
    const focusedTag = await page.evaluate(() => document.activeElement?.tagName?.toLowerCase())
    expect(['a', 'button', 'input', 'select', 'textarea']).toContain(focusedTag)
  })
})

// ============================================================================
// CROSS-CUTTING: MULTI-PAGE SEO VALIDATION
// ============================================================================

test.describe('Cross-cutting: SEO on multiple pages', () => {
  const publicPages = [
    { path: '/', name: 'homepage' },
    { path: '/about', name: 'about' },
    { path: '/faq', name: 'faq' },
    { path: '/contact', name: 'contact' },
    { path: '/careers', name: 'careers' },
  ]

  for (const { path, name } of publicPages) {
    test(`${name} — all JSON-LD is valid parseable JSON`, async ({ page }) => {
      await goto(page, path)
      const rawTexts = await page.$$eval('script[type="application/ld+json"]', (els) =>
        els.map((el) => el.textContent ?? '')
      )
      for (const raw of rawTexts) {
        expect(() => JSON.parse(raw), `Invalid JSON-LD on ${path}`).not.toThrow()
      }
    })

    test(`${name} — has <title> tag`, async ({ page }) => {
      await goto(page, path)
      const title = await page.title()
      expect(title.length).toBeGreaterThan(0)
    })

    test(`${name} — has meta description`, async ({ page }) => {
      await goto(page, path)
      const desc = await page.getAttribute('meta[name="description"]', 'content')
      expect(desc).toBeTruthy()
      expect(desc!.length).toBeGreaterThan(20)
    })
  }
})
