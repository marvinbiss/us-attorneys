/**
 * Footer Component — Unit Tests
 *
 * Covers:
 * - Logo and brand text
 * - Navigation sections (popular services, cities, regions, tools, info)
 * - Social media links
 * - Legal links with nofollow
 * - Contact info from companyIdentity
 * - Copyright year
 * - Newsletter form embed
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import Footer from '@/components/Footer'

// Mock NewsletterForm to avoid complex sub-component testing
vi.mock('@/components/NewsletterForm', () => ({
  default: () => <div data-testid="newsletter-form">Newsletter</div>,
}))

vi.mock('@/lib/config/company-identity', () => ({
  companyIdentity: {
    name: 'US Attorneys',
    tagline: 'Find Top-Rated Attorneys Near You',
    description: 'Leading attorney directory covering all 50 states.',
    url: 'https://us-attorneys.com',
    email: 'contact@us-attorneys.com',
    phone: '1-800-555-0199',
    address: '123 Main St, New York, NY 10001',
  },
}))

vi.mock('@/lib/constants/navigation', () => ({
  popularServices: [
    { name: 'Personal Injury', slug: 'personal-injury' },
    { name: 'Criminal Defense', slug: 'criminal-defense' },
  ],
  popularCities: [
    { name: 'New York', slug: 'new-york' },
    { name: 'Los Angeles', slug: 'los-angeles' },
  ],
  popularRegions: [
    { name: 'Northeast', slug: 'northeast' },
    { name: 'Southeast', slug: 'southeast' },
  ],
}))

describe('Footer', () => {
  it('renders the footer with contentinfo role', () => {
    render(<Footer />)
    expect(screen.getByRole('contentinfo')).toBeInTheDocument()
  })

  it('renders the brand name', () => {
    render(<Footer />)
    expect(screen.getByText('US')).toBeInTheDocument()
  })

  it('renders the company description', () => {
    render(<Footer />)
    expect(
      screen.getByText('Leading attorney directory covering all 50 states.')
    ).toBeInTheDocument()
  })

  it('renders the newsletter form', () => {
    render(<Footer />)
    expect(screen.getByTestId('newsletter-form')).toBeInTheDocument()
  })

  it('renders social media links with correct aria labels', () => {
    render(<Footer />)
    expect(screen.getByLabelText('Facebook')).toBeInTheDocument()
    expect(screen.getByLabelText('Twitter')).toBeInTheDocument()
    expect(screen.getByLabelText('LinkedIn')).toBeInTheDocument()
    expect(screen.getByLabelText('Instagram')).toBeInTheDocument()
  })

  it('social links open in new tab', () => {
    render(<Footer />)
    const fbLink = screen.getByLabelText('Facebook')
    expect(fbLink).toHaveAttribute('target', '_blank')
    expect(fbLink).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('renders popular practice areas links', () => {
    render(<Footer />)
    const piLinks = screen.getAllByText('Personal Injury')
    expect(piLinks.length).toBeGreaterThan(0)
    expect(piLinks[0].closest('a')).toHaveAttribute('href', '/practice-areas/personal-injury')
  })

  it('renders popular cities links', () => {
    render(<Footer />)
    const nyLinks = screen.getAllByText('New York')
    expect(nyLinks.length).toBeGreaterThan(0)
    expect(nyLinks[0].closest('a')).toHaveAttribute('href', '/cities/new-york')
  })

  it('renders region links', () => {
    render(<Footer />)
    const regionLinks = screen.getAllByText('Northeast')
    expect(regionLinks.length).toBeGreaterThan(0)
    expect(regionLinks[0].closest('a')).toHaveAttribute('href', '/regions/northeast')
  })

  it('renders Information section', () => {
    render(<Footer />)
    expect(screen.getByText('Information')).toBeInTheDocument()
  })

  it('renders Company section links', () => {
    render(<Footer />)
    expect(screen.getByText('Company')).toBeInTheDocument()
    const becomePartner = screen.getByText('Become a Partner')
    expect(becomePartner.closest('a')).toHaveAttribute('href', '/register-attorney')
  })

  it('renders Legal section', () => {
    render(<Footer />)
    expect(screen.getByText('Legal')).toBeInTheDocument()
  })

  it('renders nofollow on legal links', () => {
    render(<Footer />)
    // The bottom bar legal links
    const legalLinks = screen.getAllByText('Legal Notice')
    const bottomLegal = legalLinks.find(el => el.closest('a')?.getAttribute('rel') === 'nofollow')
    expect(bottomLegal).toBeTruthy()
  })

  it('renders contact email', () => {
    render(<Footer />)
    const emailLink = screen.getByText('contact@us-attorneys.com')
    expect(emailLink.closest('a')).toHaveAttribute('href', 'mailto:contact@us-attorneys.com')
  })

  it('renders phone number', () => {
    render(<Footer />)
    const phoneLink = screen.getByText('1-800-555-0199')
    expect(phoneLink.closest('a')).toHaveAttribute('href', 'tel:1-800-555-0199')
  })

  it('renders address', () => {
    render(<Footer />)
    expect(screen.getByText('123 Main St, New York, NY 10001')).toBeInTheDocument()
  })

  it('renders copyright with current year', () => {
    render(<Footer />)
    const year = new Date().getFullYear().toString()
    // The copyright text is split across child elements, so use a function matcher
    const copyright = screen.getByText((_, element) => {
      if (!element || element.tagName !== 'P') return false
      const text = element.textContent || ''
      return text.includes(year) && text.includes('USAttorneys')
    })
    expect(copyright).toBeInTheDocument()
  })

  it('renders trust badges', () => {
    render(<Footer />)
    expect(screen.getByText('Bar-Verified Attorneys')).toBeInTheDocument()
    expect(screen.getByText('50 States + DC')).toBeInTheDocument()
    expect(screen.getByText('100% Free')).toBeInTheDocument()
  })

  it('renders bottom bar links', () => {
    render(<Footer />)
    // Bottom bar has: Legal Notice, Privacy Policy, Terms of Service, Accessibility, FAQ, Contact, Sitemap
    const sitemapLink = screen.getByText('Sitemap')
    expect(sitemapLink.closest('a')).toHaveAttribute('href', '/sitemap-page')
  })

  it('renders "All Practice Areas" link', () => {
    render(<Footer />)
    const allPA = screen.getAllByText('All Practice Areas')
    expect(allPA.length).toBeGreaterThan(0)
    expect(allPA[0].closest('a')).toHaveAttribute('href', '/services')
  })

  it('renders "All Cities" link', () => {
    render(<Footer />)
    const allCities = screen.getAllByText('All Cities')
    expect(allCities.length).toBeGreaterThan(0)
    expect(allCities[0].closest('a')).toHaveAttribute('href', '/cities')
  })
})
