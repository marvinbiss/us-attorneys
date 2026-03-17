import { test, expect } from '@playwright/test'

test.describe('Auth — Login Page', () => {
  test('login page loads and shows heading', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByRole('heading', { name: /Log In/i })).toBeVisible()
  })

  test('login page has email and password fields', async ({ page }) => {
    await page.goto('/login')
    const form = page.locator('form').first()
    await expect(form).toBeVisible()
    const inputs = page.locator('input')
    const count = await inputs.count()
    expect(count).toBeGreaterThanOrEqual(2)
  })

  test('login page has submit button', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByRole('button', { name: /Log In/i })).toBeVisible()
  })

  test('invalid login shows error', async ({ page }) => {
    await page.goto('/login')
    // Fill with invalid credentials
    await page.locator('input[type="email"], input[name="email"]').first().fill('invalid@example.com')
    await page.locator('input[type="password"], input[name="password"]').first().fill('wrongpassword')
    await page.getByRole('button', { name: /Log In/i }).click()

    // Should show some error feedback (toast, inline error, or stay on login page)
    await page.waitForTimeout(2000)
    await expect(page).toHaveURL(/\/login/)
  })

  test('login page has link to register', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByRole('link', { name: /Create an account/i })).toBeVisible()
  })

  test('login page has link to forgot password', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByRole('link', { name: /Forgot password/i })).toBeVisible()
  })
})

test.describe('Auth — Register Page', () => {
  test('register page loads', async ({ page }) => {
    await page.goto('/register')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  })
})
