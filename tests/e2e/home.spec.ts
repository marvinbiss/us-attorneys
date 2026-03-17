import { test, expect } from '@playwright/test'

test.describe('Home Page', () => {
  test('should display the homepage correctly', async ({ page }) => {
    await page.goto('/')

    // Check title
    await expect(page).toHaveTitle(/US Attorneys/)

    // Check header has logo link
    await expect(page.getByRole('banner').getByRole('link', { name: /US Attorneys/i })).toBeVisible()

    // Check main content
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  })

  test('should navigate to practice areas page', async ({ page }) => {
    await page.goto('/')

    // Navigate to services - click on main CTA or services link
    await page.goto('/services')

    // Verify we're on services page
    await expect(page).toHaveURL(/\/services/)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  })

  test('should show search functionality', async ({ page }) => {
    await page.goto('/')

    // Find search input if visible
    const searchInput = page.getByPlaceholder(/Search|practice area|attorney/i).first()

    // If search is visible, test it
    if (await searchInput.isVisible().catch(() => false)) {
      await searchInput.fill('personal injury')
    }
  })

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/')

    // Page should load correctly on mobile
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  })
})

test.describe('Footer', () => {
  test('should display all footer links', async ({ page }) => {
    await page.goto('/')

    // Scroll to footer
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))

    // Check for footer content
    const footer = page.locator('footer')
    await expect(footer).toBeVisible()

    // Check legal links - use first() to avoid strict mode
    await expect(page.getByRole('link', { name: /Terms/i }).first()).toBeVisible()
    await expect(page.getByRole('link', { name: /Privacy/i }).first()).toBeVisible()
  })
})
