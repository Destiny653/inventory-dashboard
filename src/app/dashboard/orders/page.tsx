'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Search, Trash2, Loader2, ChevronLeft, ChevronRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import Link from 'next/link'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

interface Order {
  id: string
  status: string
  total_amount: number
  created_at: string
  user_id: string
  payment_method?: string
  shipping_method?: string
  shipping_address: {
    fullName: string
    city: string
    country: string
  }
  user?: {
    email: string
    full_name?: string
    avatar_url?: string
    phone?: string
  }
}

const ITEMS_PER_PAGE = 10;

export default function OrdersPage() {
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [selectedOrders, setSelectedOrders] = useState<string[]>([])
  const [isBulkUpdating, setIsBulkUpdating] = useState(false)
  const [bulkStatus, setBulkStatus] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    fetchOrdersWithUsers()
  }, [])

  async function fetchOrdersWithUsers() {
    try {
      setLoading(true)

      // First fetch orders
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })

      if (ordersError) throw ordersError
      if (!ordersData?.length) return setOrders([])

      // Get user IDs from orders
      const userIds = ordersData.map(order => order.user_id).filter(Boolean) as string[]

      // Then fetch user profiles
      const { data: userProfiles, error: usersError } = await supabase
        .from('user_profiles')
        .select('*')
        .in('id', userIds)

      if (usersError) throw usersError

      // Combine the data
      const combinedData = ordersData.map(order => ({
        ...order,
        user: userProfiles?.find(user => user.id === order.user_id) || {
          email: 'Unknown',
          full_name: order.shipping_address?.fullName || 'Customer',
          avatar_url: null,
          phone: null
        }
      }))

      setOrders(combinedData)
    } catch (error) {
      console.error('Error fetching orders:', error)
      toast.error('Failed to fetch orders')
    } finally {
      setLoading(false)
    }
  }


  // Filter orders based on search term and status filter
  const filteredOrders = orders.filter(order => {
    const matchesSearch =
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.user?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
      order.user?.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.shipping_address.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.user?.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
      (order.payment_method?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
      (order.shipping_method?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)

    const matchesStatus = statusFilter ? order.status === statusFilter : true

    return matchesSearch && matchesStatus
  })

  // Pagination logic
  const totalPages = Math.ceil(filteredOrders.length / ITEMS_PER_PAGE)
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)))
  }

  async function updateOrderStatus(orderId: string, newStatus: string) {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', orderId)

      if (error) throw error

      // Update local state
      setOrders(orders.map(order =>
        order.id === orderId ? { ...order, status: newStatus } : order
      ))
      toast.success('Order status updated')
    } catch (error) {
      console.error('Error updating order status:', error)
      toast.error('Failed to update order status')
    }
  }

  async function updateBulkOrderStatus() {
    if (!bulkStatus || selectedOrders.length === 0) return

    try {
      setIsBulkUpdating(true)
      const { error } = await supabase
        .from('orders')
        .update({
          status: bulkStatus,
          updated_at: new Date().toISOString()
        })
        .in('id', selectedOrders)

      if (error) throw error

      // Update local state
      setOrders(orders.map(order =>
        selectedOrders.includes(order.id)
          ? { ...order, status: bulkStatus }
          : order
      ))
      setSelectedOrders([])
      setBulkStatus('')
      toast.success(`Updated ${selectedOrders.length} order(s)`)
    } catch (error) {
      console.error('Error bulk updating orders:', error)
      toast.error('Failed to update orders')
    } finally {
      setIsBulkUpdating(false)
    }
  }

  async function deleteSelectedOrders() {
    if (selectedOrders.length === 0) return

    try {
      setIsBulkUpdating(true)
      const { error } = await supabase
        .from('orders')
        .delete()
        .in('id', selectedOrders)

      if (error) throw error

      // Update local state
      setOrders(orders.filter(order => !selectedOrders.includes(order.id)))
      setSelectedOrders([])
      toast.success(`Deleted ${selectedOrders.length} order(s)`)
    } catch (error) {
      console.error('Error deleting orders:', error)
      toast.error('Failed to delete orders')
    } finally {
      setIsBulkUpdating(false)
    }
  }

  function toggleSelectOrder(orderId: string) {
    setSelectedOrders(prev =>
      prev.includes(orderId)
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
    )
  }

  function toggleSelectAll() {
    if (selectedOrders.length === filteredOrders.length) {
      setSelectedOrders([])
    } else {
      setSelectedOrders(filteredOrders.map(order => order.id))
    }
  }


  function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  function getStatusBadgeColor(status: string): string {
    switch (status) {
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

  function getPaymentMethodColor(method?: string): string {
    switch (method?.toLowerCase()) {
      case 'credit card':
        return 'text-blue-600'
      case 'paypal':
        return 'text-blue-500'
      case 'bank transfer':
        return 'text-green-600'
      case 'crypto':
        return 'text-purple-600'
      default:
        return 'text-gray-600'
    }
  }

  function getShippingMethodColor(method?: string): string {
    switch (method?.toLowerCase()) {
      case 'express':
        return 'text-red-600'
      case 'standard':
        return 'text-green-600'
      case 'priority':
        return 'text-blue-600'
      default:
        return 'text-gray-600'
    }
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Order Management</h1>
        <Button asChild>
          <Link href="/orders/create">Create Order</Link>
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between my-6">
        <div className="relative w-full sm:w-auto">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search orders..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8 w-full sm:w-[300px]"
          />
        </div>

        <div className="flex gap-2 w-full sm:w-auto">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px] bg-white">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent className="bg-white">
              <SelectItem value="none">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="processing">Processing</SelectItem>
              <SelectItem value="shipped">Shipped</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            onClick={() => {
              setSearchTerm('')
              setStatusFilter('')
              setCurrentPage(1)
            }}
          >
            Reset
          </Button>
        </div>
      </div>

      {selectedOrders.length > 0 && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">
              {selectedOrders.length} selected
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedOrders([])}
            >
              Clear
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Select
              value={bulkStatus}
              onValueChange={setBulkStatus}
              disabled={isBulkUpdating}
            >
              <SelectTrigger className="w-[150px] bg-white">
                <SelectValue placeholder="Set status" />
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
              size="sm"
              onClick={updateBulkOrderStatus}
              disabled={!bulkStatus || isBulkUpdating}
            >
              {isBulkUpdating ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Apply
            </Button>
          </div>

          <Button
            variant="destructive"
            size="sm"
            onClick={deleteSelectedOrders}
            disabled={isBulkUpdating}
          >
            {isBulkUpdating ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="mr-2 h-4 w-4" />
            )}
            Delete
          </Button>
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Orders</CardTitle>
              <CardDescription>
                Showing {paginatedOrders.length} of {filteredOrders.length} order{filteredOrders.length !== 1 ? 's' : ''}
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={fetchOrdersWithUsers}
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center h-40">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredOrders.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[40px]">
                      <Checkbox
                        checked={
                          filteredOrders.length > 0 &&
                          selectedOrders.length === filteredOrders.length
                        }
                        onCheckedChange={toggleSelectAll}
                        aria-label="Select all"
                      />
                    </TableHead>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead>Shipping</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {paginatedOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedOrders.includes(order.id)}
                          onCheckedChange={() => toggleSelectOrder(order.id)}
                        />
                      </TableCell>
                      <TableCell>
                        <Link href={`/dashboard/orders/${order.id}`} className="font-medium text-primary hover:underline">
                          #{order.id.split('-')[0]}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={order.user?.avatar_url} />
                            <AvatarFallback>
                              {order.user?.full_name?.charAt(0) || 'C'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{order.user?.full_name}</div>
                            <div className="text-sm text-gray-500">{order.user?.email}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={`text-sm ${getPaymentMethodColor(order.payment_method)}`}>
                          {order.payment_method || 'Not specified'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className={getShippingMethodColor(order.shipping_method)}>
                            {order.shipping_method || 'Standard'}
                          </div>
                          <div className="text-gray-500">
                            {order.shipping_address?.city || 'N/A'}, {order.shipping_address?.country || ''}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm whitespace-nowrap">
                          {formatDate(order.created_at)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-green-700">
                          ${order.total_amount?.toFixed(2) || '0.00'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusBadgeColor(order.status)}>
                          {order.status?.charAt(0).toUpperCase() + order.status?.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Select
                            value={order.status}
                            onValueChange={(value) => updateOrderStatus(order.id, value)}
                          >
                            <SelectTrigger className="w-[130px] bg-white">
                              <SelectValue />
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
                            variant="ghost"
                            size="icon"
                            onClick={() => router.push(`/dashboard/orders/${order.id}`)}
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                              <circle cx="12" cy="12" r="3" />
                            </svg>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination controls */}
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-gray-500">
                  Page {currentPage} of {totalPages}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage <= 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage >= totalPages}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-10">
              <p className="text-gray-500">No orders found matching your criteria</p>
              {(searchTerm || statusFilter) && (
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => {
                    setSearchTerm('')
                    setStatusFilter('')
                    setCurrentPage(1)
                  }}
                >
                  Clear Filters
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}