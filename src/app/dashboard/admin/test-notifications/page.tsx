'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { NotificationService } from '@/lib/notificationService'
import { toast } from 'sonner'
import { 
  Bell, 
  ShoppingCart, 
  AlertTriangle, 
  User, 
  Package,
  Send,
  Loader2
} from 'lucide-react'

export default function TestNotificationsPage() {
  const [loading, setLoading] = useState(false)
  const [notificationType, setNotificationType] = useState<'order' | 'stock' | 'system' | 'new_signup'>('system')
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [targetRole, setTargetRole] = useState<'admin' | 'vendor' | 'customer'>('admin')

  const sendTestNotification = async () => {
    if (!title || !message) {
      toast.error('Please fill in both title and message')
      return
    }

    setLoading(true)
    try {
      const notifications = await NotificationService.sendNotificationToRole(targetRole, {
        title,
        message,
        type: notificationType,
        metadata: {
          test: true,
          timestamp: new Date().toISOString(),
          sender: 'Test System'
        }
      })

      if (notifications.length > 0) {
        toast.success(`Sent ${notifications.length} notification(s) to ${targetRole}s`)
        setTitle('')
        setMessage('')
      } else {
        toast.warning(`No ${targetRole}s found to send notifications to`)
      }
    } catch (error) {
      console.error('Error sending test notification:', error)
      toast.error('Failed to send notification')
    } finally {
      setLoading(false)
    }
  }

  const sendOrderNotification = async () => {
    setLoading(true)
    try {
      await NotificationService.sendNewOrderNotification({
        orderId: 'test-order-123',
        orderNumber: 'ORD-2024-001',
        customerId: 'test-customer-id',
        vendorId: 'test-vendor-id',
        status: 'pending',
        totalAmount: 99.99
      })
      toast.success('Order notification sent successfully')
    } catch (error) {
      console.error('Error sending order notification:', error)
      toast.error('Failed to send order notification')
    } finally {
      setLoading(false)
    }
  }

  const sendStockNotification = async () => {
    setLoading(true)
    try {
      await NotificationService.sendLowStockNotification({
        productId: 'test-product-123',
        productName: 'Test Product',
        currentStock: 3,
        threshold: 5,
        vendorId: 'test-vendor-id'
      })
      toast.success('Stock notification sent successfully')
    } catch (error) {
      console.error('Error sending stock notification:', error)
      toast.error('Failed to send stock notification')
    } finally {
      setLoading(false)
    }
  }

  const sendStatusUpdateNotification = async () => {
    setLoading(true)
    try {
      await NotificationService.sendOrderStatusNotification({
        orderId: 'test-order-123',
        orderNumber: 'ORD-2024-001',
        customerId: 'test-customer-id',
        vendorId: 'test-vendor-id',
        status: 'shipped',
        totalAmount: 99.99,
        oldStatus: 'processing'
      })
      toast.success('Status update notification sent successfully')
    } catch (error) {
      console.error('Error sending status update notification:', error)
      toast.error('Failed to send status update notification')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Test Notification System</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Custom Notification */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Send Custom Notification
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="type">Notification Type</Label>
              <Select value={notificationType} onValueChange={(value: any) => setNotificationType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="system">System</SelectItem>
                  <SelectItem value="order">Order</SelectItem>
                  <SelectItem value="stock">Stock</SelectItem>
                  <SelectItem value="new_signup">New Signup</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Target Role</Label>
              <Select value={targetRole} onValueChange={(value: any) => setTargetRole(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="vendor">Vendor</SelectItem>
                  <SelectItem value="customer">Customer</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Notification title"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Notification message"
                rows={3}
              />
            </div>

            <Button 
              onClick={sendTestNotification}
              disabled={loading || !title || !message}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send Notification
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Predefined Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Predefined Notifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <Button 
                onClick={sendOrderNotification}
                disabled={loading}
                variant="outline"
                className="w-full justify-start"
              >
                <ShoppingCart className="h-4 w-4 mr-2" />
                Send New Order Notification
              </Button>

              <Button 
                onClick={sendStockNotification}
                disabled={loading}
                variant="outline"
                className="w-full justify-start"
              >
                <AlertTriangle className="h-4 w-4 mr-2" />
                Send Low Stock Alert
              </Button>

              <Button 
                onClick={sendStatusUpdateNotification}
                disabled={loading}
                variant="outline"
                className="w-full justify-start"
              >
                <Bell className="h-4 w-4 mr-2" />
                Send Status Update
              </Button>
            </div>

            {loading && (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Information Card */}
      <Card>
        <CardHeader>
          <CardTitle>How the Notification System Works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h4 className="font-semibold mb-2">Real-time Notifications</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Notifications appear instantly in the header bell</li>
                <li>• Toast notifications show for new messages</li>
                <li>• Unread count updates automatically</li>
                <li>• Click to mark as read</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Notification Types</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• <strong>Order:</strong> New orders and status updates</li>
                <li>• <strong>Stock:</strong> Low stock alerts</li>
                <li>• <strong>System:</strong> General system messages</li>
                <li>• <strong>Status Update:</strong> Order status changes</li>
                <li>• <strong>New Signup:</strong> New user registrations</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 