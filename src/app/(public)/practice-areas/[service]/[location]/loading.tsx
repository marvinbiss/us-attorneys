export default function Loading() {
  return (
    <div className="min-h-screen bg-sand-100">
      {/* Breadcrumb skeleton - fixed height */}
      <div className="bg-white border-b border-stone-200 min-h-[44px]">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-2">
          <div className="h-4 w-16 bg-sand-200 rounded animate-pulse" />
          <div className="h-4 w-4 bg-sand-200 rounded animate-pulse flex-shrink-0" />
          <div className="h-4 w-24 bg-sand-200 rounded animate-pulse" />
          <div className="h-4 w-4 bg-sand-200 rounded animate-pulse flex-shrink-0" />
          <div className="h-4 w-32 bg-sand-200 rounded animate-pulse" />
        </div>
      </div>

      {/* Header skeleton - fixed height */}
      <div className="bg-white border-b border-stone-200 min-h-[72px]">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <div className="h-7 w-80 max-w-full bg-sand-200 rounded animate-pulse mb-2" />
            <div className="h-4 w-48 bg-sand-200 rounded animate-pulse" />
          </div>
          <div className="hidden md:flex gap-1 bg-stone-100 rounded-lg p-1">
            <div className="h-8 w-20 bg-white rounded-md animate-pulse" />
            <div className="h-8 w-16 bg-sand-200 rounded-md animate-pulse" />
            <div className="h-8 w-16 bg-sand-200 rounded-md animate-pulse" />
          </div>
        </div>
      </div>

      {/* Split view skeleton - explicit height to prevent CLS */}
      <div className="flex flex-col md:flex-row md:h-[calc(100vh-180px)] min-h-[600px]">
        {/* List panel */}
        <div className="w-full md:w-1/2 lg:w-2/5 p-4 space-y-4 overflow-hidden">
          {/* Filter bar skeleton */}
          <div className="flex items-center justify-between py-2 min-h-[40px]">
            <div className="h-5 w-40 bg-sand-200 rounded animate-pulse" />
            <div className="flex gap-2">
              <div className="h-9 w-28 bg-sand-200 rounded-lg animate-pulse" />
              <div className="h-9 w-20 bg-sand-200 rounded-lg animate-pulse" />
            </div>
          </div>
          {/* Card skeletons - fixed height per card */}
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-stone-200/60 p-6 space-y-4 min-h-[200px]">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-sand-200 animate-pulse shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-5 w-48 max-w-full bg-sand-200 rounded animate-pulse" />
                  <div className="h-4 w-32 bg-sand-200 rounded animate-pulse" />
                </div>
                <div className="text-right space-y-1 flex-shrink-0">
                  <div className="h-6 w-10 bg-sand-200 rounded animate-pulse ml-auto" />
                  <div className="h-3 w-14 bg-sand-200 rounded animate-pulse ml-auto" />
                </div>
              </div>
              <div className="h-4 w-56 max-w-full bg-sand-200 rounded animate-pulse" />
              <div className="flex gap-3">
                <div className="flex-1 h-12 bg-amber-100 rounded-xl animate-pulse" />
                <div className="flex-1 h-12 bg-sand-200 rounded-xl animate-pulse" />
              </div>
            </div>
          ))}
        </div>

        {/* Map panel skeleton - explicit min-height for mobile */}
        <div className="hidden md:block md:w-1/2 lg:w-3/5 bg-sand-200 animate-pulse relative min-h-[400px]">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 border-4 border-clay-400 border-t-transparent rounded-full animate-spin" />
              <span className="text-stone-500 text-sm">Loading map...</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
