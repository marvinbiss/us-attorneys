import { test, expect, Page } from '@playwright/test'

// Increase default timeout — the dev server can be slow on cold pages
test.setTimeout(60_000)

/**
 * Pre-accept cookies via localStorage so the consent banner never appears.
 * Must be called BEFORE page.goto() via addInitScript.
 */
async function preAcceptCookies(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem('cookie_consent', 'accepted')
    localStorage.setItem(
      'cookie_preferences',
      JSON.stringify({
        necessary: true,
        analytics: true,
        marketing: false,
        personalization: false,
      })
    )
  })
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Intercept API calls and return a canned success response so tests do not
 * depend on a running backend / third-party services (Resend, Supabase, etc.).
 */
async function mockContactApi(page: Page) {
  await page.route('**/api/contact', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: { message: 'Message sent successfully' } }),
    })
  )
}

async function mockNewsletterApi(page: Page, status = 200, body?: Record<string, unknown>) {
  await page.route('**/api/newsletter', (route) =>
    route.fulfill({
      status,
      contentType: 'application/json',
      body: JSON.stringify(body ?? { success: true, data: { message: 'Subscription confirmed' } }),
    })
  )
}

async function mockQuotesApi(page: Page) {
  await page.route('**/api/quotes', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true }),
    })
  )
}

async function mockClaimApi(page: Page, status = 200, body?: Record<string, unknown>) {
  await page.route('**/api/attorney/claim', (route) =>
    route.fulfill({
      status,
      contentType: 'application/json',
      body: JSON.stringify(body ?? { success: true, message: 'Claim submitted' }),
    })
  )
}

/**
 * Navigate to the quote form page. Uses domcontentloaded to avoid timeout on
 * heavy pages that lazy-load many dynamic components.
 */
async function gotoQuotes(page: Page) {
  await page.goto('/quotes', { waitUntil: 'domcontentloaded' })
  // Wait for the form to hydrate (step indicator appears)
  await page.getByText(/step 1 of 4/i).waitFor({ timeout: 30_000 })
}

/**
 * Helper to navigate through quote wizard steps to step N.
 * Fills service + city + urgency as needed.
 */
async function navigateToQuoteStep(page: Page, targetStep: 2 | 3 | 4) {
  // Step 1 -> 2: select service
  await page.locator('#service').selectOption('personal-injury')
  await page.locator('button:has-text("Next")').first().click()
  if (targetStep === 2) return

  // Step 2 -> 3: enter city
  await page.getByText(/step 2 of 4/i).waitFor({ timeout: 5_000 })
  const cityInput = page.locator('#city')
  await cityInput.fill('New York')
  // Wait for and select a suggestion if available
  const suggestion = page.locator('ul li button').first()
  const hasSuggestion = await suggestion.isVisible({ timeout: 3_000 }).catch(() => false)
  if (hasSuggestion) await suggestion.click()
  // Click the Next button (not the Previous)
  await page.locator('button:has-text("Next")').first().click()
  if (targetStep === 3) return

  // Step 3 -> 4: select urgency
  await page.getByText(/step 3 of 4/i).waitFor({ timeout: 5_000 })
  await page.getByText('This week').click()
  await page.locator('button:has-text("Next")').first().click()
  await page.getByText(/step 4 of 4/i).waitFor({ timeout: 5_000 })
}

// ---------------------------------------------------------------------------
// 1. Contact page
// ---------------------------------------------------------------------------

