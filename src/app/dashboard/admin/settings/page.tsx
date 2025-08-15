 'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { supabase, supabaseAdmin } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { Loader2, UserPlus, Edit, Trash2 } from 'lucide-react'

interface User {
  id: string
  email: string
  full_name?: string
  phone?: string
  created_at: string
  role?: string
  avatar_url?: string
  last_sign_in_at?: string
}

export default function AdminSettingsPage() {
  const { isAdmin } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [isLoadingUsers, setIsLoadingUsers] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [selectedRole, setSelectedRole] = useState<string>('')
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false)
  const [isUpdatingRole, setIsUpdatingRole] = useState(false)

  const [generalSettings, setGeneralSettings] = useState({
    storeName: 'Marketplace',
    storeEmail: 'admin@marketplace.com',
    storeCurrency: 'USD',
    storeTimezone: 'UTC',
    maintenanceMode: false,
  })

  const [paymentSettings, setPaymentSettings] = useState({
    stripeEnabled: true,
    paypalEnabled: false,
    stripePublicKey: '',
    stripeSecretKey: '',
    paypalClientId: '',
  })

  const [shippingSettings, setShippingSettings] = useState({
    freeShippingThreshold: 50,
    standardShippingRate: 5,
    expressShippingRate: 10,
  })

  const [taxSettings, setTaxSettings] = useState({
    taxEnabled: true,
    taxRate: 7.5,
    taxInclusive: false,
  })

  // Fetch users from Supabase
  const fetchUsers = async () => {
    setIsLoadingUsers(true)
    try {
      // Check if admin client is available
      if (!supabaseAdmin) {
        toast.error('Admin client not configured. Please add SUPABASE_SERVICE_ROLE_KEY to your environment variables.')
        return
      }

      // Get all auth users with their metadata using admin client
      const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers()
      
      if (authError) {
        console.error('Error fetching auth users:', authError)
        toast.error('Failed to fetch users')
        return
      }

      // Convert auth users to our User format
      const usersWithRoles: User[] = authUsers.users.map(authUser => ({
        id: authUser.id,
        email: authUser.email || '',
        full_name: authUser.user_metadata?.full_name || authUser.user_metadata?.name || 'N/A',
        phone: authUser.phone || 'N/A',
        created_at: authUser.created_at,
        role: authUser.user_metadata?.role || 'user',
        avatar_url: authUser.user_metadata?.avatar_url || authUser.user_metadata?.picture,
        last_sign_in_at: authUser.last_sign_in_at || undefined
      }))

      setUsers(usersWithRoles)
    } catch (error) {
      console.error('Error fetching users:', error)
      toast.error('Failed to fetch users')
    } finally {
      setIsLoadingUsers(false)
    }
  }

  // Update user role using Supabase Auth Admin API
  const updateUserRole = async (userId: string, email: string, role: string, fullName?: string) => {
    setIsUpdatingRole(true)
    try {
      // Check if admin client is available
      if (!supabaseAdmin) {
        toast.error('Admin client not configured. Please add SUPABASE_SERVICE_ROLE_KEY to your environment variables.')
        return
      }

      // Get current user metadata using admin client
      const { data: currentUser, error: fetchError } = await supabaseAdmin.auth.admin.getUserById(userId)
      
      if (fetchError) {
        console.error('Error fetching user:', fetchError)
        toast.error('Failed to fetch user data')
        return
      }

      // Prepare updated metadata
      const currentMetadata = currentUser.user.user_metadata || {}
      const updatedMetadata = {
        ...currentMetadata,
        role: role,
        full_name: fullName || currentMetadata.full_name || currentMetadata.name || 'User'
      }

      // Update user metadata with new role using admin client
      const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        user_metadata: updatedMetadata
      })

      if (error) {
        console.error('Error updating user role:', error)
        toast.error('Failed to update user role')
        return
      }

      toast.success(`User role updated to ${role}`)
      setIsRoleDialogOpen(false)
      setSelectedUser(null)
      setSelectedRole('')
      fetchUsers() // Refresh users list
    } catch (error) {
      console.error('Error updating user role:', error)
      toast.error('Failed to update user role')
    } finally {
      setIsUpdatingRole(false)
    }
  }

  // Handle role assignment
  const handleAssignRole = (user: User) => {
    setSelectedUser(user)
    setSelectedRole(user.role || 'user')
    setIsRoleDialogOpen(true)
  }

  // Handle role update submission
  const handleRoleUpdate = () => {
    if (!selectedUser || !selectedRole) return
    
    updateUserRole(
      selectedUser.id,
      selectedUser.email,
      selectedRole,
      selectedUser.full_name
    )
  }

  // Get role badge variant
  const getRoleBadgeVariant = (role?: string) => {
    switch (role) {
      case 'admin':
        return 'destructive'
      case 'vendor':
        return 'default'
      case 'customer':
        return 'secondary'
      default:
        return 'outline'
    }
  }

  useEffect(() => {
    if (isAdmin) {
      fetchUsers()
    }
  }, [isAdmin])

  const handleGeneralSettingsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setGeneralSettings(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handlePaymentSettingsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setPaymentSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleShippingSettingsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setShippingSettings(prev => ({
      ...prev,
      [name]: parseFloat(value) || 0
    }))
  }

  const handleTaxSettingsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setTaxSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : parseFloat(value) || 0
    }))
  }

  const handleSubmit = (section: string) => {
    // In a real app, you would save these settings to your backend
    toast.success(`${section} settings saved successfully`)
  }

  return (
    <div className="space-y-4 p-4">
      
      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="shipping">Shipping</TabsTrigger>
          <TabsTrigger value="taxes">Taxes</TabsTrigger>
        </TabsList>

        {/* User Management */}
        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>
                Manage user roles and permissions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">All Users</h3>
                  <Button onClick={fetchUsers} disabled={isLoadingUsers}>
                    {isLoadingUsers ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : null}
                    Refresh
                  </Button>
                </div>

                {isLoadingUsers ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : (
                  <div className="border rounded-lg overflow-hidden shadow-sm">
                    <Table>
                      <TableHeader className="bg-theme-50 dark:bg-theme-900">
                        <TableRow className="border-b border-theme-200 dark:border-theme-800">
                          <TableHead className="text-theme-900 dark:text-theme-100 font-semibold">Name</TableHead>
                          <TableHead className="text-theme-900 dark:text-theme-100 font-semibold">Email</TableHead>
                          <TableHead className="text-theme-900 dark:text-theme-100 font-semibold">Role</TableHead>
                          <TableHead className="text-theme-900 dark:text-theme-100 font-semibold">Created</TableHead>
                          <TableHead className="text-theme-900 dark:text-theme-100 font-semibold">Last Sign In</TableHead>
                          <TableHead className="text-theme-900 dark:text-theme-100 font-semibold">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {users.map((user, index) => (
                          <TableRow 
                            key={user.id} 
                            className={`border-b border-theme-100 dark:border-theme-800 hover:bg-theme-50 dark:hover:bg-theme-900/50 transition-all duration-200 ${
                              index % 2 === 0 ? 'bg-white dark:bg-theme-950' : 'bg-theme-50 dark:bg-theme-900/50'
                            }`}
                          >
                            <TableCell className="font-medium text-theme-900 dark:text-theme-100">
                              <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 rounded-full bg-theme-primary flex items-center justify-center text-white text-sm font-semibold">
                                  {user.full_name?.charAt(0) || user.email?.charAt(0) || 'U'}
                                </div>
                                <span>{user.full_name || 'N/A'}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-theme-600 dark:text-theme-300">
                              {user.email}
                            </TableCell>
                            <TableCell>
                              <Badge 
                                variant={getRoleBadgeVariant(user.role)} 
                                className="px-3 py-1 text-xs font-medium"
                              >
                                {user.role || 'user'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-theme-600 dark:text-theme-300">
                              {new Date(user.created_at).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="text-theme-600 dark:text-theme-300">
                              {user.last_sign_in_at 
                                ? new Date(user.last_sign_in_at).toLocaleDateString()
                                : <span className="text-theme-400 dark:text-theme-500">Never</span>
                              }
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleAssignRole(user)}
                                className="bg-theme-primary border-0 hover:bg-theme-primary-hover transition-all duration-200 shadow-sm"
                              >
                                <Edit className="h-4 w-4 mr-1" />
                                Edit Role
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* General Settings */}
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>
                Configure your store's basic information and preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="storeName">Store Name</Label>
                <Input
                  id="storeName"
                  name="storeName"
                  value={generalSettings.storeName}
                  onChange={handleGeneralSettingsChange}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="storeEmail">Store Email</Label>
                <Input
                  id="storeEmail"
                  name="storeEmail"
                  type="email"
                  value={generalSettings.storeEmail}
                  onChange={handleGeneralSettingsChange}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="storeCurrency">Store Currency</Label>
                <Select
                  value={generalSettings.storeCurrency}
                  onValueChange={(value) => setGeneralSettings(prev => ({
                    ...prev,
                    storeCurrency: value
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">US Dollar (USD)</SelectItem>
                    <SelectItem value="EUR">Euro (EUR)</SelectItem>
                    <SelectItem value="GBP">British Pound (GBP)</SelectItem>
                    <SelectItem value="JPY">Japanese Yen (JPY)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="storeTimezone">Store Timezone</Label>
                <Select
                  value={generalSettings.storeTimezone}
                  onValueChange={(value) => setGeneralSettings(prev => ({
                    ...prev,
                    storeTimezone: value
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select timezone" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UTC">UTC</SelectItem>
                    <SelectItem value="EST">Eastern Time (EST)</SelectItem>
                    <SelectItem value="PST">Pacific Time (PST)</SelectItem>
                    <SelectItem value="GMT">Greenwich Mean Time (GMT)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="maintenanceMode"
                  checked={generalSettings.maintenanceMode}
                  onCheckedChange={(checked) => setGeneralSettings(prev => ({
                    ...prev,
                    maintenanceMode: checked
                  }))}
                />
                <Label htmlFor="maintenanceMode">Maintenance Mode</Label>
              </div>
              
              <div className="flex justify-end">
                <Button onClick={() => handleSubmit('General')}>
                  Save General Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Payment Settings */}
        <TabsContent value="payments">
          <Card>
            <CardHeader>
              <CardTitle>Payment Settings</CardTitle>
              <CardDescription>
                Configure payment gateways and processing options
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="stripeEnabled"
                  checked={paymentSettings.stripeEnabled}
                  onCheckedChange={(checked) => setPaymentSettings(prev => ({
                    ...prev,
                    stripeEnabled: checked
                  }))}
                />
                <Label htmlFor="stripeEnabled">Enable Stripe</Label>
              </div>
              
              {paymentSettings.stripeEnabled && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="stripePublicKey">Stripe Publishable Key</Label>
                    <Input
                      id="stripePublicKey"
                      name="stripePublicKey"
                      value={paymentSettings.stripePublicKey}
                      onChange={handlePaymentSettingsChange}
                      placeholder="pk_test_..."
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="stripeSecretKey">Stripe Secret Key</Label>
                    <Input
                      id="stripeSecretKey"
                      name="stripeSecretKey"
                      value={paymentSettings.stripeSecretKey}
                      onChange={handlePaymentSettingsChange}
                      placeholder="sk_test_..."
                      type="password"
                    />
                  </div>
                </>
              )}
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="paypalEnabled"
                  checked={paymentSettings.paypalEnabled}
                  onCheckedChange={(checked) => setPaymentSettings(prev => ({
                    ...prev,
                    paypalEnabled: checked
                  }))}
                />
                <Label htmlFor="paypalEnabled">Enable PayPal</Label>
              </div>
              
              {paymentSettings.paypalEnabled && (
                <div className="space-y-2">
                  <Label htmlFor="paypalClientId">PayPal Client ID</Label>
                  <Input
                    id="paypalClientId"
                    name="paypalClientId"
                    value={paymentSettings.paypalClientId}
                    onChange={handlePaymentSettingsChange}
                    placeholder="AeA..."
                  />
                </div>
              )}
              
              <div className="flex justify-end">
                <Button onClick={() => handleSubmit('Payment')}>
                  Save Payment Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Shipping Settings */}
        <TabsContent value="shipping">
          <Card>
            <CardHeader>
              <CardTitle>Shipping Settings</CardTitle>
              <CardDescription>
                Configure shipping rates and options
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="freeShippingThreshold">
                  Free Shipping Threshold ({generalSettings.storeCurrency})
                </Label>
                <Input
                  id="freeShippingThreshold"
                  name="freeShippingThreshold"
                  type="number"
                  value={shippingSettings.freeShippingThreshold}
                  onChange={handleShippingSettingsChange}
                />
                <p className="text-sm text-muted-foreground">
                  Customers get free shipping when order total exceeds this amount
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="standardShippingRate">
                  Standard Shipping Rate ({generalSettings.storeCurrency})
                </Label>
                <Input
                  id="standardShippingRate"
                  name="standardShippingRate"
                  type="number"
                  value={shippingSettings.standardShippingRate}
                  onChange={handleShippingSettingsChange}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="expressShippingRate">
                  Express Shipping Rate ({generalSettings.storeCurrency})
                </Label>
                <Input
                  id="expressShippingRate"
                  name="expressShippingRate"
                  type="number"
                  value={shippingSettings.expressShippingRate}
                  onChange={handleShippingSettingsChange}
                />
              </div>
              
              <div className="flex justify-end">
                <Button onClick={() => handleSubmit('Shipping')}>
                  Save Shipping Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Tax Settings */}
        <TabsContent value="taxes">
          <Card>
            <CardHeader>
              <CardTitle>Tax Settings</CardTitle>
              <CardDescription>
                Configure tax calculation and display
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="taxEnabled"
                  checked={taxSettings.taxEnabled}
                  onCheckedChange={(checked) => setTaxSettings(prev => ({
                    ...prev,
                    taxEnabled: checked
                  }))}
                />
                <Label htmlFor="taxEnabled">Enable Taxes</Label>
              </div>
              
              {taxSettings.taxEnabled && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="taxRate">Tax Rate (%)</Label>
                    <Input
                      id="taxRate"
                      name="taxRate"
                      type="number"
                      value={taxSettings.taxRate}
                      onChange={handleTaxSettingsChange}
                    />
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="taxInclusive"
                      checked={taxSettings.taxInclusive}
                      onCheckedChange={(checked) => setTaxSettings(prev => ({
                        ...prev,
                        taxInclusive: checked
                      }))}
                    />
                    <Label htmlFor="taxInclusive">Prices Include Tax</Label>
                  </div>
                </>
              )}
              
              <div className="flex justify-end">
                <Button onClick={() => handleSubmit('Tax')}>
                  Save Tax Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Role Assignment Dialog */}
      <Dialog open={isRoleDialogOpen} onOpenChange={setIsRoleDialogOpen}>
        <DialogContent className="bg-white sm:max-w-[500px] border-0 shadow-lg">
          <DialogHeader className="pb-4 border-b border-gray-200">
            <DialogTitle className="text-xl font-semibold text-gray-900">
              Assign User Role
            </DialogTitle>
            <DialogDescription className="text-gray-600 mt-2">
              Update the role and permissions for this user
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-6 space-y-6">
            {/* User Info */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold text-lg">
                    {selectedUser?.full_name?.charAt(0) || 'U'}
                  </span>
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900 dark:text-gray-100">{selectedUser?.full_name}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{selectedUser?.email}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-500">
                    Created: {selectedUser?.created_at ? new Date(selectedUser.created_at).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
              </div>
            </div>

            {/* Role Information */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Current Role</Label>
                <div className="flex items-center space-x-2">
                  <Badge variant={getRoleBadgeVariant(selectedUser?.role)} className="px-3 py-1">
                    {selectedUser?.role || 'user'}
                  </Badge>
                  <span className="text-sm text-gray-500">
                    {selectedUser?.role === 'admin' && 'Full administrative access'}
                    {selectedUser?.role === 'vendor' && 'Can manage products and orders'}
                    {selectedUser?.role === 'customer' && 'Can place orders and view history'}
                    {selectedUser?.role === 'user' && 'Basic user access'}
                  </span>
                </div>
              </div>
              
              <div className="space-y-2 bg-white">
                <Label htmlFor="role" className="text-sm font-medium text-gray-700">
                  New Role
                </Label>
                <Select value={selectedRole} onValueChange={setSelectedRole}>
                  <SelectTrigger className="border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                    <SelectValue placeholder="Select a new role" />
                  </SelectTrigger>
                  <SelectContent className='bg-white'>
                    <SelectItem value="user" className="py-3">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                        <div>
                          <p className="font-medium">User</p>
                          <p className="text-xs text-gray-500">Basic access</p>
                        </div>
                      </div>
                    </SelectItem>
                    <SelectItem value="customer" className="py-3">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                        <div>
                          <p className="font-medium">Customer</p>
                          <p className="text-xs text-gray-500">Can place orders</p>
                        </div>
                      </div>
                    </SelectItem>
                    <SelectItem value="vendor" className="py-3">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                        <div>
                          <p className="font-medium">Vendor</p>
                          <p className="text-xs text-gray-500">Can manage products</p>
                        </div>
                      </div>
                    </SelectItem>
                    <SelectItem value="admin" className="py-3">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                        <div>
                          <p className="font-medium">Admin</p>
                          <p className="text-xs text-gray-500">Full access</p>
                        </div>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          
          <DialogFooter className="pt-4 border-t border-gray-200">
            <Button 
              variant="outline" 
              onClick={() => setIsRoleDialogOpen(false)}
              disabled={isUpdatingRole}
              className="border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleRoleUpdate}
              disabled={!selectedRole || isUpdatingRole || selectedRole === selectedUser?.role}
              className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white"
            >
              {isUpdatingRole ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Updating...
                </>
              ) : (
                <>
                  <Edit className="h-4 w-4 mr-2" />
                  Update Role
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}