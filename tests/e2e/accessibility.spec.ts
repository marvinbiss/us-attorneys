import { test, expect } from '@playwright/test'

test.describe('Accessibility', () => {
  test('home page has no critical a11y issues', async ({ page }) => {
    await page.goto('/')
    // Check for main landmark
    await expect(page.locator('main')).toBeVisible()
    // Check for header
    await expect(page.locator('header')).toBeVisible()
    // Check images have alt text
    const images = page.locator('img')
    const count = await images.count()
    for (let i = 0; i < Math.min(count, 10); i++) {
      const img = images.nth(i)
      const alt = await img.getAttribute('alt')
      // Alt can be empty string for decorative images
      expect(alt).not.toBeNull()
    }
  })

  test('forms have labels or placeholders', async ({ page }) => {
    await page.goto('/login')
    // Email input should have associated label, aria-label, or placeholder
    const emailInput = page.locator('input[type="email"]').first()
    if (await emailInput.isVisible()) {
      const emailId = await emailInput.getAttribute('id')
      const ariaLabel = await emailInput.getAttribute('aria-label')
      const placeholder = await emailInput.getAttribute('placeholder')

      let labelExists = false
      if (emailId) {
        const label = page.locator(`label[for="${emailId}"]`)
        labelExists = (await label.count()) > 0
      }

      // At least one accessibility method should be present
      expect(labelExists || ariaLabel || placeholder).toBeTruthy()
    }
  })

  test('buttons have accessible names', async ({ page }) => {
    await page.goto('/')
    const buttons = page.locator('button')
    const count = await buttons.count()
    for (let i = 0; i < Math.min(count, 10); i++) {
      const button = buttons.nth(i)
      if (await button.isVisible()) {
        const text = await button.textContent()
        const ariaLabel = await button.getAttribute('aria-label')
        const title = await button.getAttribute('title')
        // Button should have some accessible name
        expect(text?.trim() || ariaLabel || title).toBeTruthy()
      }
    }
  })

  test('keyboard navigation works', async ({ page }) => {
    await page.goto('/')
    // Tab through focusable elements
    await page.keyboard.press('Tab')
    // Something should be focused
    const focused = page.locator(':focus')
    await expect(focused).toBeVisible()
  })
})
