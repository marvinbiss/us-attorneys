'use client'

import { useState, useCallback, useEffect } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ChevronLeft, ChevronRight, Camera, ZoomIn, Play, Layers } from 'lucide-react'
import { Artisan, PortfolioItem } from './types'
import { BeforeAfterSlider, VideoPlayer } from '@/components/portfolio'

interface AttorneyGalleryProps {
  artisan: Artisan
}

export function AttorneyGallery({ artisan }: AttorneyGalleryProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)

  // Only show if artisan has real portfolio items
  const photos = artisan.portfolio || []

  if (photos.length === 0) {
    return null
  }

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
  useEffect(() => {
    if (!lightboxOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeLightbox()
      if (e.key === 'ArrowLeft') goToPrevious()
      if (e.key === 'ArrowRight') goToNext()
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [lightboxOpen, closeLightbox, goToPrevious, goToNext])

  const currentPhoto = photos[currentIndex]

  // Get thumbnail URL for display
  const getThumbnail = (photo: PortfolioItem) => {
    return photo.thumbnailUrl || photo.imageUrl || photo.afterImageUrl || ''
  }

  // Count different media types
  const stats = {
    images: photos.filter(p => !p.mediaType || p.mediaType === 'image').length,
    videos: photos.filter(p => p.mediaType === 'video').length,
    beforeAfter: photos.filter(p => p.mediaType === 'before_after').length,
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.25 }}
        className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6"
      >
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Camera className="w-5 h-5 text-clay-400" />
          Réalisations ({photos.length})
          {stats.videos > 0 && (
            <span className="ml-2 text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
              {stats.videos} vidéo{stats.videos > 1 ? 's' : ''}
            </span>
          )}
          {stats.beforeAfter > 0 && (
            <span className="ml-1 text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
              {stats.beforeAfter} avant/après
            </span>
          )}
        </h2>

        {/* Airbnb-style photo grid */}
        <div className="grid grid-cols-4 grid-rows-2 gap-2 h-80 rounded-xl overflow-hidden">
          {/* Main hero image */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="col-span-2 row-span-2 relative cursor-pointer group"
            onClick={() => openLightbox(0)}
          >
            <Image
              src={getThumbnail(photos[0])}
              alt={photos[0].title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 50vw, 40vw"
              unoptimized
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
              {photos[0].mediaType === 'video' ? (
                <div className="w-16 h-16 rounded-full bg-black/60 flex items-center justify-center">
                  <Play className="w-8 h-8 text-white ml-1" fill="currentColor" />
                </div>
              ) : photos[0].mediaType === 'before_after' ? (
                <div className="px-4 py-2 bg-black/60 rounded-lg flex items-center gap-2">
                  <Layers className="w-5 h-5 text-white" />
                  <span className="text-white font-medium">Avant/Après</span>
                </div>
              ) : (
                <ZoomIn className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
              )}
            </div>
          </motion.div>

          {/* Secondary images */}
          {photos.slice(1, 5).map((photo, index) => (
            <motion.div
              key={photo.id}
              whileHover={{ scale: 1.05 }}
              className="relative cursor-pointer group overflow-hidden"
              onClick={() => openLightbox(index + 1)}
            >
              <Image
                src={getThumbnail(photo)}
                alt={photo.title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 25vw, 20vw"
                unoptimized
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                {photo.mediaType === 'video' ? (
                  <Play className="w-6 h-6 text-white" fill="currentColor" />
                ) : photo.mediaType === 'before_after' ? (
                  <Layers className="w-6 h-6 text-white" />
                ) : (
                  <ZoomIn className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                )}
              </div>

              {/* Show more overlay on last visible image */}
              {index === 3 && photos.length > 5 && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <span className="text-white font-semibold text-lg">
                    +{photos.length - 5}
                  </span>
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {/* View all button */}
        {photos.length > 5 && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => openLightbox(0)}
            className="mt-4 w-full py-3 px-4 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
          >
            <Camera className="w-5 h-5" />
            Voir toutes les réalisations
          </motion.button>
        )}
      </motion.div>

      {/* Lightbox Modal */}
      <AnimatePresence>
        {lightboxOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 flex flex-col"
            onClick={closeLightbox}
            role="dialog"
            aria-label="Galerie de réalisations en plein écran"
            aria-modal="true"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 text-white">
              <div>
                <h3 className="font-semibold text-lg">{currentPhoto.title}</h3>
                {currentPhoto.category && (
                  <span className="text-white/70 text-sm">{currentPhoto.category}</span>
                )}
              </div>
              <div className="flex items-center gap-4">
                <span className="text-white/70">
                  {currentIndex + 1} / {photos.length}
                </span>
                <button
                  className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                  onClick={closeLightbox}
                  aria-label="Fermer la galerie"
                >
                  <X className="w-6 h-6 text-white" />
                </button>
              </div>
            </div>

            {/* Main content */}
            <div className="flex-1 flex items-center justify-center p-4 relative">
              {/* Previous button */}
              <motion.button
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="absolute left-4 p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors z-10"
                onClick={(e) => { e.stopPropagation(); goToPrevious(); }}
                aria-label="Photo précédente"
              >
                <ChevronLeft className="w-8 h-8 text-white" />
              </motion.button>

              {/* Next button */}
              <motion.button
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="absolute right-4 p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors z-10"
                onClick={(e) => { e.stopPropagation(); goToNext(); }}
                aria-label="Photo suivante"
              >
                <ChevronRight className="w-8 h-8 text-white" />
              </motion.button>

              {/* Media content */}
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
                className="max-w-5xl w-full max-h-[70vh]"
                onClick={(e) => e.stopPropagation()}
              >
                {currentPhoto.mediaType === 'before_after' &&
                currentPhoto.beforeImageUrl &&
                currentPhoto.afterImageUrl ? (
                  <BeforeAfterSlider
                    beforeImage={currentPhoto.beforeImageUrl}
                    afterImage={currentPhoto.afterImageUrl}
                    className="max-h-[70vh]"
                  />
                ) : currentPhoto.mediaType === 'video' && currentPhoto.videoUrl ? (
                  <VideoPlayer
                    src={currentPhoto.videoUrl}
                    poster={currentPhoto.thumbnailUrl}
                    className="max-h-[70vh] aspect-video mx-auto"
                  />
                ) : (
                  <Image
                    src={currentPhoto.imageUrl ?? ''}
                    alt={currentPhoto.title}
                    width={1200}
                    height={800}
                    className="max-w-full max-h-[70vh] object-contain rounded-lg mx-auto"
                    unoptimized
                  />
                )}
              </motion.div>
            </div>

            {/* Description */}
            {currentPhoto.description && (
              <div className="p-4 text-center">
                <p className="text-white/80 max-w-2xl mx-auto">{currentPhoto.description}</p>
              </div>
            )}

            {/* Thumbnail strip */}
            <div className="p-4 flex justify-center gap-2 overflow-x-auto">
              {photos.map((photo, index) => (
                <motion.button
                  key={photo.id}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  className={`flex-shrink-0 w-16 h-12 rounded-lg overflow-hidden transition-all relative ${
                    index === currentIndex
                      ? 'ring-2 ring-white opacity-100'
                      : 'opacity-50 hover:opacity-75'
                  }`}
                  onClick={(e) => { e.stopPropagation(); setCurrentIndex(index); }}
                >
                  <Image
                    src={getThumbnail(photo)}
                    alt={photo.title}
                    fill
                    className="object-cover"
                    sizes="64px"
                    unoptimized
                  />
                  {photo.mediaType === 'video' && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                      <Play className="w-4 h-4 text-white" fill="currentColor" />
                    </div>
                  )}
                  {photo.mediaType === 'before_after' && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                      <Layers className="w-4 h-4 text-white" />
                    </div>
                  )}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