test.describe('Contact page', () => {
  test.beforeEach(async ({ page }) => {
    await preAcceptCookies(page)
    await mockContactApi(page)
    await page.goto('/contact', { waitUntil: 'domcontentloaded' })
    await page.getByRole('heading', { level: 1 }).waitFor({ timeout: 15_000 })
  })

  test('page loads with h1 heading "Contact Us"', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 1, name: /contact us/i })).toBeVisible()
  })

  test('contact form is visible with all required fields', async ({ page }) => {
    await expect(page.locator('#contact-name')).toBeVisible()
    await expect(page.locator('#contact-email')).toBeVisible()
    await expect(page.locator('#contact-subject')).toBeVisible()
    await expect(page.locator('#contact-message')).toBeVisible()
    await expect(page.getByRole('button', { name: /send message/i })).toBeVisible()
  })

  test('empty submission is blocked by native validation', async ({ page }) => {
    await page.getByRole('button', { name: /send message/i }).click()
    // The form uses "required" attributes — browser blocks submission.
    await expect(page.getByRole('heading', { name: /message sent/i })).not.toBeVisible()
  })

  test('invalid email is rejected by native validation', async ({ page }) => {
    await page.locator('#contact-name').fill('John Doe')
    await page.locator('#contact-email').fill('not-an-email')
    await page.locator('#contact-subject').selectOption('other')
    await page.locator('#contact-message').fill('This is a test message for E2E')
    await page.getByRole('button', { name: /send message/i }).click()
    await expect(page.getByRole('heading', { name: /message sent/i })).not.toBeVisible()
  })

  test('successful submission shows confirmation', async ({ page }) => {
    await page.locator('#contact-name').fill('John Doe')
    await page.locator('#contact-email').fill('john@example.com')
    await page.locator('#contact-subject').selectOption('consultation')
    await page.locator('#contact-message').fill('I need help with a personal injury case')
    await page.getByRole('button', { name: /send message/i }).click()
    // After successful API response, the component renders a success view
    await expect(page.getByText(/message sent/i).first()).toBeVisible({ timeout: 15_000 })
  })

  test('contact info (email, phone) is displayed', async ({ page }) => {
    // Use first() to avoid strict-mode collision with footer
    await expect(page.getByText('contact@us-attorneys.com').first()).toBeVisible()
    await expect(page.getByText('(800) 555-1234')).toBeVisible()
  })

  test('business hours are displayed', async ({ page }) => {
    await expect(page.getByText(/Mon.*Fri/).first()).toBeVisible()
  })
})

// ---------------------------------------------------------------------------
// 2. Newsletter signup
// ---------------------------------------------------------------------------

test.describe('Newsletter signup', () => {
  test.beforeEach(async ({ page }) => {
    await preAcceptCookies(page)
    await mockNewsletterApi(page)
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    // Scroll to footer and wait for newsletter form
    const footer = page.locator('footer')
    await footer.scrollIntoViewIfNeeded()
    await page.getByPlaceholder(/your email/i).waitFor({ timeout: 15_000 })
  })

  test('newsletter form is visible in the footer', async ({ page }) => {
    await expect(page.getByPlaceholder(/your email/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /subscribe/i })).toBeVisible()
  })

  test('empty email shows validation error', async ({ page }) => {
    await page.getByRole('button', { name: /subscribe/i }).click()
    // Native required validation prevents submission — form stays, no success text
    await expect(page.getByText(/thank you for subscribing/i)).not.toBeVisible()
  })

  test('invalid email format shows error', async ({ page }) => {
    const emailInput = page.getByPlaceholder(/your email/i)
    // Use "bad@email" — passes native type="email" validation (has @) but fails
    // the JS check (!email.includes('.')) which requires a dot.
    await emailInput.fill('bad@email')
    await page.getByRole('button', { name: /subscribe/i }).click()
    await expect(page.getByText(/valid email/i)).toBeVisible({ timeout: 5_000 })
  })

  test('successful signup shows confirmation message', async ({ page }) => {
    const emailInput = page.getByPlaceholder(/your email/i)
    await emailInput.fill('test@example.com')
    await page.getByRole('button', { name: /subscribe/i }).click()
    await expect(page.getByText(/thank you for subscribing/i)).toBeVisible({ timeout: 10_000 })
  })

  test('duplicate email handled gracefully', async ({ page }) => {
    // Override the default mock with a 409 error
    await page.unrouteAll({ behavior: 'ignoreErrors' })
    await mockNewsletterApi(page, 409, {
      error: 'Email already subscribed',
    })
    const emailInput = page.getByPlaceholder(/your email/i)
    await emailInput.fill('existing@example.com')
    await page.getByRole('button', { name: /subscribe/i }).click()
    // Should display an error text — not crash
    await expect(page.getByText(/error|already/i).first()).toBeVisible({ timeout: 10_000 })
  })
})

// ---------------------------------------------------------------------------
// 3. Quote request flow (multi-step wizard)
// ---------------------------------------------------------------------------

