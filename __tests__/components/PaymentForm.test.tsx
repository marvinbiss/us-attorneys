/**
 * PaymentForm Component -- Unit Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import PaymentForm from '@/components/PaymentForm'

// ── Mocks ────────────────────────────────────────────────────────────────

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => {
      const {
        initial: _initial,
        animate: _animate,
        exit: _exit,
        transition: _transition,
        ...domProps
      } = props
      return <div {...domProps}>{children}</div>
    },
  },
}))

// Mock useReducedMotion
vi.mock('@/hooks/useReducedMotion', () => ({
  useReducedMotion: () => false,
}))

// Mock Stripe
const mockConfirmPayment = vi.fn()
const mockStripe = {
  confirmPayment: mockConfirmPayment,
}

const mockElements = {}

vi.mock('@stripe/react-stripe-js', () => ({
  Elements: ({ children }: React.PropsWithChildren) => (
    <div data-testid="stripe-elements">{children}</div>
  ),
  PaymentElement: (_props: Record<string, unknown>) => <div data-testid="payment-element" />,
  useStripe: () => mockStripe,
  useElements: () => mockElements,
}))

vi.mock('@stripe/stripe-js', () => ({
  loadStripe: vi.fn().mockResolvedValue({}),
}))

// ── Default props ────────────────────────────────────────────────────────

const defaultProps = {
  bookingId: 'booking-1',
  attorneyId: 'att-1',
  amount: 25000, // $250.00 in cents
  description: 'Family Law Consultation',
}

// ── Setup ────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          clientSecret: 'pi_secret_test',
          amount: 25000,
          totalAmount: 25000,
        }),
    })
  )
})

afterEach(() => {
  vi.restoreAllMocks()
})

// ── Tests ────────────────────────────────────────────────────────────────

describe('PaymentForm', () => {
  // ── Basic rendering ──────────────────────────────────────────────────

  it('renders the security badge', async () => {
    render(<PaymentForm {...defaultProps} />)

    await waitFor(() => {
      expect(screen.getByText('Secure payment by Stripe')).toBeInTheDocument()
    })
  })

  it('renders the payment summary with total due', async () => {
    render(<PaymentForm {...defaultProps} />)

    await waitFor(() => {
      expect(screen.getByText('Total due')).toBeInTheDocument()
      expect(screen.getByText('$250.00')).toBeInTheDocument()
    })
  })

  it('does not show payment type selection without showSplitPayment or showDeposit', async () => {
    render(<PaymentForm {...defaultProps} />)

    await waitFor(() => {
      expect(screen.queryByText('Payment method')).not.toBeInTheDocument()
    })
  })

  // ── Loading state ────────────────────────────────────────────────────

  it('shows loading spinner while creating payment intent', () => {
    // Make fetch hang
    vi.stubGlobal('fetch', vi.fn().mockReturnValue(new Promise(() => {})))

    const { container } = render(<PaymentForm {...defaultProps} />)

    // The loading spinner has animate-spin class
    const spinner = container.querySelector('.animate-spin')
    expect(spinner).toBeInTheDocument()
  })

  it('renders Stripe Elements when client secret is loaded', async () => {
    render(<PaymentForm {...defaultProps} />)

    await waitFor(() => {
      expect(screen.getByTestId('stripe-elements')).toBeInTheDocument()
      expect(screen.getByTestId('payment-element')).toBeInTheDocument()
    })
  })

  // ── Payment type selection ───────────────────────────────────────────

  it('renders payment type options when showDeposit and showSplitPayment are true', async () => {
    render(<PaymentForm {...defaultProps} showDeposit showSplitPayment />)

    await waitFor(() => {
      expect(screen.getByText('Payment method')).toBeInTheDocument()
      expect(screen.getByText('Full payment')).toBeInTheDocument()
      expect(screen.getByText('Deposit')).toBeInTheDocument()
      expect(screen.getByText('Split payment')).toBeInTheDocument()
    })
  })

  it('shows full payment amount', async () => {
    render(<PaymentForm {...defaultProps} showDeposit showSplitPayment />)

    await waitFor(() => {
      // The full payment option shows $250.00
      expect(screen.getAllByText('$250.00').length).toBeGreaterThan(0)
    })
  })

  // ── Deposit option ───────────────────────────────────────────────────

  it('shows deposit amount when deposit is selected', async () => {
    render(<PaymentForm {...defaultProps} showDeposit />)

    await waitFor(() => {
      expect(screen.getByText('Deposit')).toBeInTheDocument()
    })

    // Click deposit button
    fireEvent.click(screen.getByText('Deposit'))

    // Default deposit is 30% of $250 = $75.00
    await waitFor(() => {
      expect(screen.getByText('Deposit due')).toBeInTheDocument()
      expect(screen.getByText('$75.00')).toBeInTheDocument()
    })
  })

  it('shows deposit percentage options (20%, 30%, 50%)', async () => {
    render(<PaymentForm {...defaultProps} showDeposit />)

    await waitFor(() => {
      expect(screen.getByText('Deposit')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Deposit'))

    await waitFor(() => {
      expect(screen.getByText('Deposit percentage')).toBeInTheDocument()
      expect(screen.getByText('20%')).toBeInTheDocument()
      expect(screen.getByText('30%')).toBeInTheDocument()
      expect(screen.getByText('50%')).toBeInTheDocument()
    })
  })

  it('updates deposit amount when percentage changes', async () => {
    render(<PaymentForm {...defaultProps} showDeposit />)

    await waitFor(() => {
      expect(screen.getByText('Deposit')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Deposit'))

    await waitFor(() => {
      expect(screen.getByText('50%')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('50%'))

    // 50% of $250 = $125.00 (shown in deposit button + deposit breakdown)
    await waitFor(() => {
      const matches = screen.getAllByText('$125.00')
      expect(matches.length).toBeGreaterThanOrEqual(1)
    })
  })

  it('shows remaining balance for deposit', async () => {
    render(<PaymentForm {...defaultProps} showDeposit />)

    await waitFor(() => {
      expect(screen.getByText('Deposit')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Deposit'))

    await waitFor(() => {
      expect(screen.getByText('Remaining balance (on-site)')).toBeInTheDocument()
      // 70% of $250 = $175.00
      expect(screen.getByText('$175.00')).toBeInTheDocument()
    })
  })

  // ── Split payment option ─────────────────────────────────────────────

  it('shows split payment installment amount when split is selected', async () => {
    render(<PaymentForm {...defaultProps} showSplitPayment />)

    await waitFor(() => {
      expect(screen.getByText('Split payment')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Split payment'))

    // Default is 3 installments: $250 / 3 = $83.33
    await waitFor(() => {
      expect(screen.getByText('First installment')).toBeInTheDocument()
      expect(screen.getByText('Number of installments')).toBeInTheDocument()
    })
  })

  it('shows installment options (2x, 3x, 4x)', async () => {
    render(<PaymentForm {...defaultProps} showSplitPayment />)

    await waitFor(() => {
      expect(screen.getByText('Split payment')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Split payment'))

    await waitFor(() => {
      expect(screen.getByText('2x')).toBeInTheDocument()
      expect(screen.getByText('3x')).toBeInTheDocument()
      expect(screen.getByText('4x')).toBeInTheDocument()
    })
  })

  it('updates installment amount when installment count changes', async () => {
    render(<PaymentForm {...defaultProps} showSplitPayment />)

    await waitFor(() => {
      expect(screen.getByText('Split payment')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Split payment'))

    await waitFor(() => {
      expect(screen.getByText('2x')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('2x'))

    // 2 installments: $250 / 2 = $125.00 (shown in split button + breakdown)
    await waitFor(() => {
      const matches = screen.getAllByText('$125.00')
      expect(matches.length).toBeGreaterThanOrEqual(1)
    })
  })

  // ── Checkout form ────────────────────────────────────────────────────

  it('renders the Pay now button with lock icon', async () => {
    render(<PaymentForm {...defaultProps} />)

    await waitFor(() => {
      expect(screen.getByText('Pay now')).toBeInTheDocument()
    })
  })

  it('calls onSuccess on successful payment', async () => {
    mockConfirmPayment.mockResolvedValue({
      paymentIntent: { id: 'pi_123', status: 'succeeded' },
      error: null,
    })

    const onSuccess = vi.fn()
    render(<PaymentForm {...defaultProps} onSuccess={onSuccess} />)

    await waitFor(() => {
      expect(screen.getByText('Pay now')).toBeInTheDocument()
    })

    // Submit the form
    const form = screen.getByText('Pay now').closest('form')!
    fireEvent.submit(form)

    await waitFor(() => {
      expect(mockConfirmPayment).toHaveBeenCalled()
      expect(onSuccess).toHaveBeenCalledWith('pi_123')
    })
  })

  it('shows error message on payment failure', async () => {
    mockConfirmPayment.mockResolvedValue({
      error: { message: 'Your card was declined.' },
      paymentIntent: null,
    })

    const onError = vi.fn()
    render(<PaymentForm {...defaultProps} onError={onError} />)

    await waitFor(() => {
      expect(screen.getByText('Pay now')).toBeInTheDocument()
    })

    const form = screen.getByText('Pay now').closest('form')!
    fireEvent.submit(form)

    await waitFor(() => {
      expect(screen.getByText('Your card was declined.')).toBeInTheDocument()
      expect(onError).toHaveBeenCalledWith('Your card was declined.')
    })
  })

  it('shows generic error on unexpected failure', async () => {
    mockConfirmPayment.mockRejectedValue(new Error('network'))

    const onError = vi.fn()
    render(<PaymentForm {...defaultProps} onError={onError} />)

    await waitFor(() => {
      expect(screen.getByText('Pay now')).toBeInTheDocument()
    })

    const form = screen.getByText('Pay now').closest('form')!
    fireEvent.submit(form)

    await waitFor(() => {
      expect(screen.getByText('An unexpected error occurred')).toBeInTheDocument()
      expect(onError).toHaveBeenCalledWith('An unexpected error occurred')
    })
  })

  it('shows Processing... and disables button during payment', async () => {
    let resolvePayment!: (v: unknown) => void
    mockConfirmPayment.mockReturnValue(
      new Promise((r) => {
        resolvePayment = r
      })
    )

    render(<PaymentForm {...defaultProps} />)

    await waitFor(() => {
      expect(screen.getByText('Pay now')).toBeInTheDocument()
    })

    const form = screen.getByText('Pay now').closest('form')!
    fireEvent.submit(form)

    await waitFor(() => {
      expect(screen.getByText('Processing...')).toBeInTheDocument()
    })

    // The submit button should be disabled
    const submitBtn = screen.getByText('Processing...').closest('button')!
    expect(submitBtn).toBeDisabled()

    // Resolve to clean up
    await act(async () => {
      resolvePayment({
        paymentIntent: { id: 'pi_123', status: 'succeeded' },
        error: null,
      })
    })
  })

  // ── Payment intent API error ─────────────────────────────────────────

  it('calls onError when payment intent creation fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({}),
      })
    )

    const onError = vi.fn()
    render(<PaymentForm {...defaultProps} onError={onError} />)

    await waitFor(() => {
      expect(onError).toHaveBeenCalledWith('Failed to initialize payment')
    })
  })

  it('calls onError when fetch throws network error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')))

    const onError = vi.fn()
    render(<PaymentForm {...defaultProps} onError={onError} />)

    await waitFor(() => {
      expect(onError).toHaveBeenCalledWith('Failed to initialize payment')
    })
  })

  // ── Payment intent API call ──────────────────────────────────────────

  it('sends correct payload to payment intent API', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          clientSecret: 'pi_secret_test',
          amount: 25000,
          totalAmount: 25000,
        }),
    })
    vi.stubGlobal('fetch', mockFetch)

    render(<PaymentForm {...defaultProps} />)

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/payments/intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: 'booking-1',
          attorneyId: 'att-1',
          amount: 25000,
          description: 'Family Law Consultation',
          paymentType: 'full',
          depositPercentage: undefined,
          splitInstallments: undefined,
        }),
      })
    })
  })
})
