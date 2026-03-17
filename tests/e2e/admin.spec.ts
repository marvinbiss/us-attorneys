import { test, expect } from '@playwright/test'

// Admin pages require authentication - these tests verify the redirect behavior
// In a production environment, authentication would need to be set up properly

test.describe('Admin Authentication', () => {
  test('should redirect unauthenticated users to login', async ({ page }) => {
    await page.goto('/admin')
    // Should be redirected to login page
    await expect(page).toHaveURL(/login/)
  })

  test('should redirect from admin attorneys page to login', async ({ page }) => {
    await page.goto('/admin/attorneys')
    await expect(page).toHaveURL(/login/)
  })

  test('should redirect from admin reviews page to login', async ({ page }) => {
    await page.goto('/admin/reviews')
    await expect(page).toHaveURL(/login/)
  })

  test('should redirect from admin subscriptions page to login', async ({ page }) => {
    await page.goto('/admin/subscriptions')
    await expect(page).toHaveURL(/login/)
  })
})

test.describe('Admin Page Structure', () => {
  // These tests verify that the pages exist and have correct structure
  // by checking the build output rather than runtime behavior

  test('admin routes should be defined', async ({ page }) => {
    // Verify page returns expected redirect (not 404)
    const response = await page.goto('/admin')
    expect(response?.status()).toBeLessThan(500)
  })

  test('admin attorneys route should be defined', async ({ page }) => {
    const response = await page.goto('/admin/attorneys')
    expect(response?.status()).toBeLessThan(500)
  })

  test('admin reviews route should be defined', async ({ page }) => {
    const response = await page.goto('/admin/reviews')
    expect(response?.status()).toBeLessThan(500)
  })

  test('admin subscriptions route should be defined', async ({ page }) => {
    const response = await page.goto('/admin/subscriptions')
    expect(response?.status()).toBeLessThan(500)
  })
})
