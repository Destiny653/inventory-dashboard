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
import { Separator } from '@/components/ui/separator'
import { AlertCircle, Save, Store, CreditCard, Bell, ShieldAlert } from 'lucide-react'
import {ChangeEvent} from "react";

export default function AdminSettingsPage() {
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    // General settings
    const [general, setGeneral] = useState({
        site_name: 'MultiVendor Market',
        site_description: 'A marketplace for multiple vendors to sell their products.',
        support_email: 'support@multivendor.com',
        contact_phone: '(555) 123-4567',
        address: '123 Market Street, San Francisco, CA 94103',
    })

    // Commission settings
    const [commission, setCommission] = useState({
        base_rate: '10',
        featured_product_fee: '5',
        minimum_payout: '50',
        payout_schedule: 'monthly',
    })

    // Email settings
    const [email, setEmail] = useState({
        welcome_email_enabled: true,
        order_confirmation_enabled: true,
        shipping_updates_enabled: true,
        review_request_enabled: true,
        marketing_emails_enabled: false,
    })

    // Security settings
    const [security, setSecurity] = useState({
        vendor_approval_required: true,
        product_approval_required: true,
        two_factor_required_for_admin: true,
        password_expiry_days: '90',
        login_attempts_before_lockout: '5',
    })

    useEffect(() => {
        async function loadSettings() {
            try {
                setLoading(true)

                // In a real app, these would be actual Supabase queries
                // For demo, we're using the mock data initialized above

                // Simulate API call delay
                await new Promise(resolve => setTimeout(resolve, 500))

            } catch (error) {
                console.error('Error loading settings:', error)
            } finally {
                setLoading(false)
            }
        }

        loadSettings()
    }, [])

    const handleGeneralChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target
        setGeneral(prev => ({ ...prev, [name]: value }))
    }

    const handleCommissionChange = (key: string, value: string) => {
        setCommission(prev => ({ ...prev, [key]: value }))
    }

    const handleEmailChange = (key: string, value: boolean) => {
        setEmail(prev => ({ ...prev, [key]: value }))
    }

    const handleSecurityChange = (key: string, value: string | boolean) => {
        setSecurity(prev => ({ ...prev, [key]: value }))
    }

    const saveSettings = async (section: string) => {
        try {
            setSaving(true)

            // In a real app, this would save to Supabase
            await new Promise(resolve => setTimeout(resolve, 800))

            toast.success(`Your ${section} settings have been updated successfully.`, {
                description: "Settings saved",
            })
        } catch (error) {
            console.error(`Error saving ${section} settings:`, error)
            toast.error("There was a problem saving your settings. Please try again.", {
                description: "Error saving settings",
            })
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return <div className="flex justify-center items-center h-64">Loading settings...</div>
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">Admin Settings</h1>
            </div>

            <Tabs defaultValue="general" className="space-y-6">
                <TabsList className="grid grid-cols-4 w-full max-w-2xl">
                    <TabsTrigger value="general" className="flex items-center gap-2">
                        <Store className="h-4 w-4" />
                        <span className="hidden sm:inline">General</span>
                    </TabsTrigger>
                    <TabsTrigger value="commission" className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4" />
                        <span className="hidden sm:inline">Commission</span>
                    </TabsTrigger>
                    <TabsTrigger value="email" className="flex items-center gap-2">
                        <Bell className="h-4 w-4" />
                        <span className="hidden sm:inline">Email</span>
                    </TabsTrigger>
                    <TabsTrigger value="security" className="flex items-center gap-2">
                        <ShieldAlert className="h-4 w-4" />
                        <span className="hidden sm:inline">Security</span>
                    </TabsTrigger>
                </TabsList>

                {/* General Settings */}
                <TabsContent value="general" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>General Settings</CardTitle>
                            <CardDescription>
                                Configure basic information about your marketplace.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="site_name">Site Name</Label>
                                        <Input
                                            id="site_name"
                                            name="site_name"
                                            value={general.site_name}
                                            onChange={handleGeneralChange}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="support_email">Support Email</Label>
                                        <Input
                                            id="support_email"
                                            name="support_email"
                                            type="email"
                                            value={general.support_email}
                                            onChange={handleGeneralChange}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="contact_phone">Contact Phone</Label>
                                        <Input
                                            id="contact_phone"
                                            name="contact_phone"
                                            value={general.contact_phone}
                                            onChange={handleGeneralChange}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="address">Business Address</Label>
                                    <Textarea
                                        id="address"
                                        name="address"
                                        value={general.address}
                                        onChange={handleGeneralChange}
                                        rows={2}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="site_description">Site Description</Label>
                                    <Textarea
                                        id="site_description"
                                        name="site_description"
                                        value={general.site_description}
                                        onChange={handleGeneralChange}
                                        rows={3}
                                    />
                                    <p className="text-sm text-muted-foreground">
                                        This description will be used for SEO and may appear in search results.
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="flex justify-end">
                            <Button
                                onClick={() => saveSettings('general')}
                                disabled={saving}
                                className="flex items-center gap-2"
                            >
                                {saving ? 'Saving...' : (
                                    <>
                                        <Save className="h-4 w-4" />
                                        Save Settings
                                    </>
                                )}
                            </Button>
                        </CardFooter>
                    </Card>
                </TabsContent>

                {/* Commission Settings */}
                <TabsContent value="commission" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Commission Settings</CardTitle>
                            <CardDescription>
                                Configure how your marketplace charges vendors.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="base_rate">Base Commission Rate (%)</Label>
                                        <Input
                                            id="base_rate"
                                            type="number"
                                            min="0"
                                            max="100"
                                            value={commission.base_rate}
                                            onChange={(e) => handleCommissionChange('base_rate', e.target.value)}
                                        />
                                        <p className="text-sm text-muted-foreground">
                                            Percentage of each sale that goes to the marketplace.
                                        </p>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="featured_product_fee">Featured Product Fee ($)</Label>
                                        <Input
                                            id="featured_product_fee"
                                            type="number"
                                            min="0"
                                            value={commission.featured_product_fee}
                                            onChange={(e) => handleCommissionChange('featured_product_fee', e.target.value)}
                                        />
                                        <p className="text-sm text-muted-foreground">
                                            Additional fee for featuring a product on the homepage.
                                        </p>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="minimum_payout">Minimum Payout Amount ($)</Label>
                                        <Input
                                            id="minimum_payout"
                                            type="number"
                                            min="0"
                                            value={commission.minimum_payout}
                                            onChange={(e) => handleCommissionChange('minimum_payout', e.target.value)}
                                        />
                                        <p className="text-sm text-muted-foreground">
                                            Minimum balance required before vendors can request a payout.
                                        </p>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="payout_schedule">Payout Schedule</Label>
                                        <Select
                                            value={commission.payout_schedule}
                                            onValueChange={(value) => handleCommissionChange('payout_schedule', value)}
                                        >
                                            <SelectTrigger id="payout_schedule">
                                                <SelectValue placeholder="Select payout schedule" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="weekly">Weekly</SelectItem>
                                                <SelectItem value="biweekly">Bi-weekly</SelectItem>
                                                <SelectItem value="monthly">Monthly</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <p className="text-sm text-muted-foreground">
                                            How often vendor payouts are processed.
                                        </p>
                                    </div>
                                </div>

                                <div className="bg-amber-50 border border-amber-200 rounded-md p-3 flex items-start gap-2">
                                    <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5" />
                                    <p className="text-xs text-amber-800">
                                        Changes to commission rates will only apply to new sales. Existing orders will use the rates that were in effect at the time of purchase.
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="flex justify-end">
                            <Button
                                onClick={() => saveSettings('commission')}
                                disabled={saving}
                            >
                                {saving ? 'Saving...' : 'Save Settings'}
                            </Button>
                        </CardFooter>
                    </Card>
                </TabsContent>

                {/* Email Settings */}
                <TabsContent value="email" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Email Notification Settings</CardTitle>
                            <CardDescription>
                                Configure automated emails sent by the marketplace.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-medium">Welcome Email</p>
                                        <p className="text-sm text-muted-foreground">
                                            Send welcome email to new users when they sign up
                                        </p>
                                    </div>
                                    <Switch
                                        checked={email.welcome_email_enabled}
                                        onCheckedChange={(checked) => handleEmailChange('welcome_email_enabled', checked)}
                                    />
                                </div>

                                <Separator />

                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-medium">Order Confirmation</p>
                                        <p className="text-sm text-muted-foreground">
                                            Send email confirmation when an order is placed
                                        </p>
                                    </div>
                                    <Switch
                                        checked={email.order_confirmation_enabled}
                                        onCheckedChange={(checked) => handleEmailChange('order_confirmation_enabled', checked)}
                                    />
                                </div>

                                <Separator />

                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-medium">Shipping Updates</p>
                                        <p className="text-sm text-muted-foreground">
                                            Send email notifications for shipping status changes
                                        </p>
                                    </div>
                                    <Switch
                                        checked={email.shipping_updates_enabled}
                                        onCheckedChange={(checked) => handleEmailChange('shipping_updates_enabled', checked)}
                                    />
                                </div>

                                <Separator />

                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-medium">Review Requests</p>
                                        <p className="text-sm text-muted-foreground">
                                            Send email asking customers to review products after delivery
                                        </p>
                                    </div>
                                    <Switch
                                        checked={email.review_request_enabled}
                                        onCheckedChange={(checked) => handleEmailChange('review_request_enabled', checked)}
                                    />
                                </div>

                                <Separator />

                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-medium">Marketing Emails</p>
                                        <p className="text-sm text-muted-foreground">
                                            Send promotional emails about sales and new products
                                        </p>
                                    </div>
                                    <Switch
                                        checked={email.marketing_emails_enabled}
                                        onCheckedChange={(checked) => handleEmailChange('marketing_emails_enabled', checked)}
                                    />
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="flex justify-end">
                            <Button
                                onClick={() => saveSettings('email')}
                                disabled={saving}
                            >
                                {saving ? 'Saving...' : 'Save Settings'}
                            </Button>
                        </CardFooter>
                    </Card>
                </TabsContent>

                {/* Security Settings */}
                <TabsContent value="security" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Security Settings</CardTitle>
                            <CardDescription>
                                Configure security policies for your marketplace.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-medium">Vendor Approval Required</p>
                                        <p className="text-sm text-muted-foreground">
                                            New vendor accounts require admin approval before they can sell
                                        </p>
                                    </div>
                                    <Switch
                                        checked={security.vendor_approval_required}
                                        onCheckedChange={(checked) => handleSecurityChange('vendor_approval_required', checked)}
                                    />
                                </div>

                                <Separator />

                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-medium">Product Approval Required</p>
                                        <p className="text-sm text-muted-foreground">
                                            New products require admin approval before they appear in the marketplace
                                        </p>
                                    </div>
                                    <Switch
                                        checked={security.product_approval_required}
                                        onCheckedChange={(checked) => handleSecurityChange('product_approval_required', checked)}
                                    />
                                </div>

                                <Separator />

                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-medium">Two-Factor Authentication for Admins</p>
                                        <p className="text-sm text-muted-foreground">
                                            Require two-factor authentication for all admin accounts
                                        </p>
                                    </div>
                                    <Switch
                                        checked={security.two_factor_required_for_admin}
                                        onCheckedChange={(checked) => handleSecurityChange('two_factor_required_for_admin', checked)}
                                    />
                                </div>

                                <Separator />

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="password_expiry_days">Password Expiry (days)</Label>
                                        <Input
                                            id="password_expiry_days"
                                            type="number"
                                            min="0"
                                            value={security.password_expiry_days}
                                            onChange={(e) => handleSecurityChange('password_expiry_days', e.target.value)}
                                        />
                                        <p className="text-sm text-muted-foreground">
                                            Number of days before users are required to change their password (0 = never)
                                        </p>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="login_attempts_before_lockout">Failed Login Attempts Before Lockout</Label>
                                        <Input
                                            id="login_attempts_before_lockout"
                                            type="number"
                                            min="1"
                                            max="10"
                                            value={security.login_attempts_before_lockout}
                                            onChange={(e) => handleSecurityChange('login_attempts_before_lockout', e.target.value)}
                                        />
                                        <p className="text-sm text-muted-foreground">
                                            Number of failed login attempts before an account is temporarily locked
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="flex justify-end">
                            <Button
                                onClick={() => saveSettings('security')}
                                disabled={saving}
                            >
                                {saving ? 'Saving...' : 'Save Settings'}
                            </Button>
                        </CardFooter>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
