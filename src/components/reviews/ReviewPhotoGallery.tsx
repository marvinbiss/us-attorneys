'use client'

import { useState } from 'react'
import Image from 'next/image'
import { X, ChevronLeft, ChevronRight, Play, Maximize2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MediaItem {
  id: string
  url: string
  thumbnailUrl?: string
  type: 'photo' | 'video'
  caption?: string
}

interface ReviewPhotoGalleryProps {
  media: MediaItem[]
  showCaptions?: boolean
  maxDisplay?: number
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function ReviewPhotoGallery({
  media,
  showCaptions = true,
  maxDisplay = 4,
  size = 'md',
  className,
}: ReviewPhotoGalleryProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)

  if (media.length === 0) return null

  const displayMedia = media.slice(0, maxDisplay)
  const remainingCount = media.length - maxDisplay

  const sizeConfig = {
    sm: { grid: 'grid-cols-4 gap-1', thumb: 'h-16' },
    md: { grid: 'grid-cols-3 gap-2', thumb: 'h-24' },
    lg: { grid: 'grid-cols-2 gap-3', thumb: 'h-32' },
  }

  const config = sizeConfig[size]

  const openLightbox = (index: number) => {
    setCurrentIndex(index)
    setLightboxOpen(true)
    document.body.style.overflow = 'hidden'
  }

  const closeLightbox = () => {
    setLightboxOpen(false)
    document.body.style.overflow = ''
  }

  const navigate = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      setCurrentIndex((prev) => (prev > 0 ? prev - 1 : media.length - 1))
    } else {
      setCurrentIndex((prev) => (prev < media.length - 1 ? prev + 1 : 0))
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') closeLightbox()
    if (e.key === 'ArrowLeft') navigate('prev')
    if (e.key === 'ArrowRight') navigate('next')
  }

  return (
    <>
      {/* Thumbnail grid */}
      <div className={cn('grid', config.grid, className)}>
        {displayMedia.map((item, index) => (
          <button
            key={item.id}
            onClick={() => openLightbox(index)}
            className={cn(
              'relative rounded-lg overflow-hidden group',
              config.thumb
            )}
          >
            {item.type === 'photo' ? (
              <Image
                src={item.thumbnailUrl || item.url}
                alt={item.caption || `Photo d'avis client ${index + 1}`}
                className="w-full h-full object-cover"
                loading="lazy"
                width={200}
                height={200}
                sizes="(max-width: 768px) 25vw, 200px"
                unoptimized
              />
            ) : (
              <div className="w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                <Play className="w-6 h-6 text-white" />
              </div>
            )}

            {/* Overlay on hover */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
              <Maximize2 className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>

            {/* Video indicator */}
            {item.type === 'video' && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-10 h-10 bg-black/50 rounded-full flex items-center justify-center">
                  <Play className="w-5 h-5 text-white ml-0.5" />
                </div>
              </div>
            )}

            {/* Remaining count badge */}
            {index === maxDisplay - 1 && remainingCount > 0 && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <span className="text-white font-bold text-lg">+{remainingCount}</span>
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Lightbox */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-50 bg-black flex flex-col"
          onKeyDown={handleKeyDown}
          tabIndex={0}
          role="dialog"
          aria-label="Galerie photo en plein écran"
          aria-modal="true"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 text-white">
            <span className="text-sm">
              {currentIndex + 1} / {media.length}
            </span>
            <button
              onClick={closeLightbox}
              className="p-2 hover:bg-white/10 rounded-full"
              aria-label="Close gallery"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Main content */}
          <div className="flex-1 relative flex items-center justify-center">
            {/* Navigation */}
            <button
              onClick={() => navigate('prev')}
              className="absolute left-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white z-10"
              aria-label="Photo précédente"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={() => navigate('next')}
              className="absolute right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white z-10"
              aria-label="Photo suivante"
            >
              <ChevronRight className="w-6 h-6" />
            </button>

            {/* Media */}
            <div className="max-w-full max-h-full p-4">
              {media[currentIndex].type === 'photo' ? (
                <Image
                  src={media[currentIndex].url}
                  alt={media[currentIndex].caption || `Photo d'avis client ${currentIndex + 1}`}
                  className="max-w-full max-h-[70vh] object-contain"
                  width={800}
                  height={600}
                  sizes="90vw"
                  priority
                  unoptimized
                />
              ) : (
                <video
                  src={media[currentIndex].url}
                  controls
                  autoPlay
                  className="max-w-full max-h-[70vh]"
                />
              )}
            </div>
          </div>

          {/* Caption */}
          {showCaptions && media[currentIndex].caption && (
            <div className="p-4 text-center text-white">
              <p className="text-sm">{media[currentIndex].caption}</p>
            </div>
          )}

          {/* Thumbnails */}
          <div className="p-4 flex justify-center gap-2 overflow-x-auto">
            {media.map((item, index) => (
              <button
                key={item.id}
                onClick={() => setCurrentIndex(index)}
                className={cn(
                  'w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-colors',
                  index === currentIndex
                    ? 'border-white'
                    : 'border-transparent opacity-50 hover:opacity-75'
                )}
              >
                <Image
                  src={item.thumbnailUrl || item.url}
                  alt={`Miniature photo ${index + 1}`}
                  className="w-full h-full object-cover"
                  width={64}
                  height={64}
                  sizes="64px"
                  unoptimized
                />
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  )
}

export default ReviewPhotoGallery
