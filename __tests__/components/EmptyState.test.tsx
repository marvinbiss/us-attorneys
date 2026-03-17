/**
 * EmptyState Component — Unit Tests
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { EmptyState } from '@/components/ui/EmptyState'

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string; [key: string]: unknown }) => (
    <a href={href} {...props}>{children}</a>
  ),
}))

// Mock lucide-react
vi.mock('lucide-react', () => {
  const iconFactory = (name: string) => {
    const Icon = ({ className }: { className?: string }) => (
      <span data-testid={`icon-${name}`} className={className} />
    )
    Icon.displayName = name
    return Icon
  }
  return {
    Search: iconFactory('Search'),
    Inbox: iconFactory('Inbox'),
    FileQuestion: iconFactory('FileQuestion'),
    AlertCircle: iconFactory('AlertCircle'),
  }
})

describe('EmptyState', () => {
  it('renders the title', () => {
    render(<EmptyState title="No results found" />)
    expect(screen.getByText('No results found')).toBeInTheDocument()
  })

  it('renders the description when provided', () => {
    render(<EmptyState title="Empty" description="Try adjusting your search" />)
    expect(screen.getByText('Try adjusting your search')).toBeInTheDocument()
  })

  it('does not render description when not provided', () => {
    const { container } = render(<EmptyState title="Empty" />)
    const paragraphs = container.querySelectorAll('p')
    expect(paragraphs).toHaveLength(0)
  })

  it('renders search variant icon by default', () => {
    render(<EmptyState title="No results" />)
    expect(screen.getByTestId('icon-Search')).toBeInTheDocument()
  })

  it('renders inbox variant icon', () => {
    render(<EmptyState title="No messages" variant="inbox" />)
    expect(screen.getByTestId('icon-Inbox')).toBeInTheDocument()
  })

  it('renders notFound variant icon', () => {
    render(<EmptyState title="Page not found" variant="notFound" />)
    expect(screen.getByTestId('icon-FileQuestion')).toBeInTheDocument()
  })

  it('renders error variant icon', () => {
    render(<EmptyState title="Error" variant="error" />)
    expect(screen.getByTestId('icon-AlertCircle')).toBeInTheDocument()
  })

  it('uses custom icon when provided', () => {
    render(
      <EmptyState
        title="Custom"
        icon={<span data-testid="custom-icon">!</span>}
      />
    )
    expect(screen.getByTestId('custom-icon')).toBeInTheDocument()
  })

  it('renders action as a link when href is provided', () => {
    render(
      <EmptyState
        title="Empty"
        action={{ label: 'Go home', href: '/' }}
      />
    )
    const link = screen.getByText('Go home').closest('a')
    expect(link).toHaveAttribute('href', '/')
  })

  it('renders action as a button when onClick is provided', () => {
    const onClick = vi.fn()
    render(
      <EmptyState
        title="Empty"
        action={{ label: 'Retry', onClick }}
      />
    )
    fireEvent.click(screen.getByText('Retry'))
    expect(onClick).toHaveBeenCalledOnce()
  })

  it('renders secondary action as a link', () => {
    render(
      <EmptyState
        title="Empty"
        action={{ label: 'Primary', href: '/primary' }}
        secondaryAction={{ label: 'Secondary', href: '/help' }}
      />
    )
    const link = screen.getByText('Secondary').closest('a')
    expect(link).toHaveAttribute('href', '/help')
  })

  it('renders secondary action as a button', () => {
    const onClick = vi.fn()
    render(
      <EmptyState
        title="Empty"
        secondaryAction={{ label: 'Clear', onClick }}
      />
    )
    fireEvent.click(screen.getByText('Clear'))
    expect(onClick).toHaveBeenCalledOnce()
  })

  it('applies custom className', () => {
    const { container } = render(
      <EmptyState title="Empty" className="my-empty" />
    )
    const wrapper = container.firstChild as HTMLElement
    expect(wrapper.className).toContain('my-empty')
  })

  it('applies correct icon color for error variant', () => {
    const { container } = render(<EmptyState title="Error" variant="error" />)
    const iconWrapper = container.querySelector('.bg-red-50')
    expect(iconWrapper).toBeInTheDocument()
  })
})
