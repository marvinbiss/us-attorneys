import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest'
import {
  UUID_RE,
  stripHtml,
  sanitizeTextFields,
  createPageSchema,
  updatePageSchema,
} from '@/lib/cms-utils'
import { buildPayload, FIELD_LIMITS } from '@/components/admin/cms/shared'

// ---------------------------------------------------------------------------
// Mock next/cache so cms-revalidate can be imported in a test environment
// ---------------------------------------------------------------------------
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

// Dynamic import so the mock is in place before the module resolves
// (top-level await replaced with beforeAll to satisfy tsc isolatedModules)
let revalidatePagePaths: typeof import('@/lib/cms-revalidate').revalidatePagePaths
let revalidatePathMock: ReturnType<typeof vi.fn>

beforeAll(async () => {
  const mod = await import('@/lib/cms-revalidate')
  revalidatePagePaths = mod.revalidatePagePaths

  // Grab the mock for assertions
  const cache = await import('next/cache')
  revalidatePathMock = cache.revalidatePath as ReturnType<typeof vi.fn>
})

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Minimal valid payload for createPageSchema */
function validPage(overrides: Record<string, unknown> = {}) {
  return {
    slug: 'test-page',
    page_type: 'static',
    title: 'Test Page',
    ...overrides,
  }
}

/** Minimal valid formData for buildPayload */
function validFormData(overrides: Record<string, unknown> = {}) {
  return {
    slug: 'test-page',
    pageType: 'static',
    title: 'Test Page',
    contentJson: null,
    contentHtml: '',
    structuredData: null,
    metaTitle: '',
    metaDescription: '',
    ogImageUrl: '',
    canonicalUrl: '',
    excerpt: '',
    author: '',
    authorBio: '',
    category: '',
    tags: [] as string[],
    readTime: '',
    featuredImage: '',
    specialtySlug: '',
    locationSlug: '',
    sortOrder: 0,
    ...overrides,
  }
}

// ============================= UUID_RE =====================================
describe('UUID_RE', () => {
  it('matches valid UUID v4 (lowercase)', () => {
    expect(UUID_RE.test('550e8400-e29b-41d4-a716-446655440000')).toBe(true)
  })

  it('matches valid UUID v4 (uppercase)', () => {
    expect(UUID_RE.test('550E8400-E29B-41D4-A716-446655440000')).toBe(true)
  })

  it('matches valid UUID v4 (mixed case)', () => {
    expect(UUID_RE.test('550e8400-E29B-41d4-A716-446655440000')).toBe(true)
  })

  it('rejects empty string', () => {
    expect(UUID_RE.test('')).toBe(false)
  })

  it('rejects random string', () => {
    expect(UUID_RE.test('not-a-uuid-at-all')).toBe(false)
  })

  it('rejects partial UUID (too short)', () => {
    expect(UUID_RE.test('550e8400-e29b-41d4-a716')).toBe(false)
  })

  it('rejects UUID with extra characters', () => {
    expect(UUID_RE.test('550e8400-e29b-41d4-a716-446655440000x')).toBe(false)
  })
})

// ============================= stripHtml ===================================
describe('stripHtml', () => {
  it('strips simple HTML tags', () => {
    expect(stripHtml('<b>bold</b>')).toBe('bold')
  })

  it('strips nested HTML tags', () => {
    expect(stripHtml('<div><span>nested</span></div>')).toBe('nested')
  })

  it('returns null for null input', () => {
    expect(stripHtml(null)).toBeNull()
  })

  it('returns undefined for undefined input', () => {
    expect(stripHtml(undefined)).toBeUndefined()
  })

  it('returns empty string for empty string', () => {
    expect(stripHtml('')).toBe('')
  })

  it('handles malformed HTML', () => {
    expect(stripHtml('<div>unclosed')).toBe('unclosed')
  })

  it('strips script tags', () => {
    expect(stripHtml('<script>alert("xss")</script>')).toBe('alert("xss")')
  })

  it('preserves text content between tags', () => {
    expect(stripHtml('<p>hello</p> <p>world</p>')).toBe('hello world')
  })
})

