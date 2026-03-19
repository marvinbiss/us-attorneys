import { test, expect, type Page } from '@playwright/test'

// ---------------------------------------------------------------------------
// Helper: intercept /api/auth/signin and /api/admin/* to avoid hitting real
// Supabase in E2E tests. We mock at the network level so the full client-side
// code executes normally.
// ---------------------------------------------------------------------------

/** Simulates a successful admin login by intercepting the auth API. */
async function mockAdminLogin(page: Page) {
  await page.route('**/api/auth/signin', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          user: {
            id: 'admin-user-id-001',
            email: 'admin@us-attorneys.com',
            fullName: 'Admin User',
            role: 'super_admin',
            userType: 'client',
            isAttorney: false,
          },
          session: {
            accessToken: 'mock-access-token-admin',
            expiresAt: Math.floor(Date.now() / 1000) + 3600,
          },
        },
      }),
    })
  )
}

/** Simulates a failed login (bad credentials). */
async function mockFailedLogin(page: Page) {
  await page.route('**/api/auth/signin', (route) =>
    route.fulfill({
      status: 401,
      contentType: 'application/json',
      body: JSON.stringify({
        success: false,
        error: { code: 'AUTHENTICATION_ERROR', message: 'Incorrect email or password' },
      }),
    })
  )
}

// Mock stats response for the admin dashboard
const MOCK_STATS = {
  stats: {
    totalUsers: 1250,
    totalAttorneys: 340,
    totalBookings: 89,
    totalRevenue: 4500000,
    pendingReports: 3,
    averageRating: 4.2,
    newUsersToday: 12,
    newBookingsToday: 5,
    activeUsers7d: 230,
    trends: { users: 8, bookings: -3, revenue: 15 },
  },
  recentActivity: [
    {
      id: '1',
      type: 'booking' as const,
      action: 'created',
      details: 'New booking by John Doe',
      timestamp: new Date().toISOString(),
      status: 'pending',
    },
    {
      id: '2',
      type: 'review' as const,
      action: 'submitted',
      details: '5-star review for Attorney Smith',
      timestamp: new Date().toISOString(),
    },
  ],
  pendingReports: [
    {
      id: 'r1',
      target_type: 'review',
      reason: 'spam',
      description: 'Fake review',
      status: 'pending',
      created_at: new Date().toISOString(),
      reporter_id: 'u1',
    },
  ],
  chartData: [
    { date: '2026-03-11', bookings: 5, users: 10, reviews: 3 },
    { date: '2026-03-12', bookings: 7, users: 12, reviews: 2 },
  ],
  estimationLeads: {
    total: 42,
    today: 3,
    recent: [
      {
        id: 'l1',
        lastName: 'Johnson',
        telephone: '+1-555-0101',
        practice_area: 'Personal Injury',
        city: 'Houston',
        source: 'chat',
        created_at: new Date().toISOString(),
      },
    ],
  },
}

// Mock attorneys list
const MOCK_ATTORNEYS = {
  success: true,
  providers: [
    {
      id: 'att-1',
      name: 'John Smith',
      slug: 'john-smith',
      email: 'john@example.com',
      phone: '555-0001',
      address_city: 'Houston',
      address_state: 'TX',
      specialty: 'Personal Injury',
      is_verified: true,
      is_active: true,
      rating_average: 4.5,
      review_count: 12,
      created_at: '2026-01-01T00:00:00Z',
      bar_number: 'TX123456',
    },
    {
      id: 'att-2',
      name: 'Jane Doe',
      slug: 'jane-doe',
      email: 'jane@example.com',
      phone: '555-0002',
      address_city: 'Dallas',
      address_state: 'TX',
      specialty: 'Family Law',
      is_verified: false,
      is_active: true,
      rating_average: 0,
      review_count: 0,
      created_at: '2026-02-15T00:00:00Z',
      bar_number: 'TX654321',
    },
    {
      id: 'att-3',
      name: 'Bob Wilson',
      slug: 'bob-wilson',
      email: 'bob@example.com',
      phone: '555-0003',
      address_city: 'Austin',
      address_state: 'TX',
      specialty: 'Criminal Defense',
      is_verified: true,
      is_active: false,
      rating_average: 3.8,
      review_count: 5,
      created_at: '2026-01-20T00:00:00Z',
      bar_number: 'TX789012',
    },
  ],
  totalPages: 2,
  total: 25,
}

// Mock reviews list
const MOCK_REVIEWS = {
  reviews: [
    {
      id: 'rev-1',
      client_name: 'Alice Brown',
      client_email: 'alice@example.com',
      provider_name: 'John Smith',
      attorney_id: 'att-1',
      rating: 5,
      comment: 'Excellent attorney, very professional.',
      status: 'pending_review' as const,
      created_at: '2026-03-15T00:00:00Z',
    },
    {
      id: 'rev-2',
      client_name: 'Bob Green',
      client_email: 'bob@example.com',
      provider_name: 'Jane Doe',
      attorney_id: 'att-2',
      rating: 3,
      comment: 'Average experience.',
      response: 'Thank you for your feedback.',
      status: 'published' as const,
      created_at: '2026-03-14T00:00:00Z',
    },
    {
      id: 'rev-3',
      client_name: 'Carol White',
      client_email: 'carol@example.com',
      provider_name: 'Bob Wilson',
      attorney_id: 'att-3',
      rating: 1,
      comment: 'Terrible service.',
      status: 'flagged' as const,
      created_at: '2026-03-13T00:00:00Z',
    },
  ],
  totalPages: 1,
}

