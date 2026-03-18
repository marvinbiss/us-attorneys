/**
 * CookieConsent Component — Unit Tests
 *
 * Tests for cookie consent banner, preference management,
 * localStorage persistence, and GDPR compliance behavior.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react'

// ── Mock framer-motion ───────────────────────────────────────────────
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className, ...props }: Record<string, unknown>) => (
      <div className={className as string} data-testid="motion-div">
        {children as React.ReactNode}
      </div>
    ),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

// ── Mock useReducedMotion ────────────────────────────────────────────
vi.mock('@/hooks/useReducedMotion', () => ({
  useReducedMotion: () => false,
}))

// ── Import after mocks ──────────────────────────────────────────────
import CookieConsent, { useCookieConsent } from '@/components/CookieConsent'

// ── Helper to render the hook ────────────────────────────────────────
function HookWrapper() {
  const consent = useCookieConsent()
  return (
    <div data-testid="hook-result">
      {consent ? JSON.stringify(consent) : 'null'}
    </div>
  )
}

describe('CookieConsent', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    localStorage.clear()
    // Mock fetch for GDPR consent endpoint
    global.fetch = vi.fn(() =>
      Promise.resolve(new Response(JSON.stringify({ ok: true }), { status: 200 }))
    )
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  // ── Visibility ───────────────────────────────────────────────────

  it('does not render immediately (waits 1 second delay)', () => {
    render(<CookieConsent />)
    expect(screen.queryByText('We respect your privacy')).not.toBeInTheDocument()
  })

  it('renders banner after 1 second delay when no consent', () => {
    render(<CookieConsent />)
    act(() => {
      vi.advanceTimersByTime(1100)
    })
    expect(screen.getByText('We respect your privacy')).toBeInTheDocument()
  })

  it('does not render banner if consent already given', () => {
    localStorage.setItem('cookie_consent', new Date().toISOString())
    localStorage.setItem('cookie_preferences', JSON.stringify({
      necessary: true,
      analytics: false,
      marketing: false,
      personalization: false,
    }))
    render(<CookieConsent />)
    act(() => {
      vi.advanceTimersByTime(2000)
    })
    expect(screen.queryByText('We respect your privacy')).not.toBeInTheDocument()
  })

  // ── Banner Content ─────────────────────────────────────────────

  it('displays GDPR compliance text', () => {
    render(<CookieConsent />)
    act(() => { vi.advanceTimersByTime(1100) })
    expect(screen.getByText('GDPR Compliance')).toBeInTheDocument()
  })

  it('displays cookie explanation text', () => {
    render(<CookieConsent />)
    act(() => { vi.advanceTimersByTime(1100) })
    expect(screen.getByText(/We use cookies to improve your experience/)).toBeInTheDocument()
  })

  it('renders "Accept all" button', () => {
    render(<CookieConsent />)
    act(() => { vi.advanceTimersByTime(1100) })
    expect(screen.getByText('Accept all')).toBeInTheDocument()
  })

  it('renders "Reject all" button', () => {
    render(<CookieConsent />)
    act(() => { vi.advanceTimersByTime(1100) })
    expect(screen.getByText('Reject all')).toBeInTheDocument()
  })

  it('renders "Customize" button', () => {
    render(<CookieConsent />)
    act(() => { vi.advanceTimersByTime(1100) })
    expect(screen.getByText('Customize')).toBeInTheDocument()
  })

  it('renders privacy policy link', () => {
    render(<CookieConsent />)
    act(() => { vi.advanceTimersByTime(1100) })
    const privacyLink = screen.getByText('Privacy policy')
    expect(privacyLink.closest('a')).toHaveAttribute('href', '/privacy')
  })

  it('renders legal notice link', () => {
    render(<CookieConsent />)
    act(() => { vi.advanceTimersByTime(1100) })
    const legalLink = screen.getByText('Legal notice')
    expect(legalLink.closest('a')).toHaveAttribute('href', '/legal')
  })

  it('has role="dialog" with aria-label', () => {
    render(<CookieConsent />)
    act(() => { vi.advanceTimersByTime(1100) })
    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveAttribute('aria-label', 'Cookie management')
  })

  // ── Accept All ─────────────────────────────────────────────────

  it('hides banner when "Accept all" is clicked', async () => {
    render(<CookieConsent />)
    act(() => { vi.advanceTimersByTime(1100) })

    await act(async () => {
      fireEvent.click(screen.getByText('Accept all'))
    })
    expect(screen.queryByText('We respect your privacy')).not.toBeInTheDocument()
  })

  it('sets localStorage consent key when "Accept all" is clicked', async () => {
    render(<CookieConsent />)
    act(() => { vi.advanceTimersByTime(1100) })

    await act(async () => {
      fireEvent.click(screen.getByText('Accept all'))
    })
    const consent = localStorage.getItem('cookie_consent')
    expect(consent).toBeTruthy()
    // Should be a valid ISO date
    expect(new Date(consent!).toISOString()).toBe(consent)
  })

  it('saves all-accepted preferences when "Accept all" is clicked', async () => {
    render(<CookieConsent />)
    act(() => { vi.advanceTimersByTime(1100) })

    await act(async () => {
      fireEvent.click(screen.getByText('Accept all'))
    })
    const prefs = JSON.parse(localStorage.getItem('cookie_preferences')!)
    expect(prefs).toEqual({
      necessary: true,
      analytics: true,
      marketing: true,
      personalization: true,
    })
  })

  it('sends consent to server when "Accept all" is clicked', async () => {
    render(<CookieConsent />)
    act(() => { vi.advanceTimersByTime(1100) })

    await act(async () => {
      fireEvent.click(screen.getByText('Accept all'))
    })
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/gdpr/consent',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
    )
  })

  // ── Reject All ─────────────────────────────────────────────────

  it('hides banner when "Reject all" is clicked', async () => {
    render(<CookieConsent />)
    act(() => { vi.advanceTimersByTime(1100) })

    await act(async () => {
      fireEvent.click(screen.getByText('Reject all'))
    })
    expect(screen.queryByText('We respect your privacy')).not.toBeInTheDocument()
  })

  it('saves necessary-only preferences when "Reject all" is clicked', async () => {
    render(<CookieConsent />)
    act(() => { vi.advanceTimersByTime(1100) })

    await act(async () => {
      fireEvent.click(screen.getByText('Reject all'))
    })
    const prefs = JSON.parse(localStorage.getItem('cookie_preferences')!)
    expect(prefs).toEqual({
      necessary: true,
      analytics: false,
      marketing: false,
      personalization: false,
    })
  })

  // ── Customize / Details ────────────────────────────────────────

  it('shows detail preferences when "Customize" is clicked', () => {
    render(<CookieConsent />)
    act(() => { vi.advanceTimersByTime(1100) })

    fireEvent.click(screen.getByText('Customize'))
    expect(screen.getByText('Essential cookies')).toBeInTheDocument()
    expect(screen.getByText('Analytics cookies')).toBeInTheDocument()
    expect(screen.getByText('Marketing cookies')).toBeInTheDocument()
    expect(screen.getByText('Personalization cookies')).toBeInTheDocument()
  })

  it('shows "Save my choices" button after customizing', () => {
    render(<CookieConsent />)
    act(() => { vi.advanceTimersByTime(1100) })

    fireEvent.click(screen.getByText('Customize'))
    expect(screen.getByText('Save my choices')).toBeInTheDocument()
    // "Customize" should be replaced
    expect(screen.queryByText('Customize')).not.toBeInTheDocument()
  })

  it('essential cookies checkbox is always checked and disabled', () => {
    render(<CookieConsent />)
    act(() => { vi.advanceTimersByTime(1100) })

    fireEvent.click(screen.getByText('Customize'))
    // Find the disabled checkbox (essential cookies)
    const checkboxes = screen.getAllByRole('checkbox')
    const essentialCheckbox = checkboxes.find(cb => (cb as HTMLInputElement).disabled)
    expect(essentialCheckbox).toBeDefined()
    expect((essentialCheckbox as HTMLInputElement).checked).toBe(true)
  })

  it('saves custom preferences when "Save my choices" is clicked', async () => {
    render(<CookieConsent />)
    act(() => { vi.advanceTimersByTime(1100) })

    fireEvent.click(screen.getByText('Customize'))

    // Toggle analytics on
    const checkboxes = screen.getAllByRole('checkbox')
    const toggleableCheckboxes = checkboxes.filter(cb => !(cb as HTMLInputElement).disabled)
    // First toggleable = analytics
    fireEvent.click(toggleableCheckboxes[0])

    await act(async () => {
      fireEvent.click(screen.getByText('Save my choices'))
    })

    const prefs = JSON.parse(localStorage.getItem('cookie_preferences')!)
    expect(prefs.necessary).toBe(true)
    expect(prefs.analytics).toBe(true)
    expect(prefs.marketing).toBe(false)
    expect(prefs.personalization).toBe(false)
  })

  // ── Server error resilience ────────────────────────────────────

  it('still saves localStorage even if server request fails', async () => {
    global.fetch = vi.fn(() => Promise.reject(new Error('Network error')))
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    render(<CookieConsent />)
    act(() => { vi.advanceTimersByTime(1100) })

    await act(async () => {
      fireEvent.click(screen.getByText('Accept all'))
    })

    // localStorage should still be set
    expect(localStorage.getItem('cookie_consent')).toBeTruthy()
    expect(localStorage.getItem('cookie_preferences')).toBeTruthy()
    consoleSpy.mockRestore()
  })
})

// =====================================================================
//  useCookieConsent hook
// =====================================================================

describe('useCookieConsent', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('returns null when no consent given', () => {
    render(<HookWrapper />)
    expect(screen.getByTestId('hook-result')).toHaveTextContent('null')
  })

  it('returns saved preferences when consent exists', async () => {
    const prefs = {
      necessary: true,
      analytics: true,
      marketing: false,
      personalization: false,
    }
    localStorage.setItem('cookie_consent', new Date().toISOString())
    localStorage.setItem('cookie_preferences', JSON.stringify(prefs))

    render(<HookWrapper />)

    await waitFor(() => {
      expect(screen.getByTestId('hook-result')).toHaveTextContent(
        JSON.stringify(prefs)
      )
    })
  })

  it('returns null when consent key exists but preferences are missing', async () => {
    localStorage.setItem('cookie_consent', new Date().toISOString())
    // No cookie_preferences key

    render(<HookWrapper />)

    // Should remain null since there are no preferences
    expect(screen.getByTestId('hook-result')).toHaveTextContent('null')
  })
})
