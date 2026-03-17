/**
 * NewsletterForm Component — Unit Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import NewsletterForm from '@/components/NewsletterForm'

// Mock useToast hook
vi.mock('@/hooks/useToast', () => ({
  useToast: () => ({
    toasts: [],
    removeToast: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
  }),
}))

// Mock ToastContainer
vi.mock('@/components/ui/Toast', () => ({
  ToastContainer: () => null,
}))

describe('NewsletterForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.restoreAllMocks()
  })

  it('renders the email input and subscribe button', () => {
    render(<NewsletterForm />)

    expect(screen.getByPlaceholderText('Your email')).toBeInTheDocument()
    expect(screen.getByLabelText('Subscribe to the newsletter')).toBeInTheDocument()
  })

  it('shows error for invalid email', async () => {
    render(<NewsletterForm />)

    const input = screen.getByPlaceholderText('Your email')
    const form = input.closest('form')!
    fireEvent.change(input, { target: { value: 'bademail' } })
    // Use fireEvent.submit to bypass HTML5 type="email" validation in jsdom
    fireEvent.submit(form)

    expect(await screen.findByText('Please enter a valid email address')).toBeInTheDocument()
  })

  it('submits successfully with valid email', async () => {
    // Mock successful fetch
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    })

    render(<NewsletterForm />)

    const input = screen.getByPlaceholderText('Your email')
    fireEvent.change(input, { target: { value: 'user@example.com' } })
    fireEvent.click(screen.getByLabelText('Subscribe to the newsletter'))

    await waitFor(() => {
      expect(screen.getByText('Thank you for subscribing!')).toBeInTheDocument()
    })

    expect(globalThis.fetch).toHaveBeenCalledWith('/api/newsletter', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ email: 'user@example.com' }),
    }))
  })

  it('shows error on failed submission', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ error: 'Server error' }),
    })

    render(<NewsletterForm />)

    const input = screen.getByPlaceholderText('Your email')
    fireEvent.change(input, { target: { value: 'user@example.com' } })
    fireEvent.click(screen.getByLabelText('Subscribe to the newsletter'))

    await waitFor(() => {
      expect(screen.getByText('Server error')).toBeInTheDocument()
    })
  })

  it('disables input and button while loading', async () => {
    // Make fetch hang
    let resolvePromise: (value: unknown) => void
    globalThis.fetch = vi.fn().mockReturnValue(
      new Promise((resolve) => { resolvePromise = resolve })
    )

    render(<NewsletterForm />)

    const input = screen.getByPlaceholderText('Your email') as HTMLInputElement
    const button = screen.getByLabelText('Subscribe to the newsletter') as HTMLButtonElement

    fireEvent.change(input, { target: { value: 'user@example.com' } })
    fireEvent.click(button)

    // While loading, input should be disabled
    await waitFor(() => {
      expect(input).toBeDisabled()
      expect(button).toBeDisabled()
    })

    // Resolve to clean up
    resolvePromise!({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    })
  })
})
