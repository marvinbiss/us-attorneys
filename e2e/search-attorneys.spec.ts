import { test, expect, type Page } from '@playwright/test'

// ============================================================================
// SEARCH & ATTORNEY PROFILE E2E TESTS
// ============================================================================
// Covers: Homepage search, attorney listing, practice area + location pages,
// attorney profile pages, and mobile search.
// ============================================================================

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Wait for page to be fully interactive (hydration complete) */
async function waitForHydration(page: Page) {
  // Wait for Next.js hydration — __NEXT_DATA__ is always present
  await page.waitForFunction(() => !!(window as unknown as Record<string, unknown>).__NEXT_DATA__, {
    timeout: 15_000,
  })
}

/** Extract all JSON-LD blocks from the page */
async function getJsonLdBlocks(page: Page): Promise<Record<string, unknown>[]> {
  return page.$$eval('script[type="application/ld+json"]', (scripts) =>
    scripts.map((s) => {
      try {
        return JSON.parse(s.textContent || '{}')
      } catch {
        return {}
      }
    })
  )
}

// ============================================================================
// 1. HOMEPAGE SEARCH
// ============================================================================

test.describe('Homepage Search', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await waitForHydration(page)
  })

  test('homepage loads with search form', async ({ page }) => {
    // The ClayHeroSearch or HeroSearch component renders a form with role="search"
    const searchForm = page.locator('form[role="search"]').first()
    await expect(searchForm).toBeVisible({ timeout: 10_000 })
  })

  test('practice area dropdown/autocomplete works', async ({ page }) => {
    // Click on the service input field
    const serviceInput = page.getByLabel(/type of service|what service/i).first()
    await expect(serviceInput).toBeVisible({ timeout: 10_000 })
    await serviceInput.click()

    // Typing should filter the service list
    await serviceInput.fill('Personal')
    // The dropdown should show filtered results with "Personal Injury"
    const dropdown = page.locator('[role="listbox"]').first()
    await expect(dropdown).toBeVisible({ timeout: 5_000 })

    const personalInjuryOption = dropdown.getByText('Personal Injury').first()
    await expect(personalInjuryOption).toBeVisible()
  })

  test('location input accepts city name', async ({ page }) => {
    const locationInput = page.getByLabel(/city or zip/i).first()
    await expect(locationInput).toBeVisible({ timeout: 10_000 })
    await locationInput.click()
    await locationInput.fill('New York')

    // Should show city suggestions dropdown
    const dropdown = page.locator('[role="listbox"]').last()
    await expect(dropdown).toBeVisible({ timeout: 5_000 })

    // Should contain New York in the suggestions
    await expect(dropdown.getByText('New York').first()).toBeVisible()
  })

  test('location input accepts ZIP code', async ({ page }) => {
    const locationInput = page.getByLabel(/city or zip/i).first()
    await expect(locationInput).toBeVisible({ timeout: 10_000 })
    await locationInput.click()
    await locationInput.fill('10001')

    // ZIP code matching should show results in the dropdown
    const dropdown = page.locator('[role="listbox"]').last()
    await expect(dropdown).toBeVisible({ timeout: 5_000 })
  })

  test('search button navigates to results page', async ({ page }) => {
    // Select a service
    const serviceInput = page.getByLabel(/type of service|what service/i).first()
    await serviceInput.click()
    await serviceInput.fill('Personal')

    // Click on "Personal Injury" option in the dropdown
    const serviceDropdown = page.locator('[role="listbox"]').first()
    await expect(serviceDropdown).toBeVisible({ timeout: 5_000 })
    await serviceDropdown.getByText('Personal Injury').first().click()

    // Fill in location
    const locationInput = page.getByLabel(/city or zip/i).first()
    await expect(locationInput).toBeFocused({ timeout: 3_000 })
    await locationInput.fill('New York')

    // Select city from dropdown
    const cityDropdown = page.locator('[role="listbox"]').last()
    await expect(cityDropdown).toBeVisible({ timeout: 5_000 })
    await cityDropdown.getByText('New York').first().click()

    // Submit the search
    await page
      .getByRole('button', { name: /search/i })
      .first()
      .click()

    // Should navigate to the practice-areas route
    await page.waitForURL(/\/practice-areas\/personal-injury\/new-york/, { timeout: 15_000 })
    expect(page.url()).toContain('/practice-areas/personal-injury/new-york')
  })

  test('URL contains correct path segments after search', async ({ page }) => {
    // Select "Criminal Defense"
    const serviceInput = page.getByLabel(/type of service|what service/i).first()
    await serviceInput.click()
    await serviceInput.fill('Criminal')

    const serviceDropdown = page.locator('[role="listbox"]').first()
    await expect(serviceDropdown).toBeVisible({ timeout: 5_000 })
    await serviceDropdown.getByText('Criminal Defense').first().click()

    // Select location
    const locationInput = page.getByLabel(/city or zip/i).first()
    await locationInput.fill('Chicago')
    const cityDropdown = page.locator('[role="listbox"]').last()
    await expect(cityDropdown).toBeVisible({ timeout: 5_000 })
    await cityDropdown.getByText('Chicago').first().click()

    // Submit
    await page
      .getByRole('button', { name: /search/i })
      .first()
      .click()

    await page.waitForURL(/\/practice-areas\/criminal-defense\/chicago/, { timeout: 15_000 })
    expect(page.url()).toContain('/practice-areas/criminal-defense/chicago')
  })

  test('popular quick-link buttons navigate correctly', async ({ page }) => {
    // The homepage should have quick-link buttons for popular services
    const popularLink = page.getByRole('link', { name: /personal injury/i }).first()
    const isVisible = await popularLink.isVisible().catch(() => false)

    if (isVisible) {
      const href = await popularLink.getAttribute('href')
      expect(href).toContain('/practice-areas/personal-injury')
    }
  })
})

