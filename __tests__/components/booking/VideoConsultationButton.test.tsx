/**
 * VideoConsultationButton Component -- Unit Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import VideoConsultationButton from '@/components/booking/VideoConsultationButton'

// ── Helpers ──────────────────────────────────────────────────────────────

/** Build an ISO date string offset from "now" by `offsetMinutes`. */
function scheduledAtOffset(offsetMinutes: number): string {
  return new Date(Date.now() + offsetMinutes * 60_000).toISOString()
}

// ── Setup ────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn())
  vi.stubGlobal('open', vi.fn())
})

afterEach(() => {
  vi.restoreAllMocks()
})

// ── Tests ────────────────────────────────────────────────────────────────

describe('VideoConsultationButton', () => {
  // ── Hidden states ────────────────────────────────────────────────────

  it('renders nothing when status is not confirmed', () => {
    const { container } = render(
      <VideoConsultationButton
        bookingId="b1"
        scheduledAt={scheduledAtOffset(5)}
        durationMinutes={30}
        status="pending"
      />
    )
    expect(container.innerHTML).toBe('')
  })

  it('renders nothing when status is cancelled', () => {
    const { container } = render(
      <VideoConsultationButton
        bookingId="b1"
        scheduledAt={scheduledAtOffset(5)}
        durationMinutes={30}
        status="cancelled"
      />
    )
    expect(container.innerHTML).toBe('')
  })

  it('renders nothing when booking is far in the future (>15 min before start)', () => {
    const { container } = render(
      <VideoConsultationButton
        bookingId="b1"
        scheduledAt={scheduledAtOffset(60)}
        durationMinutes={30}
        status="confirmed"
      />
    )
    expect(container.innerHTML).toBe('')
  })

  // ── Countdown state ──────────────────────────────────────────────────

  it('shows countdown when booking is within 15 minutes before start', () => {
    render(
      <VideoConsultationButton
        bookingId="b1"
        scheduledAt={scheduledAtOffset(10)}
        durationMinutes={30}
        status="confirmed"
      />
    )
    expect(screen.getByText(/Starts in 10 minutes/)).toBeInTheDocument()
    expect(screen.getByText(/Join early/)).toBeInTheDocument()
  })

  it('shows singular "minute" when 1 minute away', () => {
    render(
      <VideoConsultationButton
        bookingId="b1"
        scheduledAt={scheduledAtOffset(1)}
        durationMinutes={30}
        status="confirmed"
      />
    )
    expect(screen.getByText(/Starts in 1 minute —/)).toBeInTheDocument()
  })

  // ── Joinable state ──────────────────────────────────────────────────

  it('shows "Join Now" with live indicator when session is active', () => {
    // scheduledAt is 5 minutes in the past, duration 30 min => within window
    render(
      <VideoConsultationButton
        bookingId="b1"
        scheduledAt={scheduledAtOffset(-5)}
        durationMinutes={30}
        status="confirmed"
      />
    )
    expect(screen.getByText('Join Now')).toBeInTheDocument()
  })

  it('shows pulsing dot in joinable state', () => {
    const { container } = render(
      <VideoConsultationButton
        bookingId="b1"
        scheduledAt={scheduledAtOffset(-5)}
        durationMinutes={30}
        status="confirmed"
      />
    )
    const pulseDot = container.querySelector('.animate-ping')
    expect(pulseDot).toBeInTheDocument()
  })

  // ── Ended state ──────────────────────────────────────────────────────

  it('shows "Call ended" when past the window end (+15 min after duration)', () => {
    // scheduledAt = 120 min ago, duration = 30 min => ended at -90 min, window ended at -75 min
    render(
      <VideoConsultationButton
        bookingId="b1"
        scheduledAt={scheduledAtOffset(-120)}
        durationMinutes={30}
        status="confirmed"
      />
    )
    expect(screen.getByText('Call ended')).toBeInTheDocument()
  })

  // ── Join flow (success) ──────────────────────────────────────────────

  it('calls fetch and opens room URL on successful join', async () => {
    const mockFetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({ success: true, data: { room_url: 'https://daily.co/room-123' } }),
    })
    vi.stubGlobal('fetch', mockFetch)

    const mockOpen = vi.fn()
    vi.stubGlobal('open', mockOpen)

    render(
      <VideoConsultationButton
        bookingId="b1"
        scheduledAt={scheduledAtOffset(-5)}
        durationMinutes={30}
        status="confirmed"
      />
    )

    fireEvent.click(screen.getByText('Join Now'))

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/bookings/b1/join')
    })

    await waitFor(() => {
      expect(mockOpen).toHaveBeenCalledWith('https://daily.co/room-123', '_blank')
    })
  })

  // ── Join flow (error) ────────────────────────────────────────────────

  it('shows error message when join API fails', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ error: { message: 'Room not available' } }),
    })
    vi.stubGlobal('fetch', mockFetch)

    render(
      <VideoConsultationButton
        bookingId="b1"
        scheduledAt={scheduledAtOffset(-5)}
        durationMinutes={30}
        status="confirmed"
      />
    )

    fireEvent.click(screen.getByText('Join Now'))

    await waitFor(() => {
      expect(screen.getByText('Room not available')).toBeInTheDocument()
    })
  })

  it('shows generic error when join API returns non-JSON error', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      json: () => Promise.reject(new Error('not json')),
    })
    vi.stubGlobal('fetch', mockFetch)

    render(
      <VideoConsultationButton
        bookingId="b1"
        scheduledAt={scheduledAtOffset(-5)}
        durationMinutes={30}
        status="confirmed"
      />
    )

    fireEvent.click(screen.getByText('Join Now'))

    await waitFor(() => {
      expect(screen.getByText('Failed to join call')).toBeInTheDocument()
    })
  })

  it('shows "Opening..." while join request is in flight', async () => {
    let resolvePromise!: (v: unknown) => void
    const pending = new Promise((r) => {
      resolvePromise = r
    })

    const mockFetch = vi.fn().mockReturnValue(pending)
    vi.stubGlobal('fetch', mockFetch)

    render(
      <VideoConsultationButton
        bookingId="b1"
        scheduledAt={scheduledAtOffset(-5)}
        durationMinutes={30}
        status="confirmed"
      />
    )

    fireEvent.click(screen.getByText('Join Now'))

    await waitFor(() => {
      expect(screen.getByText('Opening...')).toBeInTheDocument()
    })

    // Resolve to avoid dangling promise warning
    await act(async () => {
      resolvePromise({
        ok: true,
        json: () => Promise.resolve({ room_url: 'https://daily.co/room' }),
      })
    })
  })

  // ── Button disabled while joining ────────────────────────────────────

  it('disables the button while join is processing', async () => {
    let resolvePromise!: (v: unknown) => void
    const pending = new Promise((r) => {
      resolvePromise = r
    })

    vi.stubGlobal('fetch', vi.fn().mockReturnValue(pending))

    render(
      <VideoConsultationButton
        bookingId="b1"
        scheduledAt={scheduledAtOffset(-5)}
        durationMinutes={30}
        status="confirmed"
      />
    )

    const button = screen.getByRole('button')
    fireEvent.click(button)

    await waitFor(() => {
      expect(button).toBeDisabled()
    })

    await act(async () => {
      resolvePromise({
        ok: true,
        json: () => Promise.resolve({ room_url: 'https://daily.co/room' }),
      })
    })
  })

  // ── Network error ────────────────────────────────────────────────────

  it('handles network error gracefully', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')))

    render(
      <VideoConsultationButton
        bookingId="b1"
        scheduledAt={scheduledAtOffset(-5)}
        durationMinutes={30}
        status="confirmed"
      />
    )

    fireEvent.click(screen.getByText('Join Now'))

    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument()
    })
  })

  it('handles non-Error thrown value', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue('string error'))

    render(
      <VideoConsultationButton
        bookingId="b1"
        scheduledAt={scheduledAtOffset(-5)}
        durationMinutes={30}
        status="confirmed"
      />
    )

    fireEvent.click(screen.getByText('Join Now'))

    await waitFor(() => {
      expect(screen.getByText('An error occurred')).toBeInTheDocument()
    })
  })
})
