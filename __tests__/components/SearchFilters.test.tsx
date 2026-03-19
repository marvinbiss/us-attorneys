/**
 * SearchFilters Component — Unit Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  Filter: () => <span data-testid="icon-filter" />,
  ChevronDown: () => <span data-testid="icon-chevron-down" />,
  X: () => <span data-testid="icon-x" />,
  BadgeCheck: () => <span data-testid="icon-badge-check" />,
  Star: () => <span data-testid="icon-star" />,
}))

import SearchFilters from '@/components/SearchFilters'

describe('SearchFilters', () => {
  const defaultProps = {
    onFilterChange: vi.fn(),
    totalResults: 42,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ── Basic Rendering ──────────────────────────────────────────────

  it('renders the results count', () => {
    render(<SearchFilters {...defaultProps} />)
    expect(screen.getByText('42')).toBeInTheDocument()
    expect(screen.getByText(/attorneys found/i)).toBeInTheDocument()
  })

  it('renders singular "attorney" when totalResults is 1', () => {
    render(<SearchFilters {...defaultProps} totalResults={1} />)
    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByText(/attorney found/)).toBeInTheDocument()
    // Should NOT say "attorneys" (plural)
    expect(screen.queryByText(/attorneys found/)).not.toBeInTheDocument()
  })

  it('renders the sort dropdown with default value "relevance"', () => {
    render(<SearchFilters {...defaultProps} />)
    const select = screen.getByRole('combobox') as HTMLSelectElement
    expect(select.value).toBe('relevance')
  })

  it('renders all sort options', () => {
    render(<SearchFilters {...defaultProps} />)
    expect(screen.getByText('Relevance')).toBeInTheDocument()
    expect(screen.getByText('Highest rated')).toBeInTheDocument()
    expect(screen.getByText('Name A-Z')).toBeInTheDocument()
  })

  it('renders the Filters button', () => {
    render(<SearchFilters {...defaultProps} />)
    expect(screen.getByText('Filters')).toBeInTheDocument()
  })

  it('has proper search role and label', () => {
    render(<SearchFilters {...defaultProps} />)
    expect(screen.getByRole('search', { name: 'Search filters' })).toBeInTheDocument()
  })

  it('has aria-live="polite" on results count', () => {
    render(<SearchFilters {...defaultProps} />)
    const statusEl = screen.getByRole('status')
    expect(statusEl).toHaveAttribute('aria-live', 'polite')
    expect(statusEl).toHaveAttribute('aria-atomic', 'true')
  })

  // ── Sort Dropdown ────────────────────────────────────────────────

  it('calls onFilterChange when sort changes to rating', () => {
    const onFilterChange = vi.fn()
    render(<SearchFilters {...defaultProps} onFilterChange={onFilterChange} />)
    const select = screen.getByRole('combobox')
    fireEvent.change(select, { target: { value: 'rating' } })
    expect(onFilterChange).toHaveBeenCalledWith(expect.objectContaining({ sortBy: 'rating' }))
  })

  it('calls onFilterChange when sort changes to name', () => {
    const onFilterChange = vi.fn()
    render(<SearchFilters {...defaultProps} onFilterChange={onFilterChange} />)
    const select = screen.getByRole('combobox')
    fireEvent.change(select, { target: { value: 'name' } })
    expect(onFilterChange).toHaveBeenCalledWith(expect.objectContaining({ sortBy: 'name' }))
  })

  // ── Filter Panel Toggle ──────────────────────────────────────────

  it('filter panel is hidden by default', () => {
    render(<SearchFilters {...defaultProps} />)
    expect(screen.queryByText('Verified')).not.toBeInTheDocument()
  })

  it('opens filter panel when Filters button is clicked', () => {
    render(<SearchFilters {...defaultProps} />)
    fireEvent.click(screen.getByText('Filters'))
    expect(screen.getByText('Verified')).toBeInTheDocument()
  })

  it('Filters button has aria-expanded attribute', () => {
    render(<SearchFilters {...defaultProps} />)
    const btn = screen.getByText('Filters').closest('button')!
    expect(btn).toHaveAttribute('aria-expanded', 'false')
    fireEvent.click(btn)
    expect(btn).toHaveAttribute('aria-expanded', 'true')
  })

  it('closes filter panel when Filters button is clicked again', () => {
    render(<SearchFilters {...defaultProps} />)
    const btn = screen.getByText('Filters').closest('button')!
    fireEvent.click(btn) // open
    fireEvent.click(btn) // close
    expect(screen.queryByText('Verified')).not.toBeInTheDocument()
  })

  // ── Verified Filter ──────────────────────────────────────────────

  it('calls onFilterChange with verified=true when Verified button is clicked', () => {
    const onFilterChange = vi.fn()
    render(<SearchFilters {...defaultProps} onFilterChange={onFilterChange} />)
    // Open filter panel
    fireEvent.click(screen.getByText('Filters'))
    // Click Verified
    fireEvent.click(screen.getByText('Verified'))
    expect(onFilterChange).toHaveBeenCalledWith(expect.objectContaining({ verified: true }))
  })

  it('toggles verified filter off on second click', () => {
    const onFilterChange = vi.fn()
    render(<SearchFilters {...defaultProps} onFilterChange={onFilterChange} />)
    fireEvent.click(screen.getByText('Filters'))
    const verifiedBtn = screen.getByText('Verified').closest('button')!
    fireEvent.click(verifiedBtn) // on
    fireEvent.click(verifiedBtn) // off
    expect(onFilterChange).toHaveBeenLastCalledWith(expect.objectContaining({ verified: false }))
  })

  it('Verified button has aria-pressed attribute', () => {
    render(<SearchFilters {...defaultProps} />)
    fireEvent.click(screen.getByText('Filters'))
    const verifiedBtn = screen.getByText('Verified').closest('button')!
    expect(verifiedBtn).toHaveAttribute('aria-pressed', 'false')
    fireEvent.click(verifiedBtn)
    expect(verifiedBtn).toHaveAttribute('aria-pressed', 'true')
  })

  // ── Rating Filter ────────────────────────────────────────────────

  it('calls onFilterChange with minRating=4 when 4+ button is clicked', () => {
    const onFilterChange = vi.fn()
    render(<SearchFilters {...defaultProps} onFilterChange={onFilterChange} />)
    fireEvent.click(screen.getByText('Filters'))
    fireEvent.click(screen.getByLabelText('Minimum 4 stars'))
    expect(onFilterChange).toHaveBeenCalledWith(expect.objectContaining({ minRating: 4 }))
  })

  it('calls onFilterChange with minRating=4.5 when 4.5+ button is clicked', () => {
    const onFilterChange = vi.fn()
    render(<SearchFilters {...defaultProps} onFilterChange={onFilterChange} />)
    fireEvent.click(screen.getByText('Filters'))
    fireEvent.click(screen.getByLabelText('Minimum 4.5 stars'))
    expect(onFilterChange).toHaveBeenCalledWith(expect.objectContaining({ minRating: 4.5 }))
  })

  it('toggles rating filter off when same button is clicked again', () => {
    const onFilterChange = vi.fn()
    render(<SearchFilters {...defaultProps} onFilterChange={onFilterChange} />)
    fireEvent.click(screen.getByText('Filters'))
    const ratingBtn = screen.getByLabelText('Minimum 4 stars')
    fireEvent.click(ratingBtn) // on
    fireEvent.click(ratingBtn) // off
    expect(onFilterChange).toHaveBeenLastCalledWith(expect.objectContaining({ minRating: null }))
  })

  it('rating buttons have aria-pressed', () => {
    render(<SearchFilters {...defaultProps} />)
    fireEvent.click(screen.getByText('Filters'))
    const btn4 = screen.getByLabelText('Minimum 4 stars')
    expect(btn4).toHaveAttribute('aria-pressed', 'false')
    fireEvent.click(btn4)
    expect(btn4).toHaveAttribute('aria-pressed', 'true')
  })

  // ── Active Filters Count Badge ───────────────────────────────────

  it('shows active filter count badge when filters are active', () => {
    render(<SearchFilters {...defaultProps} />)
    fireEvent.click(screen.getByText('Filters'))
    // Activate verified filter
    fireEvent.click(screen.getByText('Verified'))
    expect(screen.getByLabelText('1 active filter')).toBeInTheDocument()
  })

  it('shows count 2 when both verified and rating are active', () => {
    render(<SearchFilters {...defaultProps} />)
    fireEvent.click(screen.getByText('Filters'))
    fireEvent.click(screen.getByText('Verified'))
    fireEvent.click(screen.getByLabelText('Minimum 4 stars'))
    expect(screen.getByLabelText('2 active filters')).toBeInTheDocument()
  })

  it('hides active filter count badge when no filters active', () => {
    render(<SearchFilters {...defaultProps} />)
    expect(screen.queryByLabelText(/active filter/)).not.toBeInTheDocument()
  })

  // ── Clear Filters ────────────────────────────────────────────────

  it('shows Clear button when filters are active', () => {
    render(<SearchFilters {...defaultProps} />)
    fireEvent.click(screen.getByText('Filters'))
    fireEvent.click(screen.getByText('Verified'))
    expect(screen.getByLabelText('Clear all filters')).toBeInTheDocument()
  })

  it('hides Clear button when no filters active', () => {
    render(<SearchFilters {...defaultProps} />)
    fireEvent.click(screen.getByText('Filters'))
    expect(screen.queryByLabelText('Clear all filters')).not.toBeInTheDocument()
  })

  it('resets all filters when Clear is clicked', () => {
    const onFilterChange = vi.fn()
    render(<SearchFilters {...defaultProps} onFilterChange={onFilterChange} />)
    fireEvent.click(screen.getByText('Filters'))
    // Activate filters
    fireEvent.click(screen.getByText('Verified'))
    fireEvent.click(screen.getByLabelText('Minimum 4 stars'))
    // Clear
    fireEvent.click(screen.getByLabelText('Clear all filters'))
    expect(onFilterChange).toHaveBeenLastCalledWith({
      verified: false,
      minRating: null,
      sortBy: 'relevance',
    })
  })

  // ── Results Count with Zero ──────────────────────────────────────

  it('displays 0 attorneys found', () => {
    render(<SearchFilters {...defaultProps} totalResults={0} />)
    expect(screen.getByText('0')).toBeInTheDocument()
  })

  // ── Filter Options Group Accessibility ───────────────────────────

  it('filter options panel has proper aria group label', () => {
    render(<SearchFilters {...defaultProps} />)
    fireEvent.click(screen.getByText('Filters'))
    expect(screen.getByRole('group', { name: 'Filter options' })).toBeInTheDocument()
  })

  it('rating filter group has proper aria label', () => {
    render(<SearchFilters {...defaultProps} />)
    fireEvent.click(screen.getByText('Filters'))
    expect(screen.getByRole('group', { name: 'Filter by minimum rating' })).toBeInTheDocument()
  })

  it('sort and filter controls group has proper aria label', () => {
    render(<SearchFilters {...defaultProps} />)
    expect(screen.getByRole('group', { name: 'Sort and filter controls' })).toBeInTheDocument()
  })
})
