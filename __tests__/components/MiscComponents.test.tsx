/**
 * Miscellaneous Components — Unit Tests
 *
 * Tests for SpeakableAnswerBox, SearchRecorder, and MicroConversions.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act, fireEvent } from '@testing-library/react'

// ── Mock dependencies ────────────────────────────────────────────────

vi.mock('@/lib/seo/config', () => ({
  SITE_NAME: 'Lawtendr',
  SITE_URL: 'https://lawtendr.com',
}))

vi.mock('@/lib/analytics/tracking', () => ({
  trackEvent: vi.fn(),
}))

vi.mock('@/components/RecentSearches', () => ({
  recordSearch: vi.fn(),
}))

// ── Imports after mocks ──────────────────────────────────────────────
import { SpeakableAnswerBox } from '@/components/SpeakableAnswerBox'
import SearchRecorder from '@/components/SearchRecorder'
import MicroConversions from '@/components/MicroConversions'
import { trackEvent } from '@/lib/analytics/tracking'
import { recordSearch } from '@/components/RecentSearches'

// =====================================================================
//  SpeakableAnswerBox
// =====================================================================

describe('SpeakableAnswerBox', () => {
  it('renders the answer text', () => {
    render(<SpeakableAnswerBox answer="The statute of limitations is 2 years." />)
    expect(screen.getByText('The statute of limitations is 2 years.')).toBeInTheDocument()
  })

  it('renders default source when not provided', () => {
    render(<SpeakableAnswerBox answer="Some answer" />)
    expect(screen.getByText(/Source: Lawtendr/)).toBeInTheDocument()
    expect(screen.getByText(/Verified bar records/)).toBeInTheDocument()
  })

  it('renders custom source when provided', () => {
    render(<SpeakableAnswerBox answer="Some answer" source="Texas Bar Association" />)
    expect(screen.getByText(/Source: Texas Bar Association/)).toBeInTheDocument()
  })

  it('renders updated date when provided', () => {
    render(
      <SpeakableAnswerBox answer="Some answer" updatedDate="March 2026" />
    )
    expect(screen.getByText(/Updated: March 2026/)).toBeInTheDocument()
  })

  it('does not render updated date when not provided', () => {
    render(<SpeakableAnswerBox answer="Some answer" />)
    expect(screen.queryByText(/Updated:/)).not.toBeInTheDocument()
  })

  it('has data-speakable attribute for structured data', () => {
    const { container } = render(<SpeakableAnswerBox answer="Test" />)
    const speakableDiv = container.querySelector('[data-speakable="true"]')
    expect(speakableDiv).not.toBeNull()
  })

  it('applies speakable-summary class', () => {
    const { container } = render(<SpeakableAnswerBox answer="Test" />)
    const el = container.querySelector('.speakable-summary')
    expect(el).not.toBeNull()
  })

  it('renders both source and updated date together', () => {
    render(
      <SpeakableAnswerBox
        answer="Answer"
        source="NY Courts"
        updatedDate="Jan 2026"
      />
    )
    expect(screen.getByText(/Source: NY Courts — Verified bar records — Updated: Jan 2026/)).toBeInTheDocument()
  })

  it('handles empty answer string', () => {
    const { container } = render(<SpeakableAnswerBox answer="" />)
    const speakableDiv = container.querySelector('[data-speakable="true"]')
    expect(speakableDiv).not.toBeNull()
  })

  it('handles long answer text without errors', () => {
    const longAnswer = 'A'.repeat(5000)
    render(<SpeakableAnswerBox answer={longAnswer} />)
    expect(screen.getByText(longAnswer)).toBeInTheDocument()
  })
})

// =====================================================================
//  SearchRecorder
// =====================================================================

describe('SearchRecorder', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calls recordSearch on mount with correct arguments', () => {
    render(
      <SearchRecorder
        type="service"
        label="Criminal Defense"
        href="/practice-areas/criminal-defense"
      />
    )
    expect(recordSearch).toHaveBeenCalledWith({
      type: 'service',
      label: 'Criminal Defense',
      href: '/practice-areas/criminal-defense',
    })
  })

  it('renders nothing (invisible component)', () => {
    const { container } = render(
      <SearchRecorder
        type="service-city"
        label="DUI in Houston"
        href="/practice-areas/dui/houston"
      />
    )
    expect(container.innerHTML).toBe('')
  })

  it('calls recordSearch with service-city type', () => {
    render(
      <SearchRecorder
        type="service-city"
        label="Family Law in Dallas"
        href="/practice-areas/family-law/dallas"
      />
    )
    expect(recordSearch).toHaveBeenCalledWith({
      type: 'service-city',
      label: 'Family Law in Dallas',
      href: '/practice-areas/family-law/dallas',
    })
  })

  it('calls recordSearch with emergency type', () => {
    render(
      <SearchRecorder
        type="emergency"
        label="Emergency DUI"
        href="/emergency/dui"
      />
    )
    expect(recordSearch).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'emergency' })
    )
  })

  it('calls recordSearch with consultation type', () => {
    render(
      <SearchRecorder
        type="consultation"
        label="Free consultation"
        href="/consultation"
      />
    )
    expect(recordSearch).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'consultation' })
    )
  })

  it('calls recordSearch only once on mount', () => {
    render(
      <SearchRecorder type="fees" label="Fees" href="/fees" />
    )
    expect(recordSearch).toHaveBeenCalledTimes(1)
  })
})

// =====================================================================
//  MicroConversions
// =====================================================================

describe('MicroConversions', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders nothing (invisible component)', () => {
    const { container } = render(
      <MicroConversions pageType="attorney-profile" />
    )
    expect(container.innerHTML).toBe('')
  })

  it('tracks scroll depth at 25% milestone', () => {
    render(<MicroConversions pageType="attorney-profile" specialtySlug="criminal-defense" />)

    // Simulate scroll at 25%
    Object.defineProperty(document.documentElement, 'scrollHeight', { value: 2000, configurable: true })
    Object.defineProperty(window, 'innerHeight', { value: 1000, configurable: true })
    Object.defineProperty(window, 'scrollY', { value: 250, configurable: true })

    fireEvent.scroll(window)

    expect(trackEvent).toHaveBeenCalledWith('page_view', expect.objectContaining({
      action: 'scroll_depth',
      depth: 25,
      pageType: 'attorney-profile',
      specialtySlug: 'criminal-defense',
    }))
  })

  it('tracks multiple scroll milestones', () => {
    render(<MicroConversions pageType="search" />)

    Object.defineProperty(document.documentElement, 'scrollHeight', { value: 2000, configurable: true })
    Object.defineProperty(window, 'innerHeight', { value: 1000, configurable: true })

    // Scroll to 50%
    Object.defineProperty(window, 'scrollY', { value: 500, configurable: true })
    fireEvent.scroll(window)

    // Should fire both 25% and 50%
    expect(trackEvent).toHaveBeenCalledWith('page_view', expect.objectContaining({
      action: 'scroll_depth',
      depth: 25,
    }))
    expect(trackEvent).toHaveBeenCalledWith('page_view', expect.objectContaining({
      action: 'scroll_depth',
      depth: 50,
    }))
  })

  it('does not re-fire the same scroll milestone', () => {
    render(<MicroConversions pageType="search" />)

    Object.defineProperty(document.documentElement, 'scrollHeight', { value: 2000, configurable: true })
    Object.defineProperty(window, 'innerHeight', { value: 1000, configurable: true })
    Object.defineProperty(window, 'scrollY', { value: 250, configurable: true })

    fireEvent.scroll(window)
    fireEvent.scroll(window)
    fireEvent.scroll(window)

    // 25% should only be tracked once
    const scrollDepthCalls = (trackEvent as ReturnType<typeof vi.fn>).mock.calls.filter(
      (call) => call[1]?.action === 'scroll_depth' && call[1]?.depth === 25
    )
    expect(scrollDepthCalls).toHaveLength(1)
  })

  it('tracks time on page at 30 seconds', () => {
    render(<MicroConversions pageType="attorney-profile" cityName="Houston" />)

    act(() => {
      vi.advanceTimersByTime(30000)
    })

    expect(trackEvent).toHaveBeenCalledWith('page_view', expect.objectContaining({
      action: 'time_on_page',
      seconds: 30,
      pageType: 'attorney-profile',
      cityName: 'Houston',
    }))
  })

  it('tracks time on page at 60 seconds', () => {
    render(<MicroConversions pageType="search" />)

    act(() => {
      vi.advanceTimersByTime(60000)
    })

    expect(trackEvent).toHaveBeenCalledWith('page_view', expect.objectContaining({
      action: 'time_on_page',
      seconds: 60,
    }))
  })

  it('tracks time on page at 120 seconds', () => {
    render(<MicroConversions pageType="search" />)

    act(() => {
      vi.advanceTimersByTime(120000)
    })

    expect(trackEvent).toHaveBeenCalledWith('page_view', expect.objectContaining({
      action: 'time_on_page',
      seconds: 120,
    }))
  })

  it('does not track before 30 seconds', () => {
    render(<MicroConversions pageType="search" />)

    act(() => {
      vi.advanceTimersByTime(29000)
    })

    const timeCalls = (trackEvent as ReturnType<typeof vi.fn>).mock.calls.filter(
      (call) => call[1]?.action === 'time_on_page'
    )
    expect(timeCalls).toHaveLength(0)
  })

  it('cleans up timeouts on unmount', () => {
    const { unmount } = render(<MicroConversions pageType="search" />)
    unmount()

    act(() => {
      vi.advanceTimersByTime(120000)
    })

    const timeCalls = (trackEvent as ReturnType<typeof vi.fn>).mock.calls.filter(
      (call) => call[1]?.action === 'time_on_page'
    )
    expect(timeCalls).toHaveLength(0)
  })

  it('cleans up scroll listener on unmount', () => {
    const removeSpy = vi.spyOn(window, 'removeEventListener')
    const { unmount } = render(<MicroConversions pageType="search" />)
    unmount()

    expect(removeSpy).toHaveBeenCalledWith('scroll', expect.any(Function))
    removeSpy.mockRestore()
  })

  it('handles zero scroll height gracefully', () => {
    render(<MicroConversions pageType="search" />)

    Object.defineProperty(document.documentElement, 'scrollHeight', { value: 1000, configurable: true })
    Object.defineProperty(window, 'innerHeight', { value: 1000, configurable: true })

    // scrollHeight - innerHeight = 0
    fireEvent.scroll(window)

    // Should not crash and should not track (scrollHeight <= 0)
    const scrollCalls = (trackEvent as ReturnType<typeof vi.fn>).mock.calls.filter(
      (call) => call[1]?.action === 'scroll_depth'
    )
    expect(scrollCalls).toHaveLength(0)
  })

  it('passes optional props correctly', () => {
    render(
      <MicroConversions
        pageType="practice-area"
        specialtySlug="family-law"
        cityName="Dallas"
      />
    )

    Object.defineProperty(document.documentElement, 'scrollHeight', { value: 2000, configurable: true })
    Object.defineProperty(window, 'innerHeight', { value: 1000, configurable: true })
    Object.defineProperty(window, 'scrollY', { value: 1000, configurable: true })

    fireEvent.scroll(window)

    expect(trackEvent).toHaveBeenCalledWith('page_view', expect.objectContaining({
      specialtySlug: 'family-law',
      cityName: 'Dallas',
    }))
  })
})
