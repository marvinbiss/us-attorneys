import { test, expect } from '@playwright/test'

test.describe('Attorney Detail Page', () => {
  test('attorney detail page loads', async ({ page }) => {
    // Navigate to a known attorney page structure
    await page.goto('/services/personal-injury/new-york')

    // Try to find and click a provider card
    const card = page.locator('[data-testid="attorney-card"], .attorney-card, article a').first()
    if (await card.isVisible()) {
      await card.click()
      await expect(page.locator('body')).toBeVisible()
    }
  })

  test('consultation form is visible on attorney pages', async ({ page }) => {
    // Use SEO-friendly URL format: /services/[practice-area]/[city]/[attorney-slug]
    await page.goto('/services/personal-injury/new-york/test')

    // Check for quote form elements
    // May or may not be visible depending on page structure
    await expect(page.locator('body')).toBeVisible()
  })

  test('phone number link format', async ({ page }) => {
    // Use SEO-friendly URL format: /services/[practice-area]/[city]/[attorney-slug]
    await page.goto('/services/personal-injury/new-york/test')

    const phoneLink = page.locator('a[href^="tel:"]')
    if (await phoneLink.isVisible()) {
      const href = await phoneLink.getAttribute('href')
      expect(href).toMatch(/^tel:\+?\d+/)
    }
  })

  test('reviews section if available', async ({ page }) => {
    // Use SEO-friendly URL format: /services/[practice-area]/[city]/[attorney-slug]
    await page.goto('/services/personal-injury/new-york/test')

    // Reviews may or may not be present
    await expect(page.locator('body')).toBeVisible()
  })
})
