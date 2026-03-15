'use client'

import { X, Check, AlertCircle, Loader2, Image as ImageIcon, Video } from 'lucide-react'
import { clsx } from 'clsx'
import { formatFileSize } from '@/lib/storage'
import Image from 'next/image'
import type { UploadProgress as UploadProgressType } from '@/types/portfolio'

export interface UploadProgressProps {
  uploads: UploadProgressType[]
  onRemove?: (fileName: string) => void
}

export default function UploadProgress({ uploads, onRemove }: UploadProgressProps) {
  if (uploads.length === 0) return null

  return (
    <div className="space-y-3">
      {uploads.map((upload) => (
        <UploadItem key={upload.fileName} upload={upload} onRemove={onRemove} />
      ))}
    </div>
  )
}

interface UploadItemProps {
  upload: UploadProgressType
  onRemove?: (fileName: string) => void
}

function UploadItem({ upload, onRemove }: UploadItemProps) {
  const { fileName, progress, status, error } = upload
  const isVideo = fileName.match(/\.(mp4|webm|mov)$/i)

  const statusConfig = {
    pending: {
      icon: <Loader2 className="w-4 h-4 animate-spin text-gray-400" />,
      text: 'Pending...',
      color: 'text-gray-500',
      bgColor: 'bg-gray-100',
    },
    uploading: {
      icon: <Loader2 className="w-4 h-4 animate-spin text-blue-500" />,
      text: `${progress}%`,
      color: 'text-blue-600',
      bgColor: 'bg-blue-500',
    },
    processing: {
      icon: <Loader2 className="w-4 h-4 animate-spin text-amber-500" />,
      text: 'Processing...',
      color: 'text-amber-600',
      bgColor: 'bg-amber-500',
    },
    complete: {
      icon: <Check className="w-4 h-4 text-green-500" />,
      text: 'Complete',
      color: 'text-green-600',
      bgColor: 'bg-green-500',
    },
    error: {
      icon: <AlertCircle className="w-4 h-4 text-red-500" />,
      text: error || 'Error',
      color: 'text-red-600',
      bgColor: 'bg-red-500',
    },
  }

  const config = statusConfig[status]

  return (
    <div
      className={clsx(
        'flex items-center gap-3 p-3 rounded-xl border',
        status === 'error' ? 'bg-red-50 border-red-200' : 'bg-white border-gray-200'
      )}
    >
      {/* File icon */}
      <div
        className={clsx(
          'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0',
          status === 'error' ? 'bg-red-100' : 'bg-gray-100'
        )}
      >
        {isVideo ? (
          <Video className="w-5 h-5 text-gray-500" />
        ) : (
          <ImageIcon className="w-5 h-5 text-gray-500" />
        )}
      </div>

      {/* File info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{fileName}</p>
        <div className="flex items-center gap-2 mt-1">
          {config.icon}
          <span className={clsx('text-xs', config.color)}>{config.text}</span>
        </div>

        {/* Progress bar */}
        {(status === 'uploading' || status === 'processing') && (
          <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={clsx(
                'h-full rounded-full transition-all duration-300',
                config.bgColor
              )}
              style={{ width: `${status === 'processing' ? 100 : progress}%` }}
            />
          </div>
        )}
      </div>

      {/* Remove button */}
      {onRemove && status !== 'uploading' && (
        <button
          type="button"
          onClick={() => onRemove(fileName)}
          className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="Remove"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  )
}

// Preview component for successfully uploaded files
export interface FilePreviewProps {
  files: Array<{
    url: string
    thumbnailUrl?: string
    fileName: string
    fileSize: number
    mimeType: string
  }>
  onRemove?: (url: string) => void
}

export function FilePreview({ files, onRemove }: FilePreviewProps) {
  if (files.length === 0) return null

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
      {files.map((file) => {
        const isVideo = file.mimeType.startsWith('video/')

        return (
          <div key={file.url} className="relative group aspect-square">
            <div className="absolute inset-0 rounded-xl overflow-hidden bg-gray-100">
              {isVideo ? (
                <video
                  src={file.url}
                  className="w-full h-full object-cover"
                  muted
                  playsInline
                />
              ) : (
                <Image
                  src={file.thumbnailUrl || file.url}
                  alt={file.fileName}
                  fill
                  className="object-cover"
                  unoptimized
                />
              )}
            </div>

            {/* Overlay */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors rounded-xl" />

            {/* Remove button */}
            {onRemove && (
              <button
                type="button"
                onClick={() => onRemove(file.url)}
                className="absolute top-2 right-2 p-1.5 bg-white/90 hover:bg-white text-gray-700 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                aria-label="Remove"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            {/* Video indicator */}
            {isVideo && (
              <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/70 text-white text-xs rounded-md flex items-center gap-1">
                <Video className="w-3 h-3" />
                Video
              </div>
            )}

            {/* File size */}
            <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/70 text-white text-xs rounded-md">
              {formatFileSize(file.fileSize)}
            </div>
          </div>
        )
      })}
    </div>
  )
}