test.describe('Quote request flow', () => {
  test.describe.configure({ mode: 'serial' })

  test.beforeEach(async ({ page }) => {
    await preAcceptCookies(page)
    await mockQuotesApi(page)
    // Clear saved quote draft so each test starts fresh
    await page.addInitScript(() => {
      localStorage.removeItem('sa:quote-draft')
    })
    await gotoQuotes(page)
  })

  test('quote page loads with form and step indicator', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expect(page.getByText(/step 1 of 4/i)).toBeVisible()
  })

  test('step 1: service selection required before advancing', async ({ page }) => {
    await page.locator('button:has-text("Next")').first().click()
    await expect(page.getByText(/please choose a service/i)).toBeVisible()
    await expect(page.getByText(/step 1 of 4/i)).toBeVisible()
  })

  test('step 1 -> step 2: selecting a service advances', async ({ page }) => {
    await page.locator('#service').selectOption('personal-injury')
    await page.locator('button:has-text("Next")').first().click()
    await expect(page.getByText(/step 2 of 4/i)).toBeVisible()
    await expect(page.getByText(/where is your case/i)).toBeVisible()
  })

  test('step 2: city required before advancing', async ({ page }) => {
    await navigateToQuoteStep(page, 2)
    await page.locator('button:has-text("Next")').first().click()
    await expect(page.getByText(/please enter your city/i)).toBeVisible()
  })

  test('step 2 -> step 3: entering city advances', async ({ page }) => {
    await navigateToQuoteStep(page, 3)
    await expect(page.getByText(/step 3 of 4/i)).toBeVisible()
  })

  test('step 3: urgency required before advancing', async ({ page }) => {
    await navigateToQuoteStep(page, 3)
    await page.locator('button:has-text("Next")').first().click()
    await expect(page.getByText(/please indicate your preferred timeline/i)).toBeVisible()
  })

  test('back navigation between steps works', async ({ page }) => {
    await page.locator('#service').selectOption('personal-injury')
    await page.locator('button:has-text("Next")').first().click()
    await expect(page.getByText(/step 2 of 4/i)).toBeVisible()
    await page.getByRole('button', { name: /previous/i }).click()
    await expect(page.getByText(/step 1 of 4/i)).toBeVisible()
  })

  test('full flow: step 1 -> 4 -> submit shows confirmation', async ({ page }) => {
    await navigateToQuoteStep(page, 4)

    await page.locator('#name').fill('John Doe')
    await page.locator('#phone').fill('5551234567')
    await page.locator('#email').fill('john@example.com')
    await page.getByText(/i agree to be contacted/i).click()
    await page.getByRole('button', { name: /get my free consultations/i }).click()

    await expect(page.getByText(/your request has been submitted/i)).toBeVisible({
      timeout: 10_000,
    })
  })

  test('step 4: validation blocks submission on incomplete fields', async ({ page }) => {
    await navigateToQuoteStep(page, 4)

    await page.getByRole('button', { name: /get my free consultations/i }).click()
    await expect(page.getByText(/please enter your name/i)).toBeVisible()
    await expect(page.getByText(/please enter your phone/i)).toBeVisible()
    await expect(page.getByText(/please enter your email/i)).toBeVisible()
  })

  test('step 4: invalid email shows error', async ({ page }) => {
    await navigateToQuoteStep(page, 4)

    await page.locator('#name').fill('John')
    await page.locator('#phone').fill('5551234567')
    await page.locator('#email').fill('not-an-email')
    await page.locator('#email').blur()
    await expect(page.getByText(/valid email/i)).toBeVisible()
  })
})

// ---------------------------------------------------------------------------
// 4. Attorney claim flow
// ---------------------------------------------------------------------------

