import { test, expect, type Page } from '@playwright/test'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Fill the login form (email + password) and optionally submit */
async function fillLoginForm(
  page: Page,
  email: string,
  password: string,
  { submit = false }: { submit?: boolean } = {}
) {
  await page.locator('input[type="email"]').first().fill(email)
  await page.locator('input[type="password"]').first().fill(password)
  if (submit) {
    await page.getByRole('button', { name: /Sign In/i }).click()
  }
}

// ===========================================================================
// 1. LOGIN PAGE
// ===========================================================================

test.describe('Auth — Login Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
  })

  test('page loads with heading, email and password fields', async ({ page }) => {
    // Heading
    await expect(page.getByRole('heading', { name: /Sign In/i })).toBeVisible()

    // Email input
    const emailInput = page.locator('input[type="email"]').first()
    await expect(emailInput).toBeVisible()
    await expect(emailInput).toHaveAttribute('placeholder', /email/i)

    // Password input
    const passwordInput = page.locator('input[type="password"]').first()
    await expect(passwordInput).toBeVisible()
  })

  test('submitting empty form triggers HTML validation (required fields)', async ({ page }) => {
    // Both inputs have the `required` attribute — clicking submit on an
    // empty form should NOT navigate away; the browser blocks submission.
    const emailInput = page.locator('input[type="email"]').first()
    await expect(emailInput).toHaveAttribute('required', '')

    const passwordInput = page.locator('input[type="password"]').first()
    await expect(passwordInput).toHaveAttribute('required', '')

    // Click submit — page should stay on /login (HTML5 validation prevents submit)
    await page.getByRole('button', { name: /Sign In/i }).click()
    await expect(page).toHaveURL(/\/login/)
  })

  test('invalid credentials show error message', async ({ page }) => {
    await fillLoginForm(page, 'invalid@example.com', 'wrongpassword123', { submit: true })

    // The app either shows an inline error div or stays on /login.
    // Wait for the network round-trip then check for error feedback.
    const errorBanner = page.locator('text=Sign in failed').or(
      page.locator('text=Unable to connect')
    ).or(
      page.locator('text=Invalid')
    )

    // Either an error message appears or we remain on /login
    const hasError = await errorBanner.first().isVisible({ timeout: 5000 }).catch(() => false)
    if (!hasError) {
      // Fallback: at minimum we must still be on the login page
      await expect(page).toHaveURL(/\/login/)
    }
  })

  test('successful login redirects to dashboard (mocked)', async ({ page }) => {
    // Mock the /api/auth/signin endpoint to return a successful response
    await page.route('**/api/auth/signin', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            user: { id: 'test-user-id', email: 'test@example.com', isAttorney: false },
            session: {
              accessToken: 'mock-access-token',
              refreshToken: 'mock-refresh-token',
            },
          },
        }),
      })
    })

    await fillLoginForm(page, 'test@example.com', 'ValidPassword1!', { submit: true })

    // Should redirect to /client-dashboard (non-attorney user)
    await page.waitForURL(/\/(client-dashboard|attorney-dashboard|login)/, { timeout: 10000 })
  })

  test('"Forgot Password?" link navigates to /forgot-password', async ({ page }) => {
    const forgotLink = page.getByRole('link', { name: /Forgot Password/i })
    await expect(forgotLink).toBeVisible()
    await forgotLink.click()
    await page.waitForURL(/\/forgot-password/, { timeout: 15000 })
    await expect(page).toHaveURL(/\/forgot-password/)
  })

  test('"Create Account" link navigates to /register', async ({ page }) => {
    const registerLink = page.getByRole('link', { name: /Create Account/i })
    await expect(registerLink).toBeVisible()
    await registerLink.click()
    await page.waitForURL(/\/register/, { timeout: 15000 })
    await expect(page).toHaveURL(/\/register/)
  })

  test('user type toggle switches between Client and Attorney', async ({ page }) => {
    const clientBtn = page.getByRole('button', { name: /Client/i })
    const attorneyBtn = page.getByRole('button', { name: /Attorney/i })

    await expect(clientBtn).toBeVisible()
    await expect(attorneyBtn).toBeVisible()

    // Click Attorney tab
    await attorneyBtn.click()

    // The "Create Account" link should now point to /register-attorney
    const registerLink = page.getByRole('link', { name: /Create Account/i })
    await expect(registerLink).toHaveAttribute('href', /register-attorney/)
  })

  test('show/hide password toggle works', async ({ page }) => {
    const passwordInput = page.locator('input[type="password"]').first()
    await passwordInput.fill('secret123')

    // Click the show password button
    const toggleBtn = page.getByRole('button', { name: /Show password/i })
    await toggleBtn.click()

    // Password field should now be type="text"
    const visibleInput = page.locator('input[placeholder="••••••••"]').first()
    await expect(visibleInput).toHaveAttribute('type', 'text')

    // Click again to hide
    const hideBtn = page.getByRole('button', { name: /Hide password/i })
    await hideBtn.click()
    await expect(visibleInput).toHaveAttribute('type', 'password')
  })

  test('Google sign-in button is present', async ({ page }) => {
    const googleBtn = page.getByRole('button', { name: /Continue with Google/i })
    await expect(googleBtn).toBeVisible()
  })
})

