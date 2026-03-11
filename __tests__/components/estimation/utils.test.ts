import { describe, it, expect } from 'vitest'
import {
  isValidFrenchPhone,
  shouldShowLeadForm,
  getGreetingMessage,
  EstimationContext,
} from '@/components/estimation/utils'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeContext(overrides: Partial<EstimationContext> = {}): EstimationContext {
  return {
    metier: 'plombier',
    metierSlug: 'plombier',
    ville: 'Paris',
    departement: '75',
    pageUrl: 'https://servicesartisans.fr/plombier/paris',
    ...overrides,
  }
}

// ========================= isValidFrenchPhone ==============================
describe('isValidFrenchPhone', () => {
  describe('valid numbers', () => {
    it('accepts standard mobile number 0612345678', () => {
      expect(isValidFrenchPhone('0612345678')).toBe(true)
    })

    it('accepts number with spaces: 06 12 34 56 78', () => {
      expect(isValidFrenchPhone('06 12 34 56 78')).toBe(true)
    })

    it('accepts international format +33612345678', () => {
      expect(isValidFrenchPhone('+33612345678')).toBe(true)
    })

    it('accepts international format 0033612345678', () => {
      expect(isValidFrenchPhone('0033612345678')).toBe(true)
    })

    it('accepts number with dots: 01.23.45.67.89', () => {
      expect(isValidFrenchPhone('01.23.45.67.89')).toBe(true)
    })

    it('accepts number with dashes: 06-12-34-56-78', () => {
      expect(isValidFrenchPhone('06-12-34-56-78')).toBe(true)
    })
  })

  describe('invalid numbers', () => {
    it('rejects too short number: 061234567', () => {
      expect(isValidFrenchPhone('061234567')).toBe(false)
    })

    it('rejects number starting with 00 (not 0033): 00612345678', () => {
      expect(isValidFrenchPhone('00612345678')).toBe(false)
    })

    it('rejects empty string', () => {
      expect(isValidFrenchPhone('')).toBe(false)
    })

    it('rejects letters: abcdefghij', () => {
      expect(isValidFrenchPhone('abcdefghij')).toBe(false)
    })

    it('rejects number starting with 00: 0012345678', () => {
      expect(isValidFrenchPhone('0012345678')).toBe(false)
    })
  })
})

// ========================= shouldShowLeadForm ==============================
describe('shouldShowLeadForm', () => {
  it('returns true when content contains "souhaitez-vous"', () => {
    expect(shouldShowLeadForm('Est-ce que vous souhaitez-vous un devis ?')).toBe(true)
  })

  it('returns true when content contains "mise en relation"', () => {
    expect(shouldShowLeadForm('Je peux organiser une mise en relation avec un artisan.')).toBe(true)
  })

  it('returns true when content contains "rappel"', () => {
    expect(shouldShowLeadForm('Souhaitez-vous un rappel rapide ?')).toBe(true)
  })

  it('returns true when content contains price pattern **80\u20AC \u2014 150\u20AC**', () => {
    expect(shouldShowLeadForm('Le prix serait entre **80\u20AC \u2014 150\u20AC** pour ce type de travaux.')).toBe(true)
  })

  it('returns true when content contains price pattern with spaces **80 \u20AC \u2014 150 \u20AC**', () => {
    expect(shouldShowLeadForm('Estimation : **80 \u20AC \u2014 150 \u20AC** TTC.')).toBe(true)
  })

  it('returns false for regular text without triggers', () => {
    expect(shouldShowLeadForm('Bonjour, comment puis-je vous aider ?')).toBe(false)
  })

  it('is case insensitive for keywords: SOUHAITEZ-VOUS', () => {
    expect(shouldShowLeadForm('SOUHAITEZ-VOUS un devis ?')).toBe(true)
  })

  it('returns false for empty string', () => {
    expect(shouldShowLeadForm('')).toBe(false)
  })
})

// ========================= getGreetingMessage ==============================
describe('getGreetingMessage', () => {
  it('new visitor without artisan: contains "Besoin d\'un"', () => {
    const msg = getGreetingMessage(makeContext(), false)
    expect(msg).toContain("Besoin d'un")
  })

  it('new visitor with artisan: contains artisan name', () => {
    const ctx = makeContext({
      artisan: { name: 'Jean Dupont', slug: 'jean-dupont', publicId: 'abc123' },
    })
    const msg = getGreetingMessage(ctx, false)
    expect(msg).toContain('Jean Dupont')
  })

  it('returning visitor without artisan: contains "De retour"', () => {
    const msg = getGreetingMessage(makeContext(), true)
    expect(msg).toContain('De retour')
  })

  it('returning visitor with artisan: contains artisan name and "De retour"', () => {
    const ctx = makeContext({
      artisan: { name: 'Marie Martin', slug: 'marie-martin', publicId: 'def456' },
    })
    const msg = getGreetingMessage(ctx, true)
    expect(msg).toContain('Marie Martin')
    expect(msg).toContain('De retour')
  })

  it('page URL with /urgence/: contains "Urgence"', () => {
    const ctx = makeContext({ pageUrl: 'https://servicesartisans.fr/urgence/plombier/paris' })
    const msg = getGreetingMessage(ctx, false)
    expect(msg).toContain('Urgence')
  })

  it('page URL with /tarifs/: contains "V\u00E9rifiez"', () => {
    const ctx = makeContext({ pageUrl: 'https://servicesartisans.fr/tarifs/plombier/paris' })
    const msg = getGreetingMessage(ctx, false)
    expect(msg).toContain('V\u00E9rifiez')
  })
})
