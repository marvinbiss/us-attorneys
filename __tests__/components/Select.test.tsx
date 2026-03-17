/**
 * Select Component — Unit Tests
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import Select from '@/components/ui/Select'

// Mock lucide-react
vi.mock('lucide-react', () => ({
  ChevronDown: ({ className }: { className?: string }) => (
    <span data-testid="icon-ChevronDown" className={className} />
  ),
}))

const sampleOptions = [
  { value: 'ny', label: 'New York' },
  { value: 'ca', label: 'California' },
  { value: 'tx', label: 'Texas' },
]

describe('Select', () => {
  it('renders a select element', () => {
    render(<Select options={sampleOptions} />)
    expect(screen.getByRole('combobox')).toBeInTheDocument()
  })

  it('renders all options', () => {
    render(<Select options={sampleOptions} />)
    expect(screen.getByText('New York')).toBeInTheDocument()
    expect(screen.getByText('California')).toBeInTheDocument()
    expect(screen.getByText('Texas')).toBeInTheDocument()
  })

  it('renders placeholder option when provided', () => {
    render(<Select options={sampleOptions} placeholder="Select a state" />)
    expect(screen.getByText('Select a state')).toBeInTheDocument()
  })

  it('renders label when provided', () => {
    render(<Select options={sampleOptions} label="State" />)
    expect(screen.getByText('State')).toBeInTheDocument()
  })

  it('associates label with select via htmlFor', () => {
    render(<Select options={sampleOptions} label="State" id="state-select" />)
    const label = screen.getByText('State')
    expect(label).toHaveAttribute('for', 'state-select')
  })

  it('shows required asterisk when required', () => {
    render(<Select options={sampleOptions} label="State" required />)
    expect(screen.getByText('*')).toBeInTheDocument()
  })

  it('calls onChange when selection changes', () => {
    const onChange = vi.fn()
    render(<Select options={sampleOptions} onChange={onChange} />)
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'ca' } })
    expect(onChange).toHaveBeenCalled()
  })

  it('displays error message', () => {
    render(<Select options={sampleOptions} error="Please select a state" />)
    expect(screen.getByText('Please select a state')).toBeInTheDocument()
  })

  it('sets aria-invalid when error is present', () => {
    render(<Select options={sampleOptions} error="Required" />)
    const select = screen.getByRole('combobox')
    expect(select).toHaveAttribute('aria-invalid', 'true')
  })

  it('sets aria-describedby to error id', () => {
    render(<Select options={sampleOptions} id="state" error="Error" />)
    const select = screen.getByRole('combobox')
    expect(select).toHaveAttribute('aria-describedby', 'state-error')
  })

  it('displays hint text', () => {
    render(<Select options={sampleOptions} hint="Choose your state" />)
    expect(screen.getByText('Choose your state')).toBeInTheDocument()
  })

  it('hides hint when error is present', () => {
    render(<Select options={sampleOptions} hint="Hint" error="Error" />)
    expect(screen.queryByText('Hint')).not.toBeInTheDocument()
    expect(screen.getByText('Error')).toBeInTheDocument()
  })

  it('applies disabled state', () => {
    render(<Select options={sampleOptions} disabled />)
    expect(screen.getByRole('combobox')).toBeDisabled()
  })

  it('renders disabled options', () => {
    const options = [
      { value: 'a', label: 'Active' },
      { value: 'b', label: 'Disabled', disabled: true },
    ]
    render(<Select options={options} />)
    const disabledOption = screen.getByText('Disabled') as HTMLOptionElement
    expect(disabledOption.disabled).toBe(true)
  })

  it('renders chevron down icon', () => {
    render(<Select options={sampleOptions} />)
    expect(screen.getByTestId('icon-ChevronDown')).toBeInTheDocument()
  })

  it('forwards ref', () => {
    const ref = { current: null as HTMLSelectElement | null }
    render(<Select options={sampleOptions} ref={ref} />)
    expect(ref.current).toBeInstanceOf(HTMLSelectElement)
  })

  it('applies error border styling', () => {
    render(<Select options={sampleOptions} error="Error" />)
    const select = screen.getByRole('combobox')
    expect(select.className).toContain('border-red-500')
  })
})