// ========================= sanitizeTextFields ==============================
describe('sanitizeTextFields', () => {
  it('strips HTML from title', () => {
    const data = sanitizeTextFields({ title: '<b>Title</b>' })
    expect(data.title).toBe('Title')
  })

  it('strips HTML from meta_title', () => {
    const data = sanitizeTextFields({ meta_title: '<i>Meta</i>' })
    expect(data.meta_title).toBe('Meta')
  })

  it('strips HTML from meta_description', () => {
    const data = sanitizeTextFields({ meta_description: '<p>Desc</p>' })
    expect(data.meta_description).toBe('Desc')
  })

  it('strips HTML from excerpt', () => {
    const data = sanitizeTextFields({ excerpt: '<em>Excerpt</em>' })
    expect(data.excerpt).toBe('Excerpt')
  })

  it('strips HTML from author', () => {
    const data = sanitizeTextFields({ author: '<a>Author</a>' })
    expect(data.author).toBe('Author')
  })

  it('strips HTML from author_bio', () => {
    const data = sanitizeTextFields({ author_bio: '<div>Bio</div>' })
    expect(data.author_bio).toBe('Bio')
  })

  it('strips HTML from category', () => {
    const data = sanitizeTextFields({ category: '<span>Cat</span>' })
    expect(data.category).toBe('Cat')
  })

  it('does NOT strip HTML from content_html', () => {
    const data = sanitizeTextFields({ content_html: '<p>Keep tags</p>' })
    expect(data.content_html).toBe('<p>Keep tags</p>')
  })

  it('does NOT strip HTML from slug', () => {
    const data = sanitizeTextFields({ slug: 'my-slug' })
    expect(data.slug).toBe('my-slug')
  })

  it('handles null values in fields', () => {
    const data = sanitizeTextFields({ title: null })
    expect(data.title).toBeNull()
  })

  it('handles undefined values in fields', () => {
    const data = sanitizeTextFields({ title: undefined })
    expect(data.title).toBeUndefined()
  })
})