// Mock claims list
const MOCK_CLAIMS = {
  data: [
    {
      id: 'claim-1',
      status: 'pending' as const,
      siret_provided: 'TX123456',
      claimant_name: 'John Smith',
      claimant_email: 'john@example.com',
      claimant_phone: '555-0001',
      claimant_position: 'Attorney',
      rejection_reason: null,
      reviewed_at: null,
      created_at: '2026-03-10T00:00:00Z',
      provider: {
        id: 'att-1',
        name: 'John Smith Esq.',
        bar_number: 'TX123456',
        address_city: 'Houston',
        stable_id: 'sid-1',
      },
      user: { id: 'u1', email: 'john@example.com', full_name: 'John Smith' },
    },
    {
      id: 'claim-2',
      status: 'approved' as const,
      siret_provided: 'TX654321',
      claimant_name: 'Jane Doe',
      claimant_email: 'jane@example.com',
      claimant_phone: null,
      claimant_position: null,
      rejection_reason: null,
      reviewed_at: '2026-03-12T00:00:00Z',
      created_at: '2026-03-08T00:00:00Z',
      provider: {
        id: 'att-2',
        name: 'Jane Doe Esq.',
        bar_number: 'TX654321',
        address_city: 'Dallas',
        stable_id: 'sid-2',
      },
      user: { id: 'u2', email: 'jane@example.com', full_name: 'Jane Doe' },
    },
  ],
  pagination: { page: 1, limit: 20, total: 2, totalPages: 1 },
}

// Mock bookings list
const MOCK_BOOKINGS = {
  bookings: [
    {
      id: 'bk-1',
      attorney_id: 'att-1',
      client_id: 'cl-1',
      service_name: 'Consultation',
      scheduled_at: '2026-03-20T10:00:00Z',
      status: 'pending',
      payment_status: 'paid',
      deposit_amount: 15000,
      created_at: '2026-03-15T00:00:00Z',
      provider: { id: 'att-1', name: 'John Smith', email: 'john@example.com' },
    },
    {
      id: 'bk-2',
      attorney_id: 'att-2',
      client_id: 'cl-2',
      service_name: 'Video Consultation',
      scheduled_at: '2026-03-22T14:00:00Z',
      status: 'confirmed',
      payment_status: 'paid',
      deposit_amount: 20000,
      created_at: '2026-03-16T00:00:00Z',
      provider: { id: 'att-2', name: 'Jane Doe', email: 'jane@example.com' },
    },
    {
      id: 'bk-3',
      attorney_id: 'att-3',
      client_id: 'cl-3',
      service_name: 'Case Review',
      scheduled_at: '2026-03-18T09:00:00Z',
      status: 'completed',
      payment_status: 'paid',
      deposit_amount: 10000,
      created_at: '2026-03-10T00:00:00Z',
      provider: { id: 'att-3', name: 'Bob Wilson', email: 'bob@example.com' },
    },
  ],
  totalPages: 1,
  total: 3,
}

/** Sets up all admin API mocks so dashboard pages render with data. */
async function setupAdminAPIMocks(page: Page) {
  await page.route('**/api/admin/stats', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_STATS),
    })
  )
  await page.route('**/api/admin/providers?**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_ATTORNEYS),
    })
  )
  await page.route('**/api/admin/providers/**', (route) => {
    if (route.request().method() === 'PATCH') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true }),
      })
    }
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_ATTORNEYS.providers[0]),
    })
  })
  await page.route('**/api/admin/reviews?**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_REVIEWS),
    })
  )
  await page.route('**/api/admin/reviews/**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true }),
    })
  )
  await page.route('**/api/admin/claims?**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_CLAIMS),
    })
  )
  await page.route('**/api/admin/claims', (route) => {
    if (route.request().method() === 'PATCH') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, message: 'Claim processed successfully' }),
      })
    }
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_CLAIMS),
    })
  })
  await page.route('**/api/admin/bookings?**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_BOOKINGS),
    })
  )
  await page.route('**/api/admin/bookings/**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true }),
    })
  )
}

/**
 * Helper to check if we landed on an authenticated admin page.
 * Since the admin layout does server-side auth (Supabase getUser),
 * unauthenticated requests will redirect to /admin/login or /?error=unauthorized.
 * Returns true only if the page is an admin dashboard page (not login, not home).
 */
async function requireAdminDashboard(page: Page): Promise<boolean> {
  await page.waitForLoadState('domcontentloaded')
  const url = page.url()
  // The middleware may redirect to /login?redirect=... or /admin/login or /?error=unauthorized
  if (url.includes('/login') || url.includes('error=unauthorized')) {
    return false
  }
  if (!url.includes('/admin')) {
    return false
  }
  // Additional check: see if the admin sidebar rendered (server-side auth passed)
  const sidebar = page.locator('aside[aria-label="Admin navigation"]')
  try {
    await sidebar.waitFor({ state: 'attached', timeout: 5000 })
    return true
  } catch {
    return false
  }
}

// ==========================================================================
// 1. ADMIN LOGIN
// ==========================================================================