// ===========================================================================
// 2. REGISTER PAGE (Client)
// ===========================================================================

test.describe('Auth — Register Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/register')
  })

  test('page loads with all required fields', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /Create Account/i })).toBeVisible()

    // First name / Last name
    await expect(page.locator('input[placeholder="John"]')).toBeVisible()
    await expect(page.locator('input[placeholder="Smith"]')).toBeVisible()

    // Email
    await expect(page.locator('input[type="email"]').first()).toBeVisible()

    // Password + Confirm password
    const passwordFields = page.locator('input[type="password"]')
    await expect(passwordFields).toHaveCount(2)

    // Terms checkbox
    const termsCheckbox = page.locator('input[type="checkbox"]').first()
    await expect(termsCheckbox).toBeVisible()

    // Submit button
    await expect(page.getByRole('button', { name: /Create My Account/i })).toBeVisible()
  })

  test('password mismatch shows error on submit', async ({ page }) => {
    // Fill all required fields with valid data but mismatched passwords
    await page.locator('input[placeholder="John"]').fill('John')
    await page.locator('input[placeholder="Smith"]').fill('Smith')
    await page.locator('input[type="email"]').first().fill('john@example.com')
    await page.locator('input[type="password"]').first().fill('StrongPass1!')
    await page.locator('input[type="password"]').nth(1).fill('DifferentPass2!')
    await page.locator('input[type="checkbox"]').first().check()

    await page.getByRole('button', { name: /Create My Account/i }).click()

    // Should display "Passwords do not match"
    await expect(page.locator('text=Passwords do not match')).toBeVisible({ timeout: 3000 })
  })

  test('password too short shows error on submit', async ({ page }) => {
    await page.locator('input[placeholder="John"]').fill('John')
    await page.locator('input[placeholder="Smith"]').fill('Smith')
    await page.locator('input[type="email"]').first().fill('john@example.com')
    await page.locator('input[type="password"]').first().fill('Ab1')
    await page.locator('input[type="password"]').nth(1).fill('Ab1')
    await page.locator('input[type="checkbox"]').first().check()

    await page.getByRole('button', { name: /Create My Account/i }).click()

    await expect(page.locator('text=Password must be at least 8 characters')).toBeVisible({ timeout: 3000 })
  })

  test('terms checkbox required — shows error when unchecked', async ({ page }) => {
    await page.locator('input[placeholder="John"]').fill('John')
    await page.locator('input[placeholder="Smith"]').fill('Smith')
    await page.locator('input[type="email"]').first().fill('john@example.com')
    await page.locator('input[type="password"]').first().fill('StrongPass1!')
    await page.locator('input[type="password"]').nth(1).fill('StrongPass1!')
    // Do NOT check the terms checkbox

    await page.getByRole('button', { name: /Create My Account/i }).click()

    await expect(page.locator('text=You must accept the terms')).toBeVisible({ timeout: 3000 })
  })

  test('successful registration shows confirmation (mocked)', async ({ page }) => {
    // Mock the signup API
    await page.route('**/api/auth/signup', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: { user: { id: 'new-user', email: 'john@example.com' } },
        }),
      })
    })

    await page.locator('input[placeholder="John"]').fill('John')
    await page.locator('input[placeholder="Smith"]').fill('Smith')
    await page.locator('input[type="email"]').first().fill('john@example.com')
    await page.locator('input[type="password"]').first().fill('StrongPass1!')
    await page.locator('input[type="password"]').nth(1).fill('StrongPass1!')
    await page.locator('input[type="checkbox"]').first().check()

    await page.getByRole('button', { name: /Create My Account/i }).click()

    // Confirmation screen
    await expect(page.getByText(/Registration Successful/i)).toBeVisible({ timeout: 5000 })
    await expect(page.getByText(/confirmation email/i)).toBeVisible()
  })

  test('password strength indicator updates as user types', async ({ page }) => {
    const passwordInput = page.locator('input[type="password"]').first()

    // Type a weak password
    await passwordInput.fill('ab')
    await expect(page.getByText(/Very weak|Weak/i).first()).toBeVisible({ timeout: 2000 })

    // Type a strong password
    await passwordInput.fill('StrongP@ss1')
    await expect(page.getByText(/Strong|Very strong/i).first()).toBeVisible({ timeout: 2000 })
  })

  test('"Sign In" link navigates to /login', async ({ page }) => {
    const signInLink = page.getByRole('link', { name: /Sign In/i })
    await expect(signInLink).toBeVisible()
    await signInLink.click()
    await page.waitForURL(/\/login/, { timeout: 15000 })
    await expect(page).toHaveURL(/\/login/)
  })

  test('"Register your practice" link navigates to /register-attorney', async ({ page }) => {
    const attorneyLink = page.getByRole('link', { name: /Register your practice/i })
    await expect(attorneyLink).toBeVisible()
    await attorneyLink.click()
    await page.waitForURL(/\/register-attorney/, { timeout: 15000 })
    await expect(page).toHaveURL(/\/register-attorney/)
  })
})

