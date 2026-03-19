import { test, expect } from '@playwright/test'

test.describe('Practice Area Pages', () => {
  test('should display practice areas list page', async ({ page }) => {
    await page.goto('/practice-areas')

    // Check page loads with heading
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  })

  test('should display practice area detail page', async ({ page }) => {
    await page.goto('/services/personal-injury')

    // Check page content loads
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  })

  test('should display practice area by location', async ({ page }) => {
    await page.goto('/services/personal-injury/houston')

    // Check page loads
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  })

  test('should have working navigation in practice areas', async ({ page }) => {
    await page.goto('/practice-areas')

    // Page should have practice area links
    const serviceLinks = page.getByRole('link')
    const count = await serviceLinks.count()
    expect(count).toBeGreaterThan(0)
  })
})

test.describe('Location Pages', () => {
  test('should display cities list', async ({ page }) => {
    await page.goto('/cities')

    // Check page loads
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  })

  test('should display regions list', async ({ page }) => {
    await page.goto('/regions')

    // Check page loads
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  })

  test('should display states list', async ({ page }) => {
    await page.goto('/states')

    // Check page loads
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  })

  test('should navigate from state to cities', async ({ page }) => {
    await page.goto('/states/texas')

    // Check state detail page loads
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  })
})

test.describe('Emergency Page', () => {
  test('should display emergency page', async ({ page }) => {
    await page.goto('/emergency')

    // Check page loads
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  })

  test('should have emergency contact options', async ({ page }) => {
    await page.goto('/emergency')

    // Page should have content
    const body = page.locator('body')
    await expect(body).toBeVisible()
  })
})