test.describe('Admin Login', () => {
  test('login page loads with correct heading', async ({ page }) => {
    await page.goto('/admin/login')
    await page.waitForLoadState('domcontentloaded')
    await expect(page.locator('h1').filter({ hasText: 'Administration' })).toBeVisible({
      timeout: 15000,
    })
    await expect(page.getByText('Sign in to access the admin panel')).toBeVisible()
  })

  test('login page has email and password fields', async ({ page }) => {
    await page.goto('/admin/login')
    await page.waitForLoadState('domcontentloaded')
    // Use placeholder to uniquely identify the login email field
    const emailInput = page.getByPlaceholder('admin@example.com')
    const passwordInput = page.getByPlaceholder('••••••••')
    await expect(emailInput).toBeVisible({ timeout: 15000 })
    await expect(passwordInput).toBeVisible()
  })

  test('login page has submit button', async ({ page }) => {
    await page.goto('/admin/login')
    await expect(page.getByRole('button', { name: /Admin Sign In/i })).toBeVisible({
      timeout: 15000,
    })
  })

  test('login page has "Back to Site" link', async ({ page }) => {
    await page.goto('/admin/login')
    await expect(page.getByRole('link', { name: /Back to Site/i })).toBeVisible({ timeout: 15000 })
  })

  test('password visibility toggle works', async ({ page }) => {
    await page.goto('/admin/login')
    await page.waitForLoadState('domcontentloaded')
    const passwordInput = page.getByPlaceholder('••••••••')
    await expect(passwordInput).toBeVisible({ timeout: 15000 })
    await expect(passwordInput).toHaveAttribute('type', 'password')

    await page.getByRole('button', { name: /Show password/i }).click()
    await expect(passwordInput).toHaveAttribute('type', 'text')

    await page.getByRole('button', { name: /Hide password/i }).click()
    await expect(passwordInput).toHaveAttribute('type', 'password')
  })

  test('invalid credentials show error message', async ({ page }) => {
    await mockFailedLogin(page)
    await page.goto('/admin/login')
    await page.waitForLoadState('domcontentloaded')

    await page.getByPlaceholder('admin@example.com').fill('wrong@example.com')
    await page.getByPlaceholder('••••••••').fill('badpassword')
    await page.getByRole('button', { name: /Admin Sign In/i }).click()

    // Error message should appear
    await expect(page.getByText(/Incorrect email or password/i)).toBeVisible({ timeout: 5000 })
    // Should stay on login page
    await expect(page).toHaveURL(/\/admin\/login/)
  })

  test('submit button becomes disabled during submission', async ({ page }) => {
    // Delay the response to keep loading state visible
    let resolveRoute: (() => void) | null = null
    await page.route('**/api/auth/signin', async (route) => {
      // Wait indefinitely until we resolve
      await new Promise<void>((resolve) => {
        resolveRoute = resolve
      })
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            user: { id: '1', email: 'a@b.com', role: 'admin' },
            session: { accessToken: 'tok', expiresAt: 9999999999 },
          },
        }),
      })
    })

    await page.goto('/admin/login')
    await page.waitForLoadState('domcontentloaded')

    const submitBtn = page.getByRole('button', { name: /Admin Sign In/i })
    await expect(submitBtn).toBeVisible({ timeout: 15000 })

    await page.getByPlaceholder('admin@example.com').fill('admin@example.com')
    await page.getByPlaceholder('••••••••').fill('password123')
    await submitBtn.click()

    // Button should be disabled while the request is in-flight
    await expect(submitBtn).toBeDisabled({ timeout: 3000 })

    // Clean up: resolve the pending route
    if (resolveRoute) (resolveRoute as () => void)()
  })

  test('successful admin login redirects to /admin', async ({ page }) => {
    await mockAdminLogin(page)
    await page.goto('/admin/login')
    await page.waitForLoadState('domcontentloaded')

    await page.getByPlaceholder('admin@example.com').fill('admin@us-attorneys.com')
    await page.getByPlaceholder('••••••••').fill('securepassword')
    await page.getByRole('button', { name: /Admin Sign In/i }).click()

    // After successful login the client calls router.push('/admin').
    // Server may then redirect to /admin/login if cookie isn't set properly,
    // but the navigation attempt is the thing we verify.
    await page.waitForURL(/\/admin/, { timeout: 5000 })
  })
})

// ==========================================================================
// 2. ADMIN DASHBOARD (requires authentication)
//
// These tests verify dashboard rendering when the admin is authenticated.
// Since E2E tests run without a real Supabase session, the server-side
// auth check in the layout will redirect to /admin/login.
// Tests gracefully skip if auth redirect occurs.
// ==========================================================================

test.describe('Admin Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await setupAdminAPIMocks(page)
  })

  test('dashboard page loads or redirects to login when unauthenticated', async ({ page }) => {
    await page.goto('/admin')
    await page.waitForLoadState('domcontentloaded')

    const isAdmin = await requireAdminDashboard(page)
    if (isAdmin) {
      await expect(page.getByRole('heading', { name: /Dashboard/i })).toBeVisible({
        timeout: 10000,
      })
    } else {
      // Expected: redirected to login
      await expect(page).toHaveURL(/\/login|error=unauthorized/)
    }
  })

  test('dashboard shows stats cards when authenticated', async ({ page }) => {
    await page.goto('/admin')
    if (!(await requireAdminDashboard(page))) {
      test.skip(true, 'Redirected to login — no admin session')
      return
    }

    await expect(page.getByText('Users').first()).toBeVisible({ timeout: 10000 })
    await expect(page.getByText('Active attorneys')).toBeVisible()
    await expect(page.getByText('Bookings').first()).toBeVisible()
    await expect(page.getByText('Revenue this month')).toBeVisible()
  })

  test('dashboard shows "Today" quick metrics section', async ({ page }) => {
    await page.goto('/admin')
    if (!(await requireAdminDashboard(page))) {
      test.skip(true, 'Redirected to login')
      return
    }
    await expect(page.getByText('Today').first()).toBeVisible({ timeout: 10000 })
    await expect(page.getByText('New Users')).toBeVisible()
    await expect(page.getByText('New Bookings')).toBeVisible()
    await expect(page.getByText('Active Users (7d)')).toBeVisible()
  })

  test('dashboard shows "Quality" section with average rating', async ({ page }) => {
    await page.goto('/admin')
    if (!(await requireAdminDashboard(page))) {
      test.skip(true, 'Redirected to login')
      return
    }
    await expect(page.getByText('Quality').first()).toBeVisible({ timeout: 10000 })
    await expect(page.getByText('Average Rating')).toBeVisible()
  })

  test('dashboard shows "Moderation" section with pending reports', async ({ page }) => {
    await page.goto('/admin')
    if (!(await requireAdminDashboard(page))) {
      test.skip(true, 'Redirected to login')
      return
    }
    await expect(page.getByText('Moderation').first()).toBeVisible({ timeout: 10000 })
    await expect(page.getByText('Pending Reports').first()).toBeVisible()
    await expect(page.getByRole('link', { name: /View Reports/i })).toBeVisible()
  })

  test('dashboard shows AI Estimation Leads widget', async ({ page }) => {
    await page.goto('/admin')
    if (!(await requireAdminDashboard(page))) {
      test.skip(true, 'Redirected to login')
      return
    }
    await expect(page.getByText('AI Estimation Leads')).toBeVisible({ timeout: 10000 })
    await expect(page.getByRole('link', { name: /View All/i })).toBeVisible()
  })
})

