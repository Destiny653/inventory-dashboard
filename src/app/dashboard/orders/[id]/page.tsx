 'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Loader2, Mail, MessageSquare } from 'lucide-react'
import { toast } from 'sonner'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

interface Order {
  id: string
  status: string
  total_amount: number
  created_at: string
  updated_at: string
  user_id: string
  payment_method?: string
  shipping_method?: string
  shipping_address: {
    fullName: string
    addressLine1: string
    addressLine2?: string
    city: string
    state: string
    postalCode: string
    country: string
    phoneNumber?: string
  }
  billing_address: {
    fullName: string
    addressLine1: string
    addressLine2?: string
    city: string
    state: string
    postalCode: string
    country: string
    phoneNumber?: string
  }
  payment_status: string
  payment_intent_id: string | null
  user?: {
    email: string
    full_name?: string
    avatar_url?: string
  }
  items?: {
    id: string
    product_id: string
    product_name: string
    quantity: number
    price_at_time: number
    product_image?: string
  }[]
}

export default function OrderDetailPage() {
  const router = useRouter()
  const params = useParams()
  const { id } = params as { id: string }
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updating, setUpdating] = useState(false)
  const [showContactForm, setShowContactForm] = useState(false)
  const [message, setMessage] = useState('')
  const [sendingMessage, setSendingMessage] = useState(false)

  useEffect(() => {
    if (!id) {
      setError('Invalid order ID')
      setLoading(false)
      return
    }
    fetchOrderWithUser()
  }, [id])

  async function fetchOrderWithUser() {
    try {
      setLoading(true)
      setError(null)
      
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', id)
        .single()

      if (orderError) throw orderError
      if (!orderData) {
        setError('Order not found')
        return
      }

      const { data: userProfile, error: userError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', orderData.user_id)
        .single()

      if (userError) throw userError

      const { data: orderItems, error: itemsError } = await supabase
        .from('order_items')
        .select(`
          *,
          products:product_id (name, image_url)
        `)
        .eq('order_id', id)

      if (itemsError) throw itemsError

      const formattedOrder = {
        ...orderData,
        user: userProfile || {
          email: 'Unknown',
          full_name: orderData.shipping_address?.fullName || 'Customer',
          avatar_url: null
        },
        items: orderItems?.map(item => ({
          ...item,
          product_name: item.products?.name || 'Unknown product',
          product_image: item.products?.image_url || null
        })) || []
      }

      setOrder(formattedOrder)
    } catch (error) {
      console.error('Error loading order:', error)
      setError('Failed to load order details')
      toast.error('Failed to load order details')
    } finally {
      setLoading(false)
    }
  }

  async function updateOrderStatus(newStatus: string) {
    if (!order) return

    try {
      setUpdating(true)
      const { error } = await supabase
        .from('orders')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', order.id)

      if (error) throw error

      setOrder(prev => prev ? { 
        ...prev, 
        status: newStatus,
        updated_at: new Date().toISOString()
      } : null)
      toast.success(`Order status updated to ${newStatus}`)
    } catch (error) {
      console.error('Error updating order status:', error)
      toast.error('Failed to update order status: ' + (error instanceof Error ? error.message : 'Unknown error')) 
    } finally {
      setUpdating(false)
    }
  }

  async function sendMessage() {
    if (!order || !message.trim()) return

    try {
      setSendingMessage(true)
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: order.user?.email,
          subject: `Regarding your order #${order.id.slice(0, 8)}`,
          message: message
        })
      })

      const result = await response.json()
      if (!result.success) throw new Error(result.error || 'Failed to send message')

      toast.success('Message sent successfully')
      setShowContactForm(false)
      setMessage('')
    } catch (error) {
      console.error('Error sending message:', error)
      toast.error('Failed to send message')
    } finally {
      setSendingMessage(false)
    }
  }

  function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  function getStatusBadgeColor(status: string): string {
    switch (status.toLowerCase()) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'processing': return 'bg-blue-100 text-blue-800'
      case 'shipped': return 'bg-purple-100 text-purple-800'
      case 'delivered': return 'bg-green-100 text-green-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  function getPaymentStatusColor(status: string): string {
    switch (status.toLowerCase()) {
      case 'paid': return 'text-green-600'
      case 'pending': return 'text-yellow-600'
      case 'failed': return 'text-red-600'
      case 'refunded': return 'text-blue-600'
      default: return 'text-gray-600'
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading order details...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto py-8 px-4 bg-gray-50 min-h-screen">
        <Button
          variant="outline"
          className="mb-6"
          onClick={() => router.push('/dashboard/orders')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Orders
        </Button>
        <div className="flex flex-col items-center justify-center h-64 bg-white rounded-lg p-8 border">
          <p className="text-red-500 mb-4 font-medium">{error}</p>
          <Button onClick={() => router.push('/dashboard/orders')}>
            Return to Orders
          </Button>
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="container mx-auto py-8 px-4 bg-gray-50 min-h-screen">
        <Button
          variant="outline"
          className="mb-6"
          onClick={() => router.push('/dashboard/orders')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Orders
        </Button>
        <div className="flex flex-col items-center justify-center h-64 bg-white rounded-lg p-8 border">
          <p className="text-gray-500 mb-4">No order data available</p>
          <Button onClick={() => router.push('/dashboard/orders')}>
            Return to Orders
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4 bg-gray-50 min-h-screen">
      <Button
        variant="outline"
        className="mb-6"
        onClick={() => router.push('/dashboard/orders')}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Orders
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Order Summary and Items */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Summary Card */}
          <Card className="border">
            <CardHeader className="bg-gray-50 rounded-t-lg">
              <div className="flex justify-between items-center">
                <CardTitle>Order #{order.id.slice(0, 8)}</CardTitle>
                <Badge className={`${getStatusBadgeColor(order.status)} font-medium`}>
                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Order Date</p>
                    <p>{formatDate(order.created_at)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Last Updated</p>
                    <p>{formatDate(order.updated_at)}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Payment Method</p>
                    <p>{order.payment_method || 'Not specified'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Payment Status</p>
                    <p className={`font-medium ${getPaymentStatusColor(order.payment_status)}`}>
                      {order.payment_status}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Shipping Method</p>
                  <p>{order.shipping_method}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Order Items Card */}
          <Card className="border">
            <CardHeader className="bg-gray-50 rounded-t-lg">
              <CardTitle>Order Items</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-gray-50">
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {order.items?.map((item) => (
                    <TableRow key={item.id} className="hover:bg-gray-50">
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-3">
                          {item.product_image ? (
                            <img 
                              src={item.product_image} 
                              alt={item.product_name}
                              className="h-10 w-10 rounded-md object-cover"
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-md bg-gray-100 flex items-center justify-center">
                              <span className="text-xs text-gray-500">No image</span>
                            </div>
                          )}
                          <span>{item.product_name}</span>
                        </div>
                      </TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>${item.price_at_time.toFixed(2)}</TableCell>
                      <TableCell className="text-right font-medium">
                        ${(item.quantity * item.price_at_time).toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-gray-50">
                    <TableCell colSpan={3} className="text-right font-medium">
                      Subtotal
                    </TableCell>
                    <TableCell className="text-right font-bold">
                      ${order.total_amount.toFixed(2)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Customer Info and Actions */}
        <div className="space-y-6">
          {/* Customer Card */}
          <Card className="border">
            <CardHeader className="bg-gray-50 rounded-t-lg">
              <div className="flex justify-between items-center">
                <CardTitle>Customer</CardTitle>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setShowContactForm(true)}
                >
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Contact
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <Avatar>
                  <AvatarImage src={order.user?.avatar_url || ''} />
                  <AvatarFallback>
                    {order.user?.full_name?.charAt(0) || 'C'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{order.user?.full_name || 'Customer'}</p>
                  <p className="text-sm text-muted-foreground">{order.user?.email}</p>
                  {order.shipping_address.phoneNumber && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {order.shipping_address.phoneNumber}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Shipping Address Card */}
          <Card className="border">
            <CardHeader className="bg-gray-50 rounded-t-lg">
              <CardTitle>Shipping Address</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-2">
                <p className="font-medium">{order.shipping_address.fullName}</p>
                <p>{order.shipping_address.addressLine1}</p>
                {order.shipping_address.addressLine2 && (
                  <p>{order.shipping_address.addressLine2}</p>
                )}
                <p>
                  {order.shipping_address.city}, {order.shipping_address.state}{' '}
                  {order.shipping_address.postalCode}
                </p>
                <p>{order.shipping_address.country}</p>
              </div>
            </CardContent>
          </Card>

          {/* Status Update Card */}
          <Card className="border">
            <CardHeader className="bg-gray-50 rounded-t-lg">
              <CardTitle>Update Status</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <Select
                value={order.status}
                onValueChange={updateOrderStatus}
                disabled={updating}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="shipped">Shipped</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="destructive"
                onClick={() => updateOrderStatus('cancelled')}
                disabled={updating || order.status === 'cancelled'}
                className="w-full"
              >
                {updating ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Cancel Order
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Contact Form Modal */}
      {showContactForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Contact Customer</h3>
              <button 
                onClick={() => setShowContactForm(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">To:</p>
                <p className="font-medium">{order.user?.email}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Subject:</p>
                <p className="font-medium">Regarding your order #{order.id.slice(0, 8)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Message:</p>
                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type your message here..."
                  className="min-h-[120px]"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setShowContactForm(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={sendMessage}
                  disabled={!message.trim() || sendingMessage}
                >
                  {sendingMessage ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Mail className="mr-2 h-4 w-4" />
                  )}
                  Send Message
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}