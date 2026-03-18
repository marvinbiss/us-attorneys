'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save, Upload, Loader2 } from 'lucide-react'
import { RichTextEditor } from '@/components/admin/cms/RichTextEditor'
import { StructuredFieldsEditor } from '@/components/admin/cms/StructuredFieldsEditor'
import { SEOPanel } from '@/components/admin/cms/SEOPanel'
import { PAGE_TYPE_OPTIONS, BLOG_CATEGORIES, FIELD_LIMITS, buildPayload } from '@/components/admin/cms/shared'

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

export default function AdminNewContentPage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [isDirty, setIsDirty] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const toastTimeoutRef = useRef<NodeJS.Timeout>()

  // Form fields
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [slugError, setSlugError] = useState('')
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false)
  const [pageType, setPageType] = useState('static')
  const [content, setContent] = useState('')
  const [contentJson, setContentJson] = useState<Record<string, unknown>>({})
  const [structuredData, setStructuredData] = useState<Record<string, unknown>>({})

  // Blog-specific fields
  const [author, setAuthor] = useState('')
  const [authorBio, setAuthorBio] = useState('')
  const [category, setCategory] = useState('')
  const [tags, setTags] = useState('')
  const [excerpt, setExcerpt] = useState('')
  const [featuredImage, setFeaturedImage] = useState('')
  const [readTime, setReadTime] = useState('')

  // Location/service fields
  const [specialtySlug, setServiceSlug] = useState('')
  const [locationSlug, setLocationSlug] = useState('')

  // SEO fields
  const [seoTitle, setSeoTitle] = useState('')
  const [seoDescription, setSeoDescription] = useState('')
  const [ogImageUrl, setOgImageUrl] = useState('')
  const [canonicalUrl, setCanonicalUrl] = useState('')

  // Sort order
  const [sortOrder, setSortOrder] = useState(0)

  // Unsaved changes warning
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault()
        e.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [isDirty])

  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle)
    setIsDirty(true)
    if (!slugManuallyEdited) {
      setSlug(generateSlug(newTitle))
    }
  }

  const handleSlugChange = (newSlug: string) => {
    setSlugManuallyEdited(true)
    setSlug(newSlug)
    setIsDirty(true)
    const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
    if (newSlug && !SLUG_RE.test(newSlug)) {
      setSlugError('Lowercase letters, numbers, and hyphens only')
    } else {
      setSlugError('')
    }
  }

  const showToast = (message: string, type: 'success' | 'error') => {
    clearTimeout(toastTimeoutRef.current)
    setToast({ message, type })
    toastTimeoutRef.current = setTimeout(() => setToast(null), 3000)
  }

  useEffect(() => {
    return () => clearTimeout(toastTimeoutRef.current)
  }, [])

  const usesRichTextEditor = pageType === 'static' || pageType === 'blog'
  const usesStructuredEditor = pageType === 'service' || pageType === 'faq' || pageType === 'homepage'

  const getPayload = () => {
    return buildPayload({
      slug,
      pageType,
      title,
      contentJson: usesRichTextEditor ? contentJson : null,
      contentHtml: usesRichTextEditor ? content : '',
      structuredData: usesStructuredEditor ? structuredData : null,
      metaTitle: seoTitle,
      metaDescription: seoDescription,
      ogImageUrl,
      canonicalUrl,
      excerpt,
      author,
      authorBio,
      category,
      tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
      readTime,
      featuredImage,
      specialtySlug,
      locationSlug,
      sortOrder,
    })
  }

  const handleSaveDraft = useCallback(async () => {
    if (!title.trim()) {
      showToast('Title is required', 'error')
      return
    }
    if (pageType === 'service' && !specialtySlug.trim()) {
      showToast('Service slug is required for service pages', 'error')
      return
    }
    if (pageType === 'location' && (!specialtySlug.trim() || !locationSlug.trim())) {
      showToast('Service and location slugs are required for location pages', 'error')
      return
    }

    try {
      setSaving(true)
      const payload = getPayload()

      const response = await fetch('/api/admin/cms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        setIsDirty(false)
        showToast('Page saved as draft', 'success')
        setTimeout(() => router.push('/admin/content'), 500)
      } else {
        const err = await response.json().catch(() => ({}))
        showToast(err.error?.message || 'Error saving page', 'error')
      }
    } catch (error: unknown) {
      console.error('Error:', error)
      showToast('Error saving page', 'error')
    } finally {
      setSaving(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, pageType, specialtySlug, locationSlug, slug, content, contentJson, structuredData, seoTitle, seoDescription, ogImageUrl, canonicalUrl, excerpt, author, authorBio, category, tags, readTime, featuredImage, sortOrder, router])

  // Ctrl+S / Cmd+S keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        if (!saving) {
          handleSaveDraft()
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleSaveDraft, saving])

  const handlePublish = async () => {
    if (!title.trim()) {
      showToast('Title is required', 'error')
      return
    }
    if (pageType === 'service' && !specialtySlug.trim()) {
      showToast('Service slug is required for service pages', 'error')
      return
    }
    if (pageType === 'location' && (!specialtySlug.trim() || !locationSlug.trim())) {
      showToast('Service and location slugs are required for location pages', 'error')
      return
    }

    try {
      setSaving(true)
      const payload = getPayload()

      const response = await fetch('/api/admin/cms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        const data = await response.json()
        const pageId = data.data?.id || data.id
        const publishResponse = await fetch(`/api/admin/cms/${pageId}/publish`, {
          method: 'POST',
          credentials: 'include',
        })

        if (publishResponse.ok) {
          setIsDirty(false)
          showToast('Page published successfully', 'success')
          setTimeout(() => router.push('/admin/content'), 500)
        } else {
          setIsDirty(false)
          showToast('Page created but publishing failed', 'error')
          // Redirect to edit page to avoid re-creating on retry
          setTimeout(() => router.push(`/admin/content/${pageId}`), 1500)
        }
      } else {
        const err = await response.json().catch(() => ({}))
        showToast(err.error?.message || 'Error creating page', 'error')
      }
    } catch (error: unknown) {
      console.error('Error:', error)
      showToast('Error publishing page', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Toast */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg text-white transition-all ${
            toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'
          }`}
        >
          {toast.message}
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link
              href="/admin/content"
              className="flex items-center gap-1 text-gray-500 hover:text-gray-700 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              Back
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">New page</h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleSaveDraft}
              disabled={saving || !!slugError}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save as draft
            </button>
            <button
              onClick={handlePublish}
              disabled={saving || !!slugError}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              Publish
            </button>
          </div>
        </div>

        {/* Main layout: 2/3 editor + 1/3 sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Editor area (2/3) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Title input */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="Page title"
                maxLength={FIELD_LIMITS.title}
                className="w-full px-4 py-3 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Slug input */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Slug (URL)</label>
              <div className="flex items-center gap-2">
                <span className="text-gray-400 text-sm">/</span>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => handleSlugChange(e.target.value)}
                  placeholder="page-slug"
                  maxLength={FIELD_LIMITS.slug}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
              </div>
              {slugError && <p className="mt-1 text-xs text-red-600">{slugError}</p>}
            </div>

            {/* Service/Location slug fields */}
            {(pageType === 'service' || pageType === 'location') && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
                <h3 className="font-medium text-gray-900">{pageType === 'location' ? 'Location' : 'Service'} fields</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Service slug</label>
                  <input
                    type="text"
                    value={specialtySlug}
                    onChange={(e) => { setServiceSlug(e.target.value); setIsDirty(true) }}
                    placeholder="personal-injury"
                    maxLength={FIELD_LIMITS.slug}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  />
                  <p className="mt-1 text-xs text-gray-500">Lowercase letters, numbers, and hyphens only</p>
                </div>
                {pageType === 'location' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Location slug</label>
                    <input
                      type="text"
                      value={locationSlug}
                      onChange={(e) => { setLocationSlug(e.target.value); setIsDirty(true) }}
                      placeholder="new-york"
                      maxLength={FIELD_LIMITS.slug}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    />
                    <p className="mt-1 text-xs text-gray-500">Lowercase letters, numbers, and hyphens only</p>
                  </div>
                )}
              </div>
            )}

            {/* Blog-specific fields */}
            {pageType === 'blog' && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
                <h3 className="font-medium text-gray-900">Blog fields</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Author</label>
                    <input
                      type="text"
                      value={author}
                      onChange={(e) => { setAuthor(e.target.value); setIsDirty(true) }}
                      placeholder="Author name"
                      maxLength={FIELD_LIMITS.author}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                    <select
                      value={category}
                      onChange={(e) => { setCategory(e.target.value); setIsDirty(true) }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                    >
                      <option value="">Select...</option>
                      {BLOG_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Author bio
                  </label>
                  <textarea
                    value={authorBio}
                    onChange={(e) => { setAuthorBio(e.target.value); setIsDirty(true) }}
                    rows={2}
                    maxLength={FIELD_LIMITS.authorBio}
                    placeholder="Short author biography..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tags (comma-separated)
                    </label>
                    <input
                      type="text"
                      value={tags}
                      onChange={(e) => { setTags(e.target.value); setIsDirty(true) }}
                      placeholder="legal, litigation, tips"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Read time</label>
                    <input
                      type="text"
                      value={readTime}
                      onChange={(e) => { setReadTime(e.target.value); setIsDirty(true) }}
                      placeholder="5 min"
                      maxLength={FIELD_LIMITS.readTime}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Excerpt</label>
                  <textarea
                    value={excerpt}
                    onChange={(e) => { setExcerpt(e.target.value); setIsDirty(true) }}
                    rows={3}
                    maxLength={FIELD_LIMITS.excerpt}
                    placeholder="Short article summary..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Featured image (URL)</label>
                  <input
                    type="url"
                    value={featuredImage}
                    onChange={(e) => { setFeaturedImage(e.target.value); setIsDirty(true) }}
                    placeholder="https://example.com/image.jpg"
                    maxLength={FIELD_LIMITS.featuredImage}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            )}

            {/* Editor */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <label className="block text-sm font-medium text-gray-700 mb-4">Content</label>
              {usesRichTextEditor && (
                <RichTextEditor
                  value={content}
                  onChange={(html, json) => {
                    setContent(html)
                    setContentJson(json)
                    setIsDirty(true)
                  }}
                />
              )}
              {usesStructuredEditor && (
                <StructuredFieldsEditor
                  pageType={pageType}
                  value={structuredData}
                  onChange={(data) => {
                    setStructuredData(data)
                    setIsDirty(true)
                  }}
                />
              )}
            </div>
          </div>

          {/* Right: Sidebar (1/3) */}
          <div className="space-y-6">
            {/* Page settings */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="font-medium text-gray-900 mb-4">Settings</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Page type</label>
                  <select
                    value={pageType}
                    onChange={(e) => { setPageType(e.target.value); setIsDirty(true) }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  >
                    {PAGE_TYPE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sort order</label>
                  <input
                    type="number"
                    value={sortOrder}
                    onChange={(e) => { setSortOrder(parseInt(e.target.value, 10) || 0); setIsDirty(true) }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    Draft
                  </span>
                </div>
              </div>
            </div>

            {/* SEO Panel */}
            <SEOPanel
              seoTitle={seoTitle}
              onSeoTitleChange={(v) => { setSeoTitle(v); setIsDirty(true) }}
              seoDescription={seoDescription}
              onSeoDescriptionChange={(v) => { setSeoDescription(v); setIsDirty(true) }}
            />

            {/* Additional SEO fields */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
              <h3 className="font-medium text-gray-900">Advanced SEO</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Image Open Graph (URL)</label>
                <input
                  type="url"
                  value={ogImageUrl}
                  onChange={(e) => { setOgImageUrl(e.target.value); setIsDirty(true) }}
                  placeholder="https://example.com/og-image.jpg"
                  maxLength={FIELD_LIMITS.ogImageUrl}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Canonical URL</label>
                <input
                  type="url"
                  value={canonicalUrl}
                  onChange={(e) => { setCanonicalUrl(e.target.value); setIsDirty(true) }}
                  placeholder="https://us-attorneys.com/page"
                  maxLength={FIELD_LIMITS.canonicalUrl}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
