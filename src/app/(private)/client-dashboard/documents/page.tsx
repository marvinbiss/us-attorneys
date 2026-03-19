'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  FileText,
  Image as ImageIcon,
  Loader2,
  AlertCircle,
  RefreshCw,
  Trash2,
  Share2,
  Search,
  Upload,
  FolderOpen,
  Eye,
  Filter,
} from 'lucide-react'
import ClientSidebar from '@/components/client/ClientSidebar'
import { DocumentUploader } from '@/components/client-dashboard/DocumentUploader'

// ─── Types ───────────────────────────────────────────────────────────────────

interface DocumentItem {
  id: string
  case_id: string
  case_type: string
  file_name: string
  file_size: number
  mime_type: string
  storage_path: string
  shared_with_attorney: boolean
  created_at: string
  download_url: string
}

interface CaseOption {
  id: string
  label: string
  type: 'lead' | 'booking'
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function getFileIcon(mimeType: string) {
  if (mimeType.startsWith('image/')) return <ImageIcon className="h-5 w-5 text-green-500" />
  if (mimeType === 'application/pdf') return <FileText className="h-5 w-5 text-red-500" />
  return <FileText className="h-5 w-5 text-blue-500" />
}

function getFileTypeLabel(mimeType: string): string {
  if (mimeType === 'application/pdf') return 'PDF'
  if (mimeType === 'application/msword') return 'DOC'
  if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')
    return 'DOCX'
  if (mimeType === 'image/jpeg') return 'JPG'
  if (mimeType === 'image/png') return 'PNG'
  return 'FILE'
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<DocumentItem[]>([])
  const [cases, setCases] = useState<CaseOption[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCase, setSelectedCase] = useState<string>('all')
  const [showUploader, setShowUploader] = useState(false)
  const [selectedUploadCase, setSelectedUploadCase] = useState<string>('')
  const [deletingDoc, setDeletingDoc] = useState<string | null>(null)

  const fetchDocuments = useCallback(async () => {
    try {
      setError(null)
      setLoading(true)

      // Fetch documents and cases in parallel
      const [docsRes, casesRes] = await Promise.all([
        fetch('/api/client/documents'),
        fetch('/api/client/cases?pageSize=50'),
      ])

      if (docsRes.ok) {
        const docsData = await docsRes.json()
        setDocuments(docsData.data?.documents || [])
      } else if (docsRes.status === 401) {
        window.location.href = '/login?redirect=/client-dashboard/documents'
        return
      } else {
        setError('Failed to load documents')
      }

      if (casesRes.ok) {
        const casesData = await casesRes.json()
        const caseItems = (casesData.data?.cases || []).map(
          (c: { id: string; practice_area: string; type: string }) => ({
            id: c.id,
            label: c.practice_area || 'Case',
            type: c.type as 'lead' | 'booking',
          })
        )
        setCases(caseItems)
        if (caseItems.length > 0 && !selectedUploadCase) {
          setSelectedUploadCase(caseItems[0].id)
        }
      }
    } catch {
      setError('Connection error. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [selectedUploadCase])

  useEffect(() => {
    fetchDocuments()
  }, [fetchDocuments])

  const handleDelete = async (docId: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return
    setDeletingDoc(docId)
    try {
      const res = await fetch(`/api/client/documents?id=${docId}`, { method: 'DELETE' })
      if (res.ok) {
        setDocuments((prev) => prev.filter((d) => d.id !== docId))
      }
    } catch {
      // Silent
    } finally {
      setDeletingDoc(null)
    }
  }

  // Group documents by case
  const groupedByCaseId: Record<string, DocumentItem[]> = {}
  for (const doc of documents) {
    if (!groupedByCaseId[doc.case_id]) groupedByCaseId[doc.case_id] = []
    groupedByCaseId[doc.case_id].push(doc)
  }

  // Apply filters
  const filteredDocs = documents.filter((doc) => {
    if (selectedCase !== 'all' && doc.case_id !== selectedCase) return false
    if (searchQuery) {
      return doc.file_name.toLowerCase().includes(searchQuery.toLowerCase())
    }
    return true
  })

  // Get case label for a case_id
  const getCaseLabel = (caseId: string) => {
    const caseItem = cases.find((c) => c.id === caseId)
    return caseItem?.label || `Case ${caseId.slice(0, 8)}`
  }

  // Group filtered docs by case
  const filteredGrouped: Record<string, DocumentItem[]> = {}
  for (const doc of filteredDocs) {
    if (!filteredGrouped[doc.case_id]) filteredGrouped[doc.case_id] = []
    filteredGrouped[doc.case_id].push(doc)
  }

  const totalSize = documents.reduce((sum, d) => sum + d.file_size, 0)

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <Link
                  href="/client-dashboard"
                  className="hover:text-gray-900 dark:hover:text-gray-200"
                >
                  Client Dashboard
                </Link>
                <span>/</span>
                <span className="font-medium text-gray-900 dark:text-gray-100">Documents</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                Document Management
              </h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Upload, manage, and share documents with your attorneys
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowUploader(!showUploader)}
                className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
              >
                <Upload className="h-4 w-4" />
                Upload
              </button>
              <button
                onClick={fetchDocuments}
                className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                aria-label="Refresh documents"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-4">
          {/* Sidebar */}
          <ClientSidebar activePage="my-cases" />

          {/* Main content */}
          <div className="space-y-6 lg:col-span-3">
            {/* Stats summary */}
            <div className="grid grid-cols-3 gap-4">
              <div className="rounded-xl border border-gray-200 bg-white p-4 text-center dark:border-gray-700 dark:bg-gray-800">
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {documents.length}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Documents</p>
              </div>
              <div className="rounded-xl border border-gray-200 bg-white p-4 text-center dark:border-gray-700 dark:bg-gray-800">
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {Object.keys(groupedByCaseId).length}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Cases with Documents</p>
              </div>
              <div className="rounded-xl border border-gray-200 bg-white p-4 text-center dark:border-gray-700 dark:bg-gray-800">
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {formatFileSize(totalSize)}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Size</p>
              </div>
            </div>

            {/* Upload section */}
            {showUploader && (
              <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
                <h2 className="mb-4 flex items-center gap-2 font-semibold text-gray-900 dark:text-gray-100">
                  <Upload className="h-5 w-5 text-blue-500" />
                  Upload Documents
                </h2>

                {cases.length === 0 ? (
                  <div className="py-6 text-center">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      You need an active case to upload documents.
                    </p>
                    <Link
                      href="/attorneys"
                      className="mt-2 block text-sm text-blue-600 hover:underline dark:text-blue-400"
                    >
                      Find an Attorney
                    </Link>
                  </div>
                ) : (
                  <>
                    <div className="mb-4">
                      <label
                        htmlFor="upload-case-select"
                        className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
                      >
                        Select Case
                      </label>
                      <select
                        id="upload-case-select"
                        value={selectedUploadCase}
                        onChange={(e) => setSelectedUploadCase(e.target.value)}
                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 sm:w-80"
                      >
                        {cases.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {selectedUploadCase && (
                      <DocumentUploader
                        caseId={selectedUploadCase}
                        caseType={cases.find((c) => c.id === selectedUploadCase)?.type || 'lead'}
                        onUploadComplete={() => {
                          fetchDocuments()
                        }}
                      />
                    )}
                  </>
                )}
              </div>
            )}

            {/* Filters */}
            <div className="flex flex-col gap-4 sm:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search documents..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-4 text-sm text-gray-900 focus:border-transparent focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                  aria-label="Search documents"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-400" />
                <select
                  value={selectedCase}
                  onChange={(e) => setSelectedCase(e.target.value)}
                  className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                  aria-label="Filter by case"
                >
                  <option value="all">All Cases</option>
                  {cases.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Error banner */}
            {error && (
              <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
                <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-500" />
                <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
              </div>
            )}

            {/* Content */}
            {loading ? (
              <div className="rounded-xl border border-gray-200 bg-white p-12 text-center dark:border-gray-700 dark:bg-gray-800">
                <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-600" />
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  Loading documents...
                </p>
              </div>
            ) : filteredDocs.length === 0 ? (
              <div className="rounded-xl border border-gray-200 bg-white p-12 text-center dark:border-gray-700 dark:bg-gray-800">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700">
                  {searchQuery ? (
                    <Search className="h-7 w-7 text-gray-400" />
                  ) : (
                    <FolderOpen className="h-7 w-7 text-gray-400" />
                  )}
                </div>
                <p className="text-lg font-medium text-gray-600 dark:text-gray-300">
                  {searchQuery ? 'No matching documents' : 'No documents yet'}
                </p>
                <p className="mt-2 text-sm text-gray-400 dark:text-gray-500">
                  {searchQuery
                    ? 'Try adjusting your search terms.'
                    : 'Upload documents related to your legal cases.'}
                </p>
                {!searchQuery && (
                  <button
                    onClick={() => setShowUploader(true)}
                    className="mt-6 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
                  >
                    <Upload className="h-4 w-4" />
                    Upload Document
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                {/* Documents grouped by case */}
                {Object.entries(filteredGrouped).map(([caseId, docs]) => (
                  <div
                    key={caseId}
                    className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800"
                  >
                    <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50 px-6 py-3 dark:border-gray-700 dark:bg-gray-800/50">
                      <div className="flex items-center gap-2">
                        <FolderOpen className="h-4 w-4 text-gray-400" />
                        <Link
                          href={`/client-dashboard/my-cases`}
                          className="text-sm font-medium text-gray-900 hover:text-blue-600 dark:text-gray-100 dark:hover:text-blue-400"
                        >
                          {getCaseLabel(caseId)}
                        </Link>
                        <span className="rounded-full bg-gray-200 px-1.5 py-0.5 text-xs text-gray-600 dark:bg-gray-600 dark:text-gray-300">
                          {docs.length}
                        </span>
                      </div>
                    </div>

                    <div className="divide-y divide-gray-100 dark:divide-gray-700">
                      {docs.map((doc) => (
                        <div
                          key={doc.id}
                          className="flex items-center gap-4 px-6 py-3 transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50"
                        >
                          {/* Icon */}
                          <div className="flex-shrink-0">{getFileIcon(doc.mime_type)}</div>

                          {/* File info */}
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
                              {doc.file_name}
                            </p>
                            <div className="mt-0.5 flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                              <span className="font-medium uppercase text-gray-400">
                                {getFileTypeLabel(doc.mime_type)}
                              </span>
                              <span>{formatFileSize(doc.file_size)}</span>
                              <span>{formatDate(doc.created_at)}</span>
                              {doc.shared_with_attorney && (
                                <span className="flex items-center gap-0.5 text-blue-600 dark:text-blue-400">
                                  <Share2 className="h-3 w-3" />
                                  Shared with attorney
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex flex-shrink-0 items-center gap-1">
                            {doc.mime_type.startsWith('image/') && (
                              <button
                                className="p-1.5 text-gray-400 transition-colors hover:text-gray-600 dark:hover:text-gray-300"
                                aria-label={`Preview ${doc.file_name}`}
                                title="Preview"
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                            )}
                            <button
                              onClick={() => handleDelete(doc.id)}
                              disabled={deletingDoc === doc.id}
                              className="p-1.5 text-gray-400 transition-colors hover:text-red-500 disabled:opacity-50 dark:hover:text-red-400"
                              aria-label={`Delete ${doc.file_name}`}
                              title="Delete"
                            >
                              {deletingDoc === doc.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
