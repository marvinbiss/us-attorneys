'use client'

import { useEffect } from 'react'
import { Eye, X } from 'lucide-react'
import DOMPurify from 'isomorphic-dompurify'
import Image from 'next/image'

interface PagePreviewProps {
  isOpen: boolean
  onClose: () => void
  title: string
  contentHtml: string | null
  structuredData: Record<string, unknown> | null
  author?: string | null
  excerpt?: string | null
  featuredImage?: string | null
  readTime?: string | null
}

export function PagePreview({ isOpen, onClose, title, contentHtml, structuredData, author, excerpt, featuredImage, readTime }: PagePreviewProps) {
  // Escape key handler
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [onClose])

  if (!isOpen) return null

  const hasContent = contentHtml && contentHtml.trim().length > 0
  const hasStructuredData = structuredData && Object.keys(structuredData).length > 0

  return (
    <div role="dialog" aria-modal="true" aria-label="Page preview" className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-start justify-center p-4">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black/50 transition-opacity"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="relative bg-white rounded-xl shadow-xl max-w-4xl w-full my-8">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
            <div className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-gray-500" />
              <h2 className="text-lg font-semibold text-gray-900">Preview</h2>
            </div>
            <button
              onClick={onClose}
              aria-label="Close"
              className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Page title */}
            <h1 className="text-3xl font-bold text-gray-900 mb-4">{title}</h1>

            {/* Blog metadata */}
            {(author || readTime) && (
              <p className="text-sm text-gray-500 mb-4">
                {author && <>By {author}</>}
                {author && readTime && <> &middot; </>}
                {readTime && <>{readTime}</>}
              </p>
            )}

            {/* Featured image */}
            {featuredImage && (
              <div className="relative mb-6 w-full max-h-[300px] overflow-hidden rounded-lg">
                <Image
                  src={featuredImage}
                  alt={title}
                  width={800}
                  height={300}
                  sizes="(max-width: 768px) 100vw, 800px"
                  className="w-full max-h-[300px] object-cover rounded-lg"
                />
              </div>
            )}

            {/* Excerpt */}
            {excerpt && (
              <p className="text-gray-500 italic mb-6 text-base leading-relaxed border-l-4 border-gray-200 pl-4">
                {excerpt}
              </p>
            )}

            {/* Rendered HTML */}
            {hasContent ? (
              <div
                className="prose prose-gray max-w-none"
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(contentHtml) }}
              />
            ) : hasStructuredData ? (
              <div className="space-y-4">
                <p className="text-sm text-gray-500 italic mb-4">
                  No HTML content. Structured data summary:
                </p>
                <pre className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm text-gray-700 overflow-auto max-h-96 whitespace-pre-wrap">
                  {JSON.stringify(structuredData, null, 2)}
                </pre>
              </div>
            ) : (
              <div className="text-center py-12">
                <Eye className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">
                  No content to display. Start writing in the editor.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
