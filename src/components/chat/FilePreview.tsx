'use client'

import { useState } from 'react'
import {
  FileText,
  FileImage,
  FileVideo,
  FileAudio,
  File,
  Download,
  X,
  ZoomIn,
  ZoomOut,
  RotateCw,
} from 'lucide-react'
import Image from 'next/image'
import { MessageAttachment } from '@/lib/realtime/chat-service'

interface FilePreviewProps {
  attachment: MessageAttachment
  onClose?: () => void
  isModal?: boolean
}

const FILE_ICONS: Record<string, React.ReactNode> = {
  'image': <FileImage className="w-8 h-8 text-blue-500" />,
  'video': <FileVideo className="w-8 h-8 text-purple-500" />,
  'audio': <FileAudio className="w-8 h-8 text-green-500" />,
  'application/pdf': <FileText className="w-8 h-8 text-red-500" />,
  'default': <File className="w-8 h-8 text-gray-500" />,
}

const getFileIcon = (mimeType: string) => {
  if (mimeType.startsWith('image/')) return FILE_ICONS['image']
  if (mimeType.startsWith('video/')) return FILE_ICONS['video']
  if (mimeType.startsWith('audio/')) return FILE_ICONS['audio']
  if (mimeType === 'application/pdf') return FILE_ICONS['application/pdf']
  return FILE_ICONS['default']
}

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function FilePreview({ attachment, onClose, isModal = false }: FilePreviewProps) {
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)

  const isImage = attachment.mime_type.startsWith('image/')
  const isVideo = attachment.mime_type.startsWith('video/')
  const isAudio = attachment.mime_type.startsWith('audio/')

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.25, 3))
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.25, 0.5))
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360)

  const handleDownload = () => {
    const link = document.createElement('a')
    link.href = attachment.file_url
    link.download = attachment.file_name
    link.click()
  }

  // Inline preview (not modal)
  if (!isModal) {
    if (isImage) {
      return (
        <div className="relative group">
          <Image
            src={attachment.thumbnail_url || attachment.file_url}
            alt={attachment.file_name}
            width={320}
            height={192}
            className="max-w-full max-h-48 rounded-lg cursor-pointer hover:opacity-90 transition-opacity object-contain"
            onClick={() => window.open(attachment.file_url, '_blank')}
            unoptimized
          />
          <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={handleDownload}
              className="p-1.5 bg-black/50 rounded-full text-white hover:bg-black/70"
              title="Download"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>
      )
    }

    if (isVideo) {
      return (
        <video
          src={attachment.file_url}
          controls
          className="max-w-full max-h-48 rounded-lg"
          poster={attachment.thumbnail_url}
        />
      )
    }

    if (isAudio) {
      return (
        <div className="flex items-center gap-3 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
          <FileAudio className="w-8 h-8 text-green-500 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <audio src={attachment.file_url} controls className="w-full h-8" />
            {attachment.transcription && (
              <p className="text-xs text-gray-500 mt-1 italic">
                "{attachment.transcription}"
              </p>
            )}
          </div>
        </div>
      )
    }

    // Generic file
    return (
      <a
        href={attachment.file_url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-3 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
      >
        {getFileIcon(attachment.mime_type)}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
            {attachment.file_name}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {formatFileSize(attachment.file_size)}
          </p>
        </div>
        <Download className="w-5 h-5 text-gray-400" />
      </a>
    )
  }

  // Full modal view
  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 text-white">
        <div className="flex-1 min-w-0">
          <h3 className="font-medium truncate">{attachment.file_name}</h3>
          <p className="text-sm text-gray-400">{formatFileSize(attachment.file_size)}</p>
        </div>

        <div className="flex items-center gap-2">
          {isImage && (
            <>
              <button
                onClick={handleZoomOut}
                className="p-2 hover:bg-white/10 rounded-full"
                title="Zoom out"
              >
                <ZoomOut className="w-5 h-5" />
              </button>
              <span className="text-sm min-w-[50px] text-center">{Math.round(zoom * 100)}%</span>
              <button
                onClick={handleZoomIn}
                className="p-2 hover:bg-white/10 rounded-full"
                title="Zoom in"
              >
                <ZoomIn className="w-5 h-5" />
              </button>
              <button
                onClick={handleRotate}
                className="p-2 hover:bg-white/10 rounded-full"
                title="Rotate"
              >
                <RotateCw className="w-5 h-5" />
              </button>
            </>
          )}
          <button
            onClick={handleDownload}
            className="p-2 hover:bg-white/10 rounded-full"
            title="Download"
          >
            <Download className="w-5 h-5" />
          </button>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center overflow-auto p-4">
        {isImage && (
          <Image
            src={attachment.file_url}
            alt={attachment.file_name}
            width={1200}
            height={900}
            style={{
              transform: `scale(${zoom}) rotate(${rotation}deg)`,
              transition: 'transform 0.2s ease-out',
            }}
            className="max-w-full max-h-full object-contain"
            unoptimized
          />
        )}

        {isVideo && (
          <video
            src={attachment.file_url}
            controls
            autoPlay
            className="max-w-full max-h-full"
          />
        )}

        {isAudio && (
          <div className="text-center">
            <FileAudio className="w-24 h-24 text-green-500 mx-auto mb-4" />
            <audio src={attachment.file_url} controls autoPlay className="w-full max-w-md" />
            {attachment.transcription && (
              <p className="text-gray-400 mt-4 max-w-md mx-auto">
                "{attachment.transcription}"
              </p>
            )}
          </div>
        )}

        {!isImage && !isVideo && !isAudio && (
          <div className="text-center text-white">
            {getFileIcon(attachment.mime_type)}
            <p className="mt-4 text-lg">{attachment.file_name}</p>
            <p className="text-gray-400">{formatFileSize(attachment.file_size)}</p>
            <button
              onClick={handleDownload}
              className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center gap-2 mx-auto"
            >
              <Download className="w-5 h-5" />
              Download
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default FilePreview
