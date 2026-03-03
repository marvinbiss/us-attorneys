import { Skeleton } from '@/components/ui/Skeleton'

export default function TarifsVilleLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <Skeleton className="h-10 w-72 mx-auto mb-3 bg-white/10" />
          <Skeleton className="h-6 w-80 mx-auto bg-white/10" />
        </div>
      </div>
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <Skeleton className="h-6 w-48" />
          </div>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between p-4 border-b border-gray-100">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-5 w-24" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
