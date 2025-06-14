 'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Loader2, ShieldCheck, LogOut } from 'lucide-react'

export default function WelcomeGate() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchUser() {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      setLoading(false)
    }
    fetchUser()
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <Loader2 className="h-10 w-10 text-blue-500 animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <Card className="w-full max-w-md shadow-xl">
        <CardContent className="py-10 px-6 text-center space-y-6">
          <div className="flex justify-center">
            <ShieldCheck className="h-10 w-10 text-blue-600" />
          </div>
          <h1 className="text-2xl font-semibold">Welcome to the Staff Dashboard</h1>
          <p className="text-gray-600">
            This dashboard is restricted to staff members only. Please log in to continue.
          </p>

          {user ? (
            <>
              <div className="text-sm text-gray-500">
                Logged in as <strong>{user.email}</strong>
              </div>
              <Button variant="outline" className="w-full" onClick={handleSignOut}>
                <LogOut className="w-4 h-4 mr-2" /> Sign Out
              </Button>
            </>
          ) : (
            <Button variant="default" className="w-full border-2 border-blue-500 hover:bg-blue-500 hover:text-white" onClick={() => router.push('/login')}>
              Proceed to Login
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
