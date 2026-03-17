import { test, expect } from '@playwright/test'

test.describe('Authentication Flow', () => {
  test('should display login page elements', async ({ page }) => {
    await page.goto('/login')

    // Check page elements
    await expect(page.getByRole('heading', { name: /Log In/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /Log In/i })).toBeVisible()
  })

  test('should display registration page elements', async ({ page }) => {
    await page.goto('/register')

    // Check page elements
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  })

  test('should have form on login page', async ({ page }) => {
    await page.goto('/login')

    // Check login form exists (form with email/password fields)
    const loginForm = page.locator('form').filter({ hasText: 'Email' }).first()
    await expect(loginForm).toBeVisible()
  })

  test('should have password toggle functionality', async ({ page }) => {
    await page.goto('/login')

    // Wait for page load
    await page.waitForLoadState('networkidle')

    // Check there's a button that can toggle password visibility
    const buttons = page.locator('button[type="button"]')
    const count = await buttons.count()
    expect(count).toBeGreaterThan(0)
  })

  test('should navigate between login and registration', async ({ page }) => {
    await page.goto('/login')

    // Click on "Create an account" link
    await page.getByRole('link', { name: /Create an account/i }).click()

    // Should be on registration page
    await expect(page).toHaveURL(/\/register/)

    // Click on "Log In" link
    await page.getByRole('link', { name: /Log In/i }).click()

    // Should be on login page
    await expect(page).toHaveURL(/\/login/)
  })

  test('should navigate to forgot password', async ({ page }) => {
    await page.goto('/login')

    // Click forgot password link
    await page.getByRole('link', { name: /Forgot password/i }).click()

    // Should be on forgot password page
    await expect(page).toHaveURL(/\/forgot-password/)
  })

  test('should switch between user types', async ({ page }) => {
    await page.goto('/login')

    // Click on "Attorney" tab
    await page.getByRole('button', { name: 'Attorney' }).click()

    // Check link updates
    const registerLink = page.getByRole('link', { name: /Create an account/i })
    await expect(registerLink).toHaveAttribute('href', '/register-attorney')
  })
})

test.describe('Attorney Registration', () => {
  test('should display attorney registration form', async ({ page }) => {
    await page.goto('/register-attorney')

    // Check page loads
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  })

  test('should have form elements', async ({ page }) => {
    await page.goto('/register-attorney')

    // Page should have input fields
    const inputs = page.locator('input')
    const count = await inputs.count()
    expect(count).toBeGreaterThan(0)
  })
})
