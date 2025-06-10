 'use client'

import { useState, useEffect, useRef } from 'react'
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
import { Search, Trash2, Loader2, ChevronLeft, ChevronRight, FileText, FileSpreadsheet, Printer, ShoppingBag } from 'lucide-react'
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import Image from 'next/image'
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'
import { format } from 'date-fns'

interface CompletedOrder {
  staff_info: any
  id: string
  original_order_id: string
  order_data: {
    id: string
    status: string
    total_amount: number
    created_at: string
    updated_at?: string
    user_id: string
    payment_method?: string
    shipping_method?: string
    shipping_address: {
      fullName: string
      city: string
      country: string
      address?: string
      postalCode?: string
      phone?: string
    }
    items: Array<{
      id: string
      name: string
      quantity: number
      price: number
      image_url?: string
    }>
  }
  customer_data: {
    id: string
    email: string
    full_name?: string
    avatar_url?: string
    phone?: string
  }
  completed_at: string
  last_updated_by?: string
}

const ITEMS_PER_PAGE = 10

export default function CompletedOrdersPage() {
  const router = useRouter()
  const [orders, setOrders] = useState<CompletedOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedOrders, setSelectedOrders] = useState<string[]>([])
  const [isBulkDeleting, setIsBulkDeleting] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [selectedOrder, setSelectedOrder] = useState<CompletedOrder | null>(null)
  const [exporting, setExporting] = useState(false)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    async function fetchUser() {
      const { data: { user }, error } = await supabase.auth.getUser()
      if (error) {
        console.error('Error fetching user:', error)
        return
      }
      setUser(user)
    }
    fetchUser()
    fetchCompletedOrders()
  }, [currentPage])

  async function fetchCompletedOrders() {
    try {
      setLoading(true)

      // Fetch paginated completed orders with count
      const { data: ordersData, error: ordersError, count } = await supabase
        .from('completed_orders')
        .select('*', { count: 'exact' })
        .order('completed_at', { ascending: false })
        .range((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE - 1)

      if (ordersError) throw ordersError
      setTotalCount(count || 0)

      // Get unique staff IDs for last_updated_by
      const staffIds = [...new Set(
        (ordersData || []).map(order => order.last_updated_by).filter(Boolean)
      )]

      // Fetch staff profiles
      let staffProfiles: { [key: string]: any } = {}
      if (staffIds.length > 0) {
        const { data: profiles, error: profilesError } = await supabase
          .from('user_profiles')
          .select('id, full_name, email, avatar_url')
          .in('id', staffIds)

        if (profilesError) throw profilesError

        staffProfiles = (profiles || []).reduce((acc: { [key: string]: any }, profile: any) => {
          acc[profile.id] = profile
          return acc
        }, {})
      }

      // Attach staff info to orders
      const ordersWithStaff = (ordersData || []).map(order => ({
        ...order,
        staff_info: order.last_updated_by ? staffProfiles[order.last_updated_by] : null
      }))

      setOrders(ordersWithStaff)
    } catch (error) {
      console.error('Error fetching completed orders:', error)
      toast.error('Failed to fetch completed orders')
    } finally {
      setLoading(false)
    }
  }

  // Filter orders based on search term
  const filteredOrders = orders.filter(order => {
    const matchesSearch =
      order.original_order_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer_data.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer_data.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.order_data.shipping_address.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.customer_data.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)

    return matchesSearch
  })

  // Pagination logic
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE)

  async function deleteSelectedOrders() {
    if (selectedOrders.length === 0) return

    try {
      setIsBulkDeleting(true)
      const { error } = await supabase
        .from('completed_orders')
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
      setIsBulkDeleting(false)
    }
  }

  async function exportToExcel() {
    try {
      setExporting(true)
      
      // Transform data for export
      const exportData = orders.map(order => ({
        'Order ID': order.original_order_id,
        'Completed ID': order.id,
        'Completed Date': format(new Date(order.completed_at), 'yyyy-MM-dd HH:mm:ss'),
        'Customer Name': order.customer_data.full_name || order.order_data.shipping_address.fullName,
        'Customer Email': order.customer_data.email,
        'Customer Phone': order.customer_data.phone || order.order_data.shipping_address.phone,
        'Items Count': order.order_data.items?.length,
        'Order Total': order.order_data.total_amount,
        'Payment Method': order.order_data.payment_method,
        'Shipping Method': order.order_data.shipping_method,
        'Shipping Address': `${order.order_data.shipping_address.address}, ${order.order_data.shipping_address.city}, ${order.order_data.shipping_address.country}`,
        'Processed By': order.staff_info?.full_name || 'System',
        'Status': order.order_data.status,
        'Order Date': format(new Date(order.order_data.created_at), 'yyyy-MM-dd HH:mm:ss')
      }))

      // Create worksheet
      const worksheet = XLSX.utils.json_to_sheet(exportData)
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Completed Orders')
      
      // Generate Excel file
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
      const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      
      // Save file
      saveAs(data, `completed_orders_${format(new Date(), 'yyyyMMdd_HHmmss')}.xlsx`)
      
      toast.success('Excel export completed successfully')
    } catch (error) {
      console.error('Export failed:', error)
      toast.error('Failed to export orders data')
    } finally {
      setExporting(false)
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
        <h1 className="text-2xl font-bold">Completed Orders</h1>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/dashboard/sales/orders">View Active Orders</Link>
          </Button>
        </div>
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
          <Button
            variant="outline"
            onClick={() => {
              setSearchTerm('')
              setCurrentPage(1)
            }}
          >
            Reset
          </Button>
          <Button 
            onClick={exportToExcel} 
            disabled={exporting || orders.length === 0}
            variant="outline"
          >
            {exporting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <FileSpreadsheet className="mr-2 h-4 w-4" />
            )}
            Export Excel
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

          <Button
            variant="destructive"
            size="sm"
            onClick={deleteSelectedOrders}
            disabled={isBulkDeleting}
          >
            {isBulkDeleting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="mr-2 h-4 w-4" />
            )}
            Delete Selected
          </Button>
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Completed Orders</CardTitle>
              <CardDescription>
                Showing {filteredOrders.length} of {totalCount} completed order{totalCount !== 1 ? 's' : ''}
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={fetchCompletedOrders}
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
                    <TableHead>Items</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Completed Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {filteredOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedOrders.includes(order.id)}
                          onCheckedChange={() => toggleSelectOrder(order.id)}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">
                          #{order.original_order_id.split('-')[0]}
                        </div>
                        <div className="text-xs text-gray-500">
                          {order.order_data.payment_method}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={order.customer_data.avatar_url} />
                            <AvatarFallback>
                              {order.customer_data.full_name?.charAt(0) || 'C'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">
                              {order.customer_data.full_name || order.order_data.shipping_address.fullName}
                            </div>
                            <div className="text-sm text-gray-500">
                              {order.customer_data.email}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {order.order_data.items?.slice(0, 2).map((item, index) => (
                            <div key={index} className="relative">
                              {item.image_url ? (
                                <Image
                                  src={item.image_url}
                                  alt={item.name}
                                  width={32}
                                  height={32}
                                  className="rounded-md border"
                                />
                              ) : (
                                <div className="w-8 h-8 rounded-md bg-gray-100 flex items-center justify-center">
                                  <ShoppingBag className="h-4 w-4 text-gray-400" />
                                </div>
                              )}
                              {index === 1 && order.order_data.items.length > 2 && (
                                <div className="absolute -right-1 -bottom-1 bg-gray-100 rounded-full w-5 h-5 flex items-center justify-center text-xs">
                                  +{order.order_data.items.length - 2}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        ${order.order_data.total_amount?.toFixed(2) || '0.00'}
                      </TableCell>
                      <TableCell>
                        {formatDate(order.completed_at)}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusBadgeColor(order.order_data.status)}>
                          {order.order_data.status?.charAt(0).toUpperCase() + order.order_data.status?.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedOrder(order)}
                          >
                            <FileText className="h-4 w-4 mr-1" />
                            Details
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
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage <= 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage + 1)}
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
              <p className="text-gray-500">No completed orders found</p>
              {searchTerm && (
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => setSearchTerm('')}
                >
                  Clear Search
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Order Details Dialog */}
      {selectedOrder && (
        <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
          <DialogContent className="sm:max-w-[800px] bg-white">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                Order #{selectedOrder.original_order_id.split('-')[0]}
              </DialogTitle>
              <DialogDescription>
                Completed on {formatDate(selectedOrder.completed_at)}
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column - Customer and Shipping Info */}
              <div className="space-y-4">
                {/* Customer Information */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-medium mb-3">Customer Information</h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-500">Name</p>
                      <p className="font-medium">
                        {selectedOrder.customer_data.full_name || selectedOrder.order_data.shipping_address.fullName}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="font-medium">{selectedOrder.customer_data.email}</p>
                    </div>
                    {selectedOrder.customer_data.phone && (
                      <div>
                        <p className="text-sm text-gray-500">Phone</p>
                        <p className="font-medium">{selectedOrder.customer_data.phone}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Shipping Information */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-medium mb-3">Shipping Information</h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-500">Full Name</p>
                      <p className="font-medium">{selectedOrder.order_data.shipping_address.fullName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Address</p>
                      <p className="font-medium">
                        {selectedOrder.order_data.shipping_address.address}<br />
                        {selectedOrder.order_data.shipping_address.city}, {selectedOrder.order_data.shipping_address.country}
                        {selectedOrder.order_data.shipping_address.postalCode && (
                          <>, {selectedOrder.order_data.shipping_address.postalCode}</>
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Phone</p>
                      <p className="font-medium">
                        {selectedOrder.order_data.shipping_address.phone || 'Not provided'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Shipping Method</p>
                      <p className="font-medium">
                        {selectedOrder.order_data.shipping_method || 'Standard'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Processed By */}
                {selectedOrder.staff_info && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-medium mb-3">Processed By</h3>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={selectedOrder.staff_info.avatar_url} />
                        <AvatarFallback>
                          {selectedOrder.staff_info.full_name?.charAt(0) || 'S'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{selectedOrder.staff_info.full_name}</p>
                        <p className="text-sm text-gray-500">{selectedOrder.staff_info.email}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column - Order Items and Summary */}
              <div className="space-y-4">
                {/* Order Items */}
                <div>
                  <h3 className="font-medium mb-3">
                    Order Items ({selectedOrder.order_data.items?.length})
                  </h3>
                  <div className="border rounded-lg overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Qty</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {selectedOrder.order_data.items?.map((item, index) => (
                          <tr key={index}>
                            <td className="px-4 py-2 whitespace-nowrap">
                              <div className="flex items-center">
                                {item.image_url ? (
                                  <div className="flex-shrink-0 h-10 w-10 mr-2">
                                    <Image
                                      src={item.image_url}
                                      alt={item.name}
                                      width={40}
                                      height={40}
                                      className="rounded-md"
                                    />
                                  </div>
                                ) : (
                                  <div className="flex-shrink-0 h-10 w-10 mr-2 bg-gray-100 rounded-md flex items-center justify-center">
                                    <ShoppingBag className="h-5 w-5 text-gray-400" />
                                  </div>
                                )}
                                <div className="text-sm font-medium text-gray-900">{item.name}</div>
                              </div>
                            </td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                              {item.quantity}
                            </td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                              ${item.price.toFixed(2)}
                            </td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                              ${(item.price * item.quantity).toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Order Summary */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-medium mb-3">Order Summary</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>${selectedOrder.order_data.total_amount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Shipping:</span>
                      <span>${selectedOrder.order_data.shipping_method === 'Express' ? '10.00' : '5.00'}</span>
                    </div>
                    <div className="border-t pt-2 mt-2">
                      <div className="flex justify-between font-bold">
                        <span>Total:</span>
                        <span>${selectedOrder.order_data.total_amount.toFixed(2)}</span>
                      </div>
                    </div>
                    <div className="pt-2">
                      <div className="flex justify-between">
                        <span>Payment Method:</span>
                        <span className="font-medium">
                          {selectedOrder.order_data.payment_method}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Order Timeline */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-medium mb-3">Order Timeline</h3>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="flex flex-col items-center">
                        <div className="w-2 h-2 bg-green-500 rounded-full mt-1"></div>
                        <div className="w-px h-10 bg-gray-300"></div>
                      </div>
                      <div>
                        <p className="font-medium">Order Completed</p>
                        <p className="text-sm text-gray-500">
                          {formatDate(selectedOrder.completed_at)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="flex flex-col items-center">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-1"></div>
                        <div className="w-px h-10 bg-gray-300"></div>
                      </div>
                      <div>
                        <p className="font-medium">Order Placed</p>
                        <p className="text-sm text-gray-500">
                          {formatDate(selectedOrder.order_data.created_at)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setSelectedOrder(null)}>
                Close
              </Button>
              <Button onClick={() => window.print()} className="bg-blue-600 hover:bg-blue-700">
                <Printer className="mr-2 h-4 w-4" />
                Print Details
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}