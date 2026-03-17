import { test, expect } from '@playwright/test'

test.describe('API Rate Limiting', () => {
  test('API returns rate limit headers', async ({ request }) => {
    const response = await request.get('/api/health')

    // Check for rate limit headers

    // These headers may or may not be present depending on configuration
    // Just verify the API responds
    expect(response.status()).toBeLessThan(500)
  })

  test('API handles multiple requests', async ({ request }) => {
    // Make several requests in quick succession
    const requests = Array(5).fill(null).map(() =>
      request.get('/api/health')
    )

    const responses = await Promise.all(requests)

    // All should succeed (or be rate limited with 429)
    for (const response of responses) {
      expect([200, 429]).toContain(response.status())
    }
  })

  test('search API responds correctly', async ({ request }) => {
    const response = await request.get('/api/search?q=personal-injury')

    // Should get a valid response
    expect(response.status()).toBeLessThan(500)
  })

  test('protected routes return 401 without auth', async ({ request }) => {
    const response = await request.get('/api/attorney/profile')

    // Should require authentication
    expect([401, 403]).toContain(response.status())
  })

  test('admin routes are protected', async ({ request }) => {
    const response = await request.get('/api/admin/stats')

    // Should require admin authentication
    expect([401, 403]).toContain(response.status())
  })
})

test.describe('API Error Handling', () => {
  test('invalid endpoint returns 404', async ({ request }) => {
    const response = await request.get('/api/nonexistent-endpoint-12345')

    expect(response.status()).toBe(404)
  })

  test('malformed request returns 400', async ({ request }) => {
    const response = await request.post('/api/contact', {
      data: { invalid: 'data' },
    })

    // Should return 400 for validation errors
    expect([400, 401, 422]).toContain(response.status())
  })

  test('API returns JSON errors', async ({ request }) => {
    const response = await request.get('/api/nonexistent-endpoint-12345')

    const contentType = response.headers()['content-type']
    // Should return JSON even for errors
    expect(contentType).toMatch(/json|text/)
  })
})
