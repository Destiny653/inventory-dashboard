 'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { AlertCircle, Save, Upload, CreditCard, Bell, Shield, User } from 'lucide-react'

export default function SettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  // Account settings
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    bio: '',
    avatar_url: '',
  })
  
  // Notification settings
  const [notifications, setNotifications] = useState({
    email_orders: true,
    email_stock: true,
    email_payouts: true,
    push_orders: false,
    push_stock: false,
    push_payouts: true,
  })
  
  // Payment settings
  const [paymentMethods, setPaymentMethods] = useState([
    {
      id: 1,
      type: 'bank_account',
      name: 'Primary Bank Account',
      details: '**** **** **** 5678',
      is_default: true,
    },
    {
      id: 2,
      type: 'paypal',
      name: 'PayPal',
      details: 'vendor@example.com',
      is_default: false,
    }
  ])
  
  // Security settings
  const [security, setSecurity] = useState({
    two_factor_enabled: false,
    login_notifications: true,
    auto_logout: '30',
  })
  
  useEffect(() => {
    async function loadSettings() {
      try {
        setLoading(true)
        
        // In a real app, these would be actual Supabase queries
        // For demo, we're using the mock data initialized above
        
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 500))
        
        // Set profile data (in a real app, this would come from Supabase)
        setProfile({
          name: 'Jane Cooper',
          email: 'jane@example.com',
          phone: '(555) 123-4567',
          company: 'Cooper Crafts',
          bio: 'Selling handmade crafts and accessories since 2020.',
          avatar_url: 'https://i.pravatar.cc/150?img=1',
        })
        
      } catch (error) {
        console.error('Error loading settings:', error)
      } finally {
        setLoading(false)
      }
    }
    
    loadSettings()
  }, [])
  
  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setProfile(prev => ({ ...prev, [name]: value }))
  }
  
  const handleNotificationChange = (key: keyof typeof notifications, value: boolean) => {
    setNotifications(prev => ({ ...prev, [key]: value }))
  }
  
  const handleSecurityChange = (key: keyof typeof security, value: boolean | string) => {
    setSecurity(prev => ({ ...prev, [key]: value }))
  }
  
  const setDefaultPaymentMethod = (id: number) => {
    setPaymentMethods(prev => 
      prev.map(method => ({
        ...method,
        is_default: method.id === id
      }))
    )
  }
  
  const removePaymentMethod = (id: number) => {
    setPaymentMethods(prev => prev.filter(method => method.id !== id))
  }
  
  const saveSettings = async (section: 'profile' | 'payment' | 'notification' | 'security') => {
    try {
      setSaving(true)
      
      // In a real app, this would save to Supabase
      await new Promise(resolve => setTimeout(resolve, 800))
      
      toast.success(`Settings saved: Your ${section} settings have been updated successfully.`)
    } catch (error) {
      console.error(`Error saving ${section} settings:`, error)
      toast.error("There was a problem saving your settings. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="flex justify-center items-center h-64 text-theme-700 dark:text-theme-300">Loading settings...</div>
  }
  
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-theme-900 dark:text-theme-50">Account Settings</h1>
      
      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid grid-cols-4 w-full max-w-2xl bg-theme-100 dark:bg-theme-800">
          <TabsTrigger value="profile" className="flex items-center gap-2 data-[state=active]:bg-theme-50 dark:data-[state=active]:bg-theme-900 data-[state=active]:text-theme-900 dark:data-[state=active]:text-theme-50">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Profile</span>
          </TabsTrigger>
          <TabsTrigger value="payments" className="flex items-center gap-2 data-[state=active]:bg-theme-50 dark:data-[state=active]:bg-theme-900 data-[state=active]:text-theme-900 dark:data-[state=active]:text-theme-50">
            <CreditCard className="h-4 w-4" />
            <span className="hidden sm:inline">Payments</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2 data-[state=active]:bg-theme-50 dark:data-[state=active]:bg-theme-900 data-[state=active]:text-theme-900 dark:data-[state=active]:text-theme-50">
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline">Notifications</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2 data-[state=active]:bg-theme-50 dark:data-[state=active]:bg-theme-900 data-[state=active]:text-theme-900 dark:data-[state=active]:text-theme-50">
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">Security</span>
          </TabsTrigger>
        </TabsList>
        
        {/* Profile Settings */}
        <TabsContent value="profile" className="space-y-6">
          <Card className="border-theme-200 dark:border-theme-800">
            <CardHeader className="bg-theme-50 dark:bg-theme-900 border-b border-theme-200 dark:border-theme-800">
              <CardTitle className="text-theme-900 dark:text-theme-50">Profile Information</CardTitle>
              <CardDescription className="text-theme-600 dark:text-theme-400">
                Update your account profile information and public details.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="flex flex-col sm:flex-row gap-6">
                <div className="flex flex-col items-center space-y-3">
                  <Avatar className="h-24 w-24 border border-theme-200 dark:border-theme-700">
                    <AvatarImage src={profile.avatar_url} alt={profile.name} />
                    <AvatarFallback className="bg-theme-100 dark:bg-theme-800 text-theme-700 dark:text-theme-300">{profile.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <Button variant="outline" size="sm" className="flex items-center gap-2 border-theme-200 dark:border-theme-700 text-theme-700 dark:text-theme-300 hover:bg-theme-100 dark:hover:bg-theme-800">
                    <Upload className="h-4 w-4" />
                    Change Photo
                  </Button>
                </div>
                
                <div className="space-y-4 flex-1">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-theme-700 dark:text-theme-300">Full Name</Label>
                      <Input 
                        id="name" 
                        name="name" 
                        value={profile.name} 
                        onChange={handleProfileChange}
                        className="border-theme-200 dark:border-theme-700 bg-theme-50 dark:bg-theme-900"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-theme-700 dark:text-theme-300">Email Address</Label>
                      <Input 
                        id="email" 
                        name="email" 
                        type="email" 
                        value={profile.email} 
                        onChange={handleProfileChange}
                        className="border-theme-200 dark:border-theme-700 bg-theme-50 dark:bg-theme-900"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-theme-700 dark:text-theme-300">Phone Number</Label>
                      <Input 
                        id="phone" 
                        name="phone" 
                        value={profile.phone} 
                        onChange={handleProfileChange}
                        className="border-theme-200 dark:border-theme-700 bg-theme-50 dark:bg-theme-900"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="company" className="text-theme-700 dark:text-theme-300">Company/Store Name</Label>
                      <Input 
                        id="company" 
                        name="company" 
                        value={profile.company} 
                        onChange={handleProfileChange}
                        className="border-theme-200 dark:border-theme-700 bg-theme-50 dark:bg-theme-900"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="bio" className="text-theme-700 dark:text-theme-300">Bio</Label>
                    <Textarea 
                      id="bio" 
                      name="bio" 
                      value={profile.bio} 
                      onChange={handleProfileChange}
                      placeholder="Tell customers about your business..."
                      rows={4}
                      className="border-theme-200 dark:border-theme-700 bg-theme-50 dark:bg-theme-900"
                    />
                    <p className="text-sm text-theme-500 dark:text-theme-400">
                      This will be displayed on your public vendor profile.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end border-t border-theme-200 dark:border-theme-800 bg-theme-50 dark:bg-theme-900">
              <Button 
                onClick={() => saveSettings('profile')} 
                disabled={saving}
                className="flex items-center gap-2 bg-theme-primary hover:bg-theme-primary-hover text-theme-primary-foreground"
              >
                {saving ? 'Saving...' : (
                  <>
                    <Save className="h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        {/* Payment Settings */}
        <TabsContent value="payments" className="space-y-6">
          <Card className="border-theme-200 dark:border-theme-800">
            <CardHeader className="bg-theme-50 dark:bg-theme-900 border-b border-theme-200 dark:border-theme-800">
              <CardTitle className="text-theme-900 dark:text-theme-50">Payout Methods</CardTitle>
              <CardDescription className="text-theme-600 dark:text-theme-400">
                Manage your payout methods and preferences.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="space-y-4">
                {paymentMethods.map((method) => (
                  <div 
                    key={method.id} 
                    className={`p-4 border rounded-lg flex items-center justify-between ${
                      method.is_default 
                        ? 'border-theme-primary bg-theme-primary-light dark:bg-theme-primary-dark' 
                        : 'border-theme-200 dark:border-theme-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {method.type === 'bank_account' ? (
                        <CreditCard className="h-10 w-10 p-2 bg-theme-100 dark:bg-theme-800 rounded-md text-theme-700 dark:text-theme-300" />
                      ) : (
                        <div className="h-10 w-10 p-2 bg-theme-blue-light dark:bg-theme-blue-dark rounded-md flex items-center justify-center text-theme-blue dark:text-theme-blue-foreground font-bold">
                          P
                        </div>
                      )}
                      <div>
                        <div className="font-medium text-theme-900 dark:text-theme-50">{method.name}</div>
                        <div className="text-sm text-theme-500 dark:text-theme-400">{method.details}</div>
                        {method.is_default && (
                          <span className="text-xs text-theme-primary dark:text-theme-primary-foreground font-medium">Default</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {!method.is_default && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setDefaultPaymentMethod(method.id)}
                          className="border-theme-200 dark:border-theme-700 text-theme-700 dark:text-theme-300 hover:bg-theme-100 dark:hover:bg-theme-800"
                        >
                          Set as Default
                        </Button>
                      )}
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => removePaymentMethod(method.id)}
                        className="text-theme-danger hover:text-theme-danger-hover hover:bg-theme-danger-light dark:hover:bg-theme-danger-dark"
                        disabled={paymentMethods.length === 1}
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              
              <Button 
                variant="outline" 
                className="w-full border-theme-200 dark:border-theme-700 text-theme-700 dark:text-theme-300 hover:bg-theme-100 dark:hover:bg-theme-800"
              >
                Add New Payment Method
              </Button>
              
              <div className="bg-theme-warning-light dark:bg-theme-warning-dark border border-theme-warning-border dark:border-theme-warning-border-dark rounded-md p-3 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-theme-warning dark:text-theme-warning-foreground mt-0.5" />
                <p className="text-xs text-theme-warning-foreground dark:text-theme-warning-foreground-dark">
                  For security reasons, any changes to your payment methods may require additional verification.
                </p>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between border-t border-theme-200 dark:border-theme-800 bg-theme-50 dark:bg-theme-900">
              <div className="text-sm text-theme-500 dark:text-theme-400">
                Last updated: March 24, 2025
              </div>
              <Button 
                onClick={() => saveSettings('payment')} 
                disabled={saving}
                className="bg-theme-primary hover:bg-theme-primary-hover text-theme-primary-foreground"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        {/* Notification Settings */}
        <TabsContent value="notifications" className="space-y-6">
          <Card className="border-theme-200 dark:border-theme-800">
            <CardHeader className="bg-theme-50 dark:bg-theme-900 border-b border-theme-200 dark:border-theme-800">
              <CardTitle className="text-theme-900 dark:text-theme-50">Notification Preferences</CardTitle>
              <CardDescription className="text-theme-600 dark:text-theme-400">
                Choose how and when you want to be notified.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div>
                <h3 className="text-lg font-medium mb-4 text-theme-900 dark:text-theme-50">Email Notifications</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-theme-900 dark:text-theme-50">New Order Notifications</p>
                      <p className="text-sm text-theme-500 dark:text-theme-400">
                        Receive an email when a new order is placed
                      </p>
                    </div>
                    <Switch 
                      checked={notifications.email_orders}
                      onCheckedChange={(checked) => handleNotificationChange('email_orders', checked)}
                      className="bg-theme-300 dark:bg-theme-700 data-[state=checked]:bg-theme-primary"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-theme-900 dark:text-theme-50">Low Stock Alerts</p>
                      <p className="text-sm text-theme-500 dark:text-theme-400">
                        Get notified when products are running low
                      </p>
                    </div>
                    <Switch 
                      checked={notifications.email_stock}
                      onCheckedChange={(checked) => handleNotificationChange('email_stock', checked)}
                      className="bg-theme-300 dark:bg-theme-700 data-[state=checked]:bg-theme-primary"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-theme-900 dark:text-theme-50">Payout Confirmations</p>
                      <p className="text-sm text-theme-500 dark:text-theme-400">
                        Receive emails about payout status changes
                      </p>
                    </div>
                    <Switch 
                      checked={notifications.email_payouts}
                      onCheckedChange={(checked) => handleNotificationChange('email_payouts', checked)}
                      className="bg-theme-300 dark:bg-theme-700 data-[state=checked]:bg-theme-primary"
                    />
                  </div>
                </div>
              </div>
              
              <div className="border-t border-theme-200 dark:border-theme-700 pt-6">
                <h3 className="text-lg font-medium mb-4 text-theme-900 dark:text-theme-50">Push Notifications</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-theme-900 dark:text-theme-50">New Order Notifications</p>
                      <p className="text-sm text-theme-500 dark:text-theme-400">
                        Receive push notifications for new orders
                      </p>
                    </div>
                    <Switch 
                      checked={notifications.push_orders}
                      onCheckedChange={(checked) => handleNotificationChange('push_orders', checked)}
                      className="bg-theme-300 dark:bg-theme-700 data-[state=checked]:bg-theme-primary"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-theme-900 dark:text-theme-50">Low Stock Alerts</p>
                      <p className="text-sm text-theme-500 dark:text-theme-400">
                        Get push notifications for low stock items
                      </p>
                    </div>
                    <Switch 
                      checked={notifications.push_stock}
                      onCheckedChange={(checked) => handleNotificationChange('push_stock', checked)}
                      className="bg-theme-300 dark:bg-theme-700 data-[state=checked]:bg-theme-primary"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-theme-900 dark:text-theme-50">Payout Confirmations</p>
                      <p className="text-sm text-theme-500 dark:text-theme-400">
                        Receive push notifications about payouts
                      </p>
                    </div>
                    <Switch 
                      checked={notifications.push_payouts}
                      onCheckedChange={(checked) => handleNotificationChange('push_payouts', checked)}
                      className="bg-theme-300 dark:bg-theme-700 data-[state=checked]:bg-theme-primary"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end border-t border-theme-200 dark:border-theme-800 bg-theme-50 dark:bg-theme-900">
              <Button 
                onClick={() => saveSettings('notification')} 
                disabled={saving}
                className="bg-theme-primary hover:bg-theme-primary-hover text-theme-primary-foreground"
              >
                {saving ? 'Saving...' : 'Save Preferences'}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        {/* Security Settings */}
        <TabsContent value="security" className="space-y-6">
          <Card className="border-theme-200 dark:border-theme-800">
            <CardHeader className="bg-theme-50 dark:bg-theme-900 border-b border-theme-200 dark:border-theme-800">
              <CardTitle className="text-theme-900 dark:text-theme-50">Security Settings</CardTitle>
              <CardDescription className="text-theme-600 dark:text-theme-400">
                Manage your account security preferences.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-theme-900 dark:text-theme-50">Two-Factor Authentication</p>
                  <p className="text-sm text-theme-500 dark:text-theme-400">
                    Add an extra layer of security to your account
                  </p>
                </div>
                <Switch 
                  checked={security.two_factor_enabled}
                  onCheckedChange={(checked) => handleSecurityChange('two_factor_enabled', checked)}
                  className="bg-theme-300 dark:bg-theme-700 data-[state=checked]:bg-theme-primary"
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-theme-900 dark:text-theme-50">Login Notifications</p>
                  <p className="text-sm text-theme-500 dark:text-theme-400">
                    Receive alerts about new logins to your account
                  </p>
                </div>
                <Switch 
                  checked={security.login_notifications}
                  onCheckedChange={(checked) => handleSecurityChange('login_notifications', checked)}
                  className="bg-theme-300 dark:bg-theme-700 data-[state=checked]:bg-theme-primary"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="auto_logout" className="text-theme-700 dark:text-theme-300">Auto Logout</Label>
                <Select 
                  value={security.auto_logout}
                  onValueChange={(value) => handleSecurityChange('auto_logout', value)}
                >
                  <SelectTrigger id="auto_logout" className="border-theme-200 dark:border-theme-700 bg-theme-50 dark:bg-theme-900">
                    <SelectValue placeholder="Select timeout period" />
                  </SelectTrigger>
                  <SelectContent className="border-theme-200 dark:border-theme-700 bg-theme-50 dark:bg-theme-900">
                    <SelectItem value="15" className="text-theme-900 dark:text-theme-50 focus:bg-theme-100 dark:focus:bg-theme-800">15 minutes</SelectItem>
                    <SelectItem value="30" className="text-theme-900 dark:text-theme-50 focus:bg-theme-100 dark:focus:bg-theme-800">30 minutes</SelectItem>
                    <SelectItem value="60" className="text-theme-900 dark:text-theme-50 focus:bg-theme-100 dark:focus:bg-theme-800">1 hour</SelectItem>
                    <SelectItem value="120" className="text-theme-900 dark:text-theme-50 focus:bg-theme-100 dark:focus:bg-theme-800">2 hours</SelectItem>
                    <SelectItem value="never" className="text-theme-900 dark:text-theme-50 focus:bg-theme-100 dark:focus:bg-theme-800">Never</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-theme-500 dark:text-theme-400">
                  Automatically log out after a period of inactivity
                </p>
              </div>
              
              <div className="pt-4">
                <Button 
                  variant="outline" 
                  className="w-full border-theme-200 dark:border-theme-700 text-theme-700 dark:text-theme-300 hover:bg-theme-100 dark:hover:bg-theme-800"
                >
                  Change Password
                </Button>
              </div>
              
              <div className="pt-2">
                <Button 
                  variant="outline" 
                  className="w-full border-theme-danger text-theme-danger hover:text-theme-danger-hover hover:bg-theme-danger-light dark:hover:bg-theme-danger-dark"
                >
                  Delete Account
                </Button>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end border-t border-theme-200 dark:border-theme-800 bg-theme-50 dark:bg-theme-900">
              <Button 
                onClick={() => saveSettings('security')} 
                disabled={saving}
                className="bg-theme-primary hover:bg-theme-primary-hover text-theme-primary-foreground"
              >
                {saving ? 'Saving...' : 'Save Security Settings'}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
