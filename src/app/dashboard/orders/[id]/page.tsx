 'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Loader2 } from 'lucide-react'
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
      
      // First fetch the order
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

      // Then fetch the user profile
      const { data: userProfile, error: userError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', orderData.user_id)
        .single()

      if (userError) throw userError

      // Fetch order items with product names
      const { data: orderItems, error: itemsError } = await supabase
        .from('order_items')
        .select(`
          *,
          products:product_id (name)
        `)
        .eq('order_id', id)

      if (itemsError) throw itemsError

      // Combine all the data
      const formattedOrder = {
        ...orderData,
        user: userProfile || {
          email: 'Unknown',
          full_name: orderData.shipping_address?.fullName || 'Customer',
          avatar_url: null
        },
        items: orderItems?.map(item => ({
          ...item,
          product_name: item.products?.name || 'Unknown product'
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
      toast.error('Failed to update order status')
    } finally {
      setUpdating(false)
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
      case 'pending': return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100'
      case 'processing': return 'bg-blue-100 text-blue-800 hover:bg-blue-100'
      case 'shipped': return 'bg-purple-100 text-purple-800 hover:bg-purple-100'
      case 'delivered': return 'bg-green-100 text-green-800 hover:bg-green-100'
      case 'cancelled': return 'bg-red-100 text-red-800 hover:bg-red-100'
      default: return 'bg-gray-100 text-gray-800 hover:bg-gray-100'
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
      <div className="flex justify-center items-center h-screen bg-gradient-to-br from-blue-50 to-purple-50">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-blue-800">Loading order details...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto py-8 px-4 bg-gradient-to-br from-blue-50 to-purple-50 min-h-screen">
        <Button
          variant="outline"
          className="mb-6 bg-white hover:bg-gray-50 border-blue-200 text-blue-800"
          onClick={() => router.push('/dashboard/orders')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Orders
        </Button>
        <div className="flex flex-col items-center justify-center h-64 bg-white rounded-lg shadow-sm p-8 border border-red-100">
          <p className="text-red-500 mb-4 font-medium">{error}</p>
          <Button 
            onClick={() => router.push('/dashboard/orders')}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Return to Orders
          </Button>
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="container mx-auto py-8 px-4 bg-gradient-to-br from-blue-50 to-purple-50 min-h-screen">
        <Button
          variant="outline"
          className="mb-6 bg-white hover:bg-gray-50 border-blue-200 text-blue-800"
          onClick={() => router.push('/dashboard/orders')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Orders
        </Button>
        <div className="flex flex-col items-center justify-center h-64 bg-white rounded-lg shadow-sm p-8 border border-gray-100">
          <p className="text-gray-500 mb-4">No order data available</p>
          <Button 
            onClick={() => router.push('/dashboard/orders')}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Return to Orders
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4 bg-gradient-to-br from-blue-50 to-purple-50 min-h-screen">
      <Button
        variant="outline"
        className="mb-6 bg-white hover:bg-gray-50 border-blue-200 text-blue-800"
        onClick={() => router.push('/dashboard/orders')}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Orders
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Order Summary and Items */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Summary Card */}
          <Card className="border border-gray-200 shadow-sm bg-white">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-t-lg">
              <div className="flex justify-between items-center">
                <CardTitle className="text-blue-800">Order #{order.id.slice(0, 8)}</CardTitle>
                <Badge className={`${getStatusBadgeColor(order.status)} text-sm font-medium`}>
                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <p className="text-sm text-blue-600 font-medium">Order Date</p>
                    <p className="text-blue-800">{formatDate(order.created_at)}</p>
                  </div>
                  <div className="bg-purple-50 p-3 rounded-lg">
                    <p className="text-sm text-purple-600 font-medium">Last Updated</p>
                    <p className="text-purple-800">{formatDate(order.updated_at)}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm text-gray-600 font-medium">Payment Method</p>
                    <p className="text-gray-800">{order.payment_method || 'Not specified'}</p>
                  </div>
                  <div className="bg-green-50 p-3 rounded-lg">
                    <p className="text-sm text-green-600 font-medium">Payment Status</p>
                    <p className={`font-medium ${getPaymentStatusColor(order.payment_status)}`}>
                      {order.payment_status}
                    </p>
                  </div>
                </div>
                <div className="bg-indigo-50 p-3 rounded-lg">
                  <p className="text-sm text-indigo-600 font-medium">Shipping Method</p>
                  <p className="text-indigo-800">{order.shipping_method}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Order Items Card */}
          <Card className="border border-gray-200 shadow-sm bg-white">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-t-lg">
              <CardTitle className="text-blue-800">Order Items</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-gray-50">
                  <TableRow>
                    <TableHead className="text-blue-600">Product</TableHead>
                    <TableHead className="text-blue-600">Quantity</TableHead>
                    <TableHead className="text-blue-600">Price</TableHead>
                    <TableHead className="text-right text-blue-600">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {order.items?.map((item) => (
                    <TableRow key={item.id} className="hover:bg-blue-50/50">
                      <TableCell className="font-medium text-gray-800">{item.product_name}</TableCell>
                      <TableCell className="text-gray-700">{item.quantity}</TableCell>
                      <TableCell className="text-gray-700">${item.price_at_time.toFixed(2)}</TableCell>
                      <TableCell className="text-right font-medium text-blue-700">
                        ${(item.quantity * item.price_at_time).toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-blue-50/30">
                    <TableCell colSpan={3} className="text-right font-medium text-blue-700">
                      Subtotal
                    </TableCell>
                    <TableCell className="text-right font-bold text-blue-800">
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
          <Card className="border border-gray-200 shadow-sm bg-white">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-t-lg">
              <CardTitle className="text-blue-800">Customer</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <Avatar className="h-12 w-12 border-2 border-blue-100">
                  <AvatarImage src={order.user?.avatar_url || ''} className="object-cover" />
                  <AvatarFallback className="bg-blue-100 text-blue-800">
                    {order.user?.full_name?.charAt(0) || 'C'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-gray-800">{order.user?.full_name || 'Customer'}</p>
                  <p className="text-sm text-blue-600">{order.user?.email}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Shipping Address Card */}
          <Card className="border border-gray-200 shadow-sm bg-white">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-t-lg">
              <CardTitle className="text-blue-800">Shipping Address</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-2 text-gray-700">
                <p className="font-medium text-gray-800">{order.shipping_address.fullName}</p>
                <p>{order.shipping_address.addressLine1}</p>
                {order.shipping_address.addressLine2 && (
                  <p>{order.shipping_address.addressLine2}</p>
                )}
                <p>
                  {order.shipping_address.city}, {order.shipping_address.state}{' '}
                  {order.shipping_address.postalCode}
                </p>
                <p>{order.shipping_address.country}</p>
                {order.shipping_address.phoneNumber && (
                  <p className="text-sm text-blue-600">
                    Phone: {order.shipping_address.phoneNumber}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Billing Address Card */}
          <Card className="border border-gray-200 shadow-sm bg-white">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-t-lg">
              <CardTitle className="text-blue-800">Billing Address</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-2 text-gray-700">
                <p className="font-medium text-gray-800">{order.billing_address.fullName}</p>
                <p>{order.billing_address.addressLine1}</p>
                {order.billing_address.addressLine2 && (
                  <p>{order.billing_address.addressLine2}</p>
                )}
                <p>
                  {order.billing_address.city}, {order.billing_address.state}{' '}
                  {order.billing_address.postalCode}
                </p>
                <p>{order.billing_address.country}</p>
                {order.billing_address.phoneNumber && (
                  <p className="text-sm text-blue-600">
                    Phone: {order.billing_address.phoneNumber}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Status Update Card */}
          <Card className="border border-gray-200 shadow-sm bg-white">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-t-lg">
              <CardTitle className="text-blue-800">Update Status</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <Select
                value={order.status}
                onValueChange={updateOrderStatus}
                disabled={updating}
              >
                <SelectTrigger className="w-full bg-white border-gray-300 hover:border-blue-400">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent className="bg-white border border-gray-200 shadow-lg">
                  <SelectItem value="pending" className="hover:bg-blue-50">Pending</SelectItem>
                  <SelectItem value="processing" className="hover:bg-blue-50">Processing</SelectItem>
                  <SelectItem value="shipped" className="hover:bg-blue-50">Shipped</SelectItem>
                  <SelectItem value="delivered" className="hover:bg-blue-50">Delivered</SelectItem>
                  <SelectItem value="cancelled" className="hover:bg-blue-50">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="destructive"
                onClick={() => updateOrderStatus('cancelled')}
                disabled={updating || order.status === 'cancelled'}
                className="w-full bg-red-600 hover:bg-red-700"
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
    </div>
  )
}