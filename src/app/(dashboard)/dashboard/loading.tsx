export default function DashboardLoading() {
  return (
    <main className="max-w-4xl mx-auto px-4 md:px-6 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="space-y-2">
          <div className="skeleton-shimmer h-7 w-36 rounded-lg" />
          <div className="skeleton-shimmer h-4 w-64 rounded" />
        </div>
        <div className="skeleton-shimmer h-10 w-36 rounded-lg" />
      </div>

      <div className="flex flex-col gap-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-[#0D1535] border border-[#1E2A4A] rounded-xl p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 space-y-2">
                <div className="skeleton-shimmer h-5 w-48 rounded" />
                <div className="skeleton-shimmer h-3.5 w-80 rounded" />
              </div>
              <div className="skeleton-shimmer h-6 w-24 rounded-full" />
            </div>
            <div className="mt-4 flex items-center gap-4">
              <div className="skeleton-shimmer h-3 w-28 rounded" />
              <div className="skeleton-shimmer h-3 w-20 rounded" />
            </div>
          </div>
        ))}
      </div>
    </main>
  )
}
