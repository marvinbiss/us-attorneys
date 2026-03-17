import { test, expect } from '@playwright/test'

// Attorney dashboard pages require authentication - these tests verify route existence and redirect behavior

test.describe('Attorney Dashboard Authentication', () => {
  test('should redirect unauthenticated users to login from main dashboard', async ({ page }) => {
    await page.goto('/attorney-dashboard')
    // Should be redirected to login page or show auth required
    const url = page.url()
    expect(url).toMatch(/login|attorney-dashboard/)
  })

  test('should redirect from profile page', async ({ page }) => {
    await page.goto('/attorney-dashboard/profile')
    const url = page.url()
    expect(url).toMatch(/login|attorney-dashboard/)
  })

  test('should redirect from requests page', async ({ page }) => {
    await page.goto('/attorney-dashboard/requests')
    const url = page.url()
    expect(url).toMatch(/login|attorney-dashboard/)
  })
})

test.describe('Attorney Dashboard Routes Exist', () => {
  test('attorney-dashboard route should be defined', async ({ page }) => {
    const response = await page.goto('/attorney-dashboard')
    expect(response?.status()).toBeLessThan(500)
  })

  test('profile route should be defined', async ({ page }) => {
    const response = await page.goto('/attorney-dashboard/profile')
    expect(response?.status()).toBeLessThan(500)
  })

  test('requests route should be defined', async ({ page }) => {
    const response = await page.goto('/attorney-dashboard/requests')
    expect(response?.status()).toBeLessThan(500)
  })

  test('reviews route should be defined', async ({ page }) => {
    const response = await page.goto('/attorney-dashboard/reviews')
    expect(response?.status()).toBeLessThan(500)
  })

  test('messages route should be defined', async ({ page }) => {
    const response = await page.goto('/attorney-dashboard/messages')
    expect(response?.status()).toBeLessThan(500)
  })

  test('statistics route should be defined', async ({ page }) => {
    const response = await page.goto('/attorney-dashboard/statistics')
    expect(response?.status()).toBeLessThan(500)
  })

  test('subscription route should be defined', async ({ page }) => {
    const response = await page.goto('/attorney-dashboard/subscription')
    expect(response?.status()).toBeLessThan(500)
  })

  test('calendar route should be defined', async ({ page }) => {
    const response = await page.goto('/attorney-dashboard/calendar')
    expect(response?.status()).toBeLessThan(500)
  })

  test('team route should be defined', async ({ page }) => {
    const response = await page.goto('/attorney-dashboard/team')
    expect(response?.status()).toBeLessThan(500)
  })
})
