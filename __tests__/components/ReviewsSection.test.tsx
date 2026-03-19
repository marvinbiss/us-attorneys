/**
 * ReviewsSection Component — Unit Tests
 *
 * Covers:
 * - Loading state (skeleton)
 * - Empty state (no reviews)
 * - Reviews display with stats
 * - Rating distribution and filtering
 * - Sort options
 * - Helpful vote
 * - Verified badge
 * - Attorney response display
 * - Show more button
 * - Date formatting
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import ReviewsSection from '@/components/ReviewsSection'

const mockFetch = vi.fn()

beforeEach(() => {
  vi.clearAllMocks()
  globalThis.fetch = mockFetch
})

const sampleStats = {
  total: 3,
  average: 4.3,
  recommendRate: 90,
  distribution: [0, 0, 0, 1, 2], // 1x 4-star, 2x 5-star
}

const sampleReviews = [
  {
    id: 'r1',
    rating: 5,
    comment: 'Excellent attorney!',
    would_recommend: true,
    client_name: 'John Doe',
    created_at: new Date().toISOString(),
    attorney_response: null,
    attorney_responded_at: null,
    helpful_count: 3,
    booking_id: 'b1',
    user_id: 'u1',
    is_verified: true,
  },
  {
    id: 'r2',
    rating: 4,
    comment: 'Good service overall.',
    would_recommend: true,
    client_name: 'Jane Smith',
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(), // 2 days ago
    attorney_response: 'Thank you for your feedback!',
    attorney_responded_at: new Date().toISOString(),
    helpful_count: 1,
    booking_id: null,
    user_id: null,
    is_verified: false,
  },
  {
    id: 'r3',
    rating: 5,
    comment: null,
    would_recommend: false,
    client_name: 'Bob Wilson',
    created_at: new Date(Date.now() - 86400000 * 10).toISOString(), // 10 days ago
    attorney_response: null,
    attorney_responded_at: null,
    helpful_count: 0,
    booking_id: null,
    user_id: null,
    is_verified: false,
  },
]

function mockSuccessResponse() {
  mockFetch.mockResolvedValue({
    ok: true,
    json: () => Promise.resolve({ reviews: sampleReviews, stats: sampleStats }),
  })
}

function mockEmptyResponse() {
  mockFetch.mockResolvedValue({
    ok: true,
    json: () =>
      Promise.resolve({
        reviews: [],
        stats: { total: 0, average: 0, recommendRate: 0, distribution: [0, 0, 0, 0, 0] },
      }),
  })
}

function mockErrorResponse() {
  mockFetch.mockResolvedValue({
    ok: false,
    json: () => Promise.reject(new Error('Network error')),
  })
}

describe('ReviewsSection — loading state', () => {
  it('shows loading skeleton initially', () => {
    // Make fetch hang
    mockFetch.mockReturnValue(new Promise(() => {}))
    render(<ReviewsSection attorneyId="att-1" />)
    // Skeleton: animated pulse divs
    const skeleton = document.querySelector('.animate-pulse')
    expect(skeleton).toBeTruthy()
  })
})

describe('ReviewsSection — empty state', () => {
  it('shows "No reviews yet" when stats.total is 0', async () => {
    mockEmptyResponse()
    render(<ReviewsSection attorneyId="att-1" />)

    await waitFor(() => {
      expect(screen.getByText('No reviews yet')).toBeInTheDocument()
    })
    expect(
      screen.getByText('Be the first to leave a review after your consultation!')
    ).toBeInTheDocument()
  })
})

describe('ReviewsSection — error state', () => {
  it('shows empty state on fetch error', async () => {
    mockErrorResponse()
    render(<ReviewsSection attorneyId="att-1" />)

    await waitFor(() => {
      expect(screen.getByText('No reviews yet')).toBeInTheDocument()
    })
  })
})

describe('ReviewsSection — with reviews', () => {
  beforeEach(() => {
    mockSuccessResponse()
  })

  it('displays the average rating', async () => {
    render(<ReviewsSection attorneyId="att-1" />)
    await waitFor(() => {
      expect(screen.getByText('4.3')).toBeInTheDocument()
    })
  })

  it('displays total review count', async () => {
    render(<ReviewsSection attorneyId="att-1" />)
    await waitFor(() => {
      expect(screen.getByText('3 reviews')).toBeInTheDocument()
    })
  })

  it('displays recommendation rate', async () => {
    render(<ReviewsSection attorneyId="att-1" />)
    await waitFor(() => {
      expect(screen.getByText('90%')).toBeInTheDocument()
      expect(screen.getByText('recommend')).toBeInTheDocument()
    })
  })

  it('shows attorney name in recommendation section', async () => {
    render(<ReviewsSection attorneyId="att-1" attorneyName="John Attorney" />)
    await waitFor(() => {
      expect(screen.getByText('John Attorney')).toBeInTheDocument()
    })
  })

  it('shows "this attorney" when no name provided', async () => {
    render(<ReviewsSection attorneyId="att-1" />)
    await waitFor(() => {
      expect(screen.getByText('this attorney')).toBeInTheDocument()
    })
  })

  it('renders review comments', async () => {
    render(<ReviewsSection attorneyId="att-1" />)
    await waitFor(() => {
      expect(screen.getByText('Excellent attorney!')).toBeInTheDocument()
      expect(screen.getByText('Good service overall.')).toBeInTheDocument()
    })
  })

  it('renders client names', async () => {
    render(<ReviewsSection attorneyId="att-1" />)
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument()
      expect(screen.getByText('Jane Smith')).toBeInTheDocument()
    })
  })

  it('shows verified badge for verified reviews', async () => {
    render(<ReviewsSection attorneyId="att-1" />)
    await waitFor(() => {
      expect(screen.getByText('Verified review')).toBeInTheDocument()
    })
  })

  it('shows "Recommends" badge for recommending reviews', async () => {
    render(<ReviewsSection attorneyId="att-1" />)
    await waitFor(() => {
      const badges = screen.getAllByText('Recommends')
      expect(badges.length).toBeGreaterThan(0)
    })
  })

  it('displays attorney response when present', async () => {
    render(<ReviewsSection attorneyId="att-1" attorneyName="TestAttorney" />)
    await waitFor(() => {
      expect(screen.getByText('Thank you for your feedback!')).toBeInTheDocument()
      expect(screen.getByText(/Response from TestAttorney/)).toBeInTheDocument()
    })
  })

  it('shows helpful count on each review', async () => {
    render(<ReviewsSection attorneyId="att-1" />)
    await waitFor(() => {
      expect(screen.getByText('Helpful (3)')).toBeInTheDocument()
      expect(screen.getByText('Helpful (1)')).toBeInTheDocument()
    })
  })

  it('fetches reviews with correct attorneyId', async () => {
    render(<ReviewsSection attorneyId="att-42" />)
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/reviews?attorneyId=att-42')
    })
  })
})

describe('ReviewsSection — helpful vote', () => {
  beforeEach(() => {
    mockSuccessResponse()
  })

  it('increments helpful count on vote click', async () => {
    // Mock the vote API
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ reviews: sampleReviews, stats: sampleStats }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      })

    render(<ReviewsSection attorneyId="att-1" />)

    await waitFor(() => {
      expect(screen.getByText('Helpful (3)')).toBeInTheDocument()
    })

    const helpfulBtn = screen.getByText('Helpful (3)').closest('button')
    fireEvent.click(helpfulBtn as HTMLElement)

    await waitFor(() => {
      expect(screen.getByText('Helpful (4)')).toBeInTheDocument()
    })
  })

  it('prevents double voting', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ reviews: sampleReviews, stats: sampleStats }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      })

    render(<ReviewsSection attorneyId="att-1" />)

    await waitFor(() => {
      expect(screen.getByText('Helpful (3)')).toBeInTheDocument()
    })

    const helpfulBtn = screen.getByText('Helpful (3)').closest('button')
    fireEvent.click(helpfulBtn as HTMLElement)

    await waitFor(() => {
      expect(screen.getByText('Helpful (4)')).toBeInTheDocument()
    })

    // Second click should be disabled
    const updatedBtn = screen.getByText('Helpful (4)').closest('button') as HTMLElement
    expect(updatedBtn).toBeDisabled()
  })
})

describe('ReviewsSection — sorting', () => {
  it('renders sort dropdown with options', async () => {
    mockSuccessResponse()
    render(<ReviewsSection attorneyId="att-1" />)

    await waitFor(() => {
      const select = screen.getByDisplayValue('Most recent')
      expect(select).toBeInTheDocument()
    })

    const select = screen.getByDisplayValue('Most recent') as HTMLSelectElement
    expect(select.options).toHaveLength(4)
  })
})

describe('ReviewsSection — filtering', () => {
  it('shows filter status text', async () => {
    mockSuccessResponse()
    render(<ReviewsSection attorneyId="att-1" />)

    await waitFor(() => {
      expect(screen.getByText('All reviews')).toBeInTheDocument()
    })
  })
})

describe('ReviewsSection — date formatting', () => {
  it('shows "Today" for today reviews', async () => {
    mockSuccessResponse()
    render(<ReviewsSection attorneyId="att-1" />)

    await waitFor(() => {
      const todayElements = screen.getAllByText('Today')
      expect(todayElements.length).toBeGreaterThan(0)
    })
  })

  it('shows "X days ago" for recent reviews', async () => {
    mockSuccessResponse()
    render(<ReviewsSection attorneyId="att-1" />)

    await waitFor(() => {
      expect(screen.getByText('2 days ago')).toBeInTheDocument()
    })
  })

  it('shows "X weeks ago" for older reviews', async () => {
    mockSuccessResponse()
    render(<ReviewsSection attorneyId="att-1" />)

    await waitFor(() => {
      expect(screen.getByText('1 weeks ago')).toBeInTheDocument()
    })
  })
})