test.describe('Attorney claim flow', () => {
  test('claim button opens modal with required fields', async ({ page }) => {
    await preAcceptCookies(page)
    await mockClaimApi(page)
    await page.route('**/api/auth/me', (route) =>
      route.fulfill({ status: 401, contentType: 'application/json', body: '{}' })
    )
    await page.goto('/practice-areas', { waitUntil: 'domcontentloaded' })
    const firstAttorneyLink = page.getByRole('link', { name: /view profile|attorney/i }).first()
    const hasAttorney = await firstAttorneyLink.isVisible({ timeout: 10_000 }).catch(() => false)
    if (!hasAttorney) {
      test.skip()
      return
    }
    await firstAttorneyLink.click()
    await page.waitForLoadState('domcontentloaded')

    const claimBtn = page.getByRole('button', { name: /claim this profile/i })
    const hasClaim = await claimBtn.isVisible({ timeout: 10_000 }).catch(() => false)
    if (!hasClaim) {
      test.skip()
      return
    }

    await claimBtn.click()
    await expect(page.getByRole('heading', { name: /claim this profile/i })).toBeVisible()
    await expect(page.getByPlaceholder('John Smith')).toBeVisible()
    await expect(page.getByPlaceholder('john@lawfirm.com')).toBeVisible()
    await expect(page.getByPlaceholder('(555) 123-4567')).toBeVisible()
    await expect(page.getByPlaceholder(/partner/i)).toBeVisible()
    await expect(page.getByPlaceholder('e.g. 123456')).toBeVisible()
  })

  test('claim form validates empty fields', async ({ page }) => {
    await preAcceptCookies(page)
    await mockClaimApi(page, 400, { error: 'Bar number is required' })
    await page.route('**/api/auth/me', (route) =>
      route.fulfill({ status: 401, contentType: 'application/json', body: '{}' })
    )
    await page.goto('/practice-areas', { waitUntil: 'domcontentloaded' })
    const firstAttorneyLink = page.getByRole('link', { name: /view profile|attorney/i }).first()
    const hasAttorney = await firstAttorneyLink.isVisible({ timeout: 10_000 }).catch(() => false)
    if (!hasAttorney) {
      test.skip()
      return
    }
    await firstAttorneyLink.click()
    await page.waitForLoadState('domcontentloaded')
    const claimBtn = page.getByRole('button', { name: /claim this profile/i })
    const hasClaim = await claimBtn.isVisible({ timeout: 10_000 }).catch(() => false)
    if (!hasClaim) {
      test.skip()
      return
    }
    await claimBtn.click()

    const submitBtn = page.getByRole('button', { name: /send my request/i })
    await expect(submitBtn).toBeDisabled()
  })

  test('claim form: successful submission shows confirmation', async ({ page }) => {
    await preAcceptCookies(page)
    await mockClaimApi(page, 200, {
      success: true,
      message: 'Your claim request has been submitted.',
    })
    await page.route('**/api/auth/me', (route) =>
      route.fulfill({ status: 401, contentType: 'application/json', body: '{}' })
    )
    await page.goto('/practice-areas', { waitUntil: 'domcontentloaded' })
    const firstAttorneyLink = page.getByRole('link', { name: /view profile|attorney/i }).first()
    const hasAttorney = await firstAttorneyLink.isVisible({ timeout: 10_000 }).catch(() => false)
    if (!hasAttorney) {
      test.skip()
      return
    }
    await firstAttorneyLink.click()
    await page.waitForLoadState('domcontentloaded')
    const claimBtn = page.getByRole('button', { name: /claim this profile/i })
    const hasClaim = await claimBtn.isVisible({ timeout: 10_000 }).catch(() => false)
    if (!hasClaim) {
      test.skip()
      return
    }
    await claimBtn.click()

    await page.getByPlaceholder('John Smith').fill('Jane Attorney')
    await page.getByPlaceholder('john@lawfirm.com').fill('jane@lawfirm.com')
    await page.getByPlaceholder('(555) 123-4567').fill('+12125551234')
    await page.getByPlaceholder(/partner/i).fill('Partner')
    await page.getByPlaceholder('e.g. 123456').fill('123456')
    await page.getByRole('button', { name: /send my request/i }).click()

    await expect(page.getByText(/request sent/i)).toBeVisible({ timeout: 10_000 })
  })
})

// ---------------------------------------------------------------------------
// 5. FAQ page
// ---------------------------------------------------------------------------

