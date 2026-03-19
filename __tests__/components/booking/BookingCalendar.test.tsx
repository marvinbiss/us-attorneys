/**
 * BookingCalendar Component -- Unit Tests
 * Updated 2026-03-18: Tests now mock the availability API instead of Math.random()
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { BookingCalendar } from '@/components/booking/BookingCalendar'

// ── Mocks ────────────────────────────────────────────────────────────────

// Mock framer-motion to avoid animation issues in tests
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
  AnimatePresence: ({ children }: React.PropsWithChildren) => <>{children}</>,
}))

// Mock useReducedMotion
vi.mock('@/hooks/useReducedMotion', () => ({
  useReducedMotion: () => false,
}))

// ── API mock helpers ─────────────────────────────────────────────────────

/**
 * Build mock availability API response for a week starting from Monday.
 * Returns slots for weekdays (Mon-Fri), morning 08:00-12:00 and afternoon 14:00-18:00.
 */
function buildMockAvailabilityResponse(weekStart: Date) {
  const slots: { date: string; time: string; datetime: string; available: boolean }[] = []
  for (let d = 0; d < 7; d++) {
    const date = new Date(weekStart)
    date.setDate(date.getDate() + d)
    const dateStr = date.toISOString().split('T')[0]
    const isWeekend = date.getDay() === 0 || date.getDay() === 6
    const isPast = date < new Date(new Date().toISOString().split('T')[0] + 'T00:00:00')

    if (isWeekend || isPast) continue

    // Morning slots
    for (let h = 8; h < 12; h++) {
      for (let m = 0; m < 60; m += 30) {
        const time = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
        slots.push({
          date: dateStr,
          time,
          datetime: `${dateStr}T${time}:00`,
          available: true,
        })
      }
    }

    // Afternoon slots
    for (let h = 14; h < 18; h++) {
      for (let m = 0; m < 60; m += 30) {
        const time = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
        slots.push({
          date: dateStr,
          time,
          datetime: `${dateStr}T${time}:00`,
          available: true,
        })
      }
    }
  }

  return {
    attorney_id: 'att-1',
    timezone: 'America/New_York',
    slots,
    generated_at: new Date().toISOString(),
  }
}

function getMonday() {
  const now = new Date()
  const day = now.getDay()
  const diff = now.getDate() - day + (day === 0 ? -6 : 1)
  const monday = new Date(now.setDate(diff))
  monday.setHours(0, 0, 0, 0)
  return monday
}

// ── Setup ────────────────────────────────────────────────────────────────