// ========================== createPageSchema ===============================
describe('createPageSchema', () => {
  it('validates minimal valid static page (slug + page_type + title)', () => {
    const result = createPageSchema.safeParse(validPage())
    expect(result.success).toBe(true)
  })

  it('validates full page with all optional fields', () => {
    const result = createPageSchema.safeParse(
      validPage({
        content_json: { block: 'data' },
        content_html: '<p>body</p>',
        structured_data: { '@type': 'Article' },
        meta_title: 'Meta',
        meta_description: 'Description here',
        og_image_url: 'https://example.com/og.png',
        canonical_url: 'https://example.com/page',
        excerpt: 'Short excerpt',
        author: 'Jean Dupont',
        author_bio: 'Author bio',
        category: 'Conseils',
        tags: ['tag1', 'tag2'],
        read_time: '5 min',
        featured_image: 'https://example.com/img.jpg',
        sort_order: 1,
      })
    )
    expect(result.success).toBe(true)
  })

  it('rejects missing slug', () => {
    const { slug, ...noSlug } = validPage()
    const result = createPageSchema.safeParse(noSlug)
    expect(result.success).toBe(false)
  })

  it('rejects missing title', () => {
    const { title, ...noTitle } = validPage()
    const result = createPageSchema.safeParse(noTitle)
    expect(result.success).toBe(false)
  })

  it('rejects missing page_type', () => {
    const { page_type, ...noType } = validPage()
    const result = createPageSchema.safeParse(noType)
    expect(result.success).toBe(false)
  })

  it('rejects invalid slug format (uppercase)', () => {
    const result = createPageSchema.safeParse(validPage({ slug: 'UPPER' }))
    expect(result.success).toBe(false)
  })

  it('rejects invalid slug format (spaces)', () => {
    const result = createPageSchema.safeParse(validPage({ slug: 'has space' }))
    expect(result.success).toBe(false)
  })

  it('rejects invalid slug format (special chars)', () => {
    const result = createPageSchema.safeParse(validPage({ slug: 'bad_slug!' }))
    expect(result.success).toBe(false)
  })

  it('accepts valid slug with hyphens', () => {
    const result = createPageSchema.safeParse(validPage({ slug: 'my-nice-page' }))
    expect(result.success).toBe(true)
  })

  it('rejects slug longer than 200 chars', () => {
    const result = createPageSchema.safeParse(validPage({ slug: 'a'.repeat(201) }))
    expect(result.success).toBe(false)
  })

  it('rejects title longer than 500 chars', () => {
    const result = createPageSchema.safeParse(validPage({ title: 'a'.repeat(501) }))
    expect(result.success).toBe(false)
  })

  it('rejects meta_title longer than 70 chars', () => {
    const result = createPageSchema.safeParse(validPage({ meta_title: 'a'.repeat(71) }))
    expect(result.success).toBe(false)
  })

  it('rejects meta_description longer than 170 chars', () => {
    const result = createPageSchema.safeParse(validPage({ meta_description: 'a'.repeat(171) }))
    expect(result.success).toBe(false)
  })

  it('rejects excerpt longer than 1000 chars', () => {
    const result = createPageSchema.safeParse(validPage({ excerpt: 'a'.repeat(1001) }))
    expect(result.success).toBe(false)
  })

  it('rejects author longer than 200 chars', () => {
    const result = createPageSchema.safeParse(validPage({ author: 'a'.repeat(201) }))
    expect(result.success).toBe(false)
  })

  it('rejects author_bio longer than 2000 chars', () => {
    const result = createPageSchema.safeParse(validPage({ author_bio: 'a'.repeat(2001) }))
    expect(result.success).toBe(false)
  })

  it('rejects category longer than 200 chars', () => {
    const result = createPageSchema.safeParse(validPage({ category: 'a'.repeat(201) }))
    expect(result.success).toBe(false)
  })

  it('rejects read_time longer than 50 chars', () => {
    const result = createPageSchema.safeParse(validPage({ read_time: 'a'.repeat(51) }))
    expect(result.success).toBe(false)
  })

  it('rejects tags with more than 50 items', () => {
    const tags = Array.from({ length: 51 }, (_, i) => `tag${i}`)
    const result = createPageSchema.safeParse(validPage({ tags }))
    expect(result.success).toBe(false)
  })

  it('rejects invalid page_type', () => {
    const result = createPageSchema.safeParse(validPage({ page_type: 'unknown' }))
    expect(result.success).toBe(false)
  })

  it('accepts all valid page_types', () => {
    for (const pt of ['static', 'blog', 'service', 'location', 'homepage', 'faq'] as const) {
      const overrides: Record<string, unknown> = { page_type: pt }
      if (pt === 'service') overrides.service_slug = 'plomberie'
      if (pt === 'location') {
        overrides.service_slug = 'plomberie'
        overrides.location_slug = 'paris'
      }
      const result = createPageSchema.safeParse(validPage(overrides))
      expect(result.success, `page_type '${pt}' should be valid`).toBe(true)
    }
  })

  it('rejects service page without service_slug (refine)', () => {
    const result = createPageSchema.safeParse(validPage({ page_type: 'service' }))
    expect(result.success).toBe(false)
  })

  it('rejects location page without service_slug (refine)', () => {
    const result = createPageSchema.safeParse(validPage({ page_type: 'location', location_slug: 'paris' }))
    expect(result.success).toBe(false)
  })

  it('rejects location page without location_slug (refine)', () => {
    const result = createPageSchema.safeParse(validPage({ page_type: 'location', service_slug: 'plomberie' }))
    expect(result.success).toBe(false)
  })

  it('accepts service page with service_slug', () => {
    const result = createPageSchema.safeParse(validPage({ page_type: 'service', service_slug: 'plomberie' }))
    expect(result.success).toBe(true)
  })

  it('accepts location page with both slugs', () => {
    const result = createPageSchema.safeParse(
      validPage({ page_type: 'location', service_slug: 'plomberie', location_slug: 'paris' })
    )
    expect(result.success).toBe(true)
  })

  it('validates og_image_url as URL', () => {
    const valid = createPageSchema.safeParse(validPage({ og_image_url: 'https://example.com/og.png' }))
    expect(valid.success).toBe(true)

    const invalid = createPageSchema.safeParse(validPage({ og_image_url: 'not-a-url' }))
    expect(invalid.success).toBe(false)
  })

  it('validates canonical_url as URL', () => {
    const valid = createPageSchema.safeParse(validPage({ canonical_url: 'https://example.com/page' }))
    expect(valid.success).toBe(true)

    const invalid = createPageSchema.safeParse(validPage({ canonical_url: 'not-a-url' }))
    expect(invalid.success).toBe(false)
  })

  it('validates featured_image as URL', () => {
    const valid = createPageSchema.safeParse(validPage({ featured_image: 'https://example.com/img.jpg' }))
    expect(valid.success).toBe(true)

    const invalid = createPageSchema.safeParse(validPage({ featured_image: 'not-a-url' }))
    expect(invalid.success).toBe(false)
  })

  it('accepts sort_order as number', () => {
    const result = createPageSchema.safeParse(validPage({ sort_order: 5 }))
    expect(result.success).toBe(true)
  })

  it('rejects negative sort_order', () => {
    const result = createPageSchema.safeParse(validPage({ sort_order: -1 }))
    expect(result.success).toBe(false)
  })
})

