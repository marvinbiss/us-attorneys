import { Skeleton } from '@/components/ui/Skeleton'

export default function AvisVilleLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 py-16 min-h-[152px]">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <Skeleton className="h-10 w-72 max-w-full mx-auto mb-3 bg-white/10" />
          <Skeleton className="h-6 w-96 max-w-full mx-auto bg-white/10" />
        </div>
      </div>
      <div className="max-w-4xl mx-auto px-4 py-12 space-y-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <Skeleton className="w-12 h-12 rounded-full" />
              <div>
                <Skeleton className="h-5 w-32 mb-1" />
                <div className="flex gap-1">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <Skeleton key={j} className="w-5 h-5 rounded" />
                  ))}
                </div>
              </div>
            </div>
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        ))}
      </div>
    </div>
  )
}
