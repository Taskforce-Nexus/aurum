import SettingsSidebar from '@/components/dashboard/SettingsSidebar'

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <h1 className="text-xl font-bold mb-8">Configuración</h1>
      <div className="flex gap-8">
        <SettingsSidebar />
        <main className="flex-1 min-w-0">
          {children}
        </main>
      </div>
    </div>
  )
}
