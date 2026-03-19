/**
 * LeadForm Component — Comprehensive Unit Tests
 * Tests rendering, form states, conditional content, accessibility,
 * and interaction with the lead submission hook interface
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { LeadForm } from '@/components/estimation/LeadForm'
import type { EstimationContext } from '@/components/estimation/utils'
import type { UseLeadSubmitReturn } from '@/components/estimation/hooks/useLeadSubmit'

// Mock framer-motion (LeadForm uses memo but no motion — safe minimal mock)
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => {
      const {
        initial: _initial,
        animate: _animate,
        exit: _exit,
        transition: _transition,
        whileHover: _whileHover,
        whileTap: _whileTap,
        ...rest
      } = props
      return <div {...rest}>{children}</div>
    },
  },
  AnimatePresence: ({ children }: React.PropsWithChildren) => <>{children}</>,
}))

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  ArrowRight: (props: Record<string, unknown>) => <svg data-testid="icon-arrow-right" {...props} />,
  Loader2: (props: Record<string, unknown>) => <svg data-testid="icon-loader" {...props} />,
}))

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const baseContext: EstimationContext = {
  metier: 'Personal Injury',
  metierSlug: 'personal-injury',
  ville: 'Houston',
  departement: 'TX',
  pageUrl: '/practice-areas/personal-injury/houston',
}

const contextWithAttorney: EstimationContext = {
  ...baseContext,
  attorney: {
    name: 'John Smith',
    slug: 'john-smith',
    publicId: 'abc123',
  },
}

function createMockLead(overrides: Partial<UseLeadSubmitReturn> = {}): UseLeadSubmitReturn {
  return {
    leadName: '',
    setLeadName: vi.fn(),
    leadPhone: '',
    setLeadPhone: vi.fn(),
    leadEmail: '',
    setLeadEmail: vi.fn(),
    leadPhoneError: '',
    leadLoading: false,
    leadError: false,
    leadSubmitted: false,
    privacyConsent: false,
    setPrivacyConsent: vi.fn(),
    handleLeadSubmit: vi.fn((e: React.FormEvent) => e.preventDefault()),
    // Callback fields (not used by LeadForm but required by the interface)
    callbackPhone: '',
    setCallbackPhone: vi.fn(),
    callbackPhoneError: '',
    callbackLoading: false,
    callbackError: false,
    callbackSubmitted: false,
    privacyCallbackConsent: false,
    setPrivacyCallbackConsent: vi.fn(),
    handleCallbackSubmit: vi.fn(),
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('LeadForm', () => {
  // --- Rendering ---

  it('renders the form element', () => {
    const lead = createMockLead()
    const { container } = render(<LeadForm context={baseContext} lead={lead} />)
    const form = container.querySelector('form')
    expect(form).toBeInTheDocument()
  })

  it('renders generic heading when no attorney context', () => {
    const lead = createMockLead()
    render(<LeadForm context={baseContext} lead={lead} />)
    expect(screen.getByText('Receive my personalized estimate')).toBeInTheDocument()
  })

  it('renders attorney-specific heading when attorney context is provided', () => {
    const lead = createMockLead()
    render(<LeadForm context={contextWithAttorney} lead={lead} />)
    expect(screen.getByText('Send my request to John Smith')).toBeInTheDocument()
  })

  // --- Form fields ---

  it('renders name, phone, and email input fields', () => {
    const lead = createMockLead()
    render(<LeadForm context={baseContext} lead={lead} />)

    expect(screen.getByPlaceholderText('Your name (optional)')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Your phone number *')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Your email (optional)')).toBeInTheDocument()
  })

  it('renders phone field as required with tel inputMode', () => {
    const lead = createMockLead()
    render(<LeadForm context={baseContext} lead={lead} />)

    const phoneInput = screen.getByPlaceholderText('Your phone number *')
    expect(phoneInput).toHaveAttribute('required')
    expect(phoneInput).toHaveAttribute('inputMode', 'tel')
    expect(phoneInput).toHaveAttribute('type', 'tel')
  })

  it('renders privacy consent checkbox with policy link', () => {
    const lead = createMockLead()
    render(<LeadForm context={baseContext} lead={lead} />)

    const checkbox = screen.getByRole('checkbox')
    expect(checkbox).toBeInTheDocument()

    const privacyLink = screen.getByText('Privacy Policy')
    expect(privacyLink).toHaveAttribute('href', '/privacy')
    expect(privacyLink).toHaveAttribute('target', '_blank')
  })

  // --- Submit button ---

  it('renders generic submit button text when no attorney', () => {
    const lead = createMockLead({ leadPhone: '5551234567', privacyConsent: true })
    render(<LeadForm context={baseContext} lead={lead} />)
    expect(screen.getByText('Get connected')).toBeInTheDocument()
  })

  it('renders attorney-specific submit button text', () => {
    const lead = createMockLead({ leadPhone: '5551234567', privacyConsent: true })
    render(<LeadForm context={contextWithAttorney} lead={lead} />)
    expect(screen.getByText('Send to John Smith')).toBeInTheDocument()
  })

  it('disables submit when phone is empty', () => {
    const lead = createMockLead({ leadPhone: '', privacyConsent: true })
    render(<LeadForm context={baseContext} lead={lead} />)

    const button = screen.getByRole('button', { name: /get connected/i })
    expect(button).toBeDisabled()
  })

  it('disables submit when privacy consent is not checked', () => {
    const lead = createMockLead({ leadPhone: '5551234567', privacyConsent: false })
    render(<LeadForm context={baseContext} lead={lead} />)

    const button = screen.getByRole('button', { name: /get connected/i })
    expect(button).toBeDisabled()
  })

  it('enables submit when phone is provided and consent is checked', () => {
    const lead = createMockLead({ leadPhone: '5551234567', privacyConsent: true })
    render(<LeadForm context={baseContext} lead={lead} />)

    const button = screen.getByRole('button', { name: /get connected/i })
    expect(button).not.toBeDisabled()
  })

  // --- Loading state ---

  it('shows spinner icon when loading', () => {
    const lead = createMockLead({
      leadLoading: true,
      leadPhone: '5551234567',
      privacyConsent: true,
    })
    render(<LeadForm context={baseContext} lead={lead} />)

    expect(screen.getByTestId('icon-loader')).toBeInTheDocument()
    expect(screen.queryByText('Get connected')).not.toBeInTheDocument()
  })

  it('disables submit button when loading', () => {
    const lead = createMockLead({
      leadLoading: true,
      leadPhone: '5551234567',
      privacyConsent: true,
    })
    render(<LeadForm context={baseContext} lead={lead} />)

    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
  })

  it('sets aria-busy on the form when loading', () => {
    const lead = createMockLead({ leadLoading: true })
    const { container } = render(<LeadForm context={baseContext} lead={lead} />)

    const form = container.querySelector('form')
    expect(form).toHaveAttribute('aria-busy', 'true')
  })

  // --- Error states ---

  it('displays phone validation error message', () => {
    const lead = createMockLead({ leadPhoneError: 'Invalid phone number (e.g., (555) 123-4567)' })
    render(<LeadForm context={baseContext} lead={lead} />)

    expect(screen.getByText('Invalid phone number (e.g., (555) 123-4567)')).toBeInTheDocument()
  })

  it('applies red border to phone input when there is an error', () => {
    const lead = createMockLead({ leadPhoneError: 'Invalid phone' })
    render(<LeadForm context={baseContext} lead={lead} />)

    const phoneInput = screen.getByPlaceholderText('Your phone number *')
    expect(phoneInput.className).toContain('border-red-400')
  })

  it('displays generic error message when leadError is true', () => {
    const lead = createMockLead({ leadError: true })
    render(<LeadForm context={baseContext} lead={lead} />)

    expect(screen.getByText('An error occurred. Please try again.')).toBeInTheDocument()
  })

  // --- Interactions ---

  it('calls handleLeadSubmit on form submission', () => {
    const handleLeadSubmit = vi.fn((e: React.FormEvent) => e.preventDefault())
    const lead = createMockLead({
      leadPhone: '5551234567',
      privacyConsent: true,
      handleLeadSubmit,
    })
    render(<LeadForm context={baseContext} lead={lead} />)

    const form = document.querySelector('form') as HTMLFormElement
    fireEvent.submit(form)

    expect(handleLeadSubmit).toHaveBeenCalledTimes(1)
  })

  it('calls setLeadName when name input changes', () => {
    const setLeadName = vi.fn()
    const lead = createMockLead({ setLeadName })
    render(<LeadForm context={baseContext} lead={lead} />)

    const nameInput = screen.getByPlaceholderText('Your name (optional)')
    fireEvent.change(nameInput, { target: { value: 'Jane Doe' } })

    expect(setLeadName).toHaveBeenCalledWith('Jane Doe')
  })

  it('calls setLeadPhone when phone input changes', () => {
    const setLeadPhone = vi.fn()
    const lead = createMockLead({ setLeadPhone })
    render(<LeadForm context={baseContext} lead={lead} />)

    const phoneInput = screen.getByPlaceholderText('Your phone number *')
    fireEvent.change(phoneInput, { target: { value: '5551234567' } })

    expect(setLeadPhone).toHaveBeenCalledWith('5551234567')
  })

  it('calls setPrivacyConsent when checkbox is toggled', () => {
    const setPrivacyConsent = vi.fn()
    const lead = createMockLead({ setPrivacyConsent })
    render(<LeadForm context={baseContext} lead={lead} />)

    const checkbox = screen.getByRole('checkbox')
    fireEvent.click(checkbox)

    expect(setPrivacyConsent).toHaveBeenCalled()
  })
})