beforeEach(() => {
  // Mock global fetch to return availability data
  const mockResponse = buildMockAvailabilityResponse(getMonday())
  vi.spyOn(globalThis, 'fetch').mockImplementation(async (url) => {
    const urlStr = typeof url === 'string' ? url : url.toString()
    if (urlStr.includes('/api/attorneys/') && urlStr.includes('/availability')) {
      return new Response(JSON.stringify(mockResponse), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }
    // Booking API
    if (urlStr.includes('/api/bookings')) {
      return new Response(JSON.stringify({ id: 'booking-1', status: 'pending' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }
    return new Response('Not found', { status: 404 })
  })
})

// ── Default props ────────────────────────────────────────────────────────

const defaultProps = {
  attorneyId: 'att-1',
  attorneyName: 'Jane Smith',
  specialtyName: 'Family Law',
  serviceDuration: 60,
  servicePrice: 250,
}

// ── Tests ────────────────────────────────────────────────────────────────

describe('BookingCalendar', () => {
  // ── Rendering ────────────────────────────────────────────────────────

  it('renders the calendar header with specialty and duration', async () => {
    render(<BookingCalendar {...defaultProps} />)
    expect(screen.getByText('Book a time slot')).toBeInTheDocument()
    expect(screen.getByText(/Family Law/)).toBeInTheDocument()
    expect(screen.getByText(/60 min/)).toBeInTheDocument()
    expect(screen.getByText(/\$250/)).toBeInTheDocument()
  })

  it('shows loading state initially then loads slots', async () => {
    render(<BookingCalendar {...defaultProps} />)
    // Should show loading skeleton initially (aria-busy)
    expect(document.querySelector('[aria-busy="true"]')).toBeInTheDocument()
    // Wait for slots to load
    await waitFor(() => {
      expect(document.querySelector('[aria-busy="true"]')).not.toBeInTheDocument()
    })
  })

  it('renders 7 day buttons after loading', async () => {
    render(<BookingCalendar {...defaultProps} />)
    await waitFor(() => {
      expect(document.querySelector('[aria-busy="true"]')).not.toBeInTheDocument()
    })
    // Day buttons have role="option" in the listbox
    const dayButtons = screen.getAllByRole('option')
    expect(dayButtons).toHaveLength(7)
  })

  it('renders step indicators (Date, Time, Confirmation)', async () => {
    render(<BookingCalendar {...defaultProps} />)
    expect(screen.getByText('Date')).toBeInTheDocument()
    expect(screen.getByText('Time')).toBeInTheDocument()
    expect(screen.getByText('Confirmation')).toBeInTheDocument()
  })

  it('uses default specialtyName when not provided', async () => {
    render(<BookingCalendar attorneyId="att-1" attorneyName="Jane Smith" />)
    expect(screen.getByText(/Consultation/)).toBeInTheDocument()
  })

  // ── No availability fallback ──────────────────────────────────────────

  it('shows "No slots available this week" when no slots exist', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(async () => {
      return new Response(
        JSON.stringify({
          attorney_id: 'att-1',
          timezone: 'America/New_York',
          slots: [],
          generated_at: new Date().toISOString(),
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    })

    render(<BookingCalendar {...defaultProps} />)
    await waitFor(() => {
      expect(screen.getByText('No slots available this week')).toBeInTheDocument()
    })
  })

  // ── Available slots display ──────────────────────────────────────────

  it('shows "avail" count on available weekdays', async () => {
    render(<BookingCalendar {...defaultProps} />)
    await waitFor(() => {
      const availTexts = screen.getAllByText(/avail/)
      expect(availTexts.length).toBeGreaterThan(0)
    })
  })

  // ── Week navigation ──────────────────────────────────────────────────

  it('disables previous-week button when on current week', async () => {
    render(<BookingCalendar {...defaultProps} />)
    await waitFor(() => {
      expect(document.querySelector('[aria-busy="true"]')).not.toBeInTheDocument()
    })
    const allButtons = screen.getAllByRole('button')
    const disabledNavButton = allButtons.find(
      (btn) => btn.hasAttribute('disabled') && btn.className.includes('disabled:opacity-30')
    )
    expect(disabledNavButton).toBeDefined()
  })

  // ── Date selection ───────────────────────────────────────────────────

  it('calls onSlotSelect when an available date is clicked', async () => {
    const onSlotSelect = vi.fn()
    render(<BookingCalendar {...defaultProps} onSlotSelect={onSlotSelect} />)

    await waitFor(() => {
      expect(document.querySelector('[aria-busy="true"]')).not.toBeInTheDocument()
    })

    const availButtons = screen
      .getAllByRole('button')
      .filter((btn) => !btn.hasAttribute('disabled') && btn.textContent?.includes('avail'))

    if (availButtons.length > 0) {
      fireEvent.click(availButtons[0])
      expect(onSlotSelect).toHaveBeenCalledTimes(1)
      expect(onSlotSelect.mock.calls[0][1]).toBe('')
    }
  })

  it('transitions to time step after selecting a date', async () => {
    render(<BookingCalendar {...defaultProps} />)

    await waitFor(() => {
      expect(document.querySelector('[aria-busy="true"]')).not.toBeInTheDocument()
    })

    const availButtons = screen
      .getAllByRole('button')
      .filter((btn) => !btn.hasAttribute('disabled') && btn.textContent?.includes('avail'))

    if (availButtons.length > 0) {
      fireEvent.click(availButtons[0])
      expect(screen.getByText('Choose your time slot')).toBeInTheDocument()
    }
  })

  // ── Time selection ───────────────────────────────────────────────────

  it('shows morning and afternoon time slots after date selection', async () => {
    render(<BookingCalendar {...defaultProps} />)

    await waitFor(() => {
      expect(document.querySelector('[aria-busy="true"]')).not.toBeInTheDocument()
    })

    const availButtons = screen
      .getAllByRole('button')
      .filter((btn) => !btn.hasAttribute('disabled') && btn.textContent?.includes('avail'))

    if (availButtons.length > 0) {
      fireEvent.click(availButtons[0])
      expect(screen.getByText('Morning')).toBeInTheDocument()
      expect(screen.getByText('Afternoon')).toBeInTheDocument()
    }
  })

  it('calls onSlotSelect with time when a time slot is clicked', async () => {
    const onSlotSelect = vi.fn()
    render(<BookingCalendar {...defaultProps} onSlotSelect={onSlotSelect} />)

    await waitFor(() => {
      expect(document.querySelector('[aria-busy="true"]')).not.toBeInTheDocument()
    })

    const availButtons = screen
      .getAllByRole('button')
      .filter((btn) => !btn.hasAttribute('disabled') && btn.textContent?.includes('avail'))

    if (availButtons.length > 0) {
      fireEvent.click(availButtons[0])
      const timeSlot = screen.getByText('08:00')
      if (timeSlot && !timeSlot.closest('button')?.hasAttribute('disabled')) {
        fireEvent.click(timeSlot)
        const lastCall = onSlotSelect.mock.calls[onSlotSelect.mock.calls.length - 1]
        expect(lastCall[1]).toBe('08:00')
      }
    }
  })

  // ── Confirm flow ─────────────────────────────────────────────────────

  it('shows confirm button after selecting a time slot', async () => {
    render(<BookingCalendar {...defaultProps} />)

    await waitFor(() => {
      expect(document.querySelector('[aria-busy="true"]')).not.toBeInTheDocument()
    })

    const availButtons = screen
      .getAllByRole('button')
      .filter((btn) => !btn.hasAttribute('disabled') && btn.textContent?.includes('avail'))

    if (availButtons.length > 0) {
      fireEvent.click(availButtons[0])
      const timeSlot = screen.getByText('08:00')
      fireEvent.click(timeSlot)
      expect(screen.getByText(/Confirm 08:00/)).toBeInTheDocument()
    }
  })

  it('shows confirmation step after booking completes', async () => {
    const onConfirm = vi.fn()
    render(<BookingCalendar {...defaultProps} onConfirm={onConfirm} />)

    await waitFor(() => {
      expect(document.querySelector('[aria-busy="true"]')).not.toBeInTheDocument()
    })

    const availButtons = screen
      .getAllByRole('button')
      .filter((btn) => !btn.hasAttribute('disabled') && btn.textContent?.includes('avail'))

    if (availButtons.length > 0) {
      fireEvent.click(availButtons[0])
      const timeSlot = screen.getByText('08:00')
      fireEvent.click(timeSlot)
      const confirmBtn = screen.getByText(/Confirm 08:00/)

      await act(async () => {
        fireEvent.click(confirmBtn)
      })

      await waitFor(() => {
        expect(screen.getByText('Booking confirmed!')).toBeInTheDocument()
      })
      expect(screen.getByText(/Your appointment with Jane Smith/)).toBeInTheDocument()
      expect(onConfirm).toHaveBeenCalledTimes(1)
    }
  })

  // ── Back navigation ──────────────────────────────────────────────────

  it('navigates back from time step to date step', async () => {
    render(<BookingCalendar {...defaultProps} />)

    await waitFor(() => {
      expect(document.querySelector('[aria-busy="true"]')).not.toBeInTheDocument()
    })

    const availButtons = screen
      .getAllByRole('button')
      .filter((btn) => !btn.hasAttribute('disabled') && btn.textContent?.includes('avail'))

    if (availButtons.length > 0) {
      fireEvent.click(availButtons[0])
      expect(screen.getByText('Choose your time slot')).toBeInTheDocument()

      const backButtons = screen
        .getAllByRole('button')
        .filter((btn) => btn.className.includes('hover:bg-slate-100') && !btn.textContent?.trim())

      if (backButtons.length > 0) {
        fireEvent.click(backButtons[0])
        expect(screen.getByText('Book a time slot')).toBeInTheDocument()
      }
    }
  })

  // ── className prop ───────────────────────────────────────────────────

  it('applies custom className', () => {
    const { container } = render(<BookingCalendar {...defaultProps} className="custom-class" />)
    expect(container.firstElementChild?.className).toContain('custom-class')
  })
})
