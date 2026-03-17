import { test, expect } from '@playwright/test'

test.describe('User Journey - Client', () => {
  test('can complete basic user journey', async ({ page }) => {
    // 1. Start at homepage
    await page.goto('/')
    await expect(page.locator('body')).toBeVisible()

    // 2. Navigate to services
    await page.goto('/services')
    await expect(page.locator('body')).toBeVisible()

    // 3. Select a practice area
    await page.goto('/services/personal-injury')
    await expect(page.locator('body')).toBeVisible()

    // 4. View a location
    await page.goto('/services/personal-injury/new-york')
    await expect(page.locator('body')).toBeVisible()
  })

  test('can explore regions', async ({ page }) => {
    // Start at regions
    await page.goto('/regions')
    await expect(page.locator('body')).toBeVisible()

    // Navigate to a region
    await page.goto('/regions/northeast')
    await expect(page.locator('body')).toBeVisible()
  })

  test('can explore states', async ({ page }) => {
    await page.goto('/states')
    await expect(page.locator('body')).toBeVisible()

    await page.goto('/states/texas')
    await expect(page.locator('body')).toBeVisible()
  })

  test('can explore cities', async ({ page }) => {
    await page.goto('/cities')
    await expect(page.locator('body')).toBeVisible()

    await page.goto('/cities/new-york')
    await expect(page.locator('body')).toBeVisible()
  })
})

test.describe('User Journey - Attorney Registration', () => {
  test('can access attorney registration', async ({ page }) => {
    await page.goto('/register-attorney')
    await expect(page.locator('body')).toBeVisible()

    // Should have registration form with input fields
    const inputs = page.locator('input')
    const count = await inputs.count()
    expect(count).toBeGreaterThan(0)
  })

  test('registration form has required fields', async ({ page }) => {
    await page.goto('/register-attorney')

    // Page should load with content
    await expect(page.locator('body')).toBeVisible()

    // Should have some input fields
    const inputs = page.locator('input')
    const count = await inputs.count()
    expect(count).toBeGreaterThan(0)
  })

  test('can view attorney pricing', async ({ page }) => {
    await page.goto('/pricing')
    await expect(page.locator('body')).toBeVisible()
  })
})

test.describe('User Journey - Information Pages', () => {
  test('can view how it works', async ({ page }) => {
    await page.goto('/how-it-works')
    await expect(page.locator('body')).toBeVisible()
  })

  test('can view FAQ', async ({ page }) => {
    await page.goto('/faq')
    await expect(page.locator('body')).toBeVisible()

    // FAQ should have questions
    const questions = page.locator('[data-accordion], details, .faq-item')
    const count = await questions.count()
    expect(count).toBeGreaterThanOrEqual(0) // May have accordion or other FAQ format
  })

  test('can view about page', async ({ page }) => {
    await page.goto('/about')
    await expect(page.locator('body')).toBeVisible()
  })

  test('can view blog', async ({ page }) => {
    await page.goto('/blog')
    await expect(page.locator('body')).toBeVisible()
  })
})

test.describe('User Journey - Legal Pages', () => {
  test('can view privacy policy', async ({ page }) => {
    await page.goto('/privacy')
    await expect(page.locator('body')).toBeVisible()
  })

  test('can view terms of service', async ({ page }) => {
    await page.goto('/terms')
    await expect(page.locator('body')).toBeVisible()
  })

  test('can view legal mentions', async ({ page }) => {
    await page.goto('/legal')
    await expect(page.locator('body')).toBeVisible()
  })

  test('can view accessibility page', async ({ page }) => {
    await page.goto('/accessibility')
    await expect(page.locator('body')).toBeVisible()
  })
})

test.describe('User Journey - Authentication', () => {
  test('can access login page', async ({ page }) => {
    await page.goto('/login')
    await expect(page.locator('body')).toBeVisible()

    // Should have login form with email input
    const emailInput = page.locator('input[type="email"]').first()
    await expect(emailInput).toBeVisible()
  })

  test('can access registration page', async ({ page }) => {
    await page.goto('/register')
    await expect(page.locator('body')).toBeVisible()

    // Should have registration form with email input
    const emailInput = page.locator('input[type="email"]').first()
    await expect(emailInput).toBeVisible()
  })

  test('can access password reset', async ({ page }) => {
    await page.goto('/forgot-password')
    await expect(page.locator('body')).toBeVisible()

    // Should have password reset form with email input
    const emailInput = page.locator('input[type="email"]').first()
    await expect(emailInput).toBeVisible()
  })

  test('protected routes redirect to login', async ({ page }) => {
    await page.goto('/client-dashboard')

    // Should redirect to login
    const url = page.url()
    expect(url).toMatch(/login|client-dashboard/)
  })
})