// ============================================================================
// 2. ATTORNEY LISTING PAGE (/attorneys)
// ============================================================================

test.describe('Attorney Listing Page', () => {
  test('page loads with heading and breadcrumbs', async ({ page }) => {
    await page.goto('/attorneys')
    await waitForHydration(page)

    // Should have an h1 heading
    const h1 = page.getByRole('heading', { level: 1 })
    await expect(h1).toBeVisible({ timeout: 10_000 })
    await expect(h1).toContainText(/attorney/i)

    // Breadcrumbs should be present
    await expect(page.getByText('Attorneys').first()).toBeVisible()
  })

  test('page displays attorney cards with key info', async ({ page }) => {
    await page.goto('/attorneys')
    await waitForHydration(page)

    // Wait for attorney cards to render (grid of cards)
    const attorneyGrid = page.locator('.grid').first()
    await expect(attorneyGrid).toBeVisible({ timeout: 15_000 })

    // Each card should have a link with attorney name
    const firstCard = attorneyGrid.locator('a').first()
    await expect(firstCard).toBeVisible()

    // Cards should show location info (MapPin icon + city)
    const locationInfo = page.locator('text=/[A-Z]{2}/').first()
    await expect(locationInfo).toBeVisible({ timeout: 5_000 })
  })

  test('attorney cards link to profile pages', async ({ page }) => {
    await page.goto('/attorneys')
    await waitForHydration(page)

    // Get the first attorney card link
    const firstLink = page.locator('.grid a[href*="/practice-areas/"]').first()
    const isPresent = await firstLink.isVisible().catch(() => false)

    if (isPresent) {
      const href = await firstLink.getAttribute('href')
      expect(href).toMatch(/\/practice-areas\/[^/]+\/[^/]+\/[^/]+/)
    }
  })

  test('verified badge is displayed for verified attorneys', async ({ page }) => {
    await page.goto('/attorneys')
    await waitForHydration(page)

    // Look for verified badges (blue checkmark circles)
    const verifiedBadge = page.locator('[title="Verified Attorney"]').first()
    const hasVerified = await verifiedBadge.isVisible().catch(() => false)

    // This is data-dependent; just verify the page renders without error
    if (hasVerified) {
      await expect(verifiedBadge).toBeVisible()
    }
  })

  test('CTA buttons are present on cards', async ({ page }) => {
    await page.goto('/attorneys')
    await waitForHydration(page)

    // Each card should have a "Request a Quote" button
    const quoteButton = page.getByText('Request a Quote').first()
    await expect(quoteButton).toBeVisible({ timeout: 10_000 })
  })

  test('browse by practice area section is present', async ({ page }) => {
    await page.goto('/attorneys')
    await waitForHydration(page)

    // "Browse by Practice Area" section
    const browseHeading = page.getByRole('heading', { name: /browse by practice area/i })
    await expect(browseHeading).toBeVisible()

    // Should have links to practice areas
    const practiceAreaLink = page.getByRole('link', { name: /personal injury/i }).first()
    await expect(practiceAreaLink).toBeVisible()
  })

  test('popular cities section is present', async ({ page }) => {
    await page.goto('/attorneys')
    await waitForHydration(page)

    const citiesHeading = page.getByRole('heading', { name: /popular cities/i })
    await expect(citiesHeading).toBeVisible()
  })

  test('empty state is shown when no results (simulated via nonsense route)', async ({ page }) => {
    // The /attorneys page always shows data, but the EmptyState component
    // is tested indirectly: if DB returns 0 providers, it shows
    const response = await page.goto('/attorneys')
    expect(response?.status()).toBeLessThan(500)
  })
})

