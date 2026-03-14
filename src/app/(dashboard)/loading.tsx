export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-[#0A1128] flex items-center justify-center">
      <div className="flex items-center gap-3 text-[#4A5568]">
        <div className="w-5 h-5 border-2 border-[#B8860B] border-t-transparent rounded-full animate-spin" />
        <span className="text-sm">Cargando…</span>
      </div>
    </div>
  )
}
