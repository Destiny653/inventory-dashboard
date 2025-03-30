 // app/dashboard/profile/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Shield, 
  Key, 
  Loader2,
  Edit,
  Building
} from 'lucide-react'

export default function ProfilePage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function getProfile() {
      try {
        setLoading(true)
        const { data: { user }, error } = await supabase.auth.getUser()
        
        if (error || !user) {
          throw error || new Error('No user found')
        }
        
        setUser(user)
        
        // You could fetch additional profile data from a profiles table if needed
        // For now, we'll use the user metadata
        setProfile({
          name: user.user_metadata?.name || 'Not provided',
          phone: user.user_metadata?.phone || 'Not provided',
          address: user.user_metadata?.address || 'Not provided',
          city: user.user_metadata?.city || 'Not provided',
          state: user.user_metadata?.state || 'Not provided',
          zipCode: user.user_metadata?.zip_code || 'Not provided',
          country: user.user_metadata?.country || 'Not provided',
          avatarUrl: user.user_metadata?.avatar_url || '',
          role: user.user_metadata?.role || 'Customer'
        })
      } catch (error) {
        console.error('Error getting profile:', error)
        // router.push('/login')
      } finally {
        setLoading(false)
      }
    }
    
    getProfile()
  }, [router])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    )
  }

  return (
    <div className="container mx-auto py-10 max-w-4xl">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">My Profile</h1>
        <Button asChild>
          <Link href="/dashboard/profile/edit">
            <Edit className="mr-2 h-4 w-4" />
            Edit Profile
          </Link>
        </Button>
      </div>
      
      <div className="grid gap-6 md:grid-cols-3">
        {/* Profile Card */}
        <Card className="md:col-span-1">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Avatar className="h-32 w-32">
                <AvatarImage src={profile.avatarUrl} alt={profile.name} />
                <AvatarFallback className="text-2xl">
                  {profile.name?.charAt(0) || user?.email?.charAt(0)}
                </AvatarFallback>
              </Avatar>
            </div>
            <CardTitle>{profile.name}</CardTitle>
            <CardDescription className="flex items-center justify-center">
              <Shield className="h-4 w-4 mr-1" />
              {profile.role}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center">
                <Mail className="h-4 w-4 mr-2 text-gray-500" />
                <span className="text-sm">{user?.email}</span>
              </div>
              
              <div className="flex items-center">
                <Phone className="h-4 w-4 mr-2 text-gray-500" />
                <span className="text-sm">{profile.phone}</span>
              </div>
              
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                <span className="text-sm">Joined {new Date(user?.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Account Details */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
            <CardDescription>
              Your personal and contact information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium">Personal Details</h3>
                <Separator className="my-2" />
                <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 mt-4">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Full Name</dt>
                    <dd className="mt-1 text-sm">{profile.name}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Email Address</dt>
                    <dd className="mt-1 text-sm">{user?.email}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Phone Number</dt>
                    <dd className="mt-1 text-sm">{profile.phone}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Account Role</dt>
                    <dd className="mt-1 text-sm">
                      <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-0.5 rounded">
                        {profile.role}
                      </span>
                    </dd>
                  </div>
                </dl>
              </div>
              
              <div>
                <h3 className="text-lg font-medium">Address Information</h3>
                <Separator className="my-2" />
                <div className="mt-4 flex items-start">
                  <MapPin className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                  <div>
                    <p className="text-sm">{profile.address}</p>
                    <p className="text-sm">
                      {profile.city}, {profile.state} {profile.zipCode}
                    </p>
                    <p className="text-sm">{profile.country}</p>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-medium">Account Details</h3>
                <Separator className="my-2" />
                <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 mt-4">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Account ID</dt>
                    <dd className="mt-1 text-sm font-mono">{user?.id}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Created On</dt>
                    <dd className="mt-1 text-sm">{new Date(user?.created_at).toLocaleDateString()}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Last Sign In</dt>
                    <dd className="mt-1 text-sm">{new Date(user?.last_sign_in_at).toLocaleDateString()}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Email Verified</dt>
                    <dd className="mt-1 text-sm">
                      {user?.email_confirmed_at ? (
                        <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-0.5 rounded">
                          Verified
                        </span>
                      ) : (
                        <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2 py-0.5 rounded">
                          Not Verified
                        </span>
                      )}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Activity Card */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>
            Your recent actions and orders
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-gray-500">
            <Building className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-semibold">No recent activity</h3>
            <p className="mt-1 text-sm">Your recent orders and activity will appear here</p>
            <div className="mt-6">
              <Button asChild variant="outline">
                <Link href="/dashboard/orders">
                  View Orders
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
