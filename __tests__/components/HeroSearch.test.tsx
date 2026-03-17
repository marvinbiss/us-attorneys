/**
 * HeroSearch Component — Unit Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

// Mock next/navigation
const mockPush = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}))

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => {
      const { initial: _i, animate: _a, transition: _t, whileHover: _wh, whileTap: _wt, variants: _v, ...rest } = props
      return <div {...rest}>{children}</div>
    },
    button: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => {
      const { initial: _i, animate: _a, transition: _t, whileHover: _wh, whileTap: _wt, variants: _v, ...rest } = props
      return <button {...rest}>{children}</button>
    },
  },
  AnimatePresence: ({ children }: React.PropsWithChildren) => <>{children}</>,
}))

// Mock the data/usa module
vi.mock('@/lib/data/usa', () => ({
  cities: [
    {
      name: 'Houston',
      slug: 'houston',
      stateCode: 'TX',
      stateName: 'Texas',
      county: 'Harris',
      population: '2300000',
      zipCode: '77001',
      description: 'Houston, TX',
      neighborhoods: [],
      latitude: 29.76,
      longitude: -95.36,
      metroArea: 'Houston',
    },
  ],
}))

// Mock slugify
vi.mock('@/lib/utils', () => ({
  slugify: (s: string) => s.toLowerCase().replace(/\s+/g, '-'),
}))

import { HeroSearch } from '@/components/search/HeroSearch'

describe('HeroSearch', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // localStorage mock
    const store: Record<string, string> = {}
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: (key: string) => store[key] || null,
        setItem: (key: string, val: string) => { store[key] = val },
        removeItem: (key: string) => { delete store[key] },
      },
      writable: true,
    })
  })

  it('renders the search form with two inputs and a submit button', () => {
    render(<HeroSearch />)

    expect(screen.getByLabelText('Type of service')).toBeInTheDocument()
    expect(screen.getByLabelText('City or ZIP code')).toBeInTheDocument()
    expect(screen.getByLabelText('Search')).toBeInTheDocument()
  })

  it('updates service input on typing', () => {
    render(<HeroSearch />)
    const input = screen.getByLabelText('Type of service') as HTMLInputElement
    fireEvent.change(input, { target: { value: 'Personal' } })
    expect(input.value).toBe('Personal')
  })

  it('updates location input on typing', () => {
    render(<HeroSearch />)
    const input = screen.getByLabelText('City or ZIP code') as HTMLInputElement
    fireEvent.change(input, { target: { value: 'Houston' } })
    expect(input.value).toBe('Houston')
  })

  it('renders popular service quick links', () => {
    render(<HeroSearch />)
    // The first 4 services are shown as quick links
    expect(screen.getByText('Personal Injury')).toBeInTheDocument()
    expect(screen.getByText('Criminal Defense')).toBeInTheDocument()
  })

  it('submits and navigates to the correct URL', () => {
    render(<HeroSearch />)

    const serviceInput = screen.getByLabelText('Type of service') as HTMLInputElement
    const locationInput = screen.getByLabelText('City or ZIP code') as HTMLInputElement

    fireEvent.change(serviceInput, { target: { value: 'Personal Injury' } })
    fireEvent.change(locationInput, { target: { value: 'Houston' } })

    // Submit the form
    fireEvent.click(screen.getByLabelText('Search'))

    expect(mockPush).toHaveBeenCalledWith('/practice-areas/personal-injury/houston')
  })

  it('navigates to service page only when no location is provided', () => {
    render(<HeroSearch />)

    const serviceInput = screen.getByLabelText('Type of service') as HTMLInputElement
    fireEvent.change(serviceInput, { target: { value: 'Criminal Defense' } })
    fireEvent.click(screen.getByLabelText('Search'))

    expect(mockPush).toHaveBeenCalledWith('/practice-areas/criminal-defense')
  })
})
