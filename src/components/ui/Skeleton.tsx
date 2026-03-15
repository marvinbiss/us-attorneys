import { cn } from '@/lib/utils'

interface SkeletonProps {
  className?: string
  shimmer?: boolean
}

export function Skeleton({ className, shimmer = true }: SkeletonProps) {
  return (
    <div
      className={cn(
        'rounded-md bg-gray-200 relative overflow-hidden',
        shimmer && 'after:absolute after:inset-0 after:translate-x-[-100%] after:animate-[shimmer_2s_infinite] after:bg-gradient-to-r after:from-transparent after:via-white/60 after:to-transparent',
        className
      )}
    />
  )
}

// Card skeleton for artisan/service cards
export function CardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center gap-4 mb-4">
        <Skeleton className="w-14 h-14 rounded-full" />
        <div className="flex-1">
          <Skeleton className="h-5 w-32 mb-2" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
      <Skeleton className="h-4 w-full mb-2" />
      <Skeleton className="h-4 w-3/4 mb-4" />
      <div className="flex gap-2">
        <Skeleton className="h-8 w-20 rounded-full" />
        <Skeleton className="h-8 w-20 rounded-full" />
      </div>
    </div>
  )
}

// List skeleton
export function ListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="flex items-center gap-4">
            <Skeleton className="w-12 h-12 rounded-lg" />
            <div className="flex-1">
              <Skeleton className="h-5 w-48 mb-2" />
              <Skeleton className="h-4 w-32" />
            </div>
            <Skeleton className="h-10 w-24 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  )
}

// Grid skeleton
export function GridSkeleton({ count = 8, cols = 4 }: { count?: number; cols?: number }) {
  return (
    <div className={`grid grid-cols-2 md:grid-cols-${cols} gap-4`}>
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  )
}

// Page skeleton
export function PageSkeleton() {
  return (
    <div className="min-h-screen">
      {/* Hero skeleton */}
      <div className="bg-gradient-to-r from-gray-200 to-gray-300 py-16">
        <div className="max-w-7xl mx-auto px-4">
          <Skeleton className="h-10 w-96 mb-4 bg-gray-300" />
          <Skeleton className="h-6 w-72 bg-gray-300" />
        </div>
      </div>

      {/* Content skeleton */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <Skeleton className="h-8 w-48 mb-8" />
        <GridSkeleton count={8} />
      </div>
    </div>
  )
}

// Form skeleton
export function FormSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-4 w-24 mb-2" />
        <Skeleton className="h-12 w-full rounded-lg" />
      </div>
      <div>
        <Skeleton className="h-4 w-32 mb-2" />
        <Skeleton className="h-12 w-full rounded-lg" />
      </div>
      <div>
        <Skeleton className="h-4 w-28 mb-2" />
        <Skeleton className="h-24 w-full rounded-lg" />
      </div>
      <Skeleton className="h-12 w-full rounded-lg" />
    </div>
  )
}

// Provider card skeleton - matches AttorneyCard layout
export function AttorneyCardSkeleton() {
  return (
    <div
      className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm"
      role="article"
      aria-busy="true"
      aria-label="Chargement d'un artisan"
    >
      {/* Badge placeholder */}
      <Skeleton className="h-6 w-32 rounded-full mb-3" />

      {/* Header */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <Skeleton className="h-6 w-48 mb-2" />
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>
        <Skeleton className="h-7 w-24 rounded-full ml-3" />
      </div>

      {/* Address */}
      <div className="flex items-start gap-2 mb-2">
        <Skeleton className="w-4 h-4 rounded mt-0.5" />
        <Skeleton className="h-4 w-56" />
      </div>

      {/* Contact */}
      <div className="flex gap-4 mt-3 pt-3 border-t border-gray-100">
        <Skeleton className="h-5 w-28" />
        <Skeleton className="h-5 w-20" />
      </div>

      {/* CTA buttons */}
      <div className="flex gap-2 mt-4">
        <Skeleton className="flex-1 h-10 rounded-xl" />
        <Skeleton className="flex-1 h-10 rounded-xl" />
      </div>
    </div>
  )
}

// Provider list skeleton
export function AttorneyListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-4" role="status" aria-label="Chargement des artisans">
      {Array.from({ length: count }).map((_, i) => (
        <AttorneyCardSkeleton key={i} />
      ))}
      <span className="sr-only">Chargement en cours...</span>
    </div>
  )
}
