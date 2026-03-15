'use client'

import { useCallback, useState } from 'react'
import { Upload, X, Image as ImageIcon, Video, AlertCircle } from 'lucide-react'
import { clsx } from 'clsx'
import { validateFile, formatFileSize } from '@/lib/storage'
import {
  ALLOWED_IMAGE_TYPES,
  ALLOWED_VIDEO_TYPES,
  MAX_IMAGE_SIZE,
  MAX_VIDEO_SIZE,
} from '@/types/portfolio'

export interface FileDropzoneProps {
  accept?: 'image' | 'video' | 'both'
  maxFiles?: number
  onFilesSelected: (files: File[]) => void
  onError?: (error: string) => void
  disabled?: boolean
  className?: string
}

export default function FileDropzone({
  accept = 'image',
  maxFiles = 10,
  onFilesSelected,
  onError,
  disabled = false,
  className,
}: FileDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const acceptedTypes =
    accept === 'both'
      ? [...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES]
      : accept === 'video'
        ? ALLOWED_VIDEO_TYPES
        : ALLOWED_IMAGE_TYPES

  const maxSize = accept === 'video' ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE

  const handleFiles = useCallback(
    (files: FileList | File[]) => {
      setError(null)
      const fileArray = Array.from(files)

      if (fileArray.length > maxFiles) {
        const errorMsg = `Maximum ${maxFiles} files allowed`
        setError(errorMsg)
        onError?.(errorMsg)
        return
      }

      const validFiles: File[] = []
      const errors: string[] = []

      for (const file of fileArray) {
        const fileType = file.type.startsWith('video/') ? 'video' : 'image'
        const validation = validateFile(file, fileType)

        if (validation.valid) {
          validFiles.push(file)
        } else {
          errors.push(`${file.name}: ${validation.error}`)
        }
      }

      if (errors.length > 0) {
        const errorMsg = errors.join('\n')
        setError(errorMsg)
        onError?.(errorMsg)
      }

      if (validFiles.length > 0) {
        onFilesSelected(validFiles)
      }
    },
    [maxFiles, onFilesSelected, onError]
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragging(false)

      if (disabled) return

      const { files } = e.dataTransfer
      if (files && files.length > 0) {
        handleFiles(files)
      }
    },
    [disabled, handleFiles]
  )

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const { files } = e.target
      if (files && files.length > 0) {
        handleFiles(files)
      }
      // Reset input to allow selecting the same file again
      e.target.value = ''
    },
    [handleFiles]
  )

  const Icon = accept === 'video' ? Video : accept === 'both' ? Upload : ImageIcon

  return (
    <div className={className}>
      <label
        className={clsx(
          'relative flex flex-col items-center justify-center w-full min-h-[200px] p-6',
          'border-2 border-dashed rounded-2xl cursor-pointer',
          'transition-all duration-300',
          disabled && 'opacity-50 cursor-not-allowed',
          isDragging
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          type="file"
          className="sr-only"
          accept={acceptedTypes.join(',')}
          multiple={maxFiles > 1}
          onChange={handleInputChange}
          disabled={disabled}
        />

        <div
          className={clsx(
            'flex flex-col items-center gap-4 text-center',
            isDragging && 'scale-105 transition-transform'
          )}
        >
          <div
            className={clsx(
              'w-16 h-16 rounded-2xl flex items-center justify-center',
              isDragging ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'
            )}
          >
            <Icon className="w-8 h-8" />
          </div>

          <div>
            <p className="text-base font-medium text-gray-700">
              {isDragging ? (
                'Drop your files here'
              ) : (
                <>
                  <span className="text-blue-600">Click to browse</span> or drag and drop
                </>
              )}
            </p>
            <p className="mt-1 text-sm text-gray-500">
              {accept === 'video'
                ? 'MP4, WebM'
                : accept === 'both'
                  ? 'JPG, PNG, WebP, GIF, MP4, WebM'
                  : 'JPG, PNG, WebP, GIF'}
              {' • '}
              Max {formatFileSize(maxSize)}
              {maxFiles > 1 && ` • ${maxFiles} files max`}
            </p>
          </div>
        </div>
      </label>

      {error && (
        <div className="mt-3 flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <p className="whitespace-pre-line">{error}</p>
          <button
            type="button"
            onClick={() => setError(null)}
            className="ml-auto p-1 hover:bg-red-100 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  )
}