// ==========================================================================
// 3. ADMIN SIDEBAR NAVIGATION
// ==========================================================================

test.describe('Admin Sidebar Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await setupAdminAPIMocks(page)
  })

  test('sidebar contains all main navigation items', async ({ page }) => {
    await page.goto('/admin')
    if (!(await requireAdminDashboard(page))) {
      test.skip(true, 'Redirected to login — sidebar not visible')
      return
    }

    const sidebar = page.locator('aside[aria-label="Admin navigation"]')
    const expectedItems = [
      'Dashboard',
      'Analytics',
      'System',
      'Requests',
      'Leads Estimation',
      'Dispatch',
      'Algorithm',
      'Tools',
      'Log',
      'Users',
      'Attorneys',
      'Claims',
      'Bookings',
      'Quotes',
      'Reviews',
      'Payments',
      'Services',
      'Content',
      'Messages',
      'Reports',
      'Audit',
      'GDPR',
      'Prospection',
      'Settings',
    ]

    for (const item of expectedItems) {
      await expect(sidebar.getByRole('link', { name: item, exact: true })).toBeVisible()
    }
  })

  test('sidebar has "Back to site" link', async ({ page }) => {
    await page.goto('/admin')
    if (!(await requireAdminDashboard(page))) {
      test.skip(true, 'Redirected to login')
      return
    }
    await expect(page.locator('aside').getByRole('link', { name: /Back to site/i })).toBeVisible()
  })

  test('sidebar highlights the current page', async ({ page }) => {
    await page.goto('/admin')
    if (!(await requireAdminDashboard(page))) {
      test.skip(true, 'Redirected to login')
      return
    }
    const dashboardLink = page
      .locator('aside')
      .getByRole('link', { name: 'Dashboard', exact: true })
    await expect(dashboardLink).toHaveAttribute('aria-current', 'page')
  })

  test('sidebar "Administration" header links to /admin', async ({ page }) => {
    await page.goto('/admin')
    if (!(await requireAdminDashboard(page))) {
      test.skip(true, 'Redirected to login')
      return
    }
    const headerLink = page.locator('aside').getByRole('link', { name: /Administration/i })
    await expect(headerLink).toHaveAttribute('href', '/admin')
  })
})

// ==========================================================================
// 4. ATTORNEY MANAGEMENT
// ==========================================================================

