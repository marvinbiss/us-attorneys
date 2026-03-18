/**
 * ClaimButton Component -- Unit Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ClaimButton } from '@/components/attorney/ClaimButton'

// ── Setup ────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
    ok: false,
    json: () => Promise.resolve({}),
  }))
})

afterEach(() => {
  vi.restoreAllMocks()
})

// ── Helpers ──────────────────────────────────────────────────────────────

const defaultProps = {
  attorneyId: 'att-123',
  attorneyName: 'John Doe',
  hasBarNumber: true,
}

/** Fill all required form fields with valid values */
async function fillForm(user: ReturnType<typeof userEvent.setup>, overrides?: {
  fullName?: string
  email?: string
  phone?: string
  position?: string
  barNumber?: string
}) {
  const fullName = overrides?.fullName ?? 'John Doe'
  const email = overrides?.email ?? 'john@lawfirm.com'
  const phone = overrides?.phone ?? '5551234567'
  const position = overrides?.position ?? 'Partner'
  const barNumber = overrides?.barNumber ?? '123456'

  await user.type(screen.getByPlaceholderText('John Smith'), fullName)
  await user.type(screen.getByPlaceholderText('john@lawfirm.com'), email)
  await user.type(screen.getByPlaceholderText('(555) 123-4567'), phone)
  await user.type(screen.getByPlaceholderText('Partner, Associate, Managing Attorney...'), position)
  await user.type(screen.getByPlaceholderText('e.g. 123456'), barNumber)
}

// ── Tests ────────────────────────────────────────────────────────────────