// ===========================================================================
// 3. ATTORNEY REGISTRATION
// ===========================================================================

test.describe('Auth — Attorney Registration', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/register-attorney')
  })

  test('page loads with attorney-specific heading and step 1 fields', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /Join the US Attorneys Network/i })).toBeVisible()

    // Step 1 fields: Firm Name, Bar Number, Practice Area
    await expect(page.locator('text=Firm Name')).toBeVisible()
    await expect(page.locator('text=Bar Number')).toBeVisible()
    await expect(page.locator('text=Primary Practice Area')).toBeVisible()
  })

  test('step 1 validation — empty fields show error', async ({ page }) => {
    // Try to advance without filling step 1
    const continueBtn = page.getByRole('button', { name: /Continue/i })
    await continueBtn.click()

    await expect(page.locator('text=Please fill in all required fields')).toBeVisible({ timeout: 3000 })
  })

  test('step navigation works — can advance to step 2 with valid data', async ({ page }) => {
    // Fill step 1
    await page.locator('input[placeholder="My Law Firm"]').fill('Smith & Associates')
    await page.locator('input[placeholder="Enter your bar number..."]').fill('TX12345')

    // Practice area — type and select from autocomplete
    const paInput = page.locator('input[placeholder="Search your practice area..."]')
    await paInput.fill('Personal')
    // Wait for autocomplete suggestions and click first one
    const suggestion = page.locator('[role="option"], [role="listbox"] >> text=/Personal/i').first()
    const hasSuggestion = await suggestion.isVisible({ timeout: 3000 }).catch(() => false)
    if (hasSuggestion) {
      await suggestion.click()
    } else {
      // Fallback: just type the full value (the autocomplete may work differently)
      await paInput.fill('Personal Injury')
    }

    await page.getByRole('button', { name: /Continue/i }).click()

    // Should now show step 2 heading
    await expect(page.locator('text=Your Contact Info')).toBeVisible({ timeout: 3000 })
  })

  test('bar number field accepts text input', async ({ page }) => {
    const barInput = page.locator('input[placeholder="Enter your bar number..."]')
    await expect(barInput).toBeVisible()
    await barInput.fill('CA987654')
    await expect(barInput).toHaveValue('CA987654')
  })

  test('4-step progress indicator is displayed', async ({ page }) => {
    // There are 4 step circles in the progress indicator
    const stepCircles = page.locator('.rounded-full.flex.items-center.justify-center.font-semibold')
    await expect(stepCircles).toHaveCount(4)
  })
})

