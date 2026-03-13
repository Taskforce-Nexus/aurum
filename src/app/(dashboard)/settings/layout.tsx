import SettingsSidebar from '@/components/dashboard/SettingsSidebar'

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen bg-[#0A1128]">
      {/* Sidebar */}
      <SettingsSidebar />

      {/* Main content */}
      <main className="flex-1 min-w-0 overflow-y-auto py-10 px-[210px]">
        {children}
      </main>
    </div>
  )
}