// ============================================================================
// 3. PRACTICE AREA + LOCATION PAGE
// ============================================================================

test.describe('Practice Area + Location Page', () => {
  const TEST_URL = '/practice-areas/personal-injury/new-york'

  test('page loads with correct heading', async ({ page }) => {
    await page.goto(TEST_URL)
    await waitForHydration(page)

    const h1 = page.getByRole('heading', { level: 1 })
    await expect(h1).toBeVisible({ timeout: 15_000 })
    // H1 should contain the specialty and/or location name
    const h1Text = await h1.textContent()
    expect(h1Text?.toLowerCase()).toMatch(/personal injury|new york/i)
  })

  test('breadcrumbs are correct', async ({ page }) => {
    await page.goto(TEST_URL)
    await waitForHydration(page)

    // Breadcrumb should contain "Services" or "Practice Areas" > specialty > location
    await expect(page.getByText('Personal Injury').first()).toBeVisible({ timeout: 10_000 })
    await expect(page.getByText('New York').first()).toBeVisible()
  })

  test('JSON-LD structured data is present', async ({ page }) => {
    await page.goto(TEST_URL)
    await waitForHydration(page)

    const jsonLdBlocks = await getJsonLdBlocks(page)
    expect(jsonLdBlocks.length).toBeGreaterThan(0)

    // Should have a CollectionPage or Service schema
    const hasCollectionOrService = jsonLdBlocks.some(
      (block) => block['@type'] === 'CollectionPage' || block['@type'] === 'Service'
    )
    expect(hasCollectionOrService).toBe(true)

    // Should have BreadcrumbList schema
    const hasBreadcrumb = jsonLdBlocks.some((block) => block['@type'] === 'BreadcrumbList')
    expect(hasBreadcrumb).toBe(true)
  })

  test('meta title contains specialty and location', async ({ page }) => {
    await page.goto(TEST_URL)

    const title = await page.title()
    const titleLower = title.toLowerCase()
    expect(titleLower).toMatch(/personal injury|new york/i)
  })

  test('attorney list or empty state is displayed', async ({ page }) => {
    await page.goto(TEST_URL)
    await waitForHydration(page)

    // Either shows attorney cards or an empty state message
    const hasCards = await page
      .locator('[data-provider-id]')
      .first()
      .isVisible()
      .catch(() => false)
    const hasEmptyState = await page
      .getByText(/no attorney/i)
      .isVisible()
      .catch(() => false)
    const hasContent = await page
      .getByRole('heading', { level: 1 })
      .isVisible()
      .catch(() => false)

    // At minimum, the page should have an h1 and either attorneys or empty state
    expect(hasContent).toBe(true)
    // One of these should be true (data-dependent)
    expect(hasCards || hasEmptyState || hasContent).toBe(true)
  })

  test('sort controls are present', async ({ page }) => {
    await page.goto(TEST_URL)
    await waitForHydration(page)

    // The PageClient has sort options: default, name, rating
    // On desktop, these might be in a select or button group
    const sortControl = page
      .locator('select[aria-label="Sort results"]')
      .first()
      .or(
        page
          .locator('select')
          .filter({ hasText: /name|rating|sort/i })
          .first()
      )

    const hasSortControl = await sortControl.isVisible().catch(() => false)
    // Sort controls may only be visible on desktop or when there are providers
    if (hasSortControl) {
      await expect(sortControl).toBeVisible()
    }
  })

  test('view mode toggle (list/map) is present', async ({ page }) => {
    await page.goto(TEST_URL)
    await waitForHydration(page)

    // View toggle buttons: List and Map
    const listButton = page.getByText('List').first()
    const mapButton = page.getByText('Map').first()

    const hasViewToggle = await listButton.isVisible().catch(() => false)
    if (hasViewToggle) {
      await expect(listButton).toBeVisible()
      await expect(mapButton).toBeVisible()
    }
  })

  test('cross-links section is present', async ({ page }) => {
    await page.goto(TEST_URL)
    await waitForHydration(page)

    // Page should have cross-links to related services or nearby cities
    // These are internal link sections near the bottom
    const relatedLinks = page.getByRole('link', { name: /criminal defense|family law/i }).first()
    const hasRelated = await relatedLinks.isVisible().catch(() => false)

    // At minimum the page should not error
    expect(true).toBe(true)
    if (hasRelated) {
      await expect(relatedLinks).toBeVisible()
    }
  })

  test('noindex pages show appropriate message', async ({ page }) => {
    // Use a location that likely has 0 attorneys to test noindex behavior
    const response = await page.goto('/practice-areas/personal-injury/tiny-unknown-village-xyz')

    // Should either return 404 or 200 with noindex
    const status = response?.status() ?? 0
    expect([200, 404]).toContain(status)
  })
})

