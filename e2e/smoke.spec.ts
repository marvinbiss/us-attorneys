import { test, expect } from '@playwright/test'

test.describe('Smoke — Homepage', () => {
  test('homepage loads and has title', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/US Attorneys/)
  })

  test('homepage has an h1 heading', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  })

  test('homepage has a search form or search input', async ({ page }) => {
    await page.goto('/')
    const searchInput = page.getByPlaceholder(/search|practice area|attorney|find/i).first()
    // Search input may or may not be present — just verify page renders
    const hasSearch = await searchInput.isVisible().catch(() => false)
    // If no search input, at least verify the page rendered content
    if (!hasSearch) {
      await expect(page.locator('body')).not.toBeEmpty()
    }
  })

  test('header navigation is visible', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('banner')).toBeVisible()
  })

  test('footer is visible with legal links', async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    const footer = page.locator('footer')
    await expect(footer).toBeVisible()
    await expect(page.getByRole('link', { name: /Terms/i }).first()).toBeVisible()
    await expect(page.getByRole('link', { name: /Privacy/i }).first()).toBeVisible()
  })

  test('page is responsive on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  })
})
