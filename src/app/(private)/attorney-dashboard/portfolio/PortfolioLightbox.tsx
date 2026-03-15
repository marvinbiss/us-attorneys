'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { BeforeAfterSlider, VideoPlayer } from '@/components/portfolio'
import type { PortfolioItem } from '@/types/portfolio'

interface PortfolioLightboxProps {
  items: PortfolioItem[]
  initialIndex: number
  onClose: () => void
}

export default function PortfolioLightbox({
  items,
  initialIndex,
  onClose,
}: PortfolioLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)
  const currentItem = items[currentIndex]

  const goToPrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : items.length - 1))
  }, [items.length])

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev < items.length - 1 ? prev + 1 : 0))
  }, [items.length])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      } else if (e.key === 'ArrowLeft') {
        goToPrevious()
      } else if (e.key === 'ArrowRight') {
        goToNext()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [onClose, goToPrevious, goToNext])

  if (!currentItem) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-black/95 flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 text-white">
          <div>
            <h3 className="font-semibold text-lg">{currentItem.title}</h3>
            {currentItem.category && (
              <p className="text-white/70 text-sm capitalize">{currentItem.category}</p>
            )}
          </div>
          <div className="flex items-center gap-4">
            <span className="text-white/70">
              {currentIndex + 1} / {items.length}
            </span>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              aria-label="Fermer"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 flex items-center justify-center p-4 relative">
          {/* Previous button */}
          {items.length > 1 && (
            <button
              onClick={goToPrevious}
              className="absolute left-4 z-10 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
              aria-label="Précédent"
            >
              <ChevronLeft className="w-6 h-6 text-white" />
            </button>
          )}

          {/* Content */}
          <motion.div
            key={currentItem.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="w-full max-w-5xl max-h-[70vh]"
          >
            {currentItem.media_type === 'before_after' &&
            currentItem.before_image_url &&
            currentItem.after_image_url ? (
              <BeforeAfterSlider
                beforeImage={currentItem.before_image_url}
                afterImage={currentItem.after_image_url}
                className="max-h-[70vh]"
              />
            ) : currentItem.media_type === 'video' && currentItem.video_url ? (
              <VideoPlayer
                src={currentItem.video_url}
                poster={currentItem.thumbnail_url || undefined}
                className="max-h-[70vh] aspect-video"
              />
            ) : (
              <div className="relative w-full h-[70vh]">
                <Image
                  src={currentItem.image_url}
                  alt={currentItem.title}
                  fill
                  className="object-contain"
                  sizes="100vw"
                  priority
                />
              </div>
            )}
          </motion.div>

          {/* Next button */}
          {items.length > 1 && (
            <button
              onClick={goToNext}
              className="absolute right-4 z-10 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
              aria-label="Suivant"
            >
              <ChevronRight className="w-6 h-6 text-white" />
            </button>
          )}
        </div>

        {/* Description */}
        {currentItem.description && (
          <div className="p-4 text-center">
            <p className="text-white/80 max-w-2xl mx-auto">{currentItem.description}</p>
          </div>
        )}

        {/* Thumbnails */}
        {items.length > 1 && (
          <div className="p-4 flex justify-center gap-2 overflow-x-auto">
            {items.map((item, index) => (
              <button
                key={item.id}
                onClick={() => setCurrentIndex(index)}
                className={`relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-colors ${
                  index === currentIndex
                    ? 'border-white'
                    : 'border-transparent opacity-50 hover:opacity-100'
                }`}
              >
                <Image
                  src={
                    item.thumbnail_url ||
                    item.image_url ||
                    item.after_image_url ||
                    ''
                  }
                  alt={item.title}
                  fill
                  className="object-cover"
                  sizes="64px"
                />
              </button>
            ))}
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  )
}
