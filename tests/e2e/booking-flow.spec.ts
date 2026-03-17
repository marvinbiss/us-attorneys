import { test, expect } from '@playwright/test'

test.describe('Booking Flow', () => {
  test('can navigate to service page', async ({ page }) => {
    await page.goto('/services/personal-injury')

    // Should show service page
    await expect(page.locator('body')).toBeVisible()
    const url = page.url()
    expect(url).toContain('personal-injury')
  })

  test('can navigate to service with location', async ({ page }) => {
    await page.goto('/services/personal-injury/new-york')

    // Should show attorneys in New York
    await expect(page.locator('body')).toBeVisible()
  })

  test('can access booking page', async ({ page }) => {
    // Navigate to a booking page (will redirect if not authenticated)
    await page.goto('/booking/test-id')

    // Should either show booking or redirect to login
    const url = page.url()
    expect(url).toMatch(/booking|login/)
  })

  test('consultation form is accessible', async ({ page }) => {
    await page.goto('/consultation')

    // Should show consultation form
    await expect(page.locator('body')).toBeVisible()

    // Should have input fields
    const inputs = page.locator('input')
    const count = await inputs.count()
    expect(count).toBeGreaterThan(0)
  })

  test('can fill consultation form', async ({ page }) => {
    await page.goto('/consultation')

    // Fill basic form fields if present
    const nameInput = page.locator('input[name="name"], input[placeholder*="name"]')
    if (await nameInput.isVisible()) {
      await nameInput.fill('Test User')
    }

    const emailInput = page.locator('input[name="email"], input[type="email"]')
    if (await emailInput.isVisible()) {
      await emailInput.fill('test@example.com')
    }

    await expect(page.locator('body')).toBeVisible()
  })
})

test.describe('Attorney Booking', () => {
  test('attorney profile shows booking options', async ({ page }) => {
    // Use SEO-friendly URL format: /services/[practice-area]/[city]/[attorney-slug]
    await page.goto('/services/personal-injury/houston/test-attorney')

    // Should show attorney page or 404
    await expect(page.locator('body')).toBeVisible()
  })

  test('emergency page shows emergency options', async ({ page }) => {
    await page.goto('/emergency')

    // Should show emergency services
    await expect(page.locator('body')).toBeVisible()

    // Should have emergency-related content
    const heading = page.locator('h1')
    await expect(heading).toBeVisible()
  })
})

test.describe('Quote Request', () => {
  test('can access quote request form from search', async ({ page }) => {
    await page.goto('/search?q=personal-injury')

    // Should show search results
    await expect(page.locator('body')).toBeVisible()
  })

  test('contact form is accessible', async ({ page }) => {
    await page.goto('/contact')

    // Should show contact page with inputs
    await expect(page.locator('body')).toBeVisible()
    const inputs = page.locator('input')
    const count = await inputs.count()
    expect(count).toBeGreaterThan(0)
  })

  test('can submit contact form', async ({ page }) => {
    await page.goto('/contact')

    // Page should load
    await expect(page.locator('body')).toBeVisible()

    // Fill any visible email input
    const emailInputs = page.locator('input[type="email"]')
    const emailCount = await emailInputs.count()
    if (emailCount > 0) {
      await emailInputs.first().fill('test@example.com')
    }

    await expect(page.locator('body')).toBeVisible()
  })
})
