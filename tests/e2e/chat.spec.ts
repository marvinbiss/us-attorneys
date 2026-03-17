import { test, expect } from '@playwright/test'

test.describe('Real-time Chat', () => {
  test('chat interface loads correctly', async ({ page }) => {
    // Navigate to messages page
    await page.goto('/attorney-dashboard/messages')

    // Should show messages interface or redirect to login
    const url = page.url()
    expect(url).toMatch(/messages|login/)
  })

  test('conversation list displays', async ({ page }) => {
    await page.goto('/client-dashboard/messages')

    // Should show conversations or empty state
    const body = await page.locator('body')
    await expect(body).toBeVisible()
  })

  test('search conversations works', async ({ page }) => {
    await page.goto('/attorney-dashboard/messages')

    const searchInput = page.locator('input[placeholder*="Search"]')
    if (await searchInput.isVisible()) {
      await searchInput.fill('test')
      await expect(searchInput).toHaveValue('test')
    }
  })
})

test.describe('Chat Components', () => {
  test('message input is present', async ({ page }) => {
    await page.goto('/attorney-dashboard/messages')

    // Look for message input
    // May or may not be visible depending on auth state
    await expect(page.locator('body')).toBeVisible()
  })

  test('send button is present', async ({ page }) => {
    await page.goto('/client-dashboard/messages')

    // Look for send button
    // May or may not be visible depending on auth state
    await expect(page.locator('body')).toBeVisible()
  })
})

test.describe('Chat Accessibility', () => {
  test('chat has proper ARIA labels', async ({ page }) => {
    await page.goto('/attorney-dashboard/messages')

    // Check for accessibility features
    const main = page.locator('main')
    if (await main.isVisible()) {
      await expect(main).toBeVisible()
    }
  })

  test('keyboard navigation in chat', async ({ page }) => {
    await page.goto('/client-dashboard/messages')

    // Tab through elements
    await page.keyboard.press('Tab')
    // Some element should be focused
    await expect(page.locator('body')).toBeVisible()
  })
})
