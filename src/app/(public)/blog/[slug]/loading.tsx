import { Skeleton } from '@/components/ui/Skeleton'

export default function BlogArticleLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 py-16 min-h-[184px]">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <Skeleton className="h-8 w-32 mx-auto mb-4 bg-white/10 rounded-full" />
          <Skeleton className="h-10 w-full mx-auto mb-3 bg-white/10" />
          <Skeleton className="h-6 w-64 mx-auto bg-white/10" />
        </div>
      </div>
      <div className="max-w-3xl mx-auto px-4 py-12 space-y-4">
        <Skeleton className="aspect-video w-full rounded-xl" />
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-8 w-56 mt-6" />
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-5 w-5/6" />
      </div>
    </div>
  )
}
