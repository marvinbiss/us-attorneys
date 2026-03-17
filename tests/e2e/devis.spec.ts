import { test, expect } from '@playwright/test'

test.describe('Consultation Request Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/quotes/')
  })

  test('should display the consultation request form', async ({ page }) => {
    // Check page title
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  })

  test('should validate step 1 form fields', async ({ page }) => {
    // Try to proceed without selecting a practice area
    const nextBtn = page.getByRole('button', { name: /Next/i })
    await nextBtn.click()

    // Should show validation error
    await expect(page.getByText('Please select a practice area')).toBeVisible()
  })

  test('should proceed to step 2 with valid data', async ({ page }) => {
    // Step 1: Select a practice area from dropdown
    await page.locator('select#service').selectOption('personal-injury')

    // Type a city
    await page.locator('input#city').fill('Houston')
    await page.getByText('Houston').first().click()

    // Proceed to step 2
    await page.getByRole('button', { name: /Next/i }).click()

    // Should be on step 2 - check for case details heading
    await expect(page.getByText('Case Details')).toBeVisible()
  })

  test('should complete multi-step consultation request flow', async ({ page }) => {
    // Step 1: Select practice area and city
    await page.locator('select#service').selectOption('personal-injury')
    await page.locator('input#city').fill('Houston')
    await page.getByText('Houston').first().click()
    await page.getByRole('button', { name: /Next/i }).click()

    // Step 2: Fill case details
    await page.locator('textarea').fill('I need help with a personal injury case from a car accident')
    await page.getByText('Urgent (within 24h)').click()
    await page.getByText('$5,000-$50,000').click()
    await page.getByRole('button', { name: /Next/i }).click()

    // Step 3: Contact form should be visible
    await expect(page.getByText(/contact information/i)).toBeVisible()
  })
})

test.describe('Consultation Request - Accessibility', () => {
  test('should be keyboard navigable', async ({ page }) => {
    await page.goto('/quotes/')

    // Tab through form elements
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')

    // Should be able to interact with keyboard
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName)
    expect(['INPUT', 'SELECT', 'BUTTON', 'TEXTAREA', 'A']).toContain(focusedElement)
  })

  test('should have proper form structure', async ({ page }) => {
    await page.goto('/quotes/')

    // Check that practice area dropdown is visible
    await expect(page.locator('select#service')).toBeVisible()

    // Check that city input is visible
    await expect(page.locator('input#city')).toBeVisible()
  })
})
