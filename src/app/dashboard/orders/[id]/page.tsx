 'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
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

interface OrderDetails {
  id: string
  status: string
  total_amount: number
  created_at: string
  updated_at: string
  user_id: string
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
  payment_method: string | null
  payment_status: string
  payment_intent_id: string | null
  shipping_method: string
  user?: {
    email: string
    full_name?: string
  }
  items?: {
    id: string
    product_id: string
    product_name: string
    quantity: number
    price_at_time: number
  }[]
}

interface PageProps {
  params: {
    id: string
  }
}

export default function OrderDetailPage({ params }: PageProps) {
  const { id } = params
  const router = useRouter()
  const [order, setOrder] = useState<OrderDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    if (!id || !isUUID(id)) {
      setError('Invalid order ID')
      setLoading(false)
      router.push('/orders')
      return
    }
    fetchOrderDetails()
  }, [id])

  async function fetchOrderDetails() {
    try {
      setLoading(true)
      setError(null)
      
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select(`
          *,
          user_profiles:user_id (email, full_name),
          order_items:order_items (
            id,
            product_id,
            quantity,
            price_at_time,
            products:product_id (name)
          )
        `)
        .eq('id', id)
        .single()

      if (orderError) throw orderError
      if (!orderData) {
        setError('Order not found')
        return
      }

      const formattedOrder = {
        ...orderData,
        user: {
          email: orderData.user_profiles?.email || 'Unknown',
          full_name: orderData.user_profiles?.full_name || 'Unknown'
        },
        items: orderData.order_items?.map((item: any) => ({
          ...item,
          product_name: item.products?.name || 'Unknown product'
        })) || []
      }

      setOrder(formattedOrder)
    } catch (error) {
      console.error('Error loading order:', error)
      setError('Failed to load order details')
    } finally {
      setLoading(false)
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
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100'
      case 'processing':
        return 'bg-blue-100 text-blue-800 hover:bg-blue-100'
      case 'shipped':
        return 'bg-purple-100 text-purple-800 hover:bg-purple-100'
      case 'delivered':
        return 'bg-green-100 text-green-800 hover:bg-green-100'
      case 'cancelled':
        return 'bg-red-100 text-red-800 hover:bg-red-100'
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-100'
    }
  }

  function getPaymentStatusColor(status: string): string {
    switch (status.toLowerCase()) {
      case 'paid':
        return 'text-green-600'
      case 'pending':
        return 'text-yellow-600'
      case 'failed':
        return 'text-red-600'
      case 'refunded':
        return 'text-blue-600'
      default:
        return 'text-gray-600'
    }
  }

  async function updateOrderStatus(newStatus: string) {
    try {
      setUpdating(true)
      const { error } = await supabase
        .from('orders')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', order?.id)

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

  function isUUID(id: string) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    return uuidRegex.test(id)
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading order details...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Button
          variant="outline"
          className="mb-6"
          onClick={() => router.push('/orders')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Orders
        </Button>
        <div className="flex flex-col items-center justify-center h-64">
          <p className="text-red-500 mb-4">{error}</p>
          <Button onClick={() => router.push('/orders')}>
            Return to Orders
          </Button>
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Button
          variant="outline"
          className="mb-6"
          onClick={() => router.push('/orders')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Orders
        </Button>
        <div className="flex flex-col items-center justify-center h-64">
          <p className="text-gray-500 mb-4">No order data available</p>
          <Button onClick={() => router.push('/orders')}>
            Return to Orders
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <Button
        variant="outline"
        className="mb-6"
        onClick={() => router.push('/orders')}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Orders
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Order #{order.id.slice(0, 8)}</CardTitle>
                <Badge className={getStatusBadgeColor(order.status)}>
                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-medium text-gray-500">Order Date</h3>
                    <p>{formatDate(order.created_at)}</p>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-500">Last Updated</h3>
                    <p>{formatDate(order.updated_at)}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-medium text-gray-500">Payment Method</h3>
                    <p>{order.payment_method || 'Not specified'}</p>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-500">Payment Status</h3>
                    <p className={getPaymentStatusColor(order.payment_status)}>
                      {order.payment_status}
                    </p>
                  </div>
                </div>
                <div>
                  <h3 className="font-medium text-gray-500">Shipping Method</h3>
                  <p>{order.shipping_method}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Order Items</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {order.items?.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.product_name}</TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>${item.price_at_time.toFixed(2)}</TableCell>
                      <TableCell className="text-right">
                        ${(item.quantity * item.price_at_time).toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow>
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

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Customer</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium text-gray-500">Name</h3>
                  <p>{order.user?.full_name || order.shipping_address.fullName}</p>
                </div>
                <div>
                  <h3 className="font-medium text-gray-500">Email</h3>
                  <p className="text-blue-600 hover:underline">
                    <a href={`mailto:${order.user?.email}`}>{order.user?.email}</a>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Shipping Address</CardTitle>
            </CardHeader>
            <CardContent>
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
                {order.shipping_address.phoneNumber && (
                  <p className="mt-2">
                    <span className="font-medium">Phone:</span> {order.shipping_address.phoneNumber}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Billing Address</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="font-medium">{order.billing_address.fullName}</p>
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
                  <p className="mt-2">
                    <span className="font-medium">Phone:</span> {order.billing_address.phoneNumber}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Update Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select
                value={order.status}
                onValueChange={updateOrderStatus}
                disabled={updating}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
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
    </div>
  )
}