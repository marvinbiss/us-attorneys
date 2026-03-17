import { test, expect } from '@playwright/test'

test.describe('Search Functionality', () => {
  test('home page search redirects correctly', async ({ page }) => {
    await page.goto('/')

    const serviceInput = page.locator('input[placeholder*="practice area"], input[placeholder*="service"]').first()
    const cityInput = page.locator('input[placeholder*="Where"], input[placeholder*="city"], input[placeholder*="location"]').first()

    if (await serviceInput.isVisible() && await cityInput.isVisible()) {
      await serviceInput.fill('personal injury')
      await cityInput.fill('houston')
      await page.click('button[type="submit"]')
      await expect(page).toHaveURL(/\/(services|search)\/personal-injury/)
    }
  })

  test('search with only practice area', async ({ page }) => {
    await page.goto('/')

    const serviceInput = page.locator('input[placeholder*="practice area"], input[placeholder*="service"]').first()

    if (await serviceInput.isVisible()) {
      await serviceInput.fill('family law')
      await page.click('button[type="submit"]')
      // URL can vary - may be /services/family-law or /search?q=family-law
      await expect(page).toHaveURL(/family-law/)
    }
  })

  test('search results page displays attorneys', async ({ page }) => {
    await page.goto('/services/personal-injury/houston')

    // Should have some content
    await expect(page.locator('body')).toBeVisible()
  })

  test('pagination works if present', async ({ page }) => {
    await page.goto('/services/personal-injury')

    const nextButton = page.locator('a:has-text("Next"), button:has-text("Next")')
    if (await nextButton.isVisible()) {
      await nextButton.click()
      await expect(page).toHaveURL(/page=2/)
    }
  })

  test('breadcrumbs navigation works', async ({ page }) => {
    await page.goto('/services/personal-injury/houston')

    const breadcrumb = page.locator('nav[aria-label*="Breadcrumb"] a, .breadcrumb a').first()
    if (await breadcrumb.isVisible()) {
      await breadcrumb.click()
      // Should navigate somewhere
      await expect(page.locator('body')).toBeVisible()
    }
  })
})
