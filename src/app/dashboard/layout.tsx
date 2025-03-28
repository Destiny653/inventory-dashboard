import Sidebar from '@/components/dashboard/Sidebar'
import { Header } from '@/components/dashboard/Header'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen bg-theme-50 dark:bg-theme-950">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header user={{ name: '', email: '', avatar: '' }} />
        <main className="flex-1 overflow-y-auto p-4 bg-theme-50 dark:bg-theme-900">
          {children}
        </main>
      </div>
    </div>
  )
}
