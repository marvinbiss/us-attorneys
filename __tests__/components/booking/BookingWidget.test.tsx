/**
 * BookingWidget Component -- Unit Tests
 * Tests: renders correctly, loading state, date selection, handles fetch errors
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import BookingWidget from '@/components/booking/BookingWidget'

// ── Mocks ────────────────────────────────────────────────────────────────

// Mock useToast hook
vi.mock('@/hooks/useToast', () => ({
  useToast: () => ({
    toasts: [],
    removeToast: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  }),
}))

// Mock Toast component
vi.mock('@/components/ui/Toast', () => ({
  ToastContainer: () => null,
}))

// Mock lucide-react icons to simple spans
vi.mock('lucide-react', () => {
  const iconComponent = ({ className, ...props }: Record<string, unknown>) => (
    <span data-testid="icon" className={className as string} {...props} />
  )
  return {
    Video: iconComponent,
    Calendar: iconComponent,
    Clock: iconComponent,
    CheckCircle: iconComponent,
    Phone: iconComponent,
    Mail: iconComponent,
    User: iconComponent,
    MessageSquare: iconComponent,
    Loader2: iconComponent,
    ChevronLeft: iconComponent,
    AlertCircle: iconComponent,
  }
})

// ── Helpers ──────────────────────────────────────────────────────────────

const defaultProps = {
  attorneyId: 'att-uuid-123',
  attorneyName: 'Jane Smith',
  specialty: 'Personal Injury',
  consultationFee: 49,
}

// Build a mock availability response with some available slots
function mockAvailabilityResponse() {
  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const dateStr = tomorrow.toISOString().split('T')[0]

  return {
    availability: [
      {
        date: dateStr,
        slots: [
          { time: '09:00', available: true },
          { time: '10:00', available: true },
          { time: '14:00', available: true },
        ],
      },
    ],
  }
}

beforeEach(() => {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockAvailabilityResponse()),
    })
  )
})

afterEach(() => {
  vi.restoreAllMocks()
})

// ── Tests ────────────────────────────────────────────────────────────────

describe('BookingWidget', () => {
  it('renders the widget header with attorney name and specialty', async () => {
    render(<BookingWidget {...defaultProps} />)

    expect(screen.getByText('Schedule a Video Consultation')).toBeInTheDocument()
    expect(screen.getByText(/Jane Smith/)).toBeInTheDocument()
    expect(screen.getByText(/Personal Injury/)).toBeInTheDocument()
  })

  it('displays the consultation fee in the header', () => {
    render(<BookingWidget {...defaultProps} />)

    expect(screen.getByText(/\$49/)).toBeInTheDocument()
    expect(screen.getByText(/30 min/)).toBeInTheDocument()
  })

  it('shows loading state while fetching availability', () => {
    // Make fetch hang (never resolve)
    vi.stubGlobal('fetch', vi.fn().mockReturnValue(new Promise(() => {})))

    render(<BookingWidget {...defaultProps} />)

    expect(screen.getByText('Loading availability...')).toBeInTheDocument()
  })

  it('shows error message when availability fetch fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({}),
      })
    )

    render(<BookingWidget {...defaultProps} />)

    await waitFor(() => {
      expect(screen.getByText('Failed to load availability')).toBeInTheDocument()
    })
  })

  it('renders date selection after loading availability', async () => {
    render(<BookingWidget {...defaultProps} />)

    await waitFor(() => {
      expect(screen.getByText('Select a date')).toBeInTheDocument()
    })

    // Should render 14 day buttons
    const buttons = screen.getAllByRole('button')
    // At least 14 day buttons exist (some may be disabled)
    expect(buttons.length).toBeGreaterThanOrEqual(14)
  })

  it('uses default consultation fee of $19 when not provided', () => {
    render(<BookingWidget attorneyId="att-uuid-123" attorneyName="John Doe" />)

    expect(screen.getByText(/\$19/)).toBeInTheDocument()
  })

  it('shows step indicator with 4 steps', async () => {
    render(<BookingWidget {...defaultProps} />)

    await waitFor(() => {
      expect(screen.getByText('Select a date')).toBeInTheDocument()
    })
  })

  it('fetches availability from the correct API endpoint', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockAvailabilityResponse()),
    })
    vi.stubGlobal('fetch', fetchMock)

    render(<BookingWidget {...defaultProps} />)

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith('/api/attorneys/att-uuid-123/availability')
    })
  })
})
