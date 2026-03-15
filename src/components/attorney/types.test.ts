import { describe, it, expect } from 'vitest'
import { getDisplayName, Artisan } from './types'

// Helper function to create a minimal valid Artisan object for testing
function createTestArtisan(overrides: Partial<Artisan> = {}): Artisan {
  return {
    id: 'test-id',
    business_name: null,
    first_name: null,
    last_name: null,
    city: 'Paris',
    postal_code: '75001',
    specialty: 'Plomberie',
    average_rating: 4.5,
    review_count: 10,
    is_verified: false,
    services: [],
    service_prices: [],
    ...overrides
  }
}

describe('getDisplayName', () => {
  it('should return business_name when is_center is true and business_name exists', () => {
    const artisan = createTestArtisan({
      is_center: true,
      business_name: 'Centre de Plomberie Paris',
      first_name: 'Jean',
      last_name: 'Dupont'
    })
    expect(getDisplayName(artisan)).toBe('Centre de Plomberie Paris')
  })

  it('should return business_name when it exists (not a center)', () => {
    const artisan = createTestArtisan({
      is_center: false,
      business_name: 'Plomberie Dupont',
      first_name: 'Jean',
      last_name: 'Dupont'
    })
    expect(getDisplayName(artisan)).toBe('Plomberie Dupont')
  })

  it('should return full name when no business_name', () => {
    const artisan = createTestArtisan({
      business_name: null,
      first_name: 'Jean',
      last_name: 'Dupont'
    })
    expect(getDisplayName(artisan)).toBe('Jean Dupont')
  })

  it('should return first_name only when last_name is null', () => {
    const artisan = createTestArtisan({
      business_name: null,
      first_name: 'Jean',
      last_name: null
    })
    expect(getDisplayName(artisan)).toBe('Jean')
  })

  it('should return last_name only when first_name is null', () => {
    const artisan = createTestArtisan({
      business_name: null,
      first_name: null,
      last_name: 'Dupont'
    })
    expect(getDisplayName(artisan)).toBe('Dupont')
  })

  it('should return "Artisan" as fallback when no names are available', () => {
    const artisan = createTestArtisan({
      business_name: null,
      first_name: null,
      last_name: null
    })
    expect(getDisplayName(artisan)).toBe('Artisan')
  })

  it('should return "Artisan" when names are empty strings', () => {
    const artisan = createTestArtisan({
      business_name: null,
      first_name: '',
      last_name: ''
    })
    expect(getDisplayName(artisan)).toBe('Artisan')
  })

  it('should trim whitespace from name', () => {
    const artisan = createTestArtisan({
      business_name: null,
      first_name: '  Jean  ',
      last_name: '  Dupont  '
    })
    // The function concatenates and trims the outer whitespace
    const result = getDisplayName(artisan)
    expect(result.startsWith('Jean')).toBe(true)
    expect(result.endsWith('Dupont')).toBe(true)
  })

  it('should prefer business_name over personal names for centers', () => {
    const artisan = createTestArtisan({
      is_center: true,
      business_name: 'Mon Entreprise',
      first_name: 'Jean',
      last_name: 'Dupont'
    })
    expect(getDisplayName(artisan)).toBe('Mon Entreprise')
  })

  it('should handle is_center true but no business_name', () => {
    const artisan = createTestArtisan({
      is_center: true,
      business_name: null,
      first_name: 'Jean',
      last_name: 'Dupont'
    })
    expect(getDisplayName(artisan)).toBe('Jean Dupont')
  })
})
