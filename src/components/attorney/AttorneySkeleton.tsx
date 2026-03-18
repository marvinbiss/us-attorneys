'use client'

import { motion } from 'framer-motion'
import { useReducedMotion } from '@/hooks/useReducedMotion'

// Shimmer animation component
function Shimmer({ className }: { className?: string }) {
  const reducedMotion = useReducedMotion()
  return (
    <div className={`relative overflow-hidden bg-gray-200 ${className}`}>
      <motion.div
        className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/60 to-transparent"
        animate={reducedMotion ? undefined : { translateX: ['100%', '-100%'] }}
        transition={reducedMotion ? { duration: 0 } : { duration: 1.5, repeat: Infinity, ease: 'linear' }}
      />
    </div>
  )
}

export function AttorneyPageSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 pb-24 md:pb-8">
      {/* Header skeleton */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Shimmer className="w-20 h-6 rounded" />
            <div className="flex gap-3">
              <Shimmer className="w-10 h-10 rounded-full" />
              <Shimmer className="w-10 h-10 rounded-full" />
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Breadcrumb skeleton */}
        <div className="mb-6 flex gap-2">
          <Shimmer className="w-16 h-4 rounded" />
          <Shimmer className="w-24 h-4 rounded" />
          <Shimmer className="w-20 h-4 rounded" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Photo Grid Skeleton */}
            <AttorneyPhotoGridSkeleton />

            {/* Hero Skeleton */}
            <AttorneyHeroSkeleton />

            {/* Stats Skeleton */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="text-center p-4">
                    <Shimmer className="w-12 h-12 rounded-full mx-auto mb-2" />
                    <Shimmer className="w-16 h-6 rounded mx-auto mb-1" />
                    <Shimmer className="w-20 h-4 rounded mx-auto" />
                  </div>
                ))}
              </div>
            </div>

            {/* About Skeleton */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <Shimmer className="w-32 h-6 rounded mb-4" />
              <Shimmer className="w-full h-4 rounded mb-2" />
              <Shimmer className="w-full h-4 rounded mb-2" />
              <Shimmer className="w-3/4 h-4 rounded" />
            </div>

            {/* Services Skeleton */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <Shimmer className="w-40 h-6 rounded mb-4" />
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex justify-between items-center p-4 rounded-xl bg-gray-50">
                    <div className="flex-1">
                      <Shimmer className="w-32 h-5 rounded mb-2" />
                      <Shimmer className="w-48 h-4 rounded" />
                    </div>
                    <Shimmer className="w-20 h-6 rounded" />
                  </div>
                ))}
              </div>
            </div>

            {/* Reviews Skeleton */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <Shimmer className="w-36 h-6 rounded mb-6" />
              <div className="flex gap-8 mb-8">
                <div>
                  <Shimmer className="w-20 h-12 rounded mb-2" />
                  <Shimmer className="w-24 h-4 rounded" />
                </div>
                <div className="flex-1 space-y-2">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="flex items-center gap-3">
                      <Shimmer className="w-6 h-4 rounded" />
                      <Shimmer className="flex-1 h-2 rounded-full" />
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="pb-6 border-b border-gray-100">
                    <div className="flex items-center gap-3 mb-3">
                      <Shimmer className="w-10 h-10 rounded-full" />
                      <div>
                        <Shimmer className="w-24 h-4 rounded mb-1" />
                        <Shimmer className="w-16 h-3 rounded" />
                      </div>
                    </div>
                    <Shimmer className="w-full h-4 rounded mb-2" />
                    <Shimmer className="w-2/3 h-4 rounded" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right column - Sidebar Skeleton */}
          <div className="hidden lg:block">
            <AttorneySidebarSkeleton />
          </div>
        </div>
      </main>

      {/* Mobile CTA Skeleton */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 md:hidden">
        <div className="flex gap-3">
          <Shimmer className="flex-1 h-14 rounded-xl" />
          <Shimmer className="flex-1 h-14 rounded-xl" />
        </div>
      </div>
    </div>
  )
}

export function AttorneyPhotoGridSkeleton() {
  return (
    <div className="rounded-2xl overflow-hidden min-h-[320px]">
      <div className="grid grid-cols-4 grid-rows-2 gap-2 h-80">
        {/* Main hero */}
        <Shimmer className="col-span-2 row-span-2 rounded-l-2xl" />
        {/* Secondary images */}
        <Shimmer className="rounded-none" />
        <Shimmer className="rounded-tr-2xl" />
        <Shimmer className="rounded-none" />
        <Shimmer className="rounded-br-2xl" />
      </div>
    </div>
  )
}

export function AttorneyHeroSkeleton() {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8 min-h-[200px]">
      <div className="flex flex-col md:flex-row gap-6">
        <Shimmer className="w-24 h-24 md:w-32 md:h-32 rounded-2xl flex-shrink-0" />
        <div className="flex-1">
          <div className="flex gap-2 mb-3">
            <Shimmer className="w-20 h-6 rounded-full" />
            <Shimmer className="w-24 h-6 rounded-full" />
          </div>
          <Shimmer className="w-64 h-8 rounded mb-2" />
          <Shimmer className="w-40 h-5 rounded mb-3" />
          <Shimmer className="w-48 h-4 rounded mb-4" />
          <div className="flex gap-4">
            <Shimmer className="w-24 h-8 rounded-lg" />
            <Shimmer className="w-20 h-6 rounded" />
            <Shimmer className="w-24 h-6 rounded" />
          </div>
        </div>
      </div>
    </div>
  )
}

export function AttorneySidebarSkeleton() {
  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 sticky top-24 min-h-[380px]">
      <Shimmer className="w-40 h-4 rounded mb-4" />
      <Shimmer className="w-24 h-10 rounded mb-6" />
      <div className="space-y-3 mb-6">
        <Shimmer className="w-full h-14 rounded-xl" />
        <Shimmer className="w-full h-14 rounded-xl" />
        <Shimmer className="w-full h-12 rounded-xl" />
      </div>
      <div className="space-y-3 mb-6 pb-6 border-b border-gray-100">
        <Shimmer className="w-32 h-4 rounded" />
        <Shimmer className="w-36 h-4 rounded" />
        <Shimmer className="w-28 h-4 rounded" />
      </div>
      <div className="space-y-2">
        <Shimmer className="w-24 h-4 rounded" />
        <Shimmer className="w-32 h-4 rounded" />
      </div>
    </div>
  )
}
