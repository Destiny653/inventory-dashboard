 'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import { Search, ChevronLeft, ChevronRight, FileText, User, CreditCard, Store, Mail, Phone } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'

interface CompletedSale {
  id: string;
  order_id?: string;
  transaction_date: string;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  items: Array<{
    id: string;
    name: string;
    quantity: number;
    price: number;
  }>;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  payment_method: string;
  payment_details?: any;
  staff_id?: string;
  staff_name?: string;
  is_in_person: boolean;
  notes?: string;
}

export default function CompletedSalesPage() {
  const [sales, setSales] = useState<CompletedSale[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [selectedSale, setSelectedSale] = useState<CompletedSale | null>(null)
  const itemsPerPage = 10

  useEffect(() => {
    fetchSales()
  }, [currentPage])

  async function fetchSales() {
    try {
      setLoading(true)
      
      // Base query - updated to join with user_profiles
      let query = supabase
        .from('completed_sales')
        .select(`
          *,
          user_profiles:user_id (id, full_name)
        `)
        .order('transaction_date', { ascending: false })
      
      // Count query for pagination
      const { count, error: countError } = await supabase
        .from('completed_sales')
        .select('*', { count: 'exact', head: true })
      
      if (countError) throw countError
      setTotalCount(count || 0)
      
      // Fetch paginated data
      const { data, error } = await query
        .range((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage - 1)
      
      if (error) throw error
      
      // Map data to include staff name from user_profiles
      const formattedData = data.map(sale => ({
        ...sale,
        staff_name: sale.user_profiles?.full_name || 'System'
      }))
      
      setSales(formattedData || [])
    } catch (error) {
      console.error('Error fetching sales:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredSales = sales.filter(sale => 
    sale.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sale.customer_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sale.order_id?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const totalPages = Math.ceil(totalCount / itemsPerPage)

  const getPaymentMethodIcon = (method: string) => {
    switch (method.toLowerCase()) {
      case 'credit card':
        return <CreditCard className="h-4 w-4 mr-1" />;
      case 'cash':
        return <span className="mr-1">$</span>;
      case 'paypal':
        return <span className="mr-1">P</span>;
      default:
        return <CreditCard className="h-4 w-4 mr-1" />;
    }
  }

  return (
    <div className="space-y-4 p-4 bg-white rounded-lg">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Completed Sales</h1>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="relative flex-1">
          <Input
            placeholder="Search sales by customer, email, or order ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-white border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-200"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-10 text-gray-500">Loading sales records...</div>
      ) : (
        <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
          <Table>
            <TableHeader className="bg-gray-50">
              <TableRow className="hover:bg-gray-50">
                <TableHead className="text-gray-700 font-semibold">Date</TableHead>
                <TableHead className="text-gray-700 font-semibold">Customer</TableHead>
                <TableHead className="text-gray-700 font-semibold">Order ID</TableHead>
                <TableHead className="text-gray-700 font-semibold">Items</TableHead>
                <TableHead className="text-gray-700 font-semibold">Total</TableHead>
                <TableHead className="text-gray-700 font-semibold">Payment</TableHead>
                <TableHead className="text-gray-700 font-semibold">Processed By</TableHead>
                <TableHead className="text-gray-700 font-semibold">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSales.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-10 text-gray-500">
                    No sales records found
                  </TableCell>
                </TableRow>
              ) : (
                filteredSales.map((sale) => (
                  <TableRow key={sale.id} className="hover:bg-gray-50">
                    <TableCell className="text-sm text-gray-600">
                      {formatDate(sale.transaction_date)}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-gray-800">
                        {sale.customer_name || 'Anonymous'}
                      </div>
                      {sale.customer_email && (
                        <div className="text-xs text-gray-500">{sale.customer_email}</div>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {sale.order_id || 'N/A'}
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {sale.items.length} item{sale.items.length !== 1 ? 's' : ''}
                    </TableCell>
                    <TableCell className="font-semibold text-green-600">
                      {formatCurrency(sale.total)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center text-sm">
                        {getPaymentMethodIcon(sale.payment_method)}
                        {sale.payment_method}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      <div className="flex items-center">
                        {sale.is_in_person ? (
                          <Store className="h-4 w-4 mr-1 text-blue-500" />
                        ) : (
                          <User className="h-4 w-4 mr-1 text-gray-500" />
                        )}
                        {sale.staff_name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedSale(sale)}
                        className="border-gray-300 hover:bg-gray-50"
                      >
                        <FileText className="h-4 w-4 mr-1" />
                        Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Pagination Controls */}
          <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-3 border-t bg-gray-50">
            <div className="text-sm text-gray-600 mb-2 sm:mb-0">
              Showing <span className="font-medium text-gray-800">{(currentPage - 1) * itemsPerPage + 1}</span> to{" "}
              <span className="font-medium text-gray-800">
                {Math.min(currentPage * itemsPerPage, totalCount)}
              </span>{" "}
              of <span className="font-medium text-gray-800">{totalCount}</span> sales
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="border-gray-300 hover:bg-gray-100"
              >
                <ChevronLeft className="h-4 w-4" />
                <span className="sr-only">Previous</span>
              </Button>
              <div className="flex items-center space-x-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }

                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-8 h-8 p-0 ${currentPage === pageNum ? 'bg-blue-600 hover:bg-blue-700' : 'border-gray-300 hover:bg-gray-100'}`}
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="border-gray-300 hover:bg-gray-100"
              >
                <ChevronRight className="h-4 w-4" />
                <span className="sr-only">Next</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Sale Details Dialog */}
      {selectedSale && (
        <Dialog open={!!selectedSale} onOpenChange={() => setSelectedSale(null)}>
          <DialogContent className="sm:max-w-[700px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {selectedSale.is_in_person ? (
                  <Store className="h-5 w-5 text-blue-500" />
                ) : (
                  <User className="h-5 w-5 text-gray-500" />
                )}
                <span>
                  Sale Details - {selectedSale.order_id || 'In-Person Sale'}
                </span>
              </DialogTitle>
              <DialogDescription>
                Processed on {formatDate(selectedSale.transaction_date)} by {selectedSale.staff_name}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              {/* Customer Information */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium mb-2">Customer Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center">
                    <User className="h-4 w-4 mr-2 text-gray-500" />
                    <span>{selectedSale.customer_name || 'Anonymous'}</span>
                  </div>
                  {selectedSale.customer_email && (
                    <div className="flex items-center">
                      <Mail className="h-4 w-4 mr-2 text-gray-500" />
                      <span>{selectedSale.customer_email}</span>
                    </div>
                  )}
                  {selectedSale.customer_phone && (
                    <div className="flex items-center">
                      <Phone className="h-4 w-4 mr-2 text-gray-500" />
                      <span>{selectedSale.customer_phone}</span>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Items List */}
              <div>
                <h3 className="font-medium mb-2">Items Purchased</h3>
                <div className="border rounded-lg overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Qty</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {selectedSale.items.map((item, index) => (
                        <tr key={index}>
                          <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">{item.name}</td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{item.quantity}</td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{formatCurrency(item.price)}</td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{formatCurrency(item.price * item.quantity)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              
              {/* Payment Summary */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium mb-2">Payment Summary</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>{formatCurrency(selectedSale.subtotal)}</span>
                  </div>
                  {selectedSale.discount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount:</span>
                      <span>-{formatCurrency(selectedSale.discount)}</span>
                    </div>
                  )}
                  {selectedSale.tax > 0 && (
                    <div className="flex justify-between">
                      <span>Tax:</span>
                      <span>{formatCurrency(selectedSale.tax)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold border-t pt-2 mt-2">
                    <span>Total:</span>
                    <span>{formatCurrency(selectedSale.total)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Payment Method:</span>
                    <span className="flex items-center">
                      {getPaymentMethodIcon(selectedSale.payment_method)}
                      {selectedSale.payment_method}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Notes */}
              {selectedSale.notes && (
                <div>
                  <h3 className="font-medium mb-2">Additional Notes</h3>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm text-gray-700">{selectedSale.notes}</p>
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}