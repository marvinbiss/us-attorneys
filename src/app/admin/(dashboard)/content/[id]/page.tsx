'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Save,
  Upload,
  Eye,
  History,
  Trash2,
  Pencil,
  ArrowDownCircle,
  Loader2,
} from 'lucide-react'
import { RichTextEditor } from '@/components/admin/cms/RichTextEditor'
import { StructuredFieldsEditor } from '@/components/admin/cms/StructuredFieldsEditor'
import { SEOPanel } from '@/components/admin/cms/SEOPanel'
import { PagePreview } from '@/components/admin/cms/PagePreview'
import { VersionHistory } from '@/components/admin/cms/VersionHistory'
import { PAGE_TYPE_OPTIONS, BLOG_CATEGORIES, FIELD_LIMITS, buildPayload } from '@/components/admin/cms/shared'
import type { CmsPage } from '@/types/cms'

export default function AdminEditContenuPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isDirty, setIsDirty] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  // UI state
  const [showPreview, setShowPreview] = useState(false)
  const [showVersions, setShowVersions] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const toastTimeoutRef = useRef<NodeJS.Timeout>()

  // Form fields
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [slugError, setSlugError] = useState('')
  const [pageType, setPageType] = useState('static')
  const [status, setStatus] = useState('draft')
  const [content, setContent] = useState('')
  const [contentJson, setContentJson] = useState<Record<string, unknown>>({})
  const [structuredData, setStructuredData] = useState<Record<string, unknown>>({})

  // Service/location fields
  const [specialtySlug, setServiceSlug] = useState('')
  const [locationSlug, setLocationSlug] = useState('')

  // Blog-specific fields
  const [author, setAuthor] = useState('')
  const [authorBio, setAuthorBio] = useState('')
  const [category, setCategory] = useState('')
  const [tags, setTags] = useState('')
  const [excerpt, setExcerpt] = useState('')
  const [featuredImage, setFeaturedImage] = useState('')
  const [readTime, setReadTime] = useState('')

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

  // Escape key handler for modals
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showDeleteConfirm) setShowDeleteConfirm(false)
        else if (showPreview) setShowPreview(false)
        else if (showVersions) setShowVersions(false)
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [showDeleteConfirm, showPreview, showVersions])

  const showToast = (message: string, type: 'success' | 'error') => {
    clearTimeout(toastTimeoutRef.current)
    setToast({ message, type })
    toastTimeoutRef.current = setTimeout(() => setToast(null), 3000)
  }

  useEffect(() => {
    return () => clearTimeout(toastTimeoutRef.current)
  }, [])

  const fetchPage = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch(`/api/admin/cms/${id}`, {
        credentials: 'include',
      })
      if (!response.ok) {
        if (response.status === 404) {
          setError('Page not found')
        } else {
          setError('Error loading page')
        }
        return
      }
      const json = await response.json()
      const data: CmsPage = json.data || json

      setTitle(data.title || '')
      setSlug(data.slug || '')
      setPageType(data.page_type || 'static')
      setStatus(data.status || 'draft')
      setContent(data.content_html || '')
      setContentJson(data.content_json || {})
      setStructuredData(data.structured_data || {})
      setSeoTitle(data.meta_title || '')
      setSeoDescription(data.meta_description || '')
      setOgImageUrl(data.og_image_url || '')
      setCanonicalUrl(data.canonical_url || '')
      setAuthor(data.author || '')
      setAuthorBio(data.author_bio || '')
      setCategory(data.category || '')
      setTags(Array.isArray(data.tags) ? data.tags.join(', ') : '')
      setExcerpt(data.excerpt || '')
      setReadTime(data.read_time || '')
      setFeaturedImage(data.featured_image || '')
      setServiceSlug(data.service_slug || '')
      setLocationSlug(data.location_slug || '')
      setSortOrder(data.sort_order ?? 0)
      setIsDirty(false)
    } catch (err: unknown) {
      console.error('Error:', err)
      setError('Error loading page')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchPage()
  }, [fetchPage])

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

  const handleSave = useCallback(async () => {
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

      const response = await fetch(`/api/admin/cms/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        setIsDirty(false)
        showToast('Page saved', 'success')
      } else {
        const err = await response.json().catch(() => ({}))
        showToast(err.error?.message || 'Error saving page', 'error')
      }
    } catch (err: unknown) {
      console.error('Error:', err)
      showToast('Error saving page', 'error')
    } finally {
      setSaving(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, title, pageType, specialtySlug, locationSlug, slug, content, contentJson, structuredData, seoTitle, seoDescription, ogImageUrl, canonicalUrl, excerpt, author, authorBio, category, tags, readTime, featuredImage, sortOrder])

  // Ctrl+S / Cmd+S keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        if (!saving && !loading) {
          handleSave()
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleSave, saving, loading])

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

      // Save unsaved changes before publishing
      if (isDirty) {
        const payload = getPayload()
        const saveRes = await fetch(`/api/admin/cms/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(payload),
        })
        if (!saveRes.ok) {
          showToast('Error saving before publishing', 'error')
          return
        }
        setIsDirty(false)
      }

      const response = await fetch(`/api/admin/cms/${id}/publish`, {
        method: 'POST',
        credentials: 'include',
      })

      if (response.ok) {
        setStatus('published')
        showToast('Page published', 'success')
      } else {
        const err = await response.json().catch(() => ({}))
        showToast(err?.error?.message || 'Error publishing page', 'error')
      }
    } catch (err: unknown) {
      console.error('Error:', err)
      showToast('Error publishing page', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleUnpublish = async () => {
    try {
      setSaving(true)
      const response = await fetch(`/api/admin/cms/${id}/publish`, {
        method: 'DELETE',
        credentials: 'include',
      })

      if (response.ok) {
        setStatus('draft')
        showToast('Page unpublished', 'success')
      } else {
        showToast('Error unpublishing page', 'error')
      }
    } catch (err: unknown) {
      console.error('Error:', err)
      showToast('Error unpublishing page', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    try {
      setSaving(true)
      const response = await fetch(`/api/admin/cms/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      })

      if (response.ok) {
        showToast('Page deleted', 'success')
        setTimeout(() => router.push('/admin/content'), 500)
      } else {
        showToast('Error deleting page', 'error')
      }
    } catch (err: unknown) {
      console.error('Error:', err)
      showToast('Error deleting page', 'error')
    } finally {
      setSaving(false)
      setShowDeleteConfirm(false)
    }
  }

  const statusBadge = () => {
    switch (status) {
      case 'draft':
        return { label: 'Draft', classes: 'bg-yellow-100 text-yellow-800' }
      case 'published':
        return { label: 'Published', classes: 'bg-green-100 text-green-800' }
      case 'archived':
        return { label: 'Archived', classes: 'bg-gray-100 text-gray-800' }
      default:
        return { label: status, classes: 'bg-gray-100 text-gray-600' }
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
          <p className="mt-4 text-gray-500">Loading page...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 text-lg font-medium">{error}</p>
          <div className="mt-4 flex items-center justify-center gap-4">
            <button
              onClick={fetchPage}
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              Retry
            </button>
            <Link
              href="/admin/content"
              className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to list
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const sb = statusBadge()

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
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
              <Pencil className="w-4 h-4 text-gray-400" />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowPreview(true)}
              className="flex items-center gap-2 px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Eye className="w-4 h-4" />
              Preview
            </button>
            <button
              onClick={() => setShowVersions(true)}
              className="flex items-center gap-2 px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <History className="w-4 h-4" />
              Versions
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !!slugError}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save
            </button>
            {status === 'draft' ? (
              <button
                onClick={handlePublish}
                disabled={saving || !!slugError}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                Publish
              </button>
            ) : status === 'published' ? (
              <button
                onClick={handleUnpublish}
                disabled={saving || !!slugError}
                className="flex items-center gap-2 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 disabled:opacity-50 transition-colors"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowDownCircle className="w-4 h-4" />}
                Unpublish
              </button>
            ) : null}
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
                onChange={(e) => { setTitle(e.target.value); setIsDirty(true) }}
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
                  onChange={(e) => {
                    const newSlug = e.target.value
                    setSlug(newSlug)
                    setIsDirty(true)
                    const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
                    if (newSlug && !SLUG_RE.test(newSlug)) {
                      setSlugError('Lowercase letters, numbers, and hyphens only')
                    } else {
                      setSlugError('')
                    }
                  }}
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
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${sb.classes}`}
                  >
                    {sb.label}
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

            {/* Danger zone */}
            <div className="bg-white rounded-xl shadow-sm border border-red-200 p-6">
              <h3 className="font-medium text-red-600 mb-4">Danger zone</h3>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="flex items-center gap-2 w-full px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Delete this page
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
        <div role="dialog" aria-modal="true" aria-label="Confirm deletion" className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div
              className="fixed inset-0 bg-black/50"
              onClick={() => setShowDeleteConfirm(false)}
            />
            <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Delete page
              </h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete the page &quot;{title}&quot;? This action cannot
                be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={saving}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Preview modal */}
      <PagePreview
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        title={title}
        contentHtml={content}
        structuredData={usesStructuredEditor ? structuredData : null}
        author={pageType === 'blog' ? author : null}
        excerpt={pageType === 'blog' ? excerpt : null}
        featuredImage={pageType === 'blog' ? featuredImage : null}
        readTime={pageType === 'blog' ? readTime : null}
      />

      {/* Version history modal */}
      {showVersions && (
        <VersionHistory
          pageId={id}
          onClose={() => setShowVersions(false)}
          onRestore={() => {
            setShowVersions(false)
            fetchPage()
          }}
        />
      )}
    </div>
  )
}