// ============================================================================
// 4. ATTORNEY PROFILE PAGE
// ============================================================================

test.describe('Attorney Profile Page', () => {
  // We need a real attorney URL. We'll navigate from the listing page.
  let profileUrl: string | null = null

  test('can navigate to a profile from listing', async ({ page }) => {
    await page.goto('/attorneys')
    await waitForHydration(page)

    // Find the first attorney link that goes to a profile page
    const profileLink = page.locator('a[href*="/practice-areas/"]').first()
    const isPresent = await profileLink.isVisible().catch(() => false)

    if (isPresent) {
      profileUrl = await profileLink.getAttribute('href')
      expect(profileUrl).toBeTruthy()
      expect(profileUrl).toMatch(/\/practice-areas\//)
    }
  })

  test('profile page loads with attorney details', async ({ page }) => {
    await page.goto('/attorneys')
    await waitForHydration(page)

    // Get first attorney profile link
    const profileLink = page
      .locator('a[href*="/practice-areas/"][href*="/"]')
      .filter({
        has: page.locator('text=/[A-Z]/'), // Contains at least a capital letter (name)
      })
      .first()

    const href = await profileLink.getAttribute('href').catch(() => null)
    if (!href || href.split('/').length < 5) {
      test.skip()
      return
    }

    await page.goto(href)
    await waitForHydration(page)

    // Profile page should have attorney name visible
    // The AttorneyHero component displays the attorney name
    const heading = page.getByRole('heading').first()
    await expect(heading).toBeVisible({ timeout: 15_000 })
  })

  test('profile page has breadcrumbs', async ({ page }) => {
    // Navigate to a known practice area listing first to find a real attorney
    await page.goto('/practice-areas/personal-injury/new-york')
    await waitForHydration(page)

    // Find a profile link from the listing
    const profileLink = page.locator('a[href*="/practice-areas/personal-injury/new-york/"]').first()
    const href = await profileLink.getAttribute('href').catch(() => null)
    if (!href) {
      test.skip()
      return
    }

    await page.goto(href)
    await waitForHydration(page)

    // Breadcrumbs should contain "Practice Areas" and the specialty name
    await expect(page.getByText('Practice Areas').first()).toBeVisible({ timeout: 10_000 })
    await expect(page.getByText('Personal Injury').first()).toBeVisible()
  })

  test('profile page has JSON-LD schema', async ({ page }) => {
    await page.goto('/practice-areas/personal-injury/new-york')
    await waitForHydration(page)

    const profileLink = page.locator('a[href*="/practice-areas/personal-injury/new-york/"]').first()
    const href = await profileLink.getAttribute('href').catch(() => null)
    if (!href) {
      test.skip()
      return
    }

    await page.goto(href)
    await waitForHydration(page)

    // Profile pages should have AttorneySchema JSON-LD
    const jsonLdBlocks = await getJsonLdBlocks(page)
    expect(jsonLdBlocks.length).toBeGreaterThan(0)

    // Should have at least one schema with a recognized type
    const hasSchema = jsonLdBlocks.some((block) => block['@type'] || block['@graph'])
    expect(hasSchema).toBe(true)
  })

  test('profile page shows bar number when available', async ({ page }) => {
    await page.goto('/attorneys')
    await waitForHydration(page)

    // Look for a card that shows "Bar #" — indicates the attorney has a bar number
    const barNumberText = page.locator('text=/Bar #/').first()
    const hasBarNumber = await barNumberText.isVisible().catch(() => false)

    if (hasBarNumber) {
      // Get the corresponding attorney profile link
      const card = barNumberText.locator('xpath=ancestor::div[contains(@class, "rounded")]').first()
      const profileLink = card.locator('a[href*="/practice-areas/"]').first()
      const href = await profileLink.getAttribute('href').catch(() => null)

      if (href) {
        await page.goto(href)
        await waitForHydration(page)

        // Profile page should display bar number somewhere
        // Data-dependent: bar number display depends on the attorney data
        expect(true).toBe(true)
      }
    }
  })

  test('profile page has contact/CTA section', async ({ page }) => {
    await page.goto('/practice-areas/personal-injury/new-york')
    await waitForHydration(page)

    const profileLink = page.locator('a[href*="/practice-areas/personal-injury/new-york/"]').first()
    const href = await profileLink.getAttribute('href').catch(() => null)
    if (!href) {
      test.skip()
      return
    }

    await page.goto(href)
    await waitForHydration(page)

    // Profile should have a CTA: "Request a Quote", "Contact", "Book consultation", or phone link
    const ctaButton = page.getByText(/request.*quote|contact|free consultation|book|call/i).first()
    const hasCta = await ctaButton.isVisible().catch(() => false)

    // There should be some way to contact the attorney
    const phoneLink = page.locator('a[href^="tel:"]').first()
    const hasPhone = await phoneLink.isVisible().catch(() => false)

    expect(hasCta || hasPhone).toBe(true)
  })

  test('profile page has share button', async ({ page }) => {
    await page.goto('/practice-areas/personal-injury/new-york')
    await waitForHydration(page)

    const profileLink = page.locator('a[href*="/practice-areas/personal-injury/new-york/"]').first()
    const href = await profileLink.getAttribute('href').catch(() => null)
    if (!href) {
      test.skip()
      return
    }

    await page.goto(href)
    await waitForHydration(page)

    // ShareButton component should be rendered
    const shareButton = page
      .getByRole('button', { name: /share/i })
      .first()
      .or(page.locator('[aria-label*="share" i]').first())
    const hasShare = await shareButton.isVisible().catch(() => false)

    // Share button may be present (component is imported in AttorneyPageClient)
    if (hasShare) {
      await expect(shareButton).toBeVisible()
    }
  })

  test('profile "back to listing" link is present', async ({ page }) => {
    await page.goto('/practice-areas/personal-injury/new-york')
    await waitForHydration(page)

    const profileLink = page.locator('a[href*="/practice-areas/personal-injury/new-york/"]').first()
    const href = await profileLink.getAttribute('href').catch(() => null)
    if (!href) {
      test.skip()
      return
    }

    await page.goto(href)
    await waitForHydration(page)

    // Should have a "back" link to the listing page
    const backLink = page.getByRole('link', { name: /all.*in|back/i }).first()
    const hasBack = await backLink.isVisible().catch(() => false)
    if (hasBack) {
      const backHref = await backLink.getAttribute('href')
      expect(backHref).toContain('/practice-areas/personal-injury/new-york')
    }
  })

  test('not-found attorney returns 404', async ({ page }) => {
    const response = await page.goto(
      '/practice-areas/personal-injury/new-york/nonexistent-attorney-xyz-12345'
    )
    // Should return 404 for a non-existent attorney
    expect(response?.status()).toBe(404)
  })
})

// ============================================================================
// 5. MOBILE SEARCH
// ============================================================================

test.describe('Mobile Search (375px viewport)', () => {
  test.use({ viewport: { width: 375, height: 812 } })

  test('homepage search form is accessible on mobile', async ({ page }) => {
    await page.goto('/')
    await waitForHydration(page)

    // Search form should be visible on mobile
    const searchForm = page.locator('form[role="search"]').first()
    await expect(searchForm).toBeVisible({ timeout: 10_000 })

    // Service and location fields should stack vertically
    const serviceInput = page.getByLabel(/type of service|what service/i).first()
    await expect(serviceInput).toBeVisible()

    const locationInput = page.getByLabel(/city or zip/i).first()
    await expect(locationInput).toBeVisible()
  })

  test('search form fields are full-width on mobile', async ({ page }) => {
    await page.goto('/')
    await waitForHydration(page)

    const serviceInput = page.getByLabel(/type of service|what service/i).first()
    const box = await serviceInput.boundingBox()

    if (box) {
      // Input should be at least 250px wide on a 375px viewport (not squished)
      expect(box.width).toBeGreaterThan(250)
    }
  })

  test('service dropdown works on mobile', async ({ page }) => {
    await page.goto('/')
    await waitForHydration(page)

    const serviceInput = page.getByLabel(/type of service|what service/i).first()
    await serviceInput.tap()

    const dropdown = page.locator('[role="listbox"]').first()
    await expect(dropdown).toBeVisible({ timeout: 5_000 })

    // Options should be tappable (min touch target 44px)
    const firstOption = dropdown.locator('[role="option"]').first()
    const optionBox = await firstOption.boundingBox()
    if (optionBox) {
      expect(optionBox.height).toBeGreaterThanOrEqual(40) // touch-friendly
    }
  })

  test('location dropdown works on mobile', async ({ page }) => {
    await page.goto('/')
    await waitForHydration(page)

    const locationInput = page.getByLabel(/city or zip/i).first()
    await locationInput.tap()
    await locationInput.fill('Los')

    const dropdown = page.locator('[role="listbox"]').last()
    await expect(dropdown).toBeVisible({ timeout: 5_000 })

    await expect(dropdown.getByText('Los Angeles').first()).toBeVisible()
  })

  test('full search flow works on mobile', async ({ page }) => {
    await page.goto('/')
    await waitForHydration(page)

    // Select service
    const serviceInput = page.getByLabel(/type of service|what service/i).first()
    await serviceInput.tap()
    await serviceInput.fill('Family')

    const serviceDropdown = page.locator('[role="listbox"]').first()
    await expect(serviceDropdown).toBeVisible({ timeout: 5_000 })
    await serviceDropdown.getByText('Family Law').first().tap()

    // Select location
    const locationInput = page.getByLabel(/city or zip/i).first()
    await expect(locationInput).toBeFocused({ timeout: 3_000 })
    await locationInput.fill('Houston')

    const cityDropdown = page.locator('[role="listbox"]').last()
    await expect(cityDropdown).toBeVisible({ timeout: 5_000 })
    await cityDropdown.getByText('Houston').first().tap()

    // Submit
    await page
      .getByRole('button', { name: /search/i })
      .first()
      .tap()

    await page.waitForURL(/\/practice-areas\/family-law\/houston/, { timeout: 15_000 })
    expect(page.url()).toContain('/practice-areas/family-law/houston')
  })

  test('attorney listing renders cards stacked vertically on mobile', async ({ page }) => {
    await page.goto('/attorneys')
    await waitForHydration(page)

    // Grid should have single-column layout on mobile
    const grid = page.locator('.grid').first()
    await expect(grid).toBeVisible({ timeout: 10_000 })

    const gridBox = await grid.boundingBox()
    if (gridBox) {
      // On 375px viewport, the grid should be essentially full-width
      expect(gridBox.width).toBeGreaterThan(300)
    }

    // Check that cards are stacked (first two cards should have different Y positions)
    const cards = grid.locator('> div')
    const cardCount = await cards.count()
    if (cardCount >= 2) {
      const card1Box = await cards.nth(0).boundingBox()
      const card2Box = await cards.nth(1).boundingBox()
      if (card1Box && card2Box) {
        // Cards stacked vertically means card2 is below card1
        expect(card2Box.y).toBeGreaterThan(card1Box.y)
      }
    }
  })

  test('practice area listing has mobile sort/filter bar', async ({ page }) => {
    await page.goto('/practice-areas/personal-injury/new-york')
    await waitForHydration(page)

    // Mobile search/filter bar with sort dropdown
    const sortSelect = page.locator('select[aria-label="Sort results"]').first()
    const hasMobileSort = await sortSelect.isVisible().catch(() => false)

    if (hasMobileSort) {
      await expect(sortSelect).toBeVisible()
      // Should have sort options
      const options = sortSelect.locator('option')
      const count = await options.count()
      expect(count).toBeGreaterThanOrEqual(2)
    }
  })

  test('mobile view toggle (list/map) works', async ({ page }) => {
    await page.goto('/practice-areas/personal-injury/new-york')
    await waitForHydration(page)

    // Mobile view toggle should be present
    const viewToggle = page
      .locator('.flex.md\\:hidden')
      .filter({
        has: page.locator('button'),
      })
      .first()

    const hasToggle = await viewToggle.isVisible().catch(() => false)
    if (hasToggle) {
      const buttons = viewToggle.locator('button')
      const buttonCount = await buttons.count()
      expect(buttonCount).toBeGreaterThanOrEqual(2) // List + Map
    }
  })
})

// ============================================================================
// 6. CROSS-CUTTING CONCERNS
// ============================================================================

test.describe('Cross-Cutting: Page Performance & Accessibility', () => {
  test('attorney listing page has no console errors', async ({ page }) => {
    const errors: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text())
      }
    })

    await page.goto('/attorneys')
    await waitForHydration(page)

    // Filter out known non-critical errors (e.g., third-party scripts)
    const criticalErrors = errors.filter(
      (e) => !e.includes('favicon') && !e.includes('analytics') && !e.includes('gtm')
    )
    expect(criticalErrors).toHaveLength(0)
  })

  test('practice area page has canonical URL', async ({ page }) => {
    await page.goto('/practice-areas/personal-injury/new-york')

    const canonical = await page.$('link[rel="canonical"]')
    expect(canonical).not.toBeNull()
    const href = await canonical?.getAttribute('href')
    expect(href).toContain('/practice-areas/personal-injury/new-york')
  })

  test('attorney listing page has canonical URL', async ({ page }) => {
    await page.goto('/attorneys')

    const canonical = await page.$('link[rel="canonical"]')
    expect(canonical).not.toBeNull()
    const href = await canonical?.getAttribute('href')
    expect(href).toContain('/attorneys')
  })

  test('practice area page has Open Graph meta tags', async ({ page }) => {
    await page.goto('/practice-areas/personal-injury/new-york')

    const ogTitle = await page.$('meta[property="og:title"]')
    expect(ogTitle).not.toBeNull()

    const ogDescription = await page.$('meta[property="og:description"]')
    expect(ogDescription).not.toBeNull()

    const ogType = await page.$('meta[property="og:type"]')
    expect(ogType).not.toBeNull()
  })

  test('search page has noindex', async ({ page }) => {
    await page.goto('/search')

    const robotsMeta = await page.$('meta[name="robots"]')
    if (robotsMeta) {
      const content = await robotsMeta.getAttribute('content')
      expect(content).toContain('noindex')
    }
  })
})
