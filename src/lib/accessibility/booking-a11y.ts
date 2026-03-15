/**
 * Accessibility Utilities for Booking System - US Attorneys
 * WCAG 2.1 AA Compliant
 * Best practices from Doctolib, Calendly, and ARIA guidelines
 */

// Live region announcer for screen readers
let announcer: HTMLElement | null = null

export function initAnnouncer(): void {
  if (typeof document === 'undefined') return

  if (!announcer) {
    announcer = document.createElement('div')
    announcer.setAttribute('aria-live', 'polite')
    announcer.setAttribute('aria-atomic', 'true')
    announcer.setAttribute('role', 'status')
    announcer.className = 'sr-only'
    announcer.style.cssText = `
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    `
    document.body.appendChild(announcer)
  }
}

export function announce(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
  if (!announcer) initAnnouncer()
  if (!announcer) return

  announcer.setAttribute('aria-live', priority)
  // Clear and re-set to ensure announcement
  announcer.textContent = ''
  setTimeout(() => {
    if (announcer) announcer.textContent = message
  }, 100)
}

// Calendar-specific announcements
export const calendarAnnouncements = {
  monthChanged: (month: string, year: number) =>
    announce(`Calendar: ${month} ${year}`),

  dateSelected: (date: Date, slotsCount: number) => {
    const dateStr = date.toLocaleDateString('en-US', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    })
    const slotsText =
      slotsCount === 0
        ? 'No slots available'
        : slotsCount === 1
        ? '1 slot available'
        : `${slotsCount} slots available`
    announce(`${dateStr}. ${slotsText}`)
  },

  slotSelected: (time: string, artisan: string) =>
    announce(`Slot selected: ${time} with ${artisan}`, 'assertive'),

  slotUnavailable: () =>
    announce('This slot is no longer available', 'assertive'),

  bookingConfirmed: (date: string, time: string) =>
    announce(`Booking confirmed for ${date} at ${time}`, 'assertive'),

  formError: (errorMessage: string) =>
    announce(`Error: ${errorMessage}`, 'assertive'),

  loading: () => announce('Loading...'),

  loaded: (message: string) => announce(message),
}

// Keyboard navigation helpers
export interface KeyboardNavigationConfig {
  onArrowUp?: () => void
  onArrowDown?: () => void
  onArrowLeft?: () => void
  onArrowRight?: () => void
  onEnter?: () => void
  onSpace?: () => void
  onEscape?: () => void
  onTab?: () => void
  onHome?: () => void
  onEnd?: () => void
  onPageUp?: () => void
  onPageDown?: () => void
}

export function handleCalendarKeyDown(
  event: React.KeyboardEvent,
  config: KeyboardNavigationConfig
): void {
  const handlers: Record<string, (() => void) | undefined> = {
    ArrowUp: config.onArrowUp,
    ArrowDown: config.onArrowDown,
    ArrowLeft: config.onArrowLeft,
    ArrowRight: config.onArrowRight,
    Enter: config.onEnter,
    ' ': config.onSpace,
    Escape: config.onEscape,
    Tab: config.onTab,
    Home: config.onHome,
    End: config.onEnd,
    PageUp: config.onPageUp,
    PageDown: config.onPageDown,
  }

  const handler = handlers[event.key]
  if (handler) {
    event.preventDefault()
    handler()
  }
}

// Focus management
export function focusFirstInteractive(container: HTMLElement): void {
  const focusable = container.querySelector<HTMLElement>(
    'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
  )
  focusable?.focus()
}

export function trapFocus(container: HTMLElement): () => void {
  const focusableElements = container.querySelectorAll<HTMLElement>(
    'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
  )

  const firstElement = focusableElements[0]
  const lastElement = focusableElements[focusableElements.length - 1]

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key !== 'Tab') return

    if (event.shiftKey) {
      if (document.activeElement === firstElement) {
        event.preventDefault()
        lastElement?.focus()
      }
    } else {
      if (document.activeElement === lastElement) {
        event.preventDefault()
        firstElement?.focus()
      }
    }
  }

  container.addEventListener('keydown', handleKeyDown)

  // Return cleanup function
  return () => container.removeEventListener('keydown', handleKeyDown)
}

// Skip link helper
export function createSkipLink(targetId: string, text: string): HTMLAnchorElement {
  const link = document.createElement('a')
  link.href = `#${targetId}`
  link.textContent = text
  link.className =
    'sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:bg-white focus:px-4 focus:py-2 focus:rounded focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-violet-500'

  link.addEventListener('click', (e) => {
    e.preventDefault()
    const target = document.getElementById(targetId)
    target?.focus()
    target?.scrollIntoView({ behavior: 'smooth' })
  })

  return link
}

// ARIA attributes for calendar cells
export function getCalendarCellAttributes(
  date: Date,
  isSelected: boolean,
  isToday: boolean,
  isDisabled: boolean,
  hasSlots: boolean
): Record<string, string | boolean | number> {
  const dateStr = date.toLocaleDateString('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  const labels: string[] = [dateStr]
  if (isToday) labels.push('today')
  if (isDisabled) labels.push('unavailable')
  else if (!hasSlots) labels.push('no slots')
  else labels.push('available')
  if (isSelected) labels.push('selected')

  return {
    role: 'gridcell',
    'aria-label': labels.join(', '),
    'aria-selected': isSelected,
    'aria-disabled': isDisabled || !hasSlots,
    tabIndex: isSelected ? 0 : -1,
  }
}

// ARIA attributes for time slots
export function getSlotAttributes(
  time: string,
  isSelected: boolean,
  isAvailable: boolean,
  isPopular?: boolean,
  isRecommended?: boolean
): Record<string, string | boolean | number> {
  const labels: string[] = [time]
  if (!isAvailable) labels.push('unavailable')
  if (isPopular) labels.push('popular')
  if (isRecommended) labels.push('recommended')
  if (isSelected) labels.push('selected')

  return {
    role: 'option',
    'aria-label': labels.join(', '),
    'aria-selected': isSelected,
    'aria-disabled': !isAvailable,
    tabIndex: isSelected ? 0 : -1,
  }
}

// High contrast mode detection
export function prefersHighContrast(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(forced-colors: active)').matches
}

// Reduced motion detection
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

// Generate unique IDs for form fields
let idCounter = 0
export function generateId(prefix: string): string {
  idCounter++
  return `${prefix}-${idCounter}`
}

// Form field error announcements
export function announceFieldError(fieldName: string, error: string): void {
  announce(`Error in field ${fieldName}: ${error}`, 'assertive')
}

// Form validation state
export function getFieldErrorAttributes(
  fieldId: string,
  error?: string
): Record<string, string | boolean> {
  if (!error) return {}

  return {
    'aria-invalid': true,
    'aria-describedby': `${fieldId}-error`,
  }
}

// Color contrast helpers
export function getContrastColor(bgColor: string): 'white' | 'black' {
  // Convert hex to RGB
  const hex = bgColor.replace('#', '')
  const r = parseInt(hex.substr(0, 2), 16)
  const g = parseInt(hex.substr(2, 2), 16)
  const b = parseInt(hex.substr(4, 2), 16)

  // Calculate luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255

  return luminance > 0.5 ? 'black' : 'white'
}

// Screen reader only class (for CSS)
export const srOnlyStyles = `
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
`
