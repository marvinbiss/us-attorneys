'use client'

import { useState, useRef, useCallback } from 'react'
import {
  Upload,
  FileText,
  Image as ImageIcon,
  X,
  Loader2,
  AlertCircle,
  CheckCircle,
} from 'lucide-react'
import { formatFileSize } from '@/lib/storage'

// ─── Types ───────────────────────────────────────────────────────────────────

interface DocumentUploaderProps {
  caseId: string
  caseType: 'lead' | 'booking'
  onUploadComplete: () => void
  disabled?: boolean
}

interface UploadingFile {
  file: File
  progress: number
  error?: string
  done?: boolean
}

// ─── Constants ───────────────────────────────────────────────────────────────

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/png',
]
const ALLOWED_EXTENSIONS = '.pdf,.doc,.docx,.jpg,.jpeg,.png'

const FILE_TYPE_ICONS: Record<string, React.ReactNode> = {
  'application/pdf': <FileText className="w-5 h-5 text-red-500" />,
  'application/msword': <FileText className="w-5 h-5 text-blue-500" />,
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': <FileText className="w-5 h-5 text-blue-500" />,
  'image/jpeg': <ImageIcon className="w-5 h-5 text-green-500" />,
  'image/png': <ImageIcon className="w-5 h-5 text-green-500" />,
}

// ─── Component ───────────────────────────────────────────────────────────────

export function DocumentUploader({ caseId, caseType, onUploadComplete, disabled = false }: DocumentUploaderProps) {
  const [uploading, setUploading] = useState<UploadingFile[]>([])
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const validateFile = useCallback((file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return `"${file.name}" is not a supported file type. Accepted: PDF, DOC, DOCX, JPG, PNG`
    }
    if (file.size > MAX_FILE_SIZE) {
      return `"${file.name}" is too large (${formatFileSize(file.size)}). Maximum size: 10MB`
    }
    return null
  }, [])

  const uploadFile = useCallback(async (file: File, index: number) => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('case_id', caseId)
    formData.append('case_type', caseType)

    try {
      // Simulate progress steps since fetch does not expose upload progress
      setUploading(prev => prev.map((f, i) => i === index ? { ...f, progress: 30 } : f))

      const res = await fetch('/api/client/documents', {
        method: 'POST',
        body: formData,
      })

      setUploading(prev => prev.map((f, i) => i === index ? { ...f, progress: 90 } : f))

      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.error?.message || 'Upload failed')
      }

      setUploading(prev => prev.map((f, i) => i === index ? { ...f, progress: 100, done: true } : f))

      // If all uploads complete, notify parent
      setTimeout(() => {
        setUploading(prev => {
          const remaining = prev.filter(f => !f.done && !f.error)
          if (remaining.length === 0) {
            onUploadComplete()
          }
          return prev
        })
      }, 800)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Upload failed'
      setUploading(prev => prev.map((f, i) => i === index ? { ...f, error: message, progress: 0 } : f))
    }
  }, [caseId, caseType, onUploadComplete])

  const processFiles = useCallback((files: FileList | File[]) => {
    const fileArray = Array.from(files)
    const newUploads: UploadingFile[] = []

    for (const file of fileArray) {
      const error = validateFile(file)
      newUploads.push({ file, progress: 0, error: error || undefined })
    }

    setUploading(prev => [...prev, ...newUploads])

    // Start uploading valid files
    const startIndex = uploading.length
    newUploads.forEach((upload, i) => {
      if (!upload.error) {
        uploadFile(upload.file, startIndex + i)
      }
    })
  }, [validateFile, uploadFile, uploading.length])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    if (disabled) return
    if (e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files)
    }
  }, [disabled, processFiles])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    if (!disabled) setIsDragOver(true)
  }, [disabled])

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false)
  }, [])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files)
      e.target.value = '' // Reset input
    }
  }, [processFiles])

  const removeUpload = useCallback((index: number) => {
    setUploading(prev => prev.filter((_, i) => i !== index))
  }, [])

  const hasActiveUploads = uploading.some(f => !f.done && !f.error)

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => !disabled && fileInputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click() }}
        aria-label="Upload documents"
        className={`
          relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer
          transition-all duration-200
          ${disabled
            ? 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-60 dark:border-gray-700 dark:bg-gray-800'
            : isDragOver
              ? 'border-blue-400 bg-blue-50 dark:border-blue-500 dark:bg-blue-900/20'
              : 'border-gray-300 bg-white hover:border-blue-300 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:hover:border-blue-500 dark:hover:bg-gray-800/80'
          }
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={ALLOWED_EXTENSIONS}
          onChange={handleFileSelect}
          className="hidden"
          disabled={disabled}
          aria-hidden="true"
        />

        <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 ${
          isDragOver ? 'bg-blue-100 dark:bg-blue-900/30' : 'bg-gray-100 dark:bg-gray-700'
        }`}>
          <Upload className={`w-6 h-6 ${isDragOver ? 'text-blue-500' : 'text-gray-400 dark:text-gray-500'}`} />
        </div>

        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {isDragOver ? 'Drop files here' : 'Drag & drop files here'}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          or <span className="text-blue-600 dark:text-blue-400 underline">browse files</span>
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
          PDF, DOC, DOCX, JPG, PNG &mdash; Max 10MB per file
        </p>
      </div>

      {/* Upload progress list */}
      {uploading.length > 0 && (
        <div className="space-y-2">
          {uploading.map((upload, index) => (
            <div
              key={`${upload.file.name}-${index}`}
              className="flex items-center gap-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3"
            >
              {/* File icon */}
              <div className="flex-shrink-0">
                {FILE_TYPE_ICONS[upload.file.type] || <FileText className="w-5 h-5 text-gray-400" />}
              </div>

              {/* File info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                  {upload.file.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {formatFileSize(upload.file.size)}
                </p>

                {/* Progress bar */}
                {!upload.error && !upload.done && (
                  <div className="mt-1.5 h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full transition-all duration-300"
                      style={{ width: `${upload.progress}%` }}
                    />
                  </div>
                )}
              </div>

              {/* Status icon */}
              <div className="flex-shrink-0">
                {upload.error ? (
                  <div className="flex items-center gap-1">
                    <AlertCircle className="w-4 h-4 text-red-500" />
                    <button
                      onClick={(e) => { e.stopPropagation(); removeUpload(index) }}
                      className="p-0.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      aria-label="Remove"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : upload.done ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                )}
              </div>
            </div>
          ))}

          {/* Error messages */}
          {uploading.filter(u => u.error).map((upload, i) => (
            <p key={`error-${i}`} className="text-xs text-red-600 dark:text-red-400 pl-1">
              {upload.error}
            </p>
          ))}

          {/* Clear completed */}
          {!hasActiveUploads && uploading.length > 0 && (
            <button
              onClick={() => setUploading([])}
              className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 underline"
            >
              Clear upload history
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export default DocumentUploader