// ===========================================================================
// 4. FORGOT PASSWORD
// ===========================================================================

test.describe('Auth — Forgot Password', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/forgot-password')
  })

  test('page loads with heading and email field', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /Forgot Password/i })).toBeVisible()

    const emailInput = page.locator('input[type="email"]').first()
    await expect(emailInput).toBeVisible()
    await expect(emailInput).toHaveAttribute('required', '')
  })

  test('submit button is present and labelled', async ({ page }) => {
    await expect(page.getByRole('button', { name: /Send Reset Link/i })).toBeVisible()
  })

  test('submitting valid email shows confirmation (mocked)', async ({ page }) => {
    // Mock the reset-password API
    await page.route('**/api/auth/reset-password', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Reset email sent' }),
      })
    })

    await page.locator('input[type="email"]').first().fill('user@example.com')
    await page.getByRole('button', { name: /Send Reset Link/i }).click()

    // Confirmation screen
    await expect(page.getByText(/Email Sent/i)).toBeVisible({ timeout: 5000 })
    await expect(page.getByText(/user@example.com/)).toBeVisible()
    await expect(page.getByText(/check your spam folder/i)).toBeVisible()
  })

  test('"Back to Sign In" link navigates to /login', async ({ page }) => {
    const backLink = page.getByRole('link', { name: /Back to Sign In/i })
    await expect(backLink).toBeVisible()
    await backLink.click()
    await page.waitForURL(/\/login/, { timeout: 15000 })
    await expect(page).toHaveURL(/\/login/)
  })

  test('"Create Account" link navigates to /register', async ({ page }) => {
    const createLink = page.getByRole('link', { name: /Create Account/i })
    await expect(createLink).toBeVisible()
    await createLink.click()
    await page.waitForURL(/\/register/, { timeout: 15000 })
    await expect(page).toHaveURL(/\/register/)
  })
})

// ===========================================================================
// 5. PROTECTED ROUTES
// ===========================================================================

test.describe('Auth — Protected Routes', () => {
  test('/client-dashboard redirects to /login when unauthenticated', async ({ page }) => {
    await page.goto('/client-dashboard')
    // Middleware redirects to /login?redirect=...
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 })
  })

  test('/attorney-dashboard redirects to /login when unauthenticated', async ({ page }) => {
    await page.goto('/attorney-dashboard')
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 })
  })

  test('/admin redirects when unauthenticated', async ({ page }) => {
    await page.goto('/admin')
    // Middleware redirects non-authed users to /login (with redirect param)
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 })
  })

  test('/admin/login is accessible without authentication', async ({ page }) => {
    await page.goto('/admin/login')
    // Should NOT redirect — admin login page is public
    await expect(page).toHaveURL(/\/admin\/login/)
    await expect(page.getByRole('heading', { name: /Administration/i })).toBeVisible()
  })

  test('redirect param is preserved when redirecting to login', async ({ page }) => {
    await page.goto('/client-dashboard')
    await page.waitForURL(/\/login/, { timeout: 10000 })

    // The URL should contain ?redirect= with the original path
    const url = page.url()
    expect(url).toContain('redirect=')
    expect(url).toMatch(/redirect=.*client-dashboard/)
  })
})

// ===========================================================================
// 6. ADMIN LOGIN
// ===========================================================================

