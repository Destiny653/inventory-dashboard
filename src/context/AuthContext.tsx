 // context/AuthContext.tsx
'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

type AuthContextType = {
  user: any
  isAdmin: boolean
  isVendor: boolean
  isAuthorized: boolean // Helper for admin OR vendor
  userRole: string | null
  isLoading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isVendor, setIsVendor] = useState(false)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Helper function to determine user permissions
  const setUserPermissions = (userData: any) => {
    const role = userData?.user_metadata?.role
    setUserRole(role || null)
    setIsAdmin(role === 'admin')
    setIsVendor(role === 'vendor')
  }

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          setUser(session.user)
          setUserPermissions(session.user)
        } else {
          setUser(null)
          setIsAdmin(false)
          setIsVendor(false)
          setUserRole(null)
        }
        setIsLoading(false)
      }
    )

    // Initial check
    checkUser()

    return () => {
      authListener.subscription.unsubscribe()
    }
  }, [])

  async function checkUser() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUser(user)
        setUserPermissions(user)
      } else {
        setUser(null)
        setIsAdmin(false)
        setIsVendor(false)
        setUserRole(null)
      }
    } catch (error) {
      console.error('Error checking user:', error)
    } finally {
      setIsLoading(false)
    }
  }

  async function signOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  // Computed value for components that need admin OR vendor access
  const isAuthorized = isAdmin || isVendor

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAdmin, 
      isVendor, 
      isAuthorized, 
      userRole, 
      isLoading, 
      signOut 
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}