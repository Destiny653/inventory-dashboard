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
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { Loader2, UserPlus, Edit, Trash2 } from 'lucide-react'

interface User {
  id: string
  email: string
  created_at: string
  raw_user_meta_data: {
    full_name?: string
    role?: string
    [key: string]: any
  }
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
      const { data, error } = await supabase
        .from('auth.users')
        .select('id, email, created_at, raw_user_meta_data, last_sign_in_at')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching users:', error)
        toast.error('Failed to fetch users')
        return
      }

      setUsers(data || [])
    } catch (error) {
      console.error('Error fetching users:', error)
      toast.error('Failed to fetch users')
    } finally {
      setIsLoadingUsers(false)
    }
  }

  // Update user role
  const updateUserRole = async (userId: string, email: string, role: string, fullName?: string) => {
    setIsUpdatingRole(true)
    try {
      const { error } = await supabase.rpc('update_user_role', {
        user_id: userId,
        user_email: email,
        new_role: role,
        user_full_name: fullName || 'User'
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
    setSelectedRole(user.raw_user_meta_data?.role || '')
    setIsRoleDialogOpen(true)
  }

  // Handle role update submission
  const handleRoleUpdate = () => {
    if (!selectedUser || !selectedRole) return
    
    updateUserRole(
      selectedUser.id,
      selectedUser.email,
      selectedRole,
      selectedUser.raw_user_meta_data?.full_name
    )
  }

  // Get role badge variant
  const getRoleBadgeVariant = (role?: string) => {
    switch (role) {
      case 'admin':
        return 'destructive'
      case 'vendor':
        return 'default'
      default:
        return 'secondary'
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
      <h1 className="text-2xl font-bold">Admin Settings</h1>
      
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
                  <div className="border rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>Created</TableHead>
                          <TableHead>Last Sign In</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {users.map((user) => (
                          <TableRow key={user.id}>
                            <TableCell>
                              {user.raw_user_meta_data?.full_name || 'N/A'}
                            </TableCell>
                            <TableCell>{user.email}</TableCell>
                            <TableCell>
                              <Badge variant={getRoleBadgeVariant(user.raw_user_meta_data?.role)}>
                                {user.raw_user_meta_data?.role || 'user'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {new Date(user.created_at).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              {user.last_sign_in_at 
                                ? new Date(user.last_sign_in_at).toLocaleDateString()
                                : 'Never'
                              }
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleAssignRole(user)}
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign User Role</DialogTitle>
            <DialogDescription>
              Select a role for {selectedUser?.email}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Current Role</Label>
              <Badge variant={getRoleBadgeVariant(selectedUser?.raw_user_meta_data?.role)}>
                {selectedUser?.raw_user_meta_data?.role || 'user'}
              </Badge>
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">New Role</Label>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="vendor">Vendor</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsRoleDialogOpen(false)}
              disabled={isUpdatingRole}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleRoleUpdate}
              disabled={!selectedRole || isUpdatingRole}
            >
              {isUpdatingRole ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Updating...
                </>
              ) : (
                'Update Role'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}