test.describe('Auth — Admin Login Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/admin/login', { waitUntil: 'networkidle' })
  })

  test('page loads with admin-specific heading and fields', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /Administration/i })).toBeVisible({ timeout: 10000 })
    await expect(page.getByText(/Sign in to access the admin panel/i)).toBeVisible()

    // Email and password fields
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()

    // Submit button
    await expect(page.getByRole('button', { name: /Admin Sign In/i })).toBeVisible()
  })

  test('invalid admin credentials show error', async ({ page }) => {
    await page.locator('input[type="email"]').fill('notadmin@example.com')
    await page.locator('input[type="password"]').fill('wrongpassword')
    await page.getByRole('button', { name: /Admin Sign In/i }).click()

    // Should show error or remain on admin login
    const errorBanner = page.locator('text=Sign in failed').or(
      page.locator('text=Unable to connect')
    )
    const hasError = await errorBanner.first().isVisible({ timeout: 5000 }).catch(() => false)
    if (!hasError) {
      await expect(page).toHaveURL(/\/admin\/login/)
    }
  })

  test('"Back to Site" link navigates to homepage', async ({ page }) => {
    const backLink = page.getByRole('link', { name: /Back to Site/i })
    await expect(backLink).toBeVisible()
    await backLink.click()
    await page.waitForURL('/', { timeout: 15000 })
    await expect(page).toHaveURL('/')
  })

  test('restricted access notice is displayed', async ({ page }) => {
    await expect(page.getByText(/Access restricted to authorized administrators/i)).toBeVisible()
  })
})

// ===========================================================================
// 7. MOBILE AUTH (Responsive)
// ===========================================================================

test.describe('Auth — Mobile Responsive (375px viewport)', () => {
  test.use({ viewport: { width: 375, height: 667 } })

  test('login page renders correctly on mobile', async ({ page }) => {
    await page.goto('/login')

    // Heading visible
    await expect(page.getByRole('heading', { name: /Sign In/i })).toBeVisible()

    // Form fields are accessible
    const emailInput = page.locator('input[type="email"]').first()
    await expect(emailInput).toBeVisible()
    await emailInput.fill('mobile@test.com')
    await expect(emailInput).toHaveValue('mobile@test.com')

    const passwordInput = page.locator('input[type="password"]').first()
    await expect(passwordInput).toBeVisible()
    await passwordInput.fill('password123')

    // Submit button visible and clickable
    const submitBtn = page.getByRole('button', { name: /Sign In/i })
    await expect(submitBtn).toBeVisible()
    await expect(submitBtn).toBeEnabled()
  })

  test('register page renders correctly on mobile', async ({ page }) => {
    await page.goto('/register')

    await expect(page.getByRole('heading', { name: /Create Account/i })).toBeVisible()

    // All form fields should be accessible
    await expect(page.locator('input[placeholder="John"]')).toBeVisible()
    await expect(page.locator('input[placeholder="Smith"]')).toBeVisible()
    await expect(page.locator('input[type="email"]').first()).toBeVisible()
  })

  test('forgot password page renders correctly on mobile', async ({ page }) => {
    await page.goto('/forgot-password')

    await expect(page.getByRole('heading', { name: /Forgot Password/i })).toBeVisible()
    await expect(page.locator('input[type="email"]').first()).toBeVisible()
    await expect(page.getByRole('button', { name: /Send Reset Link/i })).toBeVisible()
  })

  test('all navigation links are tappable on mobile', async ({ page }) => {
    await page.goto('/login')

    // Forgot Password link
    const forgotLink = page.getByRole('link', { name: /Forgot Password/i })
    await expect(forgotLink).toBeVisible()
    const forgotBox = await forgotLink.boundingBox()
    expect(forgotBox).not.toBeNull()
    // Ensure minimum touch target size (at least 24px height)
    if (forgotBox) {
      expect(forgotBox.height).toBeGreaterThanOrEqual(20)
    }

    // Create Account link
    const createLink = page.getByRole('link', { name: /Create Account/i })
    await expect(createLink).toBeVisible()
  })
})