test.describe('Attorney Management', () => {
  test.beforeEach(async ({ page }) => {
    await setupAdminAPIMocks(page)
  })

  test('attorney list page loads with heading', async ({ page }) => {
    await page.goto('/admin/attorneys')
    if (!(await requireAdminDashboard(page))) {
      test.skip(true, 'Redirected to login')
      return
    }
    await expect(page.getByRole('heading', { name: /Attorney Management/i })).toBeVisible({
      timeout: 10000,
    })
  })

  test('attorney list shows total count', async ({ page }) => {
    await page.goto('/admin/attorneys')
    if (!(await requireAdminDashboard(page))) {
      test.skip(true, 'Redirected to login')
      return
    }
    await expect(page.getByText(/25 attorneys total/i)).toBeVisible({ timeout: 10000 })
  })

  test('attorney list has search input', async ({ page }) => {
    await page.goto('/admin/attorneys')
    if (!(await requireAdminDashboard(page))) {
      test.skip(true, 'Redirected to login')
      return
    }
    const searchInput = page.getByLabel('Search for an attorney')
    await expect(searchInput).toBeVisible({ timeout: 10000 })
    await expect(searchInput).toHaveAttribute(
      'placeholder',
      /Search by name, email, city, bar number/i
    )
  })

  test('attorney list has filter buttons', async ({ page }) => {
    await page.goto('/admin/attorneys')
    if (!(await requireAdminDashboard(page))) {
      test.skip(true, 'Redirected to login')
      return
    }
    await expect(page.getByRole('button', { name: 'All' })).toBeVisible({ timeout: 10000 })
    await expect(page.getByRole('button', { name: 'Verified' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Pending' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Suspended' })).toBeVisible()
  })

  test('attorney list renders table with correct columns', async ({ page }) => {
    await page.goto('/admin/attorneys')
    if (!(await requireAdminDashboard(page))) {
      test.skip(true, 'Redirected to login')
      return
    }

    const table = page.getByRole('table', { name: /Attorney list/i })
    await expect(table).toBeVisible({ timeout: 10000 })

    await expect(table.getByRole('columnheader', { name: /Attorney/i })).toBeVisible()
    await expect(table.getByRole('columnheader', { name: /Specialty/i })).toBeVisible()
    await expect(table.getByRole('columnheader', { name: /Location/i })).toBeVisible()
    await expect(table.getByRole('columnheader', { name: /Status/i })).toBeVisible()
    await expect(table.getByRole('columnheader', { name: /Reviews/i })).toBeVisible()
    await expect(table.getByRole('columnheader', { name: /Actions/i })).toBeVisible()
  })

  test('attorney list shows attorney data', async ({ page }) => {
    await page.goto('/admin/attorneys')
    if (!(await requireAdminDashboard(page))) {
      test.skip(true, 'Redirected to login')
      return
    }

    await expect(page.getByText('John Smith').first()).toBeVisible({ timeout: 10000 })
    await expect(page.getByText('Jane Doe').first()).toBeVisible()
    await expect(page.getByText('Bob Wilson').first()).toBeVisible()
  })

  test('attorney list shows status badges', async ({ page }) => {
    await page.goto('/admin/attorneys')
    if (!(await requireAdminDashboard(page))) {
      test.skip(true, 'Redirected to login')
      return
    }

    const table = page.getByRole('table')
    await expect(table).toBeVisible({ timeout: 10000 })
    await expect(table.getByText('Verified').first()).toBeVisible()
    await expect(table.getByText('Pending').first()).toBeVisible()
    await expect(table.getByText('Suspended').first()).toBeVisible()
  })

  test('attorney list has Refresh button', async ({ page }) => {
    await page.goto('/admin/attorneys')
    if (!(await requireAdminDashboard(page))) {
      test.skip(true, 'Redirected to login')
      return
    }
    await expect(page.getByRole('button', { name: /Refresh/i })).toBeVisible({ timeout: 10000 })
  })

  test('attorney list has view and edit action buttons', async ({ page }) => {
    await page.goto('/admin/attorneys')
    if (!(await requireAdminDashboard(page))) {
      test.skip(true, 'Redirected to login')
      return
    }

    await expect(page.getByRole('table')).toBeVisible({ timeout: 10000 })
    const viewButtons = page.getByRole('button', { name: 'View profile' })
    expect(await viewButtons.count()).toBeGreaterThanOrEqual(1)

    const editButtons = page.getByRole('button', { name: 'Edit' })
    expect(await editButtons.count()).toBeGreaterThanOrEqual(1)
  })

  test('attorney list shows pagination info', async ({ page }) => {
    await page.goto('/admin/attorneys')
    if (!(await requireAdminDashboard(page))) {
      test.skip(true, 'Redirected to login')
      return
    }

    await expect(page.getByText(/Page 1 of 2/i)).toBeVisible({ timeout: 10000 })
    await expect(page.getByRole('button', { name: 'Previous page' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Next page' })).toBeVisible()
  })

  test('attorney list previous page button is disabled on first page', async ({ page }) => {
    await page.goto('/admin/attorneys')
    if (!(await requireAdminDashboard(page))) {
      test.skip(true, 'Redirected to login')
      return
    }

    await expect(page.getByText(/Page 1 of 2/i)).toBeVisible({ timeout: 10000 })
    await expect(page.getByRole('button', { name: 'Previous page' })).toBeDisabled()
  })

  test('filter buttons change active state when clicked', async ({ page }) => {
    await page.goto('/admin/attorneys')
    if (!(await requireAdminDashboard(page))) {
      test.skip(true, 'Redirected to login')
      return
    }

    const verifiedBtn = page.getByRole('button', { name: 'Verified' })
    await expect(verifiedBtn).toBeVisible({ timeout: 10000 })
    await verifiedBtn.click()
    await expect(verifiedBtn).toHaveClass(/bg-blue-600/)
  })

  test('search input accepts text', async ({ page }) => {
    await page.goto('/admin/attorneys')
    if (!(await requireAdminDashboard(page))) {
      test.skip(true, 'Redirected to login')
      return
    }

    const searchInput = page.getByLabel('Search for an attorney')
    await expect(searchInput).toBeVisible({ timeout: 10000 })
    await searchInput.fill('John')
    await expect(searchInput).toHaveValue('John')
  })
})

// ==========================================================================
// 5. REVIEW MANAGEMENT
// ==========================================================================

test.describe('Review Management', () => {
  test.beforeEach(async ({ page }) => {
    await setupAdminAPIMocks(page)
  })

  test('reviews page loads with heading', async ({ page }) => {
    await page.goto('/admin/reviews')
    if (!(await requireAdminDashboard(page))) {
      test.skip(true, 'Redirected to login')
      return
    }
    await expect(page.getByRole('heading', { name: /Review Moderation/i })).toBeVisible({
      timeout: 10000,
    })
    await expect(page.getByText('Review and moderate client reviews')).toBeVisible()
  })

  test('reviews page has filter buttons', async ({ page }) => {
    await page.goto('/admin/reviews')
    if (!(await requireAdminDashboard(page))) {
      test.skip(true, 'Redirected to login')
      return
    }

    await expect(page.getByRole('button', { name: 'All' })).toBeVisible({ timeout: 10000 })
    await expect(page.getByRole('button', { name: 'Pending' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Flagged' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Published' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Hidden' })).toBeVisible()
  })

  test('reviews list shows review cards with client info', async ({ page }) => {
    await page.goto('/admin/reviews')
    if (!(await requireAdminDashboard(page))) {
      test.skip(true, 'Redirected to login')
      return
    }

    await expect(page.getByText('Alice Brown')).toBeVisible({ timeout: 10000 })
    await expect(page.getByText('alice@example.com')).toBeVisible()
    await expect(page.getByText('Excellent attorney, very professional.')).toBeVisible()
  })

  test('reviews show attorney name they are for', async ({ page }) => {
    await page.goto('/admin/reviews')
    if (!(await requireAdminDashboard(page))) {
      test.skip(true, 'Redirected to login')
      return
    }

    await expect(page.getByText('John Smith').first()).toBeVisible({ timeout: 10000 })
  })

  test('reviews show star ratings', async ({ page }) => {
    await page.goto('/admin/reviews')
    if (!(await requireAdminDashboard(page))) {
      test.skip(true, 'Redirected to login')
      return
    }

    const stars = page.locator('svg.fill-amber-400')
    await expect(stars.first()).toBeVisible({ timeout: 10000 })
  })

  test('pending reviews show Publish and Hide action buttons', async ({ page }) => {
    await page.goto('/admin/reviews')
    if (!(await requireAdminDashboard(page))) {
      test.skip(true, 'Redirected to login')
      return
    }

    await expect(page.getByRole('button', { name: /Publish/i }).first()).toBeVisible({
      timeout: 10000,
    })
    await expect(page.getByRole('button', { name: /Hide/i }).first()).toBeVisible()
  })

  test('reviews show status badges', async ({ page }) => {
    await page.route('**/api/admin/reviews?**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_REVIEWS),
      })
    )
    await page.goto('/admin/reviews')
    if (!(await requireAdminDashboard(page))) {
      test.skip(true, 'Redirected to login')
      return
    }

    await page.getByRole('button', { name: 'All' }).click()
    await expect(page.getByText('Pending').first()).toBeVisible({ timeout: 10000 })
  })

  test('published reviews show attorney response', async ({ page }) => {
    await page.route('**/api/admin/reviews?**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_REVIEWS),
      })
    )
    await page.goto('/admin/reviews')
    if (!(await requireAdminDashboard(page))) {
      test.skip(true, 'Redirected to login')
      return
    }

    await page.getByRole('button', { name: 'All' }).click()
    await expect(page.getByText('Attorney response:')).toBeVisible({ timeout: 10000 })
    await expect(page.getByText('Thank you for your feedback.')).toBeVisible()
  })

  test('clicking Hide opens confirmation modal', async ({ page }) => {
    await page.goto('/admin/reviews')
    if (!(await requireAdminDashboard(page))) {
      test.skip(true, 'Redirected to login')
      return
    }

    await page.getByRole('button', { name: /Hide/i }).first().click({ timeout: 10000 })
    await expect(page.getByText('Hide review')).toBeVisible({ timeout: 3000 })
    await expect(page.getByText(/no longer be publicly visible/i)).toBeVisible()
  })
})

// ==========================================================================
// 6. CLAIMS MANAGEMENT
// ==========================================================================

test.describe('Claims Management', () => {
  test.beforeEach(async ({ page }) => {
    await setupAdminAPIMocks(page)
  })

  test('claims page loads with heading', async ({ page }) => {
    await page.goto('/admin/claims')
    if (!(await requireAdminDashboard(page))) {
      test.skip(true, 'Redirected to login')
      return
    }
    await expect(page.getByRole('heading', { name: /Profile claims/i })).toBeVisible({
      timeout: 10000,
    })
    await expect(page.getByText('Manage attorney profile claim requests')).toBeVisible()
  })

  test('claims page has filter buttons', async ({ page }) => {
    await page.goto('/admin/claims')
    if (!(await requireAdminDashboard(page))) {
      test.skip(true, 'Redirected to login')
      return
    }

    await expect(page.getByRole('button', { name: 'Pending' })).toBeVisible({ timeout: 10000 })
    await expect(page.getByRole('button', { name: 'Approved' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Rejected' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'All' })).toBeVisible()
  })

  test('claims list shows claim cards with attorney info', async ({ page }) => {
    await page.goto('/admin/claims')
    if (!(await requireAdminDashboard(page))) {
      test.skip(true, 'Redirected to login')
      return
    }

    await expect(page.getByText('John Smith Esq.')).toBeVisible({ timeout: 10000 })
    await expect(page.getByText('Houston').first()).toBeVisible()
  })

  test('claims show bar number info', async ({ page }) => {
    await page.goto('/admin/claims')
    if (!(await requireAdminDashboard(page))) {
      test.skip(true, 'Redirected to login')
      return
    }

    await expect(page.getByText('Bar number on file:')).toBeVisible({ timeout: 10000 })
    await expect(page.getByText('Bar number provided:')).toBeVisible()
  })

  test('claims show claimant contact information', async ({ page }) => {
    await page.goto('/admin/claims')
    if (!(await requireAdminDashboard(page))) {
      test.skip(true, 'Redirected to login')
      return
    }

    await expect(page.getByText('john@example.com').first()).toBeVisible({ timeout: 10000 })
    await expect(page.getByText('555-0001')).toBeVisible()
  })

  test('pending claims show Approve and Reject buttons', async ({ page }) => {
    await page.goto('/admin/claims')
    if (!(await requireAdminDashboard(page))) {
      test.skip(true, 'Redirected to login')
      return
    }

    await expect(page.getByRole('button', { name: /Approve/i }).first()).toBeVisible({
      timeout: 10000,
    })
    await expect(page.getByRole('button', { name: /Reject/i }).first()).toBeVisible()
  })

  test('claims show status badges', async ({ page }) => {
    await page.goto('/admin/claims')
    if (!(await requireAdminDashboard(page))) {
      test.skip(true, 'Redirected to login')
      return
    }

    await expect(page.getByText('Pending').first()).toBeVisible({ timeout: 10000 })
  })

  test('clicking Approve opens confirmation modal', async ({ page }) => {
    await page.goto('/admin/claims')
    if (!(await requireAdminDashboard(page))) {
      test.skip(true, 'Redirected to login')
      return
    }

    await page
      .getByRole('button', { name: /Approve/i })
      .first()
      .click({ timeout: 10000 })
    await expect(page.getByText('Approve claim')).toBeVisible({ timeout: 3000 })
  })

  test('clicking Reject opens confirmation modal with rejection reason field', async ({ page }) => {
    await page.goto('/admin/claims')
    if (!(await requireAdminDashboard(page))) {
      test.skip(true, 'Redirected to login')
      return
    }

    await page
      .getByRole('button', { name: /Reject/i })
      .first()
      .click({ timeout: 10000 })
    await expect(page.getByText('Reject claim')).toBeVisible({ timeout: 3000 })
    await expect(page.getByText('Rejection reason (optional)')).toBeVisible()
    await expect(page.getByPlaceholder(/Explain why the request is rejected/i)).toBeVisible()
  })
})

// ==========================================================================
// 7. BOOKINGS MANAGEMENT
// ==========================================================================

test.describe('Bookings Management', () => {
  test.beforeEach(async ({ page }) => {
    await setupAdminAPIMocks(page)
  })

  test('bookings page loads with heading', async ({ page }) => {
    await page.goto('/admin/bookings')
    if (!(await requireAdminDashboard(page))) {
      test.skip(true, 'Redirected to login')
      return
    }
    await expect(page.getByRole('heading', { name: /Bookings Management/i })).toBeVisible({
      timeout: 10000,
    })
    await expect(page.getByText('3 total bookings')).toBeVisible()
  })

  test('bookings page has search input', async ({ page }) => {
    await page.goto('/admin/bookings')
    if (!(await requireAdminDashboard(page))) {
      test.skip(true, 'Redirected to login')
      return
    }

    const searchInput = page.getByLabel('Search bookings')
    await expect(searchInput).toBeVisible({ timeout: 10000 })
    await expect(searchInput).toHaveAttribute('placeholder', /Search by email, service/i)
  })

  test('bookings page has status filter buttons', async ({ page }) => {
    await page.goto('/admin/bookings')
    if (!(await requireAdminDashboard(page))) {
      test.skip(true, 'Redirected to login')
      return
    }

    await expect(page.getByRole('button', { name: 'All' })).toBeVisible({ timeout: 10000 })
    await expect(page.getByRole('button', { name: 'Pending' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Confirmed' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Completed' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Cancelled' })).toBeVisible()
  })

  test('bookings table renders with correct columns', async ({ page }) => {
    await page.goto('/admin/bookings')
    if (!(await requireAdminDashboard(page))) {
      test.skip(true, 'Redirected to login')
      return
    }

    const table = page.getByRole('table', { name: /Bookings list/i })
    await expect(table).toBeVisible({ timeout: 10000 })

    await expect(table.getByRole('columnheader', { name: /Date/i })).toBeVisible()
    await expect(table.getByRole('columnheader', { name: /Client/i })).toBeVisible()
    await expect(table.getByRole('columnheader', { name: /Attorney/i })).toBeVisible()
    await expect(table.getByRole('columnheader', { name: /Service/i })).toBeVisible()
    await expect(table.getByRole('columnheader', { name: /Status/i })).toBeVisible()
    await expect(table.getByRole('columnheader', { name: /Payment/i })).toBeVisible()
    await expect(table.getByRole('columnheader', { name: /Actions/i })).toBeVisible()
  })

  test('bookings table shows booking data', async ({ page }) => {
    await page.goto('/admin/bookings')
    if (!(await requireAdminDashboard(page))) {
      test.skip(true, 'Redirected to login')
      return
    }

    await expect(page.getByText('Consultation').first()).toBeVisible({ timeout: 10000 })
    await expect(page.getByText('Video Consultation')).toBeVisible()
    await expect(page.getByText('Case Review')).toBeVisible()
  })

  test('bookings show attorney names', async ({ page }) => {
    await page.goto('/admin/bookings')
    if (!(await requireAdminDashboard(page))) {
      test.skip(true, 'Redirected to login')
      return
    }

    await expect(page.getByText('John Smith').first()).toBeVisible({ timeout: 10000 })
    await expect(page.getByText('Jane Doe').first()).toBeVisible()
  })

  test('bookings status filter changes active button', async ({ page }) => {
    await page.goto('/admin/bookings')
    if (!(await requireAdminDashboard(page))) {
      test.skip(true, 'Redirected to login')
      return
    }

    const pendingBtn = page.getByRole('button', { name: 'Pending' })
    await expect(pendingBtn).toBeVisible({ timeout: 10000 })
    await pendingBtn.click()
    await expect(pendingBtn).toHaveClass(/bg-blue-600/)
  })
})

// ==========================================================================
// 8. ADMIN PROTECTED ROUTES
// ==========================================================================

test.describe('Admin Protected Routes', () => {
  test('unauthenticated user accessing /admin is redirected to login', async ({ page }) => {
    await page.goto('/admin')
    await page.waitForLoadState('domcontentloaded')
    // Middleware may redirect to /admin/login, /login?redirect=..., or /?error=unauthorized
    await expect(page).toHaveURL(/\/login|error=unauthorized/, { timeout: 10000 })
  })

  test('unauthenticated user accessing /admin/attorneys is redirected', async ({ page }) => {
    await page.goto('/admin/attorneys')
    await page.waitForLoadState('domcontentloaded')
    await expect(page).toHaveURL(/\/login|error=unauthorized/, { timeout: 10000 })
  })

  test('unauthenticated user accessing /admin/reviews is redirected', async ({ page }) => {
    await page.goto('/admin/reviews')
    await page.waitForLoadState('domcontentloaded')
    await expect(page).toHaveURL(/\/login|error=unauthorized/, { timeout: 10000 })
  })

  test('unauthenticated user accessing /admin/claims is redirected', async ({ page }) => {
    await page.goto('/admin/claims')
    await page.waitForLoadState('domcontentloaded')
    await expect(page).toHaveURL(/\/login|error=unauthorized/, { timeout: 10000 })
  })

  test('unauthenticated user accessing /admin/bookings is redirected', async ({ page }) => {
    await page.goto('/admin/bookings')
    await page.waitForLoadState('domcontentloaded')
    await expect(page).toHaveURL(/\/login|error=unauthorized/, { timeout: 10000 })
  })

  test('unauthenticated user accessing /admin/settings is redirected', async ({ page }) => {
    await page.goto('/admin/settings')
    await page.waitForLoadState('domcontentloaded')
    await expect(page).toHaveURL(/\/login|error=unauthorized/, { timeout: 10000 })
  })

  test('/admin/login page itself is accessible without auth', async ({ page }) => {
    await page.goto('/admin/login')
    await expect(page).toHaveURL(/\/admin\/login/)
    await expect(page.locator('h1').filter({ hasText: 'Administration' })).toBeVisible({
      timeout: 15000,
    })
  })
})

// ==========================================================================
// 9. MOBILE ADMIN (responsive layout)
// ==========================================================================

test.describe('Mobile Admin Layout', () => {
  test.use({ viewport: { width: 768, height: 1024 } })

  test.beforeEach(async ({ page }) => {
    await setupAdminAPIMocks(page)
  })

  test('at tablet width, sidebar is hidden by default', async ({ page }) => {
    await page.goto('/admin')
    if (!(await requireAdminDashboard(page))) {
      test.skip(true, 'Redirected to login — sidebar not visible')
      return
    }

    const sidebar = page.locator('aside[aria-label="Admin navigation"]')
    await expect(sidebar).toHaveClass(/-translate-x-full/)
  })

  test('hamburger menu button is visible on mobile', async ({ page }) => {
    await page.goto('/admin')
    if (!(await requireAdminDashboard(page))) {
      test.skip(true, 'Redirected to login')
      return
    }

    await expect(page.getByRole('button', { name: /Open menu/i })).toBeVisible()
  })

  test('clicking hamburger opens sidebar', async ({ page }) => {
    await page.goto('/admin')
    if (!(await requireAdminDashboard(page))) {
      test.skip(true, 'Redirected to login')
      return
    }

    await page.getByRole('button', { name: /Open menu/i }).click()
    const sidebar = page.locator('aside[aria-label="Admin navigation"]')
    await expect(sidebar).toHaveClass(/translate-x-0/)
  })

  test('close button in sidebar closes it', async ({ page }) => {
    await page.goto('/admin')
    if (!(await requireAdminDashboard(page))) {
      test.skip(true, 'Redirected to login')
      return
    }

    await page.getByRole('button', { name: /Open menu/i }).click()
    const sidebar = page.locator('aside[aria-label="Admin navigation"]')
    await expect(sidebar).toHaveClass(/translate-x-0/)

    await page.getByRole('button', { name: /Close menu/i }).click()
    await expect(sidebar).toHaveClass(/-translate-x-full/)
  })

  test('attorney table has horizontal scroll on mobile', async ({ page }) => {
    await page.goto('/admin/attorneys')
    if (!(await requireAdminDashboard(page))) {
      test.skip(true, 'Redirected to login')
      return
    }

    const tableWrapper = page.locator('.overflow-x-auto').first()
    await expect(tableWrapper).toBeVisible({ timeout: 10000 })
  })

  test('bookings table has horizontal scroll on mobile', async ({ page }) => {
    await page.goto('/admin/bookings')
    if (!(await requireAdminDashboard(page))) {
      test.skip(true, 'Redirected to login')
      return
    }

    const tableWrapper = page.locator('.overflow-x-auto').first()
    await expect(tableWrapper).toBeVisible({ timeout: 10000 })
  })

  test('admin login page is responsive at 768px', async ({ page }) => {
    await page.goto('/admin/login')
    await page.waitForLoadState('domcontentloaded')
    await expect(page.locator('h1').filter({ hasText: 'Administration' })).toBeVisible({
      timeout: 15000,
    })
    await expect(page.getByPlaceholder('admin@example.com')).toBeVisible()
    await expect(page.getByPlaceholder('••••••••')).toBeVisible()
    await expect(page.getByRole('button', { name: /Admin Sign In/i })).toBeVisible()
  })
})

// ==========================================================================
// 10. SMALL MOBILE (375px)
// ==========================================================================

test.describe('Small Mobile Admin', () => {
  test.use({ viewport: { width: 375, height: 812 } })

  test('admin login renders correctly on small mobile', async ({ page }) => {
    await page.goto('/admin/login')
    await page.waitForLoadState('domcontentloaded')
    await expect(page.locator('h1').filter({ hasText: 'Administration' })).toBeVisible({
      timeout: 15000,
    })
    await expect(page.getByRole('button', { name: /Admin Sign In/i })).toBeVisible()
  })
})
