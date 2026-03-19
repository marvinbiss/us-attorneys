/**
 * Button Component — Unit Tests
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import Button from '@/components/ui/Button'

describe('Button', () => {
  // ── Variants ──────────────────────────────────────────────────────

  it('renders with default (primary) variant', () => {
    render(<Button>Click me</Button>)
    const btn = screen.getByRole('button', { name: 'Click me' })
    expect(btn).toBeInTheDocument()
    expect(btn.className).toContain('bg-brand')
  })

  it('renders outline variant', () => {
    render(<Button variant="outline">Outline</Button>)
    const btn = screen.getByRole('button', { name: 'Outline' })
    expect(btn.className).toContain('border-blue-600')
    expect(btn.className).toContain('bg-transparent')
  })

  it('renders ghost variant', () => {
    render(<Button variant="ghost">Ghost</Button>)
    const btn = screen.getByRole('button', { name: 'Ghost' })
    expect(btn.className).toContain('bg-transparent')
    expect(btn.className).toContain('text-gray-700')
  })

  it('renders danger variant', () => {
    render(<Button variant="danger">Delete</Button>)
    const btn = screen.getByRole('button', { name: 'Delete' })
    expect(btn.className).toContain('bg-red-600')
  })

  it('renders premium variant with gradient', () => {
    render(<Button variant="premium">Upgrade</Button>)
    const btn = screen.getByRole('button', { name: 'Upgrade' })
    expect(btn.className).toContain('from-amber-500')
  })

  // ── Sizes ─────────────────────────────────────────────────────────

  it('applies small size', () => {
    render(<Button size="sm">Small</Button>)
    const btn = screen.getByRole('button')
    expect(btn.className).toContain('px-3.5')
    expect(btn.className).toContain('text-sm')
  })

  it('applies large size', () => {
    render(<Button size="lg">Large</Button>)
    const btn = screen.getByRole('button')
    expect(btn.className).toContain('px-6')
    expect(btn.className).toContain('text-lg')
  })

  // ── Disabled state ────────────────────────────────────────────────

  it('is disabled when disabled prop is true', () => {
    render(<Button disabled>Disabled</Button>)
    const btn = screen.getByRole('button')
    expect(btn).toBeDisabled()
  })

  it('is disabled when isLoading is true', () => {
    render(<Button isLoading>Loading</Button>)
    const btn = screen.getByRole('button')
    expect(btn).toBeDisabled()
  })

  // ── Loading state ─────────────────────────────────────────────────

  it('shows spinner when loading', () => {
    const { container } = render(<Button isLoading>Submit</Button>)
    // Loader2 icon should be present (has animate-spin class)
    const spinner = container.querySelector('.animate-spin')
    expect(spinner).toBeInTheDocument()
  })

  // ── Click handler ─────────────────────────────────────────────────

  it('calls onClick when clicked', () => {
    const handleClick = vi.fn()
    render(<Button onClick={handleClick}>Click</Button>)
    fireEvent.click(screen.getByRole('button'))
    expect(handleClick).toHaveBeenCalledOnce()
  })

  it('does not fire onClick when disabled', () => {
    const handleClick = vi.fn()
    render(
      <Button disabled onClick={handleClick}>
        Nope
      </Button>
    )
    fireEvent.click(screen.getByRole('button'))
    expect(handleClick).not.toHaveBeenCalled()
  })

  // ── fullWidth ─────────────────────────────────────────────────────

  it('applies w-full when fullWidth is true', () => {
    render(<Button fullWidth>Full</Button>)
    const btn = screen.getByRole('button')
    expect(btn.className).toContain('w-full')
  })

  // ── Icons ─────────────────────────────────────────────────────────

  it('renders left and right icons', () => {
    render(
      <Button
        leftIcon={<span data-testid="left-icon">L</span>}
        rightIcon={<span data-testid="right-icon">R</span>}
      >
        Action
      </Button>
    )
    expect(screen.getByTestId('left-icon')).toBeInTheDocument()
    expect(screen.getByTestId('right-icon')).toBeInTheDocument()
  })

  it('hides icons when loading', () => {
    render(
      <Button
        isLoading
        leftIcon={<span data-testid="left-icon">L</span>}
        rightIcon={<span data-testid="right-icon">R</span>}
      >
        Action
      </Button>
    )
    expect(screen.queryByTestId('left-icon')).not.toBeInTheDocument()
    expect(screen.queryByTestId('right-icon')).not.toBeInTheDocument()
  })

  // ── Ref forwarding ────────────────────────────────────────────────

  it('forwards ref to the button element', () => {
    const ref = { current: null as HTMLButtonElement | null }
    render(<Button ref={ref}>Ref</Button>)
    expect(ref.current).toBeInstanceOf(HTMLButtonElement)
  })
})
