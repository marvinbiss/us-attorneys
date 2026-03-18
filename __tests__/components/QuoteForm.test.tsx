/**
 * QuoteForm (ConsultationRequestForm) — Unit Tests
 *
 * Covers:
 * - Initial render and step indicator
 * - Step navigation
 * - Prefilled service/city behavior
 * - Form submission success
 * - Form submission error
 * - LocalStorage persistence
 * - Validation errors at each step
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import ConsultationRequestForm from '@/components/QuoteForm'

// --- Mocks ---

vi.mock('@/hooks/useToast', () => ({
  useToast: () => ({
    toasts: [],
    removeToast: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
  }),
}))

vi.mock('@/components/ui/Toast', () => ({
  ToastContainer: () => null,
}))

vi.mock('@/lib/analytics/tracking', () => ({
  trackEvent: vi.fn(),
  trackConversion: vi.fn(),
}))

vi.mock('@/components/quote/StepIndicator', () => ({
  StepIndicator: ({ currentStep }: { currentStep: number }) => (
    <div data-testid="step-indicator">Step {currentStep}</div>
  ),
}))

vi.mock('@/components/quote/QuoteFormStep1', () => ({
  QuoteFormStep1: ({ formData, errors, updateField, onNext }: any) => (
    <div data-testid="step1">
      <select
        data-testid="service-select"
        value={formData.service}
        onChange={(e) => updateField('service', e.target.value)}
      >
        <option value="">Select service</option>
        <option value="personal-injury">Personal Injury</option>
      </select>
      {errors.service && <p data-testid="error-service">{errors.service}</p>}
      <button data-testid="next1" onClick={onNext}>Next</button>
    </div>
  ),
}))

vi.mock('@/components/quote/QuoteFormStep2', () => ({
  QuoteFormStep2: ({ formData, errors, updateField, onNext, onPrev }: any) => (
    <div data-testid="step2">
      <input
        data-testid="city-input"
        value={formData.city}
        onChange={(e) => updateField('city', e.target.value)}
      />
      {errors.city && <p data-testid="error-city">{errors.city}</p>}
      <button data-testid="prev2" onClick={onPrev}>Back</button>
      <button data-testid="next2" onClick={onNext}>Next</button>
    </div>
  ),
}))

vi.mock('@/components/quote/QuoteFormStep3', () => ({
  QuoteFormStep3: ({ formData, errors, updateField, onNext, onPrev }: any) => (
    <div data-testid="step3">
      <select
        data-testid="urgency-select"
        value={formData.urgency}
        onChange={(e) => updateField('urgency', e.target.value)}
      >
        <option value="">Select urgency</option>
        <option value="flexible">Not urgent</option>
      </select>
      {errors.urgency && <p data-testid="error-urgency">{errors.urgency}</p>}
      <button data-testid="prev3" onClick={onPrev}>Back</button>
      <button data-testid="next3" onClick={onNext}>Next</button>
    </div>
  ),
}))

vi.mock('@/components/quote/QuoteFormStep4', () => ({
  QuoteFormStep4: ({ formData, errors, updateField, validateField, submitting, submitError, onPrev }: any) => (
    <div data-testid="step4">
      <input
        data-testid="name-input"
        value={formData.name}
        onChange={(e) => updateField('name', e.target.value)}
        onBlur={() => validateField('name')}
      />
      <input
        data-testid="phone-input"
        value={formData.phone}
        onChange={(e) => updateField('phone', e.target.value)}
      />
      <input
        data-testid="email-input"
        value={formData.email}
        onChange={(e) => updateField('email', e.target.value)}
      />
      <label>
        <input
          data-testid="consent-checkbox"
          type="checkbox"
          checked={formData.consent}
          onChange={(e) => updateField('consent', e.target.checked)}
        />
        I agree
      </label>
      {errors.name && <p data-testid="error-name">{errors.name}</p>}
      {errors.phone && <p data-testid="error-phone">{errors.phone}</p>}
      {errors.email && <p data-testid="error-email">{errors.email}</p>}
      {errors.consent && <p data-testid="error-consent">{errors.consent}</p>}
      {submitError && <p data-testid="submit-error">{submitError}</p>}
      <button data-testid="prev4" onClick={onPrev}>Back</button>
      <button data-testid="submit" type="submit" disabled={submitting}>Submit</button>
    </div>
  ),
}))

vi.mock('@/components/quote/QuoteFormConfirmation', () => ({
  QuoteFormConfirmation: () => <div data-testid="confirmation">Request submitted!</div>,
}))

const mockLocalStorage: Record<string, string> = {}
const localStorageMock = {
  getItem: vi.fn((key: string) => mockLocalStorage[key] || null),
  setItem: vi.fn((key: string, value: string) => { mockLocalStorage[key] = value }),
  removeItem: vi.fn((key: string) => { delete mockLocalStorage[key] }),
  clear: vi.fn(),
  length: 0,
  key: vi.fn(),
}
Object.defineProperty(window, 'localStorage', { value: localStorageMock })

describe('ConsultationRequestForm — initial render', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    Object.keys(mockLocalStorage).forEach(k => delete mockLocalStorage[k])
  })

  it('renders step 1 by default', () => {
    render(<ConsultationRequestForm />)
    expect(screen.getByTestId('step-indicator')).toHaveTextContent('Step 1')
    expect(screen.getByTestId('step1')).toBeInTheDocument()
  })

  it('shows the "less than 60 seconds" text', () => {
    render(<ConsultationRequestForm />)
    expect(screen.getByText(/less than 60 seconds/i)).toBeInTheDocument()
  })
})

describe('ConsultationRequestForm — prefilled', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    Object.keys(mockLocalStorage).forEach(k => delete mockLocalStorage[k])
  })

  it('starts at step 3 when service and city are prefilled', () => {
    render(
      <ConsultationRequestForm
        prefilledService="personal-injury"
        prefilledCity="New York"
      />
    )
    expect(screen.getByTestId('step-indicator')).toHaveTextContent('Step 3')
    expect(screen.getByTestId('step3')).toBeInTheDocument()
  })
})

describe('ConsultationRequestForm — step navigation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    Object.keys(mockLocalStorage).forEach(k => delete mockLocalStorage[k])
  })

  it('advances from step 1 to step 2 after selecting a service', () => {
    render(<ConsultationRequestForm />)

    // Select a service
    fireEvent.change(screen.getByTestId('service-select'), {
      target: { value: 'personal-injury' },
    })

    // Click next
    fireEvent.click(screen.getByTestId('next1'))

    expect(screen.getByTestId('step-indicator')).toHaveTextContent('Step 2')
  })

  it('does not advance past step 1 if no service selected', async () => {
    render(<ConsultationRequestForm />)
    fireEvent.click(screen.getByTestId('next1'))
    // Should still be on step 1
    await waitFor(() => {
      expect(screen.getByTestId('step-indicator')).toHaveTextContent('Step 1')
      expect(screen.getByTestId('step1')).toBeInTheDocument()
    })
  })

  it('navigates back from step 2 to step 1', () => {
    render(<ConsultationRequestForm />)

    // Go to step 2
    fireEvent.change(screen.getByTestId('service-select'), {
      target: { value: 'personal-injury' },
    })
    fireEvent.click(screen.getByTestId('next1'))

    // Go back
    fireEvent.click(screen.getByTestId('prev2'))
    expect(screen.getByTestId('step-indicator')).toHaveTextContent('Step 1')
  })

  it('does not advance past step 2 if no city entered', async () => {
    render(<ConsultationRequestForm />)

    // Go to step 2
    fireEvent.change(screen.getByTestId('service-select'), {
      target: { value: 'personal-injury' },
    })
    fireEvent.click(screen.getByTestId('next1'))

    await waitFor(() => {
      expect(screen.getByTestId('step2')).toBeInTheDocument()
    })

    // Try to advance without city
    fireEvent.click(screen.getByTestId('next2'))
    await waitFor(() => {
      // Should still be on step 2
      expect(screen.getByTestId('step-indicator')).toHaveTextContent('Step 2')
      expect(screen.getByTestId('step2')).toBeInTheDocument()
    })
  })
})

describe('ConsultationRequestForm — submission', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    Object.keys(mockLocalStorage).forEach(k => delete mockLocalStorage[k])
  })

  async function navigateToStep4() {
    render(<ConsultationRequestForm />)

    // Step 1: select service
    fireEvent.change(screen.getByTestId('service-select'), {
      target: { value: 'personal-injury' },
    })
    fireEvent.click(screen.getByTestId('next1'))

    // Step 2: enter city
    fireEvent.change(screen.getByTestId('city-input'), {
      target: { value: 'New York' },
    })
    fireEvent.click(screen.getByTestId('next2'))

    // Step 3: select urgency
    fireEvent.change(screen.getByTestId('urgency-select'), {
      target: { value: 'flexible' },
    })
    fireEvent.click(screen.getByTestId('next3'))

    // Now on step 4
    expect(screen.getByTestId('step4')).toBeInTheDocument()
  }

  it('shows validation errors on step 4 for empty fields', async () => {
    await navigateToStep4()

    const form = screen.getByTestId('submit').closest('form')!
    fireEvent.submit(form)

    await waitFor(() => {
      expect(screen.getByTestId('error-name')).toBeInTheDocument()
      expect(screen.getByTestId('error-phone')).toBeInTheDocument()
      expect(screen.getByTestId('error-email')).toBeInTheDocument()
      expect(screen.getByTestId('error-consent')).toBeInTheDocument()
    })
  })

  it('submits successfully with valid data', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    })

    await navigateToStep4()

    // Fill in step 4
    fireEvent.change(screen.getByTestId('name-input'), { target: { value: 'John Doe' } })
    fireEvent.change(screen.getByTestId('phone-input'), { target: { value: '5551234567' } })
    fireEvent.change(screen.getByTestId('email-input'), { target: { value: 'john@test.com' } })
    fireEvent.click(screen.getByTestId('consent-checkbox'))

    // Submit
    const form = screen.getByTestId('submit').closest('form')!
    fireEvent.submit(form)

    await waitFor(() => {
      expect(screen.getByTestId('confirmation')).toBeInTheDocument()
    })
  })

  it('shows error message on submission failure', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ error: 'Service unavailable' }),
    })

    await navigateToStep4()

    fireEvent.change(screen.getByTestId('name-input'), { target: { value: 'John Doe' } })
    fireEvent.change(screen.getByTestId('phone-input'), { target: { value: '5551234567' } })
    fireEvent.change(screen.getByTestId('email-input'), { target: { value: 'john@test.com' } })
    fireEvent.click(screen.getByTestId('consent-checkbox'))

    const form = screen.getByTestId('submit').closest('form')!
    fireEvent.submit(form)

    await waitFor(() => {
      expect(screen.getByTestId('submit-error')).toHaveTextContent('Service unavailable')
    })
  })

  it('shows generic error when API returns non-JSON', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: () => Promise.reject(new Error('parse error')),
    })

    await navigateToStep4()

    fireEvent.change(screen.getByTestId('name-input'), { target: { value: 'John Doe' } })
    fireEvent.change(screen.getByTestId('phone-input'), { target: { value: '5551234567' } })
    fireEvent.change(screen.getByTestId('email-input'), { target: { value: 'john@test.com' } })
    fireEvent.click(screen.getByTestId('consent-checkbox'))

    const form = screen.getByTestId('submit').closest('form')!
    fireEvent.submit(form)

    await waitFor(() => {
      expect(screen.getByTestId('submit-error')).toHaveTextContent('Error sending request')
    })
  })
})