// ========================== updatePageSchema ===============================
describe('updatePageSchema', () => {
  it('all fields are optional (accepts empty object)', () => {
    const result = updatePageSchema.safeParse({})
    expect(result.success).toBe(true)
  })

  it('validates fields that are provided', () => {
    const result = updatePageSchema.safeParse({ title: 'Updated Title' })
    expect(result.success).toBe(true)
  })

  it('rejects invalid slug when provided', () => {
    const result = updatePageSchema.safeParse({ slug: 'INVALID SLUG' })
    expect(result.success).toBe(false)
  })

  it('does NOT have refine (partial updates)', () => {
    // A service page_type without service_slug should still pass updatePageSchema
    const result = updatePageSchema.safeParse({ page_type: 'service' })
    expect(result.success).toBe(true)
  })
})

// ======================== revalidatePagePaths ==============================
describe('revalidatePagePaths', () => {
  beforeEach(() => {
    revalidatePathMock.mockClear()
  })

  it('revalidates /slug for static pages', () => {
    revalidatePagePaths({ page_type: 'static', slug: 'about' })
    expect(revalidatePathMock).toHaveBeenCalledWith('/about')
  })

  it('revalidates /blog/slug for blog pages', () => {
    revalidatePagePaths({ page_type: 'blog', slug: 'my-article' })
    expect(revalidatePathMock).toHaveBeenCalledWith('/blog/my-article')
    expect(revalidatePathMock).toHaveBeenCalledWith('/blog')
  })

  it('revalidates /services/slug for service pages', () => {
    revalidatePagePaths({ page_type: 'service', slug: 'plomberie' })
    expect(revalidatePathMock).toHaveBeenCalledWith('/services/plomberie')
  })

  it('revalidates /services/service_slug/location_slug for location pages', () => {
    revalidatePagePaths({
      page_type: 'location',
      slug: 'plomberie-paris',
      service_slug: 'plomberie',
      location_slug: 'paris',
    })
    expect(revalidatePathMock).toHaveBeenCalledWith('/services/plomberie/paris')
  })

  it('revalidates / for homepage pages', () => {
    revalidatePagePaths({ page_type: 'homepage', slug: 'home' })
    expect(revalidatePathMock).toHaveBeenCalledWith('/')
  })

  it('revalidates /faq for FAQ pages', () => {
    revalidatePagePaths({ page_type: 'faq', slug: 'faq' })
    expect(revalidatePathMock).toHaveBeenCalledWith('/faq')
  })

  it('does not throw for unknown page_type', () => {
    expect(() => {
      revalidatePagePaths({ page_type: 'unknown', slug: 'x' })
    }).not.toThrow()
    expect(revalidatePathMock).not.toHaveBeenCalled()
  })
})

