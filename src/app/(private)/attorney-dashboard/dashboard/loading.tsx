export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb skeleton */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="h-4 w-48 bg-gray-200 rounded animate-pulse" />
        </div>
      </div>

      {/* Header skeleton */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="h-8 w-56 bg-white/20 rounded animate-pulse mb-2" />
          <div className="h-5 w-40 bg-white/10 rounded animate-pulse" />
        </div>
      </div>

      {/* Content skeleton */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar skeleton */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-4 space-y-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-10 bg-gray-100 rounded-lg animate-pulse" />
              ))}
            </div>
          </div>

          {/* Main content skeleton */}
          <div className="lg:col-span-3 space-y-8">
            {/* Stats skeleton */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-white rounded-xl border border-gray-200 p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="h-10 w-10 bg-gray-200 rounded-lg animate-pulse" />
                    <div className="h-6 w-14 bg-gray-200 rounded-full animate-pulse" />
                  </div>
                  <div className="h-8 w-20 bg-gray-200 rounded animate-pulse mb-1" />
                  <div className="h-4 w-28 bg-gray-200 rounded animate-pulse" />
                </div>
              ))}
            </div>

            {/* Cases skeleton */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="h-6 w-44 bg-gray-200 rounded animate-pulse" />
                <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
              </div>
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2 flex-1">
                        <div className="h-5 w-48 bg-gray-200 rounded animate-pulse" />
                        <div className="flex gap-4">
                          <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
                          <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
                          <div className="h-4 w-28 bg-gray-200 rounded animate-pulse" />
                        </div>
                      </div>
                      <div className="h-7 w-20 bg-gray-200 rounded-full animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
