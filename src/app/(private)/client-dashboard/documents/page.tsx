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
  if (mimeType.startsWith('image/')) return <ImageIcon className="w-5 h-5 text-green-500" />
  if (mimeType === 'application/pdf') return <FileText className="w-5 h-5 text-red-500" />
  return <FileText className="w-5 h-5 text-blue-500" />
}

function getFileTypeLabel(mimeType: string): string {
  if (mimeType === 'application/pdf') return 'PDF'
  if (mimeType === 'application/msword') return 'DOC'
  if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') return 'DOCX'
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
        const caseItems = (casesData.data?.cases || []).map((c: { id: string; practice_area: string; type: string }) => ({
          id: c.id,
          label: c.practice_area || 'Case',
          type: c.type as 'lead' | 'booking',
        }))
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
        setDocuments(prev => prev.filter(d => d.id !== docId))
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
  const filteredDocs = documents.filter(doc => {
    if (selectedCase !== 'all' && doc.case_id !== selectedCase) return false
    if (searchQuery) {
      return doc.file_name.toLowerCase().includes(searchQuery.toLowerCase())
    }
    return true
  })

  // Get case label for a case_id
  const getCaseLabel = (caseId: string) => {
    const caseItem = cases.find(c => c.id === caseId)
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
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-2">
                <Link href="/client-dashboard" className="hover:text-gray-900 dark:hover:text-gray-200">
                  Client Dashboard
                </Link>
                <span>/</span>
                <span className="text-gray-900 dark:text-gray-100 font-medium">Documents</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Document Management</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Upload, manage, and share documents with your attorneys
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowUploader(!showUploader)}
                className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                <Upload className="w-4 h-4" />
                Upload
              </button>
              <button
                onClick={fetchDocuments}
                className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                aria-label="Refresh documents"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <ClientSidebar activePage="my-cases" />

          {/* Main content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Stats summary */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 text-center">
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{documents.length}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Documents</p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 text-center">
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{Object.keys(groupedByCaseId).length}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Cases with Documents</p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 text-center">
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{formatFileSize(totalSize)}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Size</p>
              </div>
            </div>

            {/* Upload section */}
            {showUploader && (
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                  <Upload className="w-5 h-5 text-blue-500" />
                  Upload Documents
                </h2>

                {cases.length === 0 ? (
                  <div className="text-center py-6">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      You need an active case to upload documents.
                    </p>
                    <Link
                      href="/attorneys"
                      className="text-sm text-blue-600 dark:text-blue-400 hover:underline mt-2 block"
                    >
                      Find an Attorney
                    </Link>
                  </div>
                ) : (
                  <>
                    <div className="mb-4">
                      <label htmlFor="upload-case-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Select Case
                      </label>
                      <select
                        id="upload-case-select"
                        value={selectedUploadCase}
                        onChange={(e) => setSelectedUploadCase(e.target.value)}
                        className="w-full sm:w-80 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
                      >
                        {cases.map((c) => (
                          <option key={c.id} value={c.id}>{c.label}</option>
                        ))}
                      </select>
                    </div>

                    {selectedUploadCase && (
                      <DocumentUploader
                        caseId={selectedUploadCase}
                        caseType={cases.find(c => c.id === selectedUploadCase)?.type || 'lead'}
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
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search documents..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-4 py-2 w-full text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  aria-label="Search documents"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-400" />
                <select
                  value={selectedCase}
                  onChange={(e) => setSelectedCase(e.target.value)}
                  className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
                  aria-label="Filter by case"
                >
                  <option value="all">All Cases</option>
                  {cases.map((c) => (
                    <option key={c.id} value={c.id}>{c.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Error banner */}
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                <p className="text-red-700 dark:text-red-400 text-sm">{error}</p>
              </div>
            )}

            {/* Content */}
            {loading ? (
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Loading documents...</p>
              </div>
            ) : filteredDocs.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
                <div className="w-14 h-14 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  {searchQuery ? <Search className="w-7 h-7 text-gray-400" /> : <FolderOpen className="w-7 h-7 text-gray-400" />}
                </div>
                <p className="text-gray-600 dark:text-gray-300 font-medium text-lg">
                  {searchQuery ? 'No matching documents' : 'No documents yet'}
                </p>
                <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">
                  {searchQuery
                    ? 'Try adjusting your search terms.'
                    : 'Upload documents related to your legal cases.'}
                </p>
                {!searchQuery && (
                  <button
                    onClick={() => setShowUploader(true)}
                    className="inline-flex items-center gap-2 mt-6 px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                  >
                    <Upload className="w-4 h-4" />
                    Upload Document
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                {/* Documents grouped by case */}
                {Object.entries(filteredGrouped).map(([caseId, docs]) => (
                  <div key={caseId} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div className="px-6 py-3 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FolderOpen className="w-4 h-4 text-gray-400" />
                        <Link
                          href={`/client-dashboard/cases/${caseId}`}
                          className="text-sm font-medium text-gray-900 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400"
                        >
                          {getCaseLabel(caseId)}
                        </Link>
                        <span className="bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300 text-xs px-1.5 py-0.5 rounded-full">
                          {docs.length}
                        </span>
                      </div>
                    </div>

                    <div className="divide-y divide-gray-100 dark:divide-gray-700">
                      {docs.map((doc) => (
                        <div key={doc.id} className="flex items-center gap-4 px-6 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                          {/* Icon */}
                          <div className="flex-shrink-0">
                            {getFileIcon(doc.mime_type)}
                          </div>

                          {/* File info */}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                              {doc.file_name}
                            </p>
                            <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                              <span className="uppercase font-medium text-gray-400">{getFileTypeLabel(doc.mime_type)}</span>
                              <span>{formatFileSize(doc.file_size)}</span>
                              <span>{formatDate(doc.created_at)}</span>
                              {doc.shared_with_attorney && (
                                <span className="flex items-center gap-0.5 text-blue-600 dark:text-blue-400">
                                  <Share2 className="w-3 h-3" />
                                  Shared with attorney
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-1 flex-shrink-0">
                            {doc.mime_type.startsWith('image/') && (
                              <button
                                className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                                aria-label={`Preview ${doc.file_name}`}
                                title="Preview"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={() => handleDelete(doc.id)}
                              disabled={deletingDoc === doc.id}
                              className="p-1.5 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors disabled:opacity-50"
                              aria-label={`Delete ${doc.file_name}`}
                              title="Delete"
                            >
                              {deletingDoc === doc.id
                                ? <Loader2 className="w-4 h-4 animate-spin" />
                                : <Trash2 className="w-4 h-4" />}
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
