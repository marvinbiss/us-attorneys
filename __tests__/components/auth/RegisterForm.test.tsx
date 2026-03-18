/**
 * RegisterForm Component — Unit Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { RegisterForm } from '@/components/auth/register-form'

// ── Mocks ────────────────────────────────────────────────────────────────

const mockSignUp = vi.fn()

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      signUp: mockSignUp,
    },
  }),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
}))

// ── Helper ───────────────────────────────────────────────────────────────

function fillForm(overrides: {
  email?: string
  password?: string
  confirmPassword?: string
  acceptTerms?: boolean
} = {}) {
  const {
    email = 'john@law.com',
    password = 'password123',
    confirmPassword = 'password123',
    acceptTerms = true,
  } = overrides

  fireEvent.change(screen.getByPlaceholderText('you@company.com'), {
    target: { value: email },
  })
  fireEvent.change(screen.getByPlaceholderText('8 characters minimum'), {
    target: { value: password },
  })
  fireEvent.change(screen.getByPlaceholderText('••••••••'), {
    target: { value: confirmPassword },
  })
  if (acceptTerms) {
    fireEvent.click(screen.getByRole('checkbox'))
  }
}

function submitForm() {
  fireEvent.submit(screen.getByRole('button', { name: 'Create my account' }))
}

// ── Tests ────────────────────────────────────────────────────────────────

describe('RegisterForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ── Rendering ──────────────────────────────────────────────────────

  it('renders email, password, and confirm password fields', () => {
    render(<RegisterForm />)
    expect(screen.getByPlaceholderText('you@company.com')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('8 characters minimum')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument()
  })

  it('renders terms checkbox', () => {
    render(<RegisterForm />)
    expect(screen.getByRole('checkbox')).toBeInTheDocument()
    expect(screen.getByText(/I accept the/)).toBeInTheDocument()
  })

  it('renders submit button with "Create my account"', () => {
    render(<RegisterForm />)
    expect(screen.getByRole('button', { name: 'Create my account' })).toBeInTheDocument()
  })

  it('links to terms and privacy pages', () => {
    render(<RegisterForm />)
    const termsLink = screen.getByText('terms of service')
    const privacyLink = screen.getByText('privacy policy')
    expect(termsLink.closest('a')).toHaveAttribute('href', '/terms')
    expect(privacyLink.closest('a')).toHaveAttribute('href', '/privacy')
  })

  // ── Validation errors ──────────────────────────────────────────────

  it('shows error when password < 8 characters', async () => {
    render(<RegisterForm />)
    fillForm({ password: 'short', confirmPassword: 'short', acceptTerms: true })
    submitForm()

    await waitFor(() => {
      expect(screen.getByText('Password must be at least 8 characters')).toBeInTheDocument()
    })
  })

  it('shows error when passwords do not match', async () => {
    render(<RegisterForm />)
    fillForm({ password: 'password123', confirmPassword: 'different1', acceptTerms: true })
    submitForm()

    await waitFor(() => {
      expect(screen.getByText('Passwords do not match')).toBeInTheDocument()
    })
  })

  it('shows error when terms not accepted', async () => {
    render(<RegisterForm />)
    fillForm({ acceptTerms: false })
    submitForm()

    await waitFor(() => {
      expect(screen.getByText('You must accept the terms of service')).toBeInTheDocument()
    })
  })

  // ── Loading state ──────────────────────────────────────────────────

  it('shows "Creating..." during submission', async () => {
    mockSignUp.mockReturnValue(new Promise(() => {})) // never resolves
    render(<RegisterForm />)
    fillForm()
    submitForm()

    await waitFor(() => {
      expect(screen.getByText('Creating...')).toBeInTheDocument()
    })
  })

  it('disables button during loading', async () => {
    mockSignUp.mockReturnValue(new Promise(() => {}))
    render(<RegisterForm />)
    fillForm()
    submitForm()

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Creating...' })).toBeDisabled()
    })
  })

  // ── Successful submission ──────────────────────────────────────────

  it('calls supabase.auth.signUp on submit', async () => {
    mockSignUp.mockResolvedValue({ error: null })
    render(<RegisterForm />)
    fillForm({ email: 'jane@lawfirm.com' })
    submitForm()

    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalledWith({
        email: 'jane@lawfirm.com',
        password: 'password123',
        options: {
          emailRedirectTo: expect.stringContaining('/auth/callback'),
        },
      })
    })
  })

  it('shows success state with email confirmation message', async () => {
    mockSignUp.mockResolvedValue({ error: null })
    render(<RegisterForm />)
    fillForm({ email: 'jane@lawfirm.com' })
    submitForm()

    await waitFor(() => {
      expect(screen.getByText('Check your email')).toBeInTheDocument()
      expect(screen.getByText(/confirmation link has been sent/)).toBeInTheDocument()
      expect(screen.getByText('jane@lawfirm.com')).toBeInTheDocument()
    })
  })

  // ── Error handling ─────────────────────────────────────────────────

  it('shows error on auth failure', async () => {
    mockSignUp.mockResolvedValue({
      error: { message: 'User already registered' },
    })
    render(<RegisterForm />)
    fillForm()
    submitForm()

    await waitFor(() => {
      expect(screen.getByText('User already registered')).toBeInTheDocument()
    })
  })

  it('shows generic error on unexpected failure', async () => {
    mockSignUp.mockRejectedValue(new Error('Network error'))
    render(<RegisterForm />)
    fillForm()
    submitForm()

    await waitFor(() => {
      expect(screen.getByText('An error occurred')).toBeInTheDocument()
    })
  })
})
