 // app/dashboard/layout.tsx
'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/dashboard/Sidebar'
import { Header } from '@/components/dashboard/Header'
import { useAuth } from '@/context/AuthContext'
import { Loader2 } from 'lucide-react'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const { user, isAuthorized, isLoading, userRole } = useAuth()

  useEffect(() => {
    if (!isLoading && (!user || !isAuthorized)) {
      router.push('/unauthorized')
    }
  }, [user, isAuthorized, isLoading, router])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    )
  }

  if (!user || !isAuthorized) {
    console.log(`Access denied. User role: ${userRole}. Must be admin or vendor to view this dashboard.`)
    return null // Will redirect in the useEffect
  }

  return (
    <div className="flex h-screen bg-theme-50 dark:bg-theme-950">
      <div className="hidden md:block">
        <Sidebar />
      </div>
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header 
          user={{ 
            id: user.id, 
            name: user.user_metadata.full_name, 
            email: user.email, 
            avatar: user.user_metadata.avatar_url, 
          }} 
        />
        <main className="flex-1 overflow-y-auto p-4 bg-theme-50 dark:bg-theme-900 w-full">
          {children}
        </main>
      </div>
    </div>
  )
}