/**
 * Pagination Component — Unit Tests
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Pagination } from '@/components/ui/Pagination'

describe('Pagination', () => {
  it('returns null when totalPages is 1', () => {
    const { container } = render(
      <Pagination currentPage={1} totalPages={1} baseUrl="/attorneys" />
    )
    expect(container.innerHTML).toBe('')
  })

  it('returns null when totalPages is 0', () => {
    const { container } = render(
      <Pagination currentPage={1} totalPages={0} baseUrl="/attorneys" />
    )
    expect(container.innerHTML).toBe('')
  })

  it('renders page numbers for small page counts', () => {
    render(<Pagination currentPage={1} totalPages={3} baseUrl="/attorneys" />)

    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
  })

  it('highlights the current page', () => {
    render(<Pagination currentPage={2} totalPages={5} baseUrl="/attorneys" />)

    const page2 = screen.getByText('2')
    expect(page2).toHaveAttribute('aria-current', 'page')
    expect(page2.className).toContain('bg-blue-600')
  })

  it('disables Previous on the first page', () => {
    render(<Pagination currentPage={1} totalPages={5} baseUrl="/attorneys" />)

    // Previous should NOT be inside a link (disabled state renders a span wrapper)
    const prevText = screen.getByText('Previous')
    expect(prevText.closest('a')).toBeNull()
  })

  it('disables Next on the last page', () => {
    render(<Pagination currentPage={5} totalPages={5} baseUrl="/attorneys" />)

    // Next should NOT be inside a link (disabled state renders a span wrapper)
    const nextText = screen.getByText('Next')
    expect(nextText.closest('a')).toBeNull()
  })

  it('shows Previous link when not on first page', () => {
    render(<Pagination currentPage={3} totalPages={5} baseUrl="/attorneys" />)

    const prevLink = screen.getByText('Previous').closest('a')
    expect(prevLink).toHaveAttribute('href', expect.stringContaining('page=2'))
  })

  it('shows Next link when not on last page', () => {
    render(<Pagination currentPage={3} totalPages={5} baseUrl="/attorneys" />)

    const nextLink = screen.getByText('Next').closest('a')
    expect(nextLink).toHaveAttribute('href', expect.stringContaining('page=4'))
  })

  it('shows ellipsis for large page counts', () => {
    render(<Pagination currentPage={5} totalPages={10} baseUrl="/attorneys" />)

    const ellipses = screen.getAllByText('...')
    expect(ellipses.length).toBeGreaterThanOrEqual(1)
  })

  it('always shows first and last page', () => {
    render(<Pagination currentPage={5} totalPages={10} baseUrl="/attorneys" />)

    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByText('10')).toBeInTheDocument()
  })

  it('generates correct page URLs with query params', () => {
    render(<Pagination currentPage={1} totalPages={3} baseUrl="/attorneys?specialty=tax" />)

    const page2Link = screen.getByText('2').closest('a')
    expect(page2Link?.getAttribute('href')).toContain('specialty=tax')
    expect(page2Link?.getAttribute('href')).toContain('page=2')
  })

  it('applies custom className', () => {
    const { container } = render(
      <Pagination currentPage={1} totalPages={3} baseUrl="/test" className="my-pagination" />
    )
    expect(container.querySelector('nav')).toHaveClass('my-pagination')
  })
})