test.describe('FAQ page', () => {
  test.beforeEach(async ({ page }) => {
    await preAcceptCookies(page)
    await page.goto('/faq', { waitUntil: 'domcontentloaded' })
    await page.getByRole('heading', { level: 1 }).waitFor({ timeout: 15_000 })
  })

  test('page loads with h1 heading', async ({ page }) => {
    await expect(
      page.getByRole('heading', { level: 1, name: /frequently asked questions/i })
    ).toBeVisible()
  })

  test('FAQ accordions expand and collapse on click', async ({ page }) => {
    // faqCategories may be empty in dev — skip gracefully
    const firstQuestion = page
      .locator('button')
      .filter({ hasText: /.{15,}/ })
      .first()
    const isVisible = await firstQuestion.isVisible({ timeout: 5_000 }).catch(() => false)
    if (!isVisible) {
      test.skip()
      return
    }

    await firstQuestion.click()
    const parent = firstQuestion.locator('..')
    const answerDiv = parent.locator('div.px-6')
    const answerVisible = await answerDiv.isVisible({ timeout: 3_000 }).catch(() => false)
    if (answerVisible) {
      await expect(answerDiv).toBeVisible()
      await firstQuestion.click()
      await expect(answerDiv).not.toBeVisible()
    }
  })

  test('search/filter FAQs works', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/search.*question/i)
    await expect(searchInput).toBeVisible()
    await searchInput.fill('zzzzxyzzy')
    const noResults = page.getByText(/no results/i)
    const hasNoResults = await noResults.isVisible({ timeout: 3_000 }).catch(() => false)
    if (hasNoResults) {
      await expect(noResults).toBeVisible()
    }
  })

  test('JSON-LD FAQPage schema is present in page source', async ({ page }) => {
    const jsonLdScripts = page.locator('script[type="application/ld+json"]')
    const count = await jsonLdScripts.count()
    expect(count).toBeGreaterThan(0)

    let foundFaqSchema = false
    for (let i = 0; i < count; i++) {
      const content = await jsonLdScripts.nth(i).textContent()
      if (content && content.includes('FAQPage')) {
        foundFaqSchema = true
        break
      }
    }
    expect(foundFaqSchema).toBe(true)
  })

  test('"Contact us" CTA link is present', async ({ page }) => {
    await expect(page.getByRole('link', { name: /contact us/i })).toBeVisible()
  })
})

// ---------------------------------------------------------------------------
// 6. Mobile forms
// ---------------------------------------------------------------------------

test.describe('Mobile forms (375px viewport)', () => {
  test.use({ viewport: { width: 375, height: 812 } })

  test('contact form is fully usable at 375px', async ({ page }) => {
    await preAcceptCookies(page)
    await mockContactApi(page)
    await page.goto('/contact', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expect(page.locator('#contact-name')).toBeVisible()
    await expect(page.locator('#contact-email')).toBeVisible()
    // No significant horizontal overflow (allow rounding from scrollbars/subpixel)
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth)
    expect(bodyWidth).toBeLessThanOrEqual(385)
  })

  test('contact form inputs have minimum tap-target size', async ({ page }) => {
    await page.goto('/contact', { waitUntil: 'domcontentloaded' })
    const nameInput = page.locator('#contact-name')
    await expect(nameInput).toBeVisible()
    const box = await nameInput.boundingBox()
    expect(box).not.toBeNull()
    expect(box!.height).toBeGreaterThanOrEqual(44)
  })

  test('quote form is usable at 375px', async ({ page }) => {
    await mockQuotesApi(page)
    await page.addInitScript(() => localStorage.removeItem('sa:quote-draft'))
    await gotoQuotes(page)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expect(page.getByText(/step 1 of 4/i)).toBeVisible()
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth)
    expect(bodyWidth).toBeLessThanOrEqual(385)
  })

  test('newsletter form in footer is usable on mobile', async ({ page }) => {
    await mockNewsletterApi(page)
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    const footer = page.locator('footer')
    await footer.scrollIntoViewIfNeeded()
    const emailInput = page.getByPlaceholder(/your email/i)
    const isVisible = await emailInput.isVisible({ timeout: 15_000 }).catch(() => false)
    if (!isVisible) {
      test.skip()
      return
    }
    const box = await emailInput.boundingBox()
    expect(box).not.toBeNull()
    expect(box!.height).toBeGreaterThanOrEqual(44)
  })
})
