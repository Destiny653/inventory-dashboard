 
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Shield, AlertTriangle } from 'lucide-react'


export default function UnauthorizedPage() {
  const router = useRouter()
  const [user, setUser] = useState(null)

  useEffect(() => {
    async function getUser() {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }
    getUser()
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="max-w-md w-full p-8 bg-white shadow-lg rounded-lg text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-6">
          <AlertTriangle className="h-8 w-8 text-red-600" />
        </div>
        
        <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
        <p className="text-gray-600 mb-6">
          You don't have permission to access the dashboard. Only administrators can access this area.
        </p>
        
        {user && (
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <div className="flex items-center justify-center mb-2">
              <Shield className="h-4 w-4 mr-2 text-gray-500" />
              <span className="text-sm font-medium">Current Role: {user.user_metadata?.role || 'User'}</span>
            </div>
            <p className="text-sm text-gray-500">
              Logged in as: {user.email}
            </p>
          </div>
        )}

        <Button
          variant="primary"
          className="w-full mb-4 border"
          onClick={() => router.push('/login')}
        >
            Login
        </Button>
       
      </div>
    </div>
  )
}
