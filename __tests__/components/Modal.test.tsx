/**
 * Modal / ConfirmModal Components — Unit Tests
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Modal, ConfirmModal } from '@/components/ui/Modal'

// Mock lucide-react
vi.mock('lucide-react', () => ({
  X: ({ className }: { className?: string }) => (
    <span data-testid="icon-X" className={className} />
  ),
}))

// Mock styled-jsx (used by Modal for animations)
vi.mock('react', async () => {
  const actual = await vi.importActual('react')
  return actual
})

describe('Modal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    children: <p>Modal content</p>,
  }

  it('renders nothing when isOpen is false', () => {
    const { container } = render(
      <Modal isOpen={false} onClose={vi.fn()}>
        <p>Hidden</p>
      </Modal>
    )
    expect(container.innerHTML).toBe('')
  })

  it('renders children when isOpen is true', () => {
    render(<Modal {...defaultProps} />)
    expect(screen.getByText('Modal content')).toBeInTheDocument()
  })

  it('renders title when provided', () => {
    render(<Modal {...defaultProps} title="My Title" />)
    expect(screen.getByText('My Title')).toBeInTheDocument()
  })

  it('renders description when provided', () => {
    render(<Modal {...defaultProps} title="Title" description="A description" />)
    expect(screen.getByText('A description')).toBeInTheDocument()
  })

  it('has role=dialog and aria-modal=true', () => {
    render(<Modal {...defaultProps} title="Dialog" />)
    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveAttribute('aria-modal', 'true')
  })

  it('renders close button by default', () => {
    render(<Modal {...defaultProps} title="Title" />)
    expect(screen.getByLabelText('Close')).toBeInTheDocument()
  })

  it('hides close button when showCloseButton is false', () => {
    render(<Modal {...defaultProps} title="Title" showCloseButton={false} />)
    expect(screen.queryByLabelText('Close')).not.toBeInTheDocument()
  })

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn()
    render(<Modal isOpen={true} onClose={onClose} title="Title"><p>Content</p></Modal>)
    fireEvent.click(screen.getByLabelText('Close'))
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('calls onClose on Escape key press', () => {
    const onClose = vi.fn()
    render(<Modal isOpen={true} onClose={onClose}><p>Content</p></Modal>)
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('calls onClose on overlay click when closeOnOverlayClick is true', () => {
    const onClose = vi.fn()
    render(
      <Modal isOpen={true} onClose={onClose} closeOnOverlayClick={true}>
        <p>Content</p>
      </Modal>
    )
    // Click on the overlay container (the second fixed div)
    const overlays = document.querySelectorAll('.fixed.inset-0')
    // Click on the first overlay (backdrop)
    fireEvent.click(overlays[0])
    expect(onClose).toHaveBeenCalled()
  })

  it('does not call onClose on overlay click when closeOnOverlayClick is false', () => {
    const onClose = vi.fn()
    render(
      <Modal isOpen={true} onClose={onClose} closeOnOverlayClick={false}>
        <p>Content</p>
      </Modal>
    )
    const overlays = document.querySelectorAll('.fixed.inset-0')
    fireEvent.click(overlays[0])
    expect(onClose).not.toHaveBeenCalled()
  })

  it('locks body scroll when open', () => {
    render(<Modal {...defaultProps} />)
    expect(document.body.style.overflow).toBe('hidden')
  })

  it('applies correct size class', () => {
    render(<Modal {...defaultProps} title="Large" size="lg" />)
    const dialog = screen.getByRole('dialog')
    expect(dialog.className).toContain('max-w-2xl')
  })
})

describe('ConfirmModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onConfirm: vi.fn(),
    title: 'Delete item?',
    message: 'This action cannot be undone.',
  }

  it('renders title and message', () => {
    render(<ConfirmModal {...defaultProps} />)
    expect(screen.getByText('Delete item?')).toBeInTheDocument()
    expect(screen.getByText('This action cannot be undone.')).toBeInTheDocument()
  })

  it('renders default Confirm and Cancel buttons', () => {
    render(<ConfirmModal {...defaultProps} />)
    expect(screen.getByText('Confirm')).toBeInTheDocument()
    expect(screen.getByText('Cancel')).toBeInTheDocument()
  })

  it('uses custom button text', () => {
    render(<ConfirmModal {...defaultProps} confirmText="Delete" cancelText="Keep" />)
    expect(screen.getByText('Delete')).toBeInTheDocument()
    expect(screen.getByText('Keep')).toBeInTheDocument()
  })

  it('calls onConfirm when confirm button is clicked', () => {
    const onConfirm = vi.fn()
    render(<ConfirmModal {...defaultProps} onConfirm={onConfirm} />)
    fireEvent.click(screen.getByText('Confirm'))
    expect(onConfirm).toHaveBeenCalledOnce()
  })

  it('calls onClose when cancel button is clicked', () => {
    const onClose = vi.fn()
    render(<ConfirmModal {...defaultProps} onClose={onClose} />)
    fireEvent.click(screen.getByText('Cancel'))
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('shows Loading... text when isLoading is true', () => {
    render(<ConfirmModal {...defaultProps} isLoading={true} />)
    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('disables buttons when isLoading is true', () => {
    render(<ConfirmModal {...defaultProps} isLoading={true} />)
    expect(screen.getByText('Cancel')).toBeDisabled()
    expect(screen.getByText('Loading...')).toBeDisabled()
  })

  it('applies danger variant styling by default', () => {
    render(<ConfirmModal {...defaultProps} />)
    const confirmBtn = screen.getByText('Confirm')
    expect(confirmBtn.className).toContain('bg-red-600')
  })

  it('applies info variant styling', () => {
    render(<ConfirmModal {...defaultProps} variant="info" />)
    const confirmBtn = screen.getByText('Confirm')
    expect(confirmBtn.className).toContain('bg-blue-600')
  })
})
