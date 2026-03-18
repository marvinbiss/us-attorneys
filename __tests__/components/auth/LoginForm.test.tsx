/**
 * LoginForm Component — Unit Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { LoginForm } from '@/components/auth/login-form'

// ── Mocks ────────────────────────────────────────────────────────────────

const mockPush = vi.fn()
const mockRefresh = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
  }),
}))

const mockSignInWithPassword = vi.fn()

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      signInWithPassword: mockSignInWithPassword,
    },
  }),
}))

// ── Tests ────────────────────────────────────────────────────────────────

describe('LoginForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ── Rendering ──────────────────────────────────────────────────────

  it('renders email and password fields', () => {
    render(<LoginForm />)
    expect(screen.getByPlaceholderText('you@example.com')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument()
  })

  it('renders submit button with "Sign in" text', () => {
    render(<LoginForm />)
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeInTheDocument()
  })

  it('renders email field as required', () => {
    render(<LoginForm />)
    const emailInput = screen.getByPlaceholderText('you@example.com')
    expect(emailInput).toBeRequired()
  })

  it('renders password field as required', () => {
    render(<LoginForm />)
    const passwordInput = screen.getByPlaceholderText('••••••••')
    expect(passwordInput).toBeRequired()
  })

  it('has a "Forgot password?" link', () => {
    render(<LoginForm />)
    const link = screen.getByText('Forgot password?')
    expect(link).toBeInTheDocument()
    expect(link.closest('a')).toHaveAttribute('href', '/forgot-password')
  })

  it('has a "Remember me" checkbox', () => {
    render(<LoginForm />)
    expect(screen.getByText('Remember me')).toBeInTheDocument()
    expect(screen.getByRole('checkbox')).toBeInTheDocument()
  })

  // ── State changes ──────────────────────────────────────────────────

  it('updates email state on change', () => {
    render(<LoginForm />)
    const emailInput = screen.getByPlaceholderText('you@example.com')
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    expect(emailInput).toHaveValue('test@example.com')
  })

  it('updates password state on change', () => {
    render(<LoginForm />)
    const passwordInput = screen.getByPlaceholderText('••••••••')
    fireEvent.change(passwordInput, { target: { value: 'secret123' } })
    expect(passwordInput).toHaveValue('secret123')
  })

  // ── Loading state ──────────────────────────────────────────────────

  it('shows "Signing in..." during submission', async () => {
    mockSignInWithPassword.mockReturnValue(new Promise(() => {})) // never resolves
    render(<LoginForm />)

    fireEvent.change(screen.getByPlaceholderText('you@example.com'), {
      target: { value: 'test@example.com' },
    })
    fireEvent.change(screen.getByPlaceholderText('••••••••'), {
      target: { value: 'password123' },
    })
    fireEvent.submit(screen.getByRole('button', { name: 'Sign in' }))

    await waitFor(() => {
      expect(screen.getByText('Signing in...')).toBeInTheDocument()
    })
  })

  it('disables button during loading', async () => {
    mockSignInWithPassword.mockReturnValue(new Promise(() => {}))
    render(<LoginForm />)

    fireEvent.change(screen.getByPlaceholderText('you@example.com'), {
      target: { value: 'test@example.com' },
    })
    fireEvent.change(screen.getByPlaceholderText('••••••••'), {
      target: { value: 'password123' },
    })
    fireEvent.submit(screen.getByRole('button', { name: 'Sign in' }))

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Signing in...' })).toBeDisabled()
    })
  })

  // ── Successful submission ──────────────────────────────────────────

  it('calls supabase.auth.signInWithPassword on submit', async () => {
    mockSignInWithPassword.mockResolvedValue({ error: null })
    render(<LoginForm />)

    fireEvent.change(screen.getByPlaceholderText('you@example.com'), {
      target: { value: 'john@law.com' },
    })
    fireEvent.change(screen.getByPlaceholderText('••••••••'), {
      target: { value: 'password123' },
    })
    fireEvent.submit(screen.getByRole('button', { name: 'Sign in' }))

    await waitFor(() => {
      expect(mockSignInWithPassword).toHaveBeenCalledWith({
        email: 'john@law.com',
        password: 'password123',
      })
    })
  })

  it('redirects to /attorney-dashboard on success', async () => {
    mockSignInWithPassword.mockResolvedValue({ error: null })
    render(<LoginForm />)

    fireEvent.change(screen.getByPlaceholderText('you@example.com'), {
      target: { value: 'john@law.com' },
    })
    fireEvent.change(screen.getByPlaceholderText('••••••••'), {
      target: { value: 'password123' },
    })
    fireEvent.submit(screen.getByRole('button', { name: 'Sign in' }))

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/attorney-dashboard')
      expect(mockRefresh).toHaveBeenCalled()
    })
  })

  // ── Error handling ─────────────────────────────────────────────────

  it('shows "Incorrect email or password" on Invalid login error', async () => {
    mockSignInWithPassword.mockResolvedValue({
      error: { message: 'Invalid login credentials' },
    })
    render(<LoginForm />)

    fireEvent.change(screen.getByPlaceholderText('you@example.com'), {
      target: { value: 'wrong@example.com' },
    })
    fireEvent.change(screen.getByPlaceholderText('••••••••'), {
      target: { value: 'badpassword' },
    })
    fireEvent.submit(screen.getByRole('button', { name: 'Sign in' }))

    await waitFor(() => {
      expect(screen.getByText('Incorrect email or password')).toBeInTheDocument()
    })
  })

  it('shows auth error message for non-login errors', async () => {
    mockSignInWithPassword.mockResolvedValue({
      error: { message: 'Email not confirmed' },
    })
    render(<LoginForm />)

    fireEvent.change(screen.getByPlaceholderText('you@example.com'), {
      target: { value: 'test@example.com' },
    })
    fireEvent.change(screen.getByPlaceholderText('••••••••'), {
      target: { value: 'password123' },
    })
    fireEvent.submit(screen.getByRole('button', { name: 'Sign in' }))

    await waitFor(() => {
      expect(screen.getByText('Email not confirmed')).toBeInTheDocument()
    })
  })

  it('shows generic error on unexpected failure', async () => {
    mockSignInWithPassword.mockRejectedValue(new Error('Network error'))
    render(<LoginForm />)

    fireEvent.change(screen.getByPlaceholderText('you@example.com'), {
      target: { value: 'test@example.com' },
    })
    fireEvent.change(screen.getByPlaceholderText('••••••••'), {
      target: { value: 'password123' },
    })
    fireEvent.submit(screen.getByRole('button', { name: 'Sign in' }))

    await waitFor(() => {
      expect(screen.getByText('An error occurred')).toBeInTheDocument()
    })
  })
})