// ======================== buildPayload & FIELD_LIMITS ======================
describe('buildPayload', () => {
  it('builds correct payload with all fields', () => {
    const form = validFormData({
      pageType: 'blog',
      title: 'My Article',
      contentHtml: '<p>Body</p>',
      metaTitle: 'Meta Title',
      metaDescription: 'Meta desc',
      ogImageUrl: 'https://example.com/og.png',
      canonicalUrl: 'https://example.com/page',
      excerpt: 'Short excerpt',
      author: 'Jean',
      authorBio: 'Bio',
      category: 'Conseils',
      tags: ['tag1', 'tag2'],
      readTime: '5 min',
      featuredImage: 'https://example.com/img.jpg',
      sortOrder: 3,
    })

    const payload = buildPayload(form)

    expect(payload.slug).toBe('test-page')
    expect(payload.page_type).toBe('blog')
    expect(payload.title).toBe('My Article')
    expect(payload.content_html).toBe('<p>Body</p>')
    expect(payload.meta_title).toBe('Meta Title')
    expect(payload.meta_description).toBe('Meta desc')
    expect(payload.og_image_url).toBe('https://example.com/og.png')
    expect(payload.canonical_url).toBe('https://example.com/page')
    expect(payload.excerpt).toBe('Short excerpt')
    expect(payload.author).toBe('Jean')
    expect(payload.author_bio).toBe('Bio')
    expect(payload.category).toBe('Conseils')
    expect(payload.tags).toEqual(['tag1', 'tag2'])
    expect(payload.read_time).toBe('5 min')
    expect(payload.featured_image).toBe('https://example.com/img.jpg')
    expect(payload.sort_order).toBe(3)
  })

  it('converts empty strings to null for optional fields', () => {
    const payload = buildPayload(validFormData())

    expect(payload.content_html).toBeNull()
    expect(payload.meta_title).toBeNull()
    expect(payload.meta_description).toBeNull()
    expect(payload.og_image_url).toBeNull()
    expect(payload.canonical_url).toBeNull()
    expect(payload.excerpt).toBeNull()
    expect(payload.author).toBeNull()
    expect(payload.author_bio).toBeNull()
    expect(payload.category).toBeNull()
    expect(payload.read_time).toBeNull()
    expect(payload.featured_image).toBeNull()
  })

  it('nullifies service_slug for static pages', () => {
    const payload = buildPayload(validFormData({ pageType: 'static', specialtySlug: 'plomberie' }))
    expect(payload.service_slug).toBeNull()
  })

  it('nullifies location_slug for non-location pages', () => {
    const payload = buildPayload(validFormData({ pageType: 'service', specialtySlug: 'plomberie', locationSlug: 'paris' }))
    expect(payload.location_slug).toBeNull()
  })

  it('keeps service_slug for service pages', () => {
    const payload = buildPayload(validFormData({ pageType: 'service', specialtySlug: 'plomberie' }))
    expect(payload.service_slug).toBe('plomberie')
  })

  it('keeps both slugs for location pages', () => {
    const payload = buildPayload(validFormData({ pageType: 'location', specialtySlug: 'plomberie', locationSlug: 'paris' }))
    expect(payload.service_slug).toBe('plomberie')
    expect(payload.location_slug).toBe('paris')
  })

  it('filters empty tags', () => {
    const payload = buildPayload(validFormData({ tags: ['valid', '', '  ', 'also-valid'] }))
    expect(payload.tags).toEqual(['valid', 'also-valid'])
  })
})

describe('FIELD_LIMITS', () => {
  it('values match expected constraints', () => {
    expect(FIELD_LIMITS.title).toBe(500)
    expect(FIELD_LIMITS.slug).toBe(200)
    expect(FIELD_LIMITS.excerpt).toBe(1000)
    expect(FIELD_LIMITS.author).toBe(200)
    expect(FIELD_LIMITS.authorBio).toBe(2000)
    expect(FIELD_LIMITS.category).toBe(200)
    expect(FIELD_LIMITS.metaTitle).toBe(70)
    expect(FIELD_LIMITS.metaDescription).toBe(170)
    expect(FIELD_LIMITS.readTime).toBe(50)
    expect(FIELD_LIMITS.ogImageUrl).toBe(2048)
    expect(FIELD_LIMITS.canonicalUrl).toBe(2048)
    expect(FIELD_LIMITS.featuredImage).toBe(2048)
    expect(FIELD_LIMITS.tagsMax).toBe(50)
    expect(FIELD_LIMITS.tagItemMax).toBe(100)
  })
})
