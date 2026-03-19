/**
 * Tests for Email Service
 * Covers sendEmail function (with/without API key, success/failure)
 * and all 8 email templates (welcome, welcomeAttorney, newBooking,
 * reviewRequest, bookingConfirmationClient, bookingNotificationAttorney,
 * bookingReminder, passwordReset).
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock the logger before importing the module
vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}))

import { sendEmail, emailTemplates, type EmailTemplate } from '@/lib/services/email-service'

// ============================================================================
// sendEmail
// ============================================================================

describe('sendEmail', () => {
  const originalEnv = { ...process.env }

  beforeEach(() => {
    vi.restoreAllMocks()
    // Reset env vars to a known state
    delete (process.env as Record<string, string | undefined>).RESEND_API_KEY
    ;(process.env as Record<string, string | undefined>).NODE_ENV = undefined
  })

  afterEach(() => {
    process.env.RESEND_API_KEY = originalEnv.RESEND_API_KEY
    ;(process.env as Record<string, string | undefined>).NODE_ENV = originalEnv.NODE_ENV
  })

  it('returns success with dev-mode id when RESEND_API_KEY is not set', async () => {
    delete (process.env as Record<string, string | undefined>).RESEND_API_KEY
    const result = await sendEmail({
      to: 'test@example.com',
      template: { subject: 'Test', html: '<p>Hello</p>' },
    })
    expect(result).toEqual({ success: true, id: 'dev-mode' })
  })

  it('logs email details in development mode when API key is missing', async () => {
    const { logger } = await import('@/lib/logger')
    delete (process.env as Record<string, string | undefined>).RESEND_API_KEY
    ;(process.env as Record<string, string | undefined>).NODE_ENV = 'development'

    await sendEmail({
      to: 'dev@example.com',
      template: { subject: 'Dev test', html: '<p>Dev</p>' },
    })

    expect(logger.info).toHaveBeenCalledWith(
      expect.stringContaining('No RESEND_API_KEY'),
      expect.objectContaining({ to: 'dev@example.com', subject: 'Dev test' })
    )
  })

  it('sends email via Resend API when API key is set', async () => {
    process.env.RESEND_API_KEY = 'test-resend-key'

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ id: 'email-123' }),
    })
    vi.stubGlobal('fetch', mockFetch)

    const result = await sendEmail({
      to: 'user@example.com',
      template: { subject: 'Hello', html: '<p>World</p>' },
    })

    expect(result).toEqual({ success: true, id: 'email-123' })
    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.resend.com/emails',
      expect.objectContaining({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer test-resend-key',
        },
      })
    )

    vi.unstubAllGlobals()
  })

  it('sends to array of recipients', async () => {
    process.env.RESEND_API_KEY = 'key'

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ id: 'batch-1' }),
    })
    vi.stubGlobal('fetch', mockFetch)

    await sendEmail({
      to: ['a@test.com', 'b@test.com'],
      template: { subject: 'Batch', html: '<p>Hi</p>' },
    })

    const body = JSON.parse(mockFetch.mock.calls[0][1].body)
    expect(body.to).toEqual(['a@test.com', 'b@test.com'])

    vi.unstubAllGlobals()
  })

  it('wraps single recipient in array in the API call', async () => {
    process.env.RESEND_API_KEY = 'key'

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ id: 'single-1' }),
    })
    vi.stubGlobal('fetch', mockFetch)

    await sendEmail({
      to: 'solo@test.com',
      template: { subject: 'Solo', html: '<p>Hi</p>' },
    })

    const body = JSON.parse(mockFetch.mock.calls[0][1].body)
    expect(body.to).toEqual(['solo@test.com'])

    vi.unstubAllGlobals()
  })

  it('uses custom "from" when provided', async () => {
    process.env.RESEND_API_KEY = 'key'

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ id: 'custom-from-1' }),
    })
    vi.stubGlobal('fetch', mockFetch)

    await sendEmail({
      to: 'user@test.com',
      template: { subject: 'Custom', html: '<p>Hi</p>' },
      from: 'Custom Sender <custom@us-attorneys.com>',
    })

    const body = JSON.parse(mockFetch.mock.calls[0][1].body)
    expect(body.from).toBe('Custom Sender <custom@us-attorneys.com>')

    vi.unstubAllGlobals()
  })

  it('uses default "from" when not provided', async () => {
    process.env.RESEND_API_KEY = 'key'

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ id: 'default-from-1' }),
    })
    vi.stubGlobal('fetch', mockFetch)

    await sendEmail({
      to: 'user@test.com',
      template: { subject: 'Default', html: '<p>Hi</p>' },
    })

    const body = JSON.parse(mockFetch.mock.calls[0][1].body)
    expect(body.from).toBe('US Attorneys <noreply@lawtendr.com>')

    vi.unstubAllGlobals()
  })

  it('returns error when Resend API responds with non-OK status', async () => {
    process.env.RESEND_API_KEY = 'key'

    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ message: 'Invalid API key' }),
    })
    vi.stubGlobal('fetch', mockFetch)

    const result = await sendEmail({
      to: 'user@test.com',
      template: { subject: 'Fail', html: '<p>Nope</p>' },
    })

    expect(result.success).toBe(false)
    expect(result.error).toBe('Invalid API key')

    vi.unstubAllGlobals()
  })

  it('returns error with fallback message when API error has no message', async () => {
    process.env.RESEND_API_KEY = 'key'

    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({}),
    })
    vi.stubGlobal('fetch', mockFetch)

    const result = await sendEmail({
      to: 'user@test.com',
      template: { subject: 'Fail', html: '<p>Nope</p>' },
    })

    expect(result.success).toBe(false)
    expect(result.error).toBe('Failed to send email')

    vi.unstubAllGlobals()
  })

  it('returns error when fetch throws a network error', async () => {
    process.env.RESEND_API_KEY = 'key'

    const mockFetch = vi.fn().mockRejectedValue(new Error('Network error'))
    vi.stubGlobal('fetch', mockFetch)

    const result = await sendEmail({
      to: 'user@test.com',
      template: { subject: 'Crash', html: '<p>Crash</p>' },
    })

    expect(result.success).toBe(false)
    expect(result.error).toBe('Network error')

    vi.unstubAllGlobals()
  })

  it('returns "Unknown error" when a non-Error is thrown', async () => {
    process.env.RESEND_API_KEY = 'key'

    const mockFetch = vi.fn().mockRejectedValue('string error')
    vi.stubGlobal('fetch', mockFetch)

    const result = await sendEmail({
      to: 'user@test.com',
      template: { subject: 'Weird', html: '<p>Weird</p>' },
    })

    expect(result.success).toBe(false)
    expect(result.error).toBe('Unknown error')

    vi.unstubAllGlobals()
  })

  it('includes text field in payload when provided in template', async () => {
    process.env.RESEND_API_KEY = 'key'

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ id: 'txt-1' }),
    })
    vi.stubGlobal('fetch', mockFetch)

    await sendEmail({
      to: 'user@test.com',
      template: { subject: 'With text', html: '<p>Hi</p>', text: 'Hi plain' },
    })

    const body = JSON.parse(mockFetch.mock.calls[0][1].body)
    expect(body.text).toBe('Hi plain')

    vi.unstubAllGlobals()
  })
})

// ============================================================================
// Email Templates
// ============================================================================

describe('emailTemplates', () => {
  // Helper to validate template structure
  function validateTemplate(template: EmailTemplate) {
    expect(template).toHaveProperty('subject')
    expect(template).toHaveProperty('html')
    expect(typeof template.subject).toBe('string')
    expect(typeof template.html).toBe('string')
    expect(template.subject.length).toBeGreaterThan(0)
    expect(template.html.length).toBeGreaterThan(0)
    expect(template.html).toContain('<!DOCTYPE html>')
  }

  describe('welcome', () => {
    it('returns a valid template with the user name', () => {
      const tpl = emailTemplates.welcome('John')
      validateTemplate(tpl)
      expect(tpl.subject).toBe('Welcome to US Attorneys!')
      expect(tpl.html).toContain('Welcome John')
    })

    it('contains a link to search attorneys', () => {
      const tpl = emailTemplates.welcome('Jane')
      expect(tpl.html).toContain('/search')
      expect(tpl.html).toContain('Find an attorney')
    })
  })

  describe('welcomeAttorney', () => {
    it('returns a valid template with the attorney name', () => {
      const tpl = emailTemplates.welcomeAttorney('Esquire Smith')
      validateTemplate(tpl)
      expect(tpl.subject).toContain('Welcome to US Attorneys')
      expect(tpl.html).toContain('Welcome Esquire Smith')
    })

    it('contains onboarding steps', () => {
      const tpl = emailTemplates.welcomeAttorney('Test')
      expect(tpl.html).toContain('Complete your profile')
      expect(tpl.html).toContain('Add your portfolio')
      expect(tpl.html).toContain('Set up your calendar')
    })

    it('contains link to attorney dashboard', () => {
      const tpl = emailTemplates.welcomeAttorney('Test')
      expect(tpl.html).toContain('/attorney-dashboard')
    })
  })

  describe('newBooking', () => {
    it('returns a valid template with booking details', () => {
      const tpl = emailTemplates.newBooking(
        'Att. Johnson',
        'Client Smith',
        'Personal Injury',
        '2026-04-01'
      )
      validateTemplate(tpl)
      expect(tpl.subject).toBe('New booking from Client Smith')
      expect(tpl.html).toContain('Hello Att. Johnson')
      expect(tpl.html).toContain('Client Smith')
      expect(tpl.html).toContain('Personal Injury')
      expect(tpl.html).toContain('2026-04-01')
    })

    it('contains link to dashboard requests', () => {
      const tpl = emailTemplates.newBooking('A', 'B', 'C', 'D')
      expect(tpl.html).toContain('/attorney-dashboard/requests')
    })
  })

  describe('reviewRequest', () => {
    it('returns a valid template with review details', () => {
      const tpl = emailTemplates.reviewRequest('Client Jones', 'Att. Brown', 'booking-uuid-123')
      validateTemplate(tpl)
      expect(tpl.subject).toBe('Leave a review for Att. Brown')
      expect(tpl.html).toContain('Hello Client Jones')
      expect(tpl.html).toContain('Att. Brown')
    })

    it('contains link to leave review with booking id', () => {
      const tpl = emailTemplates.reviewRequest('C', 'A', 'uuid-42')
      expect(tpl.html).toContain('/leave-review/uuid-42')
    })
  })

  describe('bookingConfirmationClient', () => {
    it('returns a valid template with all consultation details', () => {
      const tpl = emailTemplates.bookingConfirmationClient(
        'Client Doe',
        'Att. Lee',
        'Family Law',
        '2026-05-01',
        '10:00 AM',
        'https://daily.co/room-xyz'
      )
      validateTemplate(tpl)
      expect(tpl.subject).toContain('Att. Lee')
      expect(tpl.subject).toContain('confirmed')
      expect(tpl.html).toContain('Client Doe')
      expect(tpl.html).toContain('Att. Lee')
      expect(tpl.html).toContain('Family Law')
      expect(tpl.html).toContain('2026-05-01')
      expect(tpl.html).toContain('10:00 AM')
      expect(tpl.html).toContain('https://daily.co/room-xyz')
    })
  })

  describe('bookingNotificationAttorney', () => {
    it('returns a valid template with full booking info', () => {
      const tpl = emailTemplates.bookingNotificationAttorney(
        'Att. Green',
        'Client White',
        'client@test.com',
        'Criminal Defense',
        '2026-06-15',
        '2:00 PM',
        'I need help with my case',
        'https://us-attorneys.com/attorney-dashboard'
      )
      validateTemplate(tpl)
      expect(tpl.subject).toContain('Client White')
      expect(tpl.html).toContain('Att. Green')
      expect(tpl.html).toContain('client@test.com')
      expect(tpl.html).toContain('Criminal Defense')
      expect(tpl.html).toContain('I need help with my case')
    })

    it('omits notes section when notes are empty', () => {
      const tpl = emailTemplates.bookingNotificationAttorney(
        'Att.',
        'Client',
        'c@test.com',
        'Tax',
        '2026-01-01',
        '9:00',
        '',
        '/dash'
      )
      expect(tpl.html).not.toContain('Client Notes')
    })

    it('includes notes section when notes are provided', () => {
      const tpl = emailTemplates.bookingNotificationAttorney(
        'Att.',
        'Client',
        'c@test.com',
        'Tax',
        '2026-01-01',
        '9:00',
        'Some notes here',
        '/dash'
      )
      expect(tpl.html).toContain('Client Notes')
      expect(tpl.html).toContain('Some notes here')
    })
  })

  describe('bookingReminder', () => {
    it('returns a valid template with reminder details', () => {
      const tpl = emailTemplates.bookingReminder(
        'Client Taylor',
        'Att. Adams',
        '2026-07-01',
        '3:00 PM',
        'https://daily.co/reminder-room'
      )
      validateTemplate(tpl)
      expect(tpl.subject).toContain('Att. Adams')
      expect(tpl.subject).toContain('1 hour')
      expect(tpl.html).toContain('Client Taylor')
      expect(tpl.html).toContain('https://daily.co/reminder-room')
    })
  })

  describe('passwordReset', () => {
    it('returns a valid template with reset link', () => {
      const tpl = emailTemplates.passwordReset(
        'User Zero',
        'https://us-attorneys.com/reset?token=abc123'
      )
      validateTemplate(tpl)
      expect(tpl.subject).toBe('Password Reset - US Attorneys')
      expect(tpl.html).toContain('Hello User Zero')
      expect(tpl.html).toContain('https://us-attorneys.com/reset?token=abc123')
    })

    it('includes expiration warning', () => {
      const tpl = emailTemplates.passwordReset('X', 'https://reset')
      expect(tpl.html).toContain('expires in 1 hour')
    })
  })
})
