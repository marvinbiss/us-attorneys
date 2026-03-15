'use client'

import Link from 'next/link'
import { Camera, ArrowRight } from 'lucide-react'

interface PhotoUploadBannerProps {
  /** Number of portfolio photos the artisan currently has */
  photoCount: number
}

/**
 * Banner shown on the artisan dashboard when they have 0 portfolio photos.
 * Encourages them to upload photos to increase quote requests.
 */
export default function PhotoUploadBanner({ photoCount }: PhotoUploadBannerProps) {
  if (photoCount > 0) return null

  return (
    <div className="relative overflow-hidden rounded-xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 p-5 sm:p-6">
      {/* Decorative background circle */}
      <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-amber-100/60" />

      <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-amber-500 shadow-md shadow-amber-500/20">
          <Camera className="h-6 w-6 text-white" />
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-slate-900 text-base">
            Ajoutez des photos de vos r&eacute;alisations
          </h3>
          <p className="text-sm text-slate-600 mt-0.5">
            Les artisans avec des photos re&ccedil;oivent 3x plus de demandes de devis.
          </p>
        </div>

        <Link
          href="/attorney-dashboard/portfolio"
          className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-amber-500/25 hover:from-amber-600 hover:to-amber-700 hover:shadow-lg hover:shadow-amber-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 whitespace-nowrap"
        >
          Ajouter des photos
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  )
}
