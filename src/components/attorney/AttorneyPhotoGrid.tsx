'use client'

import { useState, useCallback } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { X, ChevronLeft, ChevronRight, Grid3X3 } from 'lucide-react'
import { Artisan } from './types'
import { BLUR_PLACEHOLDER } from '@/lib/data/images'

interface AttorneyPhotoGridProps {
  attorney: Artisan
}

// Use shared BLUR_PLACEHOLDER from images.ts
const BLUR_DATA_URL = BLUR_PLACEHOLDER

export function AttorneyPhotoGrid({ attorney }: AttorneyPhotoGridProps) {
  const reducedMotion = useReducedMotion()
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)

  // Only show real portfolio photos — no fake stock images
  const photos = attorney.portfolio && attorney.portfolio.length > 0
    ? attorney.portfolio
    : []

  const openLightbox = useCallback((index: number) => {
    setCurrentIndex(index)
    setLightboxOpen(true)
    document.body.style.overflow = 'hidden'
  }, [])

  const closeLightbox = useCallback(() => {
    setLightboxOpen(false)
    document.body.style.overflow = 'unset'
  }, [])

  const goToPrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev === 0 ? photos.length - 1 : prev - 1))
  }, [photos.length])

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev === photos.length - 1 ? 0 : prev + 1))
  }, [photos.length])

  // Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') closeLightbox()
    if (e.key === 'ArrowLeft') goToPrevious()
    if (e.key === 'ArrowRight') goToNext()
  }, [closeLightbox, goToPrevious, goToNext])

  if (photos.length === 0) return null

  // Take first 5 photos for grid display
  const gridPhotos = photos.slice(0, 5)
  const remainingCount = photos.length - 5

  return (
    <>
      {/* Airbnb-style Photo Grid */}
      <motion.div
        initial={reducedMotion ? false : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={reducedMotion ? { duration: 0 } : { duration: 0.4 }}
        className="rounded-2xl overflow-hidden cursor-pointer group"
      >
        <div className="grid grid-cols-4 grid-rows-2 gap-2 h-80 md:h-96">
          {/* Main hero image (left half) */}
          <div
            className="col-span-2 row-span-2 relative overflow-hidden"
            onClick={() => openLightbox(0)}
          >
            <Image
              src={gridPhotos[0]?.imageUrl}
              alt={gridPhotos[0]?.title || 'Main photo'}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              placeholder="blur"
              blurDataURL={BLUR_DATA_URL}
              sizes="(max-width: 768px) 50vw, 33vw"
              priority
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
          </div>

          {/* Top right images */}
          {gridPhotos[1] && (
            <div
              className="relative overflow-hidden"
              onClick={() => openLightbox(1)}
            >
              <Image
                src={gridPhotos[1].imageUrl}
                alt={gridPhotos[1].title}
                fill
                className="object-cover transition-transform duration-300 hover:scale-110"
                placeholder="blur"
                blurDataURL={BLUR_DATA_URL}
                sizes="(max-width: 768px) 25vw, 16vw"
              />
              <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors" />
            </div>
          )}

          {gridPhotos[2] && (
            <div
              className="relative overflow-hidden rounded-tr-2xl"
              onClick={() => openLightbox(2)}
            >
              <Image
                src={gridPhotos[2].imageUrl}
                alt={gridPhotos[2].title}
                fill
                className="object-cover transition-transform duration-300 hover:scale-110"
                placeholder="blur"
                blurDataURL={BLUR_DATA_URL}
                sizes="(max-width: 768px) 25vw, 16vw"
              />
              <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors" />
            </div>
          )}

          {/* Bottom right images */}
          {gridPhotos[3] && (
            <div
              className="relative overflow-hidden"
              onClick={() => openLightbox(3)}
            >
              <Image
                src={gridPhotos[3].imageUrl}
                alt={gridPhotos[3].title}
                fill
                className="object-cover transition-transform duration-300 hover:scale-110"
                placeholder="blur"
                blurDataURL={BLUR_DATA_URL}
                sizes="(max-width: 768px) 25vw, 16vw"
              />
              <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors" />
            </div>
          )}

          {gridPhotos[4] && (
            <div
              className="relative overflow-hidden rounded-br-2xl"
              onClick={() => openLightbox(4)}
            >
              <Image
                src={gridPhotos[4].imageUrl}
                alt={gridPhotos[4].title}
                fill
                className="object-cover transition-transform duration-300 hover:scale-110"
                placeholder="blur"
                blurDataURL={BLUR_DATA_URL}
                sizes="(max-width: 768px) 25vw, 16vw"
              />
              <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors" />

              {/* Show more overlay */}
              {remainingCount > 0 && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <span className="text-white font-semibold text-lg">
                    +{remainingCount}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Show all photos button */}
        <motion.button
          whileHover={reducedMotion ? undefined : { scale: 1.02 }}
          whileTap={reducedMotion ? undefined : { scale: 0.98 }}
          onClick={() => openLightbox(0)}
          className="absolute bottom-4 right-4 px-4 py-2 bg-white rounded-lg font-medium text-sm text-gray-900 shadow-lg flex items-center gap-2 hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-clay-400 focus:ring-offset-2"
          aria-label={`View all ${photos.length} photos fullscreen`}
        >
          <Grid3X3 className="w-4 h-4" aria-hidden="true" />
          View all {photos.length} photos
        </motion.button>
      </motion.div>

      {/* Lightbox Modal */}
      <AnimatePresence>
        {lightboxOpen && (
          <motion.div
            initial={reducedMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={reducedMotion ? { duration: 0 } : undefined}
            className="fixed inset-0 z-[100] bg-black flex items-center justify-center"
            onClick={closeLightbox}
            onKeyDown={handleKeyDown}
            tabIndex={0}
            role="dialog"
            aria-modal="true"
            aria-label={`Photo gallery - Image ${currentIndex + 1} of ${photos.length}`}
          >
            {/* Close button */}
            <motion.button
              initial={reducedMotion ? false : { opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={reducedMotion ? { duration: 0 } : undefined}
              className="absolute top-4 right-4 p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors z-10 focus:outline-none focus:ring-2 focus:ring-white"
              onClick={closeLightbox}
              aria-label="Close gallery"
            >
              <X className="w-6 h-6 text-white" aria-hidden="true" />
            </motion.button>

            {/* Counter */}
            <div className="absolute top-4 left-4 text-white text-sm font-medium bg-black/50 px-3 py-1.5 rounded-full" aria-live="polite">
              {currentIndex + 1} / {photos.length}
            </div>

            {/* Navigation buttons */}
            <motion.button
              initial={reducedMotion ? false : { opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={reducedMotion ? { duration: 0 } : undefined}
              className="absolute left-4 p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors z-10 focus:outline-none focus:ring-2 focus:ring-white"
              onClick={(e) => { e.stopPropagation(); goToPrevious(); }}
              aria-label="Previous photo"
            >
              <ChevronLeft className="w-8 h-8 text-white" aria-hidden="true" />
            </motion.button>

            <motion.button
              initial={reducedMotion ? false : { opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={reducedMotion ? { duration: 0 } : undefined}
              className="absolute right-4 p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors z-10 focus:outline-none focus:ring-2 focus:ring-white"
              onClick={(e) => { e.stopPropagation(); goToNext(); }}
              aria-label="Next photo"
            >
              <ChevronRight className="w-8 h-8 text-white" aria-hidden="true" />
            </motion.button>

            {/* Main image */}
            <motion.div
              key={currentIndex}
              initial={reducedMotion ? false : { opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={reducedMotion ? { duration: 0 } : { duration: 0.2 }}
              className="relative w-full h-full max-w-5xl max-h-[80vh] mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <Image
                src={photos[currentIndex].imageUrl}
                alt={photos[currentIndex].title}
                fill
                className="object-contain"
                sizes="100vw"
                priority
              />

              {/* Caption */}
              <motion.div
                initial={reducedMotion ? false : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={reducedMotion ? { duration: 0 } : undefined}
                className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent"
              >
                <h3 className="text-white font-semibold text-lg">
                  {photos[currentIndex].title}
                </h3>
                {photos[currentIndex].description && (
                  <p className="text-white/70 text-sm mt-1">
                    {photos[currentIndex].description}
                  </p>
                )}
              </motion.div>
            </motion.div>

            {/* Thumbnail strip */}
            <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 px-4 overflow-x-auto py-2">
              {photos.map((photo, index) => (
                <motion.button
                  key={photo.id}
                  whileHover={reducedMotion ? undefined : { scale: 1.1 }}
                  whileTap={reducedMotion ? undefined : { scale: 0.95 }}
                  className={`relative flex-shrink-0 w-16 h-12 rounded-lg overflow-hidden transition-all ${
                    index === currentIndex
                      ? 'ring-2 ring-white opacity-100'
                      : 'opacity-50 hover:opacity-75'
                  }`}
                  onClick={(e) => { e.stopPropagation(); setCurrentIndex(index); }}
                >
                  <Image
                    src={photo.imageUrl}
                    alt={photo.title}
                    fill
                    className="object-cover"
                    sizes="64px"
                  />
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
