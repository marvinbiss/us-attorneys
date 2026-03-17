/**
 * Textarea Component — Unit Tests
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import Textarea from '@/components/ui/Textarea'

describe('Textarea', () => {
  it('renders a textarea element', () => {
    render(<Textarea placeholder="Enter description" />)
    expect(screen.getByPlaceholderText('Enter description')).toBeInTheDocument()
  })

  it('renders label when provided', () => {
    render(<Textarea label="Description" />)
    expect(screen.getByText('Description')).toBeInTheDocument()
  })

  it('associates label with textarea via htmlFor', () => {
    render(<Textarea label="Bio" id="bio-input" />)
    const label = screen.getByText('Bio')
    expect(label).toHaveAttribute('for', 'bio-input')
  })

  it('shows required asterisk when required', () => {
    render(<Textarea label="Bio" required />)
    expect(screen.getByText('*')).toBeInTheDocument()
  })

  it('handles value and onChange', () => {
    const onChange = vi.fn()
    render(<Textarea value="hello" onChange={onChange} />)
    const textarea = screen.getByRole('textbox') as HTMLTextAreaElement
    expect(textarea.value).toBe('hello')
    fireEvent.change(textarea, { target: { value: 'world' } })
    expect(onChange).toHaveBeenCalled()
  })

  it('displays error message', () => {
    render(<Textarea error="Too short" />)
    expect(screen.getByText('Too short')).toBeInTheDocument()
  })

  it('sets aria-invalid when error is present', () => {
    render(<Textarea error="Invalid" />)
    const textarea = screen.getByRole('textbox')
    expect(textarea).toHaveAttribute('aria-invalid', 'true')
  })

  it('sets aria-describedby to error id when error present', () => {
    render(<Textarea id="bio" error="Bad" />)
    const textarea = screen.getByRole('textbox')
    expect(textarea).toHaveAttribute('aria-describedby', 'bio-error')
  })

  it('displays hint text', () => {
    render(<Textarea hint="Max 500 characters" />)
    expect(screen.getByText('Max 500 characters')).toBeInTheDocument()
  })

  it('hides hint when error is present', () => {
    render(<Textarea hint="Hint" error="Error" />)
    expect(screen.queryByText('Hint')).not.toBeInTheDocument()
    expect(screen.getByText('Error')).toBeInTheDocument()
  })

  it('applies disabled state', () => {
    render(<Textarea disabled />)
    expect(screen.getByRole('textbox')).toBeDisabled()
  })

  it('shows character count when showCount and maxLength are set', () => {
    render(<Textarea showCount maxLength={500} value="Hello" />)
    expect(screen.getByText('5/500')).toBeInTheDocument()
  })

  it('shows 0/maxLength when value is empty', () => {
    render(<Textarea showCount maxLength={100} value="" />)
    expect(screen.getByText('0/100')).toBeInTheDocument()
  })

  it('does not show count when showCount is false', () => {
    const { container } = render(<Textarea maxLength={100} value="Test" />)
    expect(container.textContent).not.toContain('/100')
  })

  it('applies maxLength attribute to textarea', () => {
    render(<Textarea maxLength={200} />)
    const textarea = screen.getByRole('textbox')
    expect(textarea).toHaveAttribute('maxlength', '200')
  })

  it('forwards ref', () => {
    const ref = { current: null as HTMLTextAreaElement | null }
    render(<Textarea ref={ref} />)
    expect(ref.current).toBeInstanceOf(HTMLTextAreaElement)
  })

  it('applies error border styling', () => {
    render(<Textarea error="Error" />)
    const textarea = screen.getByRole('textbox')
    expect(textarea.className).toContain('border-red-500')
  })
})
