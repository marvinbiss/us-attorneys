   import { GridSkeleton } from '@/components/ui/Skeleton'

export default function ServicesLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="h-12 w-64 bg-white/10 rounded-lg mx-auto mb-4 animate-pulse" />
          <div className="h-6 w-96 bg-white/10 rounded-lg mx-auto animate-pulse" />
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
         <GridSkeleton count={8} cols={3} />
      </div>
    </div>
  )
}
