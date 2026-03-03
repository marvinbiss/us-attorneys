import { Skeleton, FormSkeleton } from '@/components/ui/Skeleton'

export default function DevisLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <Skeleton className="h-10 w-80 mx-auto mb-3 bg-white/10" />
          <Skeleton className="h-6 w-96 mx-auto bg-white/10" />
        </div>
      </div>
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="bg-white rounded-xl border border-gray-200 p-8">
          <Skeleton className="h-8 w-48 mb-6" />
          <FormSkeleton />
        </div>
      </div>
    </div>
  )
}
