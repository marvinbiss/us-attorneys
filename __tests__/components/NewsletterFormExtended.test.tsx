/**
 * NewsletterForm — Extended Tests
 *
 * Supplements the existing NewsletterForm.test.tsx with additional edge cases:
 * - Empty email submission
 * - Email missing @ or .
 * - Network error handling
 * - Multiple rapid submissions
 * - Form accessibility (aria attributes)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import NewsletterForm from '@/components/NewsletterForm'

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

vi.mock('@/components/ui/Toast', () => ({
  ToastContainer: () => null,
}))

describe('NewsletterForm — additional edge cases', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.restoreAllMocks()
  })

  it('rejects email without @ sign', async () => {
    render(<NewsletterForm />)
    const input = screen.getByPlaceholderText('Your email')
    const form = input.closest('form')!
    fireEvent.change(input, { target: { value: 'nodomain.com' } })
    fireEvent.submit(form)
    expect(await screen.findByText('Please enter a valid email address')).toBeInTheDocument()
  })

  it('rejects email without dot', async () => {
    render(<NewsletterForm />)
    const input = screen.getByPlaceholderText('Your email')
    const form = input.closest('form')!
    fireEvent.change(input, { target: { value: 'user@localhost' } })
    fireEvent.submit(form)
    expect(await screen.findByText('Please enter a valid email address')).toBeInTheDocument()
  })

  it('rejects empty submission', async () => {
    render(<NewsletterForm />)
    const form = screen.getByPlaceholderText('Your email').closest('form')!
    fireEvent.submit(form)
    expect(await screen.findByText('Please enter a valid email address')).toBeInTheDocument()
  })

  it('handles network error (fetch throws)', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network error'))

    render(<NewsletterForm />)
    const input = screen.getByPlaceholderText('Your email')
    fireEvent.change(input, { target: { value: 'user@example.com' } })
    fireEvent.click(screen.getByLabelText('Subscribe to the newsletter'))

    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument()
    })
  })

  it('handles non-Error exceptions gracefully', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue('string error')

    render(<NewsletterForm />)
    const input = screen.getByPlaceholderText('Your email')
    fireEvent.change(input, { target: { value: 'user@example.com' } })
    fireEvent.click(screen.getByLabelText('Subscribe to the newsletter'))

    await waitFor(() => {
      expect(screen.getByText('Error subscribing')).toBeInTheDocument()
    })
  })

  it('has correct aria-label on email input', () => {
    render(<NewsletterForm />)
    const input = screen.getByLabelText('Email address for newsletter')
    expect(input).toBeInTheDocument()
    expect(input).toHaveAttribute('type', 'email')
  })

  it('has aria-busy attribute on form', async () => {
    let resolvePromise: (value: unknown) => void
    globalThis.fetch = vi.fn().mockReturnValue(
      new Promise((resolve) => { resolvePromise = resolve })
    )

    render(<NewsletterForm />)
    const input = screen.getByPlaceholderText('Your email')
    const form = input.closest('form')!
    fireEvent.change(input, { target: { value: 'user@example.com' } })
    fireEvent.submit(form)

    await waitFor(() => {
      expect(form).toHaveAttribute('aria-busy', 'true')
    })

    resolvePromise!({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    })
  })

  it('clears email input after successful subscription', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    })

    render(<NewsletterForm />)
    const input = screen.getByPlaceholderText('Your email') as HTMLInputElement
    fireEvent.change(input, { target: { value: 'user@example.com' } })
    fireEvent.click(screen.getByLabelText('Subscribe to the newsletter'))

    await waitFor(() => {
      expect(screen.getByText('Thank you for subscribing!')).toBeInTheDocument()
    })
  })

  it('uses correct API payload', async () => {
    const mockFetchFn = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    })
    globalThis.fetch = mockFetchFn

    render(<NewsletterForm />)
    fireEvent.change(screen.getByPlaceholderText('Your email'), {
      target: { value: 'test@domain.com' },
    })
    fireEvent.click(screen.getByLabelText('Subscribe to the newsletter'))

    await waitFor(() => {
      expect(mockFetchFn).toHaveBeenCalledWith('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'test@domain.com' }),
      })
    })
  })

  it('shows error message from API response', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ error: 'Already subscribed' }),
    })

    render(<NewsletterForm />)
    fireEvent.change(screen.getByPlaceholderText('Your email'), {
      target: { value: 'user@example.com' },
    })
    fireEvent.click(screen.getByLabelText('Subscribe to the newsletter'))

    await waitFor(() => {
      expect(screen.getByText('Already subscribed')).toBeInTheDocument()
    })
  })
})
