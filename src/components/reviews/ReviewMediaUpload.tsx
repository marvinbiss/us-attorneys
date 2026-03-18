'use client'

import { useState, useRef } from 'react'
import { Camera, Video, X, Upload, Loader2, Image as ImageIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import Image from 'next/image'

interface ReviewMediaUploadProps {
  onUpload: (files: UploadedMedia[]) => void
  maxFiles?: number
  maxFileSize?: number // in MB
  acceptedTypes?: ('image' | 'video')[]
  className?: string
}

export interface UploadedMedia {
  id: string
  url: string
  thumbnailUrl?: string
  type: 'photo' | 'video'
  fileName: string
  fileSize: number
  caption?: string
}

const MAX_IMAGE_SIZE = 5 * 1024 * 1024 // 5MB
const MAX_VIDEO_SIZE = 50 * 1024 * 1024 // 50MB

export function ReviewMediaUpload({
  onUpload,
  maxFiles = 5,
  acceptedTypes = ['image', 'video'],
  className,
}: ReviewMediaUploadProps) {
  const [files, setFiles] = useState<UploadedMedia[]>([])
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const acceptString = [
    ...(acceptedTypes.includes('image') ? ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] : []),
    ...(acceptedTypes.includes('video') ? ['video/mp4', 'video/webm', 'video/quicktime'] : []),
  ].join(',')

  const handleFileSelect = async (selectedFiles: FileList | null) => {
    if (!selectedFiles || selectedFiles.length === 0) return

    setError(null)
    const newFiles: File[] = []

    // Validate files
    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i]

      // Check max files
      if (files.length + newFiles.length >= maxFiles) {
        setError(`Maximum ${maxFiles} files allowed`)
        break
      }

      // Check file type
      const isImage = file.type.startsWith('image/')
      const isVideo = file.type.startsWith('video/')

      if (!isImage && !isVideo) {
        setError('Unsupported file type')
        continue
      }

      if (isImage && !acceptedTypes.includes('image')) {
        setError('Images are not accepted')
        continue
      }

      if (isVideo && !acceptedTypes.includes('video')) {
        setError('Videos are not accepted')
        continue
      }

      // Check file size
      const maxSize = isVideo ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE
      if (file.size > maxSize) {
        setError(`File too large (max ${isVideo ? '50' : '5'}MB)`)
        continue
      }

      newFiles.push(file)
    }

    if (newFiles.length === 0) return

    // Upload files
    setUploading(true)
    try {
      const uploadedFiles: UploadedMedia[] = []

      for (const file of newFiles) {
        const formData = new FormData()
        formData.append('file', file)

        // For demo, create local URL. In production, upload to server
        const url = URL.createObjectURL(file)
        const isVideo = file.type.startsWith('video/')

        uploadedFiles.push({
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          url,
          type: isVideo ? 'video' : 'photo',
          fileName: file.name,
          fileSize: file.size,
        })
      }

      const updatedFiles = [...files, ...uploadedFiles]
      setFiles(updatedFiles)
      onUpload(updatedFiles)
    } catch (_err: unknown) {
      setError('Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    handleFileSelect(e.dataTransfer.files)
  }

  const removeFile = (id: string) => {
    const updatedFiles = files.filter((f) => f.id !== id)
    setFiles(updatedFiles)
    onUpload(updatedFiles)
  }

  const updateCaption = (id: string, caption: string) => {
    const updatedFiles = files.map((f) =>
      f.id === id ? { ...f, caption } : f
    )
    setFiles(updatedFiles)
    onUpload(updatedFiles)
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Upload area */}
      <div
        className={cn(
          'relative border-2 border-dashed rounded-lg p-6 text-center transition-colors',
          dragActive
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400',
          files.length >= maxFiles && 'opacity-50 pointer-events-none'
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptString}
          multiple
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
        />

        {uploading ? (
          <div className="flex flex-col items-center">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-2" />
            <p className="text-sm text-gray-600 dark:text-gray-400">Uploading...</p>
          </div>
        ) : (
          <>
            <div className="flex justify-center gap-2 mb-3">
              {acceptedTypes.includes('image') && (
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                  <Camera className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
              )}
              {acceptedTypes.includes('video') && (
                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-full">
                  <Video className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
              )}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              Drag and drop your files here or
            </p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Upload className="w-4 h-4" />
              Browse
            </button>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
              {acceptedTypes.includes('image') && 'Images: JPG, PNG, WebP (max 5MB)'}
              {acceptedTypes.includes('image') && acceptedTypes.includes('video') && ' • '}
              {acceptedTypes.includes('video') && 'Videos: MP4, WebM (max 50MB)'}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500">
              Maximum {maxFiles} files
            </p>
          </>
        )}
      </div>

      {/* Error message */}
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      {/* File previews */}
      {files.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {files.map((file) => (
            <div
              key={file.id}
              className="relative group rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800"
            >
              {/* Preview */}
              {file.type === 'photo' ? (
                <Image
                  src={file.url}
                  alt={file.fileName}
                  width={200}
                  height={128}
                  sizes="200px"
                  className="w-full h-32 object-cover"
                  loading="lazy"
                  unoptimized
                />
              ) : (
                <div className="w-full h-32 flex items-center justify-center bg-gray-200 dark:bg-gray-700">
                  <Video className="w-8 h-8 text-gray-400" />
                </div>
              )}

              {/* Remove button */}
              <button
                onClick={() => removeFile(file.id)}
                className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Type indicator */}
              <div className="absolute bottom-2 left-2">
                {file.type === 'photo' ? (
                  <ImageIcon className="w-4 h-4 text-white drop-shadow" />
                ) : (
                  <Video className="w-4 h-4 text-white drop-shadow" />
                )}
              </div>

              {/* Caption input */}
              <input
                type="text"
                placeholder="Add a caption..."
                value={file.caption || ''}
                onChange={(e) => updateCaption(file.id, e.target.value)}
                className="absolute bottom-0 left-0 right-0 px-2 py-1 text-xs bg-black/50 text-white placeholder-gray-300 border-none focus:outline-none focus:ring-0"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default ReviewMediaUpload
