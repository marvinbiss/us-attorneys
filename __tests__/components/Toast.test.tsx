/**
 * Toast / ToastContainer Components — Unit Tests
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Toast, ToastContainer } from '@/components/ui/Toast'
import type { Toast as ToastType } from '@/hooks/useToast'

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
    X: iconFactory('X'),
    CheckCircle: iconFactory('CheckCircle'),
    AlertCircle: iconFactory('AlertCircle'),
    AlertTriangle: iconFactory('AlertTriangle'),
    Info: iconFactory('Info'),
  }
})

function buildToast(overrides: Partial<ToastType> = {}): ToastType {
  return {
    id: 'toast-1',
    type: 'success',
    title: 'Success!',
    ...overrides,
  }
}

describe('Toast', () => {
  it('renders the title', () => {
    render(<Toast toast={buildToast()} onDismiss={vi.fn()} />)
    expect(screen.getByText('Success!')).toBeInTheDocument()
  })

  it('renders the message when provided', () => {
    render(<Toast toast={buildToast({ message: 'Item saved.' })} onDismiss={vi.fn()} />)
    expect(screen.getByText('Item saved.')).toBeInTheDocument()
  })

  it('does not render message when not provided', () => {
    const { container } = render(<Toast toast={buildToast()} onDismiss={vi.fn()} />)
    const paragraphs = container.querySelectorAll('p')
    // Only the title paragraph
    expect(paragraphs).toHaveLength(1)
  })

  it('has role="alert"', () => {
    render(<Toast toast={buildToast()} onDismiss={vi.fn()} />)
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })

  it('renders close button with aria-label', () => {
    render(<Toast toast={buildToast()} onDismiss={vi.fn()} />)
    expect(screen.getByLabelText('Close')).toBeInTheDocument()
  })

  it('calls onDismiss when close button is clicked', () => {
    vi.useFakeTimers()
    const onDismiss = vi.fn()
    render(<Toast toast={buildToast({ id: 'abc' })} onDismiss={onDismiss} />)
    fireEvent.click(screen.getByLabelText('Close'))
    // onDismiss is called after a 150ms timeout
    vi.advanceTimersByTime(200)
    expect(onDismiss).toHaveBeenCalledWith('abc')
    vi.useRealTimers()
  })

  it('applies success styling', () => {
    render(<Toast toast={buildToast({ type: 'success' })} onDismiss={vi.fn()} />)
    const alert = screen.getByRole('alert')
    expect(alert.className).toContain('bg-green-50')
  })

  it('applies error styling', () => {
    render(<Toast toast={buildToast({ type: 'error', title: 'Error!' })} onDismiss={vi.fn()} />)
    const alert = screen.getByRole('alert')
    expect(alert.className).toContain('bg-red-50')
  })

  it('applies warning styling', () => {
    render(<Toast toast={buildToast({ type: 'warning', title: 'Warning!' })} onDismiss={vi.fn()} />)
    const alert = screen.getByRole('alert')
    expect(alert.className).toContain('bg-amber-50')
  })

  it('applies info styling', () => {
    render(<Toast toast={buildToast({ type: 'info', title: 'Info' })} onDismiss={vi.fn()} />)
    const alert = screen.getByRole('alert')
    expect(alert.className).toContain('bg-blue-50')
  })

  it('renders correct icon for each type', () => {
    const { rerender } = render(<Toast toast={buildToast({ type: 'success' })} onDismiss={vi.fn()} />)
    expect(screen.getByTestId('icon-CheckCircle')).toBeInTheDocument()

    rerender(<Toast toast={buildToast({ type: 'error' })} onDismiss={vi.fn()} />)
    expect(screen.getByTestId('icon-AlertCircle')).toBeInTheDocument()

    rerender(<Toast toast={buildToast({ type: 'warning' })} onDismiss={vi.fn()} />)
    expect(screen.getByTestId('icon-AlertTriangle')).toBeInTheDocument()

    rerender(<Toast toast={buildToast({ type: 'info' })} onDismiss={vi.fn()} />)
    expect(screen.getByTestId('icon-Info')).toBeInTheDocument()
  })

  it('renders action button when action is provided', () => {
    const onClick = vi.fn()
    render(
      <Toast
        toast={buildToast({ action: { label: 'Undo', onClick } })}
        onDismiss={vi.fn()}
      />
    )
    const actionBtn = screen.getByText('Undo')
    expect(actionBtn).toBeInTheDocument()
    fireEvent.click(actionBtn)
    expect(onClick).toHaveBeenCalledOnce()
  })
})

describe('ToastContainer', () => {
  it('renders nothing when toasts array is empty', () => {
    const { container } = render(<ToastContainer toasts={[]} onDismiss={vi.fn()} />)
    expect(container.innerHTML).toBe('')
  })

  it('renders multiple toasts', () => {
    const toasts: ToastType[] = [
      buildToast({ id: '1', title: 'First' }),
      buildToast({ id: '2', title: 'Second', type: 'error' }),
    ]
    render(<ToastContainer toasts={toasts} onDismiss={vi.fn()} />)
    expect(screen.getByText('First')).toBeInTheDocument()
    expect(screen.getByText('Second')).toBeInTheDocument()
  })

  it('has aria-live="polite" for accessibility', () => {
    const toasts: ToastType[] = [buildToast()]
    render(<ToastContainer toasts={toasts} onDismiss={vi.fn()} />)
    const container = screen.getByLabelText('Notifications')
    expect(container).toHaveAttribute('aria-live', 'polite')
  })
})
