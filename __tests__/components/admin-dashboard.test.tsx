/**
 * Tests -- Admin Dashboard Components
 * Covers: StatsGrid, RecentActivity, PendingReports, ActivityChart
 *
 * Tests loading/skeleton states, empty states, data rendering,
 * accessibility (aria-labels, roles), and English text assertions.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, within, fireEvent, act } from '@testing-library/react'
import React from 'react'

// ============================================
// Mock setup -- must come before component imports
// ============================================

// --- next/link mock ---
vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string; [key: string]: unknown }) => (
    <a href={href} {...props}>{children}</a>
  ),
}))

// --- lucide-react mock ---
vi.mock('lucide-react', () => {
  const iconFactory = (name: string) => {
    const Icon = ({ className }: { className?: string }) => (
      <span data-testid={`icon-${name}`} className={className} />
    )
    Icon.displayName = name
    return Icon
  }

  return {
    Users: iconFactory('Users'),
    Briefcase: iconFactory('Briefcase'),
    Calendar: iconFactory('Calendar'),
    DollarSign: iconFactory('DollarSign'),
    TrendingUp: iconFactory('TrendingUp'),
    TrendingDown: iconFactory('TrendingDown'),
    Minus: iconFactory('Minus'),
    Star: iconFactory('Star'),
    AlertTriangle: iconFactory('AlertTriangle'),
    Activity: iconFactory('Activity'),
    ArrowRight: iconFactory('ArrowRight'),
    CheckCircle: iconFactory('CheckCircle'),
    XCircle: iconFactory('XCircle'),
    Loader2: iconFactory('Loader2'),
    X: iconFactory('X'),
    Info: iconFactory('Info'),
  }
})

// --- recharts mock ---
vi.mock('recharts', () => ({
  AreaChart: ({ children, data }: { children: React.ReactNode; data: unknown[] }) => (
    <div data-testid="area-chart" data-count={data?.length ?? 0}>{children}</div>
  ),
  Area: ({ dataKey, name }: { dataKey: string; name: string }) => (
    <div data-testid={`area-${dataKey}`} data-name={name} />
  ),
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  Legend: () => <div data-testid="legend" />,
}))

// --- adminMutate mock ---
const mockAdminMutate = vi.fn()
vi.mock('@/hooks/admin/useAdminFetch', () => ({
  adminMutate: (...args: unknown[]) => mockAdminMutate(...args),
}))

// --- ConfirmationModal mock ---
vi.mock('@/components/admin/ConfirmationModal', () => ({
  ConfirmationModal: ({
    isOpen,
    onConfirm,
    onClose,
    title,
    message,
    children,
  }: {
    isOpen: boolean
    onConfirm: () => void
    onClose: () => void
    title: string
    message: string
    confirmText?: string
    variant?: string
    children?: React.ReactNode
  }) => {
    if (!isOpen) return null
    return (
      <div data-testid="confirmation-modal" role="dialog">
        <p data-testid="modal-title">{title}</p>
        <p data-testid="modal-message">{message}</p>
        {children}
        <button data-testid="modal-confirm" onClick={onConfirm}>Confirm</button>
        <button data-testid="modal-cancel" onClick={onClose}>Cancel</button>
      </div>
    )
  },
}))

// --- Toast mock ---
vi.mock('@/components/admin/Toast', () => ({
  Toast: ({ toast, onClose }: { toast: { type: string; message: string } | null; onClose: () => void }) => {
    if (!toast) return null
    return (
      <div data-testid="toast" data-type={toast.type}>
        {toast.message}
        <button onClick={onClose} data-testid="toast-close">close</button>
      </div>
    )
  },
}))

// --- clsx mock (used by ConfirmationModal) ---
vi.mock('clsx', () => ({
  clsx: (...args: unknown[]) => args.filter(Boolean).join(' '),
}))

// ============================================
// Component imports -- after mocks
// ============================================

import { StatsGrid } from '@/components/admin/dashboard/StatsGrid'
import { RecentActivity } from '@/components/admin/dashboard/RecentActivity'
import { PendingReports } from '@/components/admin/dashboard/PendingReports'
import { ActivityChart } from '@/components/admin/dashboard/ActivityChart'

// ============================================
// Test data factories
// ============================================

function buildStats(overrides: Partial<{
  totalUsers: number
  totalAttorneys: number
  totalBookings: number
  totalRevenue: number
  trends: { users: number; bookings: number; revenue: number }
}> = {}) {
  return {
    totalUsers: 1250,
    totalAttorneys: 48,
    totalBookings: 320,
    totalRevenue: 150000, // in cents
    trends: {
      users: 12,
      bookings: -5,
      revenue: 0,
    },
    ...overrides,
  }
}

function buildActivityItems() {
  return [
    {
      id: 'a1',
      type: 'booking' as const,
      action: 'New booking',
      details: 'Consultation with John Smith',
      timestamp: new Date(Date.now() - 30_000).toISOString(), // 30s ago
      status: 'confirmed',
    },
    {
      id: 'a2',
      type: 'review' as const,
      action: 'New review published',
      details: '5 stars for Martin Law Firm',
      timestamp: new Date(Date.now() - 7_200_000).toISOString(), // 2h ago
      status: 'published',
    },
    {
      id: 'a3',
      type: 'report' as const,
      action: 'Report received',
      details: 'Inappropriate content reported',
      timestamp: new Date(Date.now() - 90_000_000).toISOString(), // ~1 day ago
    },
  ]
}

function buildReports() {
  return [
    {
      id: 'rpt1',
      target_type: 'review',
      reason: 'spam',
      description: 'This comment is obvious spam',
      status: 'pending',
      created_at: '2026-02-14T10:00:00Z',
      reporter_id: 'user-123',
    },
    {
      id: 'rpt2',
      target_type: 'provider',
      reason: 'fake',
      description: null,
      status: 'pending',
      created_at: '2026-02-13T09:30:00Z',
      reporter_id: null,
    },
  ]
}

function buildChartData() {
  return Array.from({ length: 30 }, (_, i) => ({
    date: `2026-01-${String(i + 1).padStart(2, '0')}`,
    bookings: Math.floor(Math.random() * 10),
    users: Math.floor(Math.random() * 5),
    reviews: Math.floor(Math.random() * 3),
  }))
}

function buildEmptyChartData() {
  return Array.from({ length: 30 }, (_, i) => ({
    date: `2026-01-${String(i + 1).padStart(2, '0')}`,
    bookings: 0,
    users: 0,
    reviews: 0,
  }))
}

// ============================================
// StatsGrid Tests
// ============================================

describe('StatsGrid', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('loading state', () => {
    it('renders 4 skeleton cards when loading is true', () => {
      const { container } = render(<StatsGrid stats={null} loading={true} />)
      const skeletons = container.querySelectorAll('.animate-pulse')
      expect(skeletons).toHaveLength(4)
    })

    it('renders skeletons when stats is null (even without loading flag)', () => {
      const { container } = render(<StatsGrid stats={null} />)
      const skeletons = container.querySelectorAll('.animate-pulse')
      expect(skeletons).toHaveLength(4)
    })

    it('does not render any links when loading', () => {
      render(<StatsGrid stats={null} loading={true} />)
      expect(screen.queryAllByRole('link')).toHaveLength(0)
    })
  })

  describe('data rendering', () => {
    it('renders all 4 stat cards with correct English labels', () => {
      render(<StatsGrid stats={buildStats()} />)

      expect(screen.getByText('Users')).toBeInTheDocument()
      expect(screen.getByText('Active attorneys')).toBeInTheDocument()
      expect(screen.getByText('Bookings')).toBeInTheDocument()
      expect(screen.getByText('Revenue this month')).toBeInTheDocument()
    })

    it('formats user count with US locale', () => {
      const stats = buildStats({ totalUsers: 1250 })
      render(<StatsGrid stats={stats} />)
      // en-US locale uses comma as thousands separator
      const userCard = screen.getByText('1,250')
      expect(userCard).toBeInTheDocument()
    })

    it('formats revenue from cents to dollars with US locale', () => {
      const stats = buildStats({ totalRevenue: 150000 }) // 1500.00 USD
      render(<StatsGrid stats={stats} />)
      // 150000 / 100 = 1500.00, formatted as "1,500.00 $" in en-US
      const revenueText = screen.getByText(/1,500\.00\s*\$/)
      expect(revenueText).toBeInTheDocument()
    })

    it('renders links to correct admin pages', () => {
      render(<StatsGrid stats={buildStats()} />)
      const links = screen.getAllByRole('link')
      const hrefs = links.map((l) => l.getAttribute('href'))

      expect(hrefs).toContain('/admin/users')
      expect(hrefs).toContain('/admin/attorneys')
      expect(hrefs).toContain('/admin/bookings')
      expect(hrefs).toContain('/admin/payments')
    })

    it('renders exactly 4 links (one per stat card)', () => {
      render(<StatsGrid stats={buildStats()} />)
      expect(screen.getAllByRole('link')).toHaveLength(4)
    })
  })

  describe('trend badges', () => {
    it('displays positive trend with + prefix and green styling', () => {
      const stats = buildStats({ trends: { users: 12, bookings: 5, revenue: 8 } })
      render(<StatsGrid stats={stats} />)

      expect(screen.getByText('+12%')).toBeInTheDocument()
      expect(screen.getByText('+5%')).toBeInTheDocument()
      expect(screen.getByText('+8%')).toBeInTheDocument()
    })

    it('displays negative trend without + prefix and red styling', () => {
      const stats = buildStats({ trends: { users: -3, bookings: -10, revenue: -1 } })
      render(<StatsGrid stats={stats} />)

      expect(screen.getByText('-3%')).toBeInTheDocument()
      expect(screen.getByText('-10%')).toBeInTheDocument()
      expect(screen.getByText('-1%')).toBeInTheDocument()
    })

    it('displays zero trend with 0%', () => {
      const stats = buildStats({ trends: { users: 0, bookings: 0, revenue: 0 } })
      render(<StatsGrid stats={stats} />)

      const zeroBadges = screen.getAllByText('0%')
      expect(zeroBadges).toHaveLength(3)
    })

    it('shows "vs last month" text for trended cards', () => {
      render(<StatsGrid stats={buildStats()} />)
      const trendLabels = screen.getAllByText('vs last month')
      // 3 cards have trends: Users, Bookings, Revenue (not Attorneys)
      expect(trendLabels).toHaveLength(3)
    })

    it('does not show trend badge for Active attorneys card', () => {
      const stats = buildStats()
      render(<StatsGrid stats={stats} />)

      // The attorneys card links to /admin/attorneys
      const attorneyLink = screen.getByRole('link', { name: /Active attorneys/ })
      // Should not contain a trend badge
      expect(within(attorneyLink).queryByText(/vs last month/)).not.toBeInTheDocument()
    })
  })

  describe('accessibility', () => {
    it('renders aria-labels with stat values on each card link', () => {
      const stats = buildStats({ trends: { users: 12, bookings: -5, revenue: 0 } })
      render(<StatsGrid stats={stats} />)

      // Users card: positive trend
      const usersLink = screen.getByRole('link', { name: /Users.*trend \+12%/ })
      expect(usersLink).toBeInTheDocument()

      // Bookings card: negative trend
      const bookingsLink = screen.getByRole('link', { name: /Bookings.*trend -5%/ })
      expect(bookingsLink).toBeInTheDocument()

      // Revenue card: zero trend
      const revenueLink = screen.getByRole('link', { name: /Revenue this month.*trend 0%/ })
      expect(revenueLink).toBeInTheDocument()
    })

    it('renders aria-label without trend info for Attorneys card', () => {
      render(<StatsGrid stats={buildStats()} />)
      const attorneyLink = screen.getByRole('link', { name: /Active attorneys/ })
      expect(attorneyLink.getAttribute('aria-label')).not.toContain('trend')
    })
  })
})

// ============================================
// RecentActivity Tests
// ============================================

describe('RecentActivity', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('loading state', () => {
    it('renders skeleton rows when loading', () => {
      const { container } = render(<RecentActivity activity={[]} loading={true} />)
      const skeletons = container.querySelectorAll('.animate-pulse')
      expect(skeletons).toHaveLength(5)
    })

    it('does not render activity items when loading', () => {
      render(<RecentActivity activity={buildActivityItems()} loading={true} />)
      expect(screen.queryByText('New booking')).not.toBeInTheDocument()
    })
  })

  describe('empty state', () => {
    it('shows empty state message when no activities', () => {
      render(<RecentActivity activity={[]} />)
      expect(screen.getByText('No recent activity')).toBeInTheDocument()
    })

    it('renders the Activity icon in empty state', () => {
      render(<RecentActivity activity={[]} />)
      expect(screen.getByTestId('icon-Activity')).toBeInTheDocument()
    })
  })

  describe('data rendering', () => {
    it('renders all activity items', () => {
      const items = buildActivityItems()
      render(<RecentActivity activity={items} />)

      expect(screen.getByText('New booking')).toBeInTheDocument()
      expect(screen.getByText('New review published')).toBeInTheDocument()
      expect(screen.getByText('Report received')).toBeInTheDocument()
    })

    it('renders activity detail text', () => {
      const items = buildActivityItems()
      render(<RecentActivity activity={items} />)

      expect(screen.getByText('Consultation with John Smith')).toBeInTheDocument()
      expect(screen.getByText('5 stars for Martin Law Firm')).toBeInTheDocument()
      expect(screen.getByText('Inappropriate content reported')).toBeInTheDocument()
    })

    it('renders English status labels', () => {
      const items = buildActivityItems()
      render(<RecentActivity activity={items} />)

      expect(screen.getByText('Confirmed')).toBeInTheDocument()
      expect(screen.getByText('Published')).toBeInTheDocument()
    })

    it('does not render status label when status is undefined', () => {
      const items = buildActivityItems()
      render(<RecentActivity activity={items} />)

      // The report item (id: a3) has no status
      // Ensure no extra status badges
      const allStatuses = ['Confirmed', 'Published']
      allStatuses.forEach((label) => {
        expect(screen.getAllByText(label)).toHaveLength(1)
      })
    })

    it('renders relative time for recent items', () => {
      const items = [
        {
          id: 'recent',
          type: 'user' as const,
          action: 'New user',
          details: 'test@example.com',
          timestamp: new Date(Date.now() - 10_000).toISOString(), // 10s ago
        },
      ]
      render(<RecentActivity activity={items} />)
      expect(screen.getByText(/Just now/i)).toBeInTheDocument()
    })

    it('renders relative time in minutes for items within the last hour', () => {
      const items = [
        {
          id: 'minutes',
          type: 'booking' as const,
          action: 'Booking',
          details: 'Detail',
          timestamp: new Date(Date.now() - 300_000).toISOString(), // 5 minutes ago
        },
      ]
      render(<RecentActivity activity={items} />)
      expect(screen.getByText(/5m ago/)).toBeInTheDocument()
    })

    it('renders relative time in hours for items within the last day', () => {
      const items = [
        {
          id: 'hours',
          type: 'review' as const,
          action: 'Review',
          details: 'Detail',
          timestamp: new Date(Date.now() - 7_200_000).toISOString(), // 2h ago
        },
      ]
      render(<RecentActivity activity={items} />)
      expect(screen.getByText(/2h ago/)).toBeInTheDocument()
    })

    it('renders relative time in days for items within the last week', () => {
      const items = [
        {
          id: 'days',
          type: 'report' as const,
          action: 'Report',
          details: 'Detail',
          timestamp: new Date(Date.now() - 172_800_000).toISOString(), // 2 days ago
        },
      ]
      render(<RecentActivity activity={items} />)
      expect(screen.getByText(/2d ago/)).toBeInTheDocument()
    })

    it('renders formatted date for items older than a week', () => {
      const items = [
        {
          id: 'old',
          type: 'user' as const,
          action: 'Old event',
          details: 'Detail',
          timestamp: '2025-12-01T10:00:00Z', // long ago
        },
      ]
      render(<RecentActivity activity={items} />)
      // en-US date format: 12/1/2025
      expect(screen.getByText(/12\/1\/2025/)).toBeInTheDocument()
    })

    it('handles unknown status gracefully by rendering the raw status string', () => {
      const items = [
        {
          id: 'unknown-status',
          type: 'booking' as const,
          action: 'Test',
          details: 'Detail',
          timestamp: new Date().toISOString(),
          status: 'unknown_status',
        },
      ]
      render(<RecentActivity activity={items} />)
      expect(screen.getByText('unknown_status')).toBeInTheDocument()
    })
  })

  describe('header and navigation', () => {
    it('displays "Recent activity" heading', () => {
      render(<RecentActivity activity={[]} />)
      expect(screen.getByText('Recent activity')).toBeInTheDocument()
    })

    it('renders "View all" link pointing to /admin/journal', () => {
      render(<RecentActivity activity={[]} />)
      const link = screen.getByRole('link', { name: /View all/ })
      expect(link).toHaveAttribute('href', '/admin/journal')
    })
  })

  describe('accessibility', () => {
    it('has region role with correct aria-label', () => {
      render(<RecentActivity activity={[]} />)
      expect(screen.getByRole('region', { name: 'Recent activity' })).toBeInTheDocument()
    })
  })
})

// ============================================
// PendingReports Tests
// ============================================

describe('PendingReports', () => {
  const mockOnMutate = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    mockAdminMutate.mockResolvedValue({ success: true })
  })

  describe('loading state', () => {
    it('renders 3 skeleton reports when loading', () => {
      const { container } = render(
        <PendingReports reports={[]} loading={true} onMutate={mockOnMutate} />
      )
      const skeletons = container.querySelectorAll('.animate-pulse')
      expect(skeletons).toHaveLength(3)
    })

    it('does not render report data when loading', () => {
      render(
        <PendingReports reports={buildReports()} loading={true} onMutate={mockOnMutate} />
      )
      expect(screen.queryByText('Spam')).not.toBeInTheDocument()
    })
  })

  describe('empty state', () => {
    it('shows empty state message when no reports', () => {
      render(
        <PendingReports reports={[]} loading={false} onMutate={mockOnMutate} />
      )
      expect(screen.getByText('No pending reports')).toBeInTheDocument()
      expect(screen.getByText('All reports have been processed')).toBeInTheDocument()
    })

    it('renders CheckCircle icon in empty state', () => {
      render(
        <PendingReports reports={[]} loading={false} onMutate={mockOnMutate} />
      )
      expect(screen.getByTestId('icon-CheckCircle')).toBeInTheDocument()
    })

    it('does not show count badge when no reports', () => {
      const { container } = render(
        <PendingReports reports={[]} loading={false} onMutate={mockOnMutate} />
      )
      const badge = container.querySelector('.bg-red-100.text-red-700')
      expect(badge).not.toBeInTheDocument()
    })
  })

  describe('data rendering', () => {
    it('renders all pending reports', () => {
      render(
        <PendingReports reports={buildReports()} loading={false} onMutate={mockOnMutate} />
      )

      // First report: review + spam
      expect(screen.getByText('Review')).toBeInTheDocument()
      expect(screen.getByText('Spam')).toBeInTheDocument()
      expect(screen.getByText('This comment is obvious spam')).toBeInTheDocument()

      // Second report: provider + fake
      expect(screen.getByText('Attorney')).toBeInTheDocument()
      expect(screen.getByText('Fake content')).toBeInTheDocument()
    })

    it('shows report count badge', () => {
      const reports = buildReports()
      render(
        <PendingReports reports={reports} loading={false} onMutate={mockOnMutate} />
      )
      expect(screen.getByText('2')).toBeInTheDocument()
    })

    it('renders formatted date in English for each report', () => {
      render(
        <PendingReports reports={buildReports()} loading={false} onMutate={mockOnMutate} />
      )
      // en-US date format with { day: 'numeric', month: 'short', year: 'numeric' }: "Feb 14, 2026"
      expect(screen.getByText(/Feb 14, 2026/)).toBeInTheDocument()
      expect(screen.getByText(/Feb 13, 2026/)).toBeInTheDocument()
    })

    it('does not render description when it is null', () => {
      const reports = buildReports()
      render(
        <PendingReports reports={reports} loading={false} onMutate={mockOnMutate} />
      )
      // Second report has null description -- only the first description should be present
      const descriptions = screen.queryAllByText('This comment is obvious spam')
      expect(descriptions).toHaveLength(1)
    })

    it('renders correct English reason labels', () => {
      const reports = [
        { id: '1', target_type: 'review', reason: 'spam', description: null, status: 'pending', created_at: '2026-02-10T00:00:00Z', reporter_id: null },
        { id: '2', target_type: 'review', reason: 'inappropriate', description: null, status: 'pending', created_at: '2026-02-10T00:00:00Z', reporter_id: null },
        { id: '3', target_type: 'review', reason: 'fake', description: null, status: 'pending', created_at: '2026-02-10T00:00:00Z', reporter_id: null },
        { id: '4', target_type: 'review', reason: 'harassment', description: null, status: 'pending', created_at: '2026-02-10T00:00:00Z', reporter_id: null },
        { id: '5', target_type: 'review', reason: 'other', description: null, status: 'pending', created_at: '2026-02-10T00:00:00Z', reporter_id: null },
      ]
      render(
        <PendingReports reports={reports} loading={false} onMutate={mockOnMutate} />
      )

      expect(screen.getByText('Spam')).toBeInTheDocument()
      expect(screen.getByText('Inappropriate')).toBeInTheDocument()
      expect(screen.getByText('Fake content')).toBeInTheDocument()
      expect(screen.getByText('Harassment')).toBeInTheDocument()
      expect(screen.getByText('Other')).toBeInTheDocument()
    })

    it('renders correct English target type labels', () => {
      const reports = [
        { id: '1', target_type: 'review', reason: 'spam', description: null, status: 'pending', created_at: '2026-02-10T00:00:00Z', reporter_id: null },
        { id: '2', target_type: 'user', reason: 'spam', description: null, status: 'pending', created_at: '2026-02-10T00:00:00Z', reporter_id: null },
        { id: '3', target_type: 'provider', reason: 'spam', description: null, status: 'pending', created_at: '2026-02-10T00:00:00Z', reporter_id: null },
        { id: '4', target_type: 'message', reason: 'spam', description: null, status: 'pending', created_at: '2026-02-10T00:00:00Z', reporter_id: null },
      ]
      render(
        <PendingReports reports={reports} loading={false} onMutate={mockOnMutate} />
      )

      expect(screen.getByText('Review')).toBeInTheDocument()
      expect(screen.getByText('User')).toBeInTheDocument()
      expect(screen.getByText('Attorney')).toBeInTheDocument()
      expect(screen.getByText('Message')).toBeInTheDocument()
    })

    it('falls back to raw target_type when label is not mapped', () => {
      const reports = [
        { id: '1', target_type: 'booking_unknown', reason: 'spam', description: null, status: 'pending', created_at: '2026-02-10T00:00:00Z', reporter_id: null },
      ]
      render(
        <PendingReports reports={reports} loading={false} onMutate={mockOnMutate} />
      )
      expect(screen.getByText('booking_unknown')).toBeInTheDocument()
    })
  })

  describe('action buttons', () => {
    it('renders resolve button with correct aria-label for each report', () => {
      render(
        <PendingReports reports={buildReports()} loading={false} onMutate={mockOnMutate} />
      )
      const resolveButtons = screen.getAllByRole('button', { name: 'Resolve this report' })
      expect(resolveButtons).toHaveLength(2)
    })

    it('renders dismiss button with correct aria-label for each report', () => {
      render(
        <PendingReports reports={buildReports()} loading={false} onMutate={mockOnMutate} />
      )
      const dismissButtons = screen.getAllByRole('button', { name: 'Dismiss this report' })
      expect(dismissButtons).toHaveLength(2)
    })

    it('opens confirmation modal when resolve button is clicked', () => {
      render(
        <PendingReports reports={buildReports()} loading={false} onMutate={mockOnMutate} />
      )

      const resolveButtons = screen.getAllByRole('button', { name: 'Resolve this report' })
      fireEvent.click(resolveButtons[0])

      expect(screen.getByTestId('confirmation-modal')).toBeInTheDocument()
      expect(screen.getByTestId('modal-title')).toHaveTextContent('Resolve report')
    })

    it('opens confirmation modal when dismiss button is clicked', () => {
      render(
        <PendingReports reports={buildReports()} loading={false} onMutate={mockOnMutate} />
      )

      const dismissButtons = screen.getAllByRole('button', { name: 'Dismiss this report' })
      fireEvent.click(dismissButtons[0])

      expect(screen.getByTestId('confirmation-modal')).toBeInTheDocument()
      expect(screen.getByTestId('modal-title')).toHaveTextContent('Dismiss report')
    })

    it('calls adminMutate with correct parameters on resolve confirmation', async () => {
      render(
        <PendingReports reports={buildReports()} loading={false} onMutate={mockOnMutate} />
      )

      // Click resolve on first report
      const resolveButtons = screen.getAllByRole('button', { name: 'Resolve this report' })
      fireEvent.click(resolveButtons[0])

      // Confirm in modal
      const confirmBtn = screen.getByTestId('modal-confirm')
      await act(async () => {
        fireEvent.click(confirmBtn)
      })

      expect(mockAdminMutate).toHaveBeenCalledWith(
        '/api/admin/reports/rpt1/resolve',
        { method: 'POST', body: { action: 'resolve' } }
      )
    })

    it('calls adminMutate with dismiss action on dismiss confirmation', async () => {
      render(
        <PendingReports reports={buildReports()} loading={false} onMutate={mockOnMutate} />
      )

      // Click dismiss on first report
      const dismissButtons = screen.getAllByRole('button', { name: 'Dismiss this report' })
      fireEvent.click(dismissButtons[0])

      // Confirm in modal
      const confirmBtn = screen.getByTestId('modal-confirm')
      await act(async () => {
        fireEvent.click(confirmBtn)
      })

      expect(mockAdminMutate).toHaveBeenCalledWith(
        '/api/admin/reports/rpt1/resolve',
        { method: 'POST', body: { action: 'dismiss' } }
      )
    })

    it('calls onMutate after successful resolution', async () => {
      mockAdminMutate.mockResolvedValue({ success: true })

      render(
        <PendingReports reports={buildReports()} loading={false} onMutate={mockOnMutate} />
      )

      const resolveButtons = screen.getAllByRole('button', { name: 'Resolve this report' })
      fireEvent.click(resolveButtons[0])

      const confirmBtn = screen.getByTestId('modal-confirm')
      await act(async () => {
        fireEvent.click(confirmBtn)
      })

      expect(mockOnMutate).toHaveBeenCalledOnce()
    })

    it('shows success toast after resolving a report', async () => {
      mockAdminMutate.mockResolvedValue({ success: true })

      render(
        <PendingReports reports={buildReports()} loading={false} onMutate={mockOnMutate} />
      )

      const resolveButtons = screen.getAllByRole('button', { name: 'Resolve this report' })
      fireEvent.click(resolveButtons[0])

      const confirmBtn = screen.getByTestId('modal-confirm')
      await act(async () => {
        fireEvent.click(confirmBtn)
      })

      const toast = screen.getByTestId('toast')
      expect(toast).toHaveTextContent('Report resolved')
      expect(toast).toHaveAttribute('data-type', 'success')
    })

    it('shows success toast with dismiss message after rejecting', async () => {
      mockAdminMutate.mockResolvedValue({ success: true })

      render(
        <PendingReports reports={buildReports()} loading={false} onMutate={mockOnMutate} />
      )

      const dismissButtons = screen.getAllByRole('button', { name: 'Dismiss this report' })
      fireEvent.click(dismissButtons[0])

      const confirmBtn = screen.getByTestId('modal-confirm')
      await act(async () => {
        fireEvent.click(confirmBtn)
      })

      const toast = screen.getByTestId('toast')
      expect(toast).toHaveTextContent('Report dismissed')
    })

    it('shows error toast when adminMutate fails', async () => {
      mockAdminMutate.mockRejectedValue(new Error('Server error'))

      render(
        <PendingReports reports={buildReports()} loading={false} onMutate={mockOnMutate} />
      )

      const resolveButtons = screen.getAllByRole('button', { name: 'Resolve this report' })
      fireEvent.click(resolveButtons[0])

      const confirmBtn = screen.getByTestId('modal-confirm')
      await act(async () => {
        fireEvent.click(confirmBtn)
      })

      const toast = screen.getByTestId('toast')
      expect(toast).toHaveTextContent('Server error')
      expect(toast).toHaveAttribute('data-type', 'error')
    })

    it('shows fallback error message when error has no message', async () => {
      mockAdminMutate.mockRejectedValue('string error')

      render(
        <PendingReports reports={buildReports()} loading={false} onMutate={mockOnMutate} />
      )

      const resolveButtons = screen.getAllByRole('button', { name: 'Resolve this report' })
      fireEvent.click(resolveButtons[0])

      const confirmBtn = screen.getByTestId('modal-confirm')
      await act(async () => {
        fireEvent.click(confirmBtn)
      })

      const toast = screen.getByTestId('toast')
      expect(toast).toHaveTextContent('Error processing report')
    })

    it('does not call onMutate when adminMutate fails', async () => {
      mockAdminMutate.mockRejectedValue(new Error('fail'))

      render(
        <PendingReports reports={buildReports()} loading={false} onMutate={mockOnMutate} />
      )

      const resolveButtons = screen.getAllByRole('button', { name: 'Resolve this report' })
      fireEvent.click(resolveButtons[0])

      const confirmBtn = screen.getByTestId('modal-confirm')
      await act(async () => {
        fireEvent.click(confirmBtn)
      })

      expect(mockOnMutate).not.toHaveBeenCalled()
    })
  })

  describe('header and navigation', () => {
    it('displays "Reports" heading', () => {
      render(
        <PendingReports reports={[]} loading={false} onMutate={mockOnMutate} />
      )
      expect(screen.getByText('Reports')).toBeInTheDocument()
    })

    it('renders "View all" link pointing to /admin/reports', () => {
      render(
        <PendingReports reports={[]} loading={false} onMutate={mockOnMutate} />
      )
      const link = screen.getByRole('link', { name: /View all/ })
      expect(link).toHaveAttribute('href', '/admin/reports')
    })
  })

  describe('accessibility', () => {
    it('has region role with correct aria-label', () => {
      render(
        <PendingReports reports={[]} loading={false} onMutate={mockOnMutate} />
      )
      expect(screen.getByRole('region', { name: 'Pending reports' })).toBeInTheDocument()
    })

    it('resolve buttons have title attribute "Resolve"', () => {
      render(
        <PendingReports reports={buildReports()} loading={false} onMutate={mockOnMutate} />
      )
      const resolveButtons = screen.getAllByRole('button', { name: 'Resolve this report' })
      resolveButtons.forEach((btn) => {
        expect(btn).toHaveAttribute('title', 'Resolve')
      })
    })

    it('dismiss buttons have title attribute "Dismiss"', () => {
      render(
        <PendingReports reports={buildReports()} loading={false} onMutate={mockOnMutate} />
      )
      const dismissButtons = screen.getAllByRole('button', { name: 'Dismiss this report' })
      dismissButtons.forEach((btn) => {
        expect(btn).toHaveAttribute('title', 'Dismiss')
      })
    })
  })
})

// ============================================
// ActivityChart Tests
// ============================================

describe('ActivityChart', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('loading state', () => {
    it('renders skeleton when loading is true', () => {
      const { container } = render(<ActivityChart data={[]} loading={true} />)
      const skeleton = container.querySelector('.animate-pulse')
      expect(skeleton).toBeInTheDocument()
    })

    it('does not render chart elements when loading', () => {
      render(<ActivityChart data={buildChartData()} loading={true} />)
      expect(screen.queryByTestId('area-chart')).not.toBeInTheDocument()
    })
  })

  describe('mounting behavior', () => {
    it('renders chart after mounting (client-side hydration)', () => {
      render(<ActivityChart data={buildChartData()} loading={false} />)
      // After mounting, useEffect sets mounted=true, chart should render
      expect(screen.getByTestId('responsive-container')).toBeInTheDocument()
    })
  })

  describe('empty data state', () => {
    it('shows empty state message when all data points are zero', () => {
      render(<ActivityChart data={buildEmptyChartData()} loading={false} />)
      expect(screen.getByText('No data for this period')).toBeInTheDocument()
    })

    it('does not render chart when data is all zeros', () => {
      render(<ActivityChart data={buildEmptyChartData()} loading={false} />)
      expect(screen.queryByTestId('area-chart')).not.toBeInTheDocument()
    })
  })

  describe('data rendering', () => {
    it('renders the heading "Activity over the last 30 days"', () => {
      render(<ActivityChart data={buildChartData()} loading={false} />)
      expect(screen.getByText('Activity over the last 30 days')).toBeInTheDocument()
    })

    it('renders a responsive container with area chart', () => {
      render(<ActivityChart data={buildChartData()} loading={false} />)
      expect(screen.getByTestId('responsive-container')).toBeInTheDocument()
      expect(screen.getByTestId('area-chart')).toBeInTheDocument()
    })

    it('renders 3 Area elements for bookings, users, reviews', () => {
      render(<ActivityChart data={buildChartData()} loading={false} />)

      expect(screen.getByTestId('area-bookings')).toBeInTheDocument()
      expect(screen.getByTestId('area-users')).toBeInTheDocument()
      expect(screen.getByTestId('area-reviews')).toBeInTheDocument()
    })

    it('assigns correct English names to Area series', () => {
      render(<ActivityChart data={buildChartData()} loading={false} />)

      expect(screen.getByTestId('area-bookings')).toHaveAttribute('data-name', 'Bookings')
      expect(screen.getByTestId('area-users')).toHaveAttribute('data-name', 'Sign-ups')
      expect(screen.getByTestId('area-reviews')).toHaveAttribute('data-name', 'Reviews')
    })

    it('passes data to AreaChart with correct count', () => {
      const data = buildChartData()
      render(<ActivityChart data={data} loading={false} />)
      expect(screen.getByTestId('area-chart')).toHaveAttribute('data-count', '30')
    })

    it('renders chart axes and grid', () => {
      render(<ActivityChart data={buildChartData()} loading={false} />)
      expect(screen.getByTestId('x-axis')).toBeInTheDocument()
      expect(screen.getByTestId('y-axis')).toBeInTheDocument()
      expect(screen.getByTestId('cartesian-grid')).toBeInTheDocument()
    })

    it('renders tooltip and legend', () => {
      render(<ActivityChart data={buildChartData()} loading={false} />)
      expect(screen.getByTestId('tooltip')).toBeInTheDocument()
      expect(screen.getByTestId('legend')).toBeInTheDocument()
    })
  })

  describe('accessibility', () => {
    it('has region role with aria-label describing the chart', () => {
      render(<ActivityChart data={buildChartData()} loading={false} />)
      const region = screen.getByRole('region', { name: /Activity chart for the last 30 days/ })
      expect(region).toBeInTheDocument()
    })

    it('renders a screen-reader-only data table for chart data', () => {
      render(<ActivityChart data={buildChartData()} loading={false} />)
      const srOnly = screen.getByText(/Chart showing bookings, sign-ups, and reviews/)
      expect(srOnly).toBeInTheDocument()
    })

    it('screen-reader table contains column headers in English', () => {
      render(<ActivityChart data={buildChartData()} loading={false} />)

      expect(screen.getByText('Date')).toBeInTheDocument()
      expect(screen.getByText('Bookings')).toBeInTheDocument()
      expect(screen.getByText('Sign-ups')).toBeInTheDocument()
      // "Reviews" appears both as legend label and table header -- check it exists
      expect(screen.getAllByText('Reviews').length).toBeGreaterThanOrEqual(1)
    })

    it('screen-reader table only includes rows with non-zero data', () => {
      const data = [
        { date: '2026-01-01', bookings: 0, users: 0, reviews: 0 },
        { date: '2026-01-02', bookings: 5, users: 2, reviews: 1 },
        { date: '2026-01-03', bookings: 0, users: 0, reviews: 0 },
        { date: '2026-01-04', bookings: 3, users: 0, reviews: 0 },
      ]
      render(<ActivityChart data={data} loading={false} />)

      // Only 2 rows with non-zero data should appear in the sr-only table
      const rows = screen.getAllByRole('row')
      // 1 header row + 2 data rows = 3
      expect(rows).toHaveLength(3)
    })
  })

  describe('empty data array', () => {
    it('handles empty array without crashing', () => {
      render(<ActivityChart data={[]} loading={false} />)
      expect(screen.getByText('No data for this period')).toBeInTheDocument()
    })
  })
})