describe('ClaimButton', () => {
  // ── No bar number state ────────────────────────────────────────────

  it('renders contact-us message when hasBarNumber is false', () => {
    render(<ClaimButton {...defaultProps} hasBarNumber={false} />)
    expect(screen.getByText('Are you this attorney?')).toBeInTheDocument()
    expect(screen.getByText(/cannot yet be claimed automatically/)).toBeInTheDocument()
    expect(screen.getByText('support@us-attorneys.com')).toBeInTheDocument()
  })

  it('renders mailto link when hasBarNumber is false', () => {
    render(<ClaimButton {...defaultProps} hasBarNumber={false} />)
    const link = screen.getByText('support@us-attorneys.com')
    expect(link.closest('a')).toHaveAttribute('href', 'mailto:support@us-attorneys.com')
  })

  it('does not render claim button when hasBarNumber is false', () => {
    render(<ClaimButton {...defaultProps} hasBarNumber={false} />)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  // ── Button rendering ──────────────────────────────────────────────

  it('renders claim button when hasBarNumber is true', () => {
    render(<ClaimButton {...defaultProps} />)
    expect(screen.getByText(/Claim this profile/)).toBeInTheDocument()
    expect(screen.getByRole('button')).toBeInTheDocument()
  })

  it('opens modal when claim button is clicked', async () => {
    render(<ClaimButton {...defaultProps} />)
    fireEvent.click(screen.getByText(/Claim this profile/))
    expect(screen.getByText('Claim this profile')).toBeInTheDocument()
    expect(screen.getByText(defaultProps.attorneyName)).toBeInTheDocument()
  })

  // ── Modal form ────────────────────────────────────────────────────

  it('renders all form fields in the modal', () => {
    render(<ClaimButton {...defaultProps} />)
    fireEvent.click(screen.getByRole('button'))

    expect(screen.getByPlaceholderText('John Smith')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('john@lawfirm.com')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('(555) 123-4567')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Partner, Associate, Managing Attorney...')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('e.g. 123456')).toBeInTheDocument()
  })

  it('renders form labels with required indicators', () => {
    render(<ClaimButton {...defaultProps} />)
    fireEvent.click(screen.getByRole('button'))

    expect(screen.getByText('Full name')).toBeInTheDocument()
    expect(screen.getByText('Professional email')).toBeInTheDocument()
    expect(screen.getByText('Phone')).toBeInTheDocument()
    expect(screen.getByText('Position / Role')).toBeInTheDocument()
    expect(screen.getByText('Bar Number')).toBeInTheDocument()
  })

  it('shows submit button disabled initially (empty form)', () => {
    render(<ClaimButton {...defaultProps} />)
    fireEvent.click(screen.getByRole('button', { name: /Claim this profile/ }))

    const submitBtn = screen.getByText('Send my request')
    expect(submitBtn.closest('button')).toBeDisabled()
  })

  // ── Modal close ───────────────────────────────────────────────────

  it('closes modal when cancel button is clicked', () => {
    render(<ClaimButton {...defaultProps} />)
    fireEvent.click(screen.getByRole('button', { name: /Claim this profile/ }))

    expect(screen.getByText('Claim this profile')).toBeInTheDocument()

    fireEvent.click(screen.getByText('Cancel'))
    // Modal should be gone -- modal content should not be visible
    expect(screen.queryByText('Cancel')).not.toBeInTheDocument()
  })

  it('closes modal when backdrop is clicked', () => {
    const { container } = render(<ClaimButton {...defaultProps} />)
    fireEvent.click(screen.getByRole('button', { name: /Claim this profile/ }))

    // Backdrop has bg-black/60 class
    const backdrop = container.querySelector('.backdrop-blur-sm')
    expect(backdrop).toBeInTheDocument()
    fireEvent.click(backdrop!)

    expect(screen.queryByText('Cancel')).not.toBeInTheDocument()
  })

  it('closes modal when X button is clicked', () => {
    render(<ClaimButton {...defaultProps} />)
    fireEvent.click(screen.getByRole('button', { name: /Claim this profile/ }))

    // X button is the one in the top-right (not Cancel, not Submit)
    const allButtons = screen.getAllByRole('button')
    const closeButton = allButtons.find(
      (btn) => btn.className.includes('absolute top-4 right-4')
    )
    expect(closeButton).toBeDefined()
    fireEvent.click(closeButton!)

    expect(screen.queryByText('Cancel')).not.toBeInTheDocument()
  })

  // ── Form submission (success) ──────────────────────────────────────

  it('submits claim successfully and shows success state', async () => {
    const user = userEvent.setup()

    const mockFetch = vi.fn()
      // First call: /api/auth/me (profile prefill)
      .mockResolvedValueOnce({ ok: false, json: () => Promise.resolve({}) })
      // Second call: /api/attorney/claim
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      })
    vi.stubGlobal('fetch', mockFetch)

    render(<ClaimButton {...defaultProps} />)
    fireEvent.click(screen.getByRole('button', { name: /Claim this profile/ }))

    await fillForm(user)

    const submitBtn = screen.getByText('Send my request')
    expect(submitBtn.closest('button')).not.toBeDisabled()

    await user.click(submitBtn)

    await waitFor(() => {
      expect(screen.getByText('Request sent!')).toBeInTheDocument()
    })
    expect(screen.getByText(/has been submitted/)).toBeInTheDocument()
    expect(screen.getByText(defaultProps.attorneyName)).toBeInTheDocument()
  })

  // ── Form submission (API error) ────────────────────────────────────

  it('shows error when API returns an error', async () => {
    const user = userEvent.setup()

    const mockFetch = vi.fn()
      .mockResolvedValueOnce({ ok: false, json: () => Promise.resolve({}) })
      .mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: 'Bar number does not match' }),
      })
    vi.stubGlobal('fetch', mockFetch)

    render(<ClaimButton {...defaultProps} />)
    fireEvent.click(screen.getByRole('button', { name: /Claim this profile/ }))

    await fillForm(user)
    await user.click(screen.getByText('Send my request'))

    await waitFor(() => {
      expect(screen.getByText('Bar number does not match')).toBeInTheDocument()
    })
  })

  it('shows error with debug info when API returns debug data', async () => {
    const user = userEvent.setup()

    const mockFetch = vi.fn()
      .mockResolvedValueOnce({ ok: false, json: () => Promise.resolve({}) })
      .mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({
          error: 'Verification failed',
          debug: { reason: 'mismatch' },
        }),
      })
    vi.stubGlobal('fetch', mockFetch)

    render(<ClaimButton {...defaultProps} />)
    fireEvent.click(screen.getByRole('button', { name: /Claim this profile/ }))

    await fillForm(user)
    await user.click(screen.getByText('Send my request'))

    await waitFor(() => {
      expect(screen.getByText(/Verification failed/)).toBeInTheDocument()
      expect(screen.getByText(/DEBUG/)).toBeInTheDocument()
    })
  })

  // ── Network error ──────────────────────────────────────────────────

  it('shows server connection error on network failure', async () => {
    const user = userEvent.setup()

    const mockFetch = vi.fn()
      .mockResolvedValueOnce({ ok: false, json: () => Promise.resolve({}) })
      .mockRejectedValueOnce(new Error('Network error'))
    vi.stubGlobal('fetch', mockFetch)

    render(<ClaimButton {...defaultProps} />)
    fireEvent.click(screen.getByRole('button', { name: /Claim this profile/ }))

    await fillForm(user)
    await user.click(screen.getByText('Send my request'))

    await waitFor(() => {
      expect(screen.getByText('Server connection error')).toBeInTheDocument()
    })
  })

  // ── Phone formatting ──────────────────────────────────────────────

  it('strips non-numeric characters from phone input', async () => {
    const user = userEvent.setup()
    render(<ClaimButton {...defaultProps} />)
    fireEvent.click(screen.getByRole('button', { name: /Claim this profile/ }))

    const phoneInput = screen.getByPlaceholderText('(555) 123-4567')
    await user.type(phoneInput, '(555) 123-4567')

    // formatPhone strips non-digit/non-+ chars
    expect((phoneInput as HTMLInputElement).value).toBe('5551234567')
  })

  // ── Profile prefill ────────────────────────────────────────────────

  it('prefills form from /api/auth/me if user is logged in', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        user: {
          fullName: 'Jane Doe',
          email: 'jane@firm.com',
          phone: '9998887777',
        },
      }),
    })
    vi.stubGlobal('fetch', mockFetch)

    render(<ClaimButton {...defaultProps} />)

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Claim this profile/ }))
    })

    await waitFor(() => {
      expect((screen.getByPlaceholderText('John Smith') as HTMLInputElement).value).toBe('Jane Doe')
      expect((screen.getByPlaceholderText('john@lawfirm.com') as HTMLInputElement).value).toBe('jane@firm.com')
      expect((screen.getByPlaceholderText('(555) 123-4567') as HTMLInputElement).value).toBe('9998887777')
    })
  })

  // ── Success state close ────────────────────────────────────────────

  it('closes modal from success state via Close button', async () => {
    const user = userEvent.setup()

    const mockFetch = vi.fn()
      .mockResolvedValueOnce({ ok: false, json: () => Promise.resolve({}) })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      })
    vi.stubGlobal('fetch', mockFetch)

    render(<ClaimButton {...defaultProps} />)
    fireEvent.click(screen.getByRole('button', { name: /Claim this profile/ }))

    await fillForm(user)
    await user.click(screen.getByText('Send my request'))

    await waitFor(() => {
      expect(screen.getByText('Request sent!')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Close'))
    expect(screen.queryByText('Request sent!')).not.toBeInTheDocument()
  })
})
