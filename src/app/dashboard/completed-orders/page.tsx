// app/dashboard/sales/completed/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Download, Loader2, FileText, FileSpreadsheet } from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'

interface CompletedOrder {
  id: string
  original_order_id: string
  order_data: {
    id: string
    status: string
    total_amount: number
    created_at: string
    payment_method?: string
    shipping_method?: string
  }
  customer_data: {
    id: string
    email: string
    full_name: string
    phone?: string
  }
  completed_at: string
}

export default function CompletedOrdersPage() {
  const [orders, setOrders] = useState<CompletedOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    fetchCompletedOrders()
  }, [])

  async function fetchCompletedOrders() {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('completed_orders')
        .select('*')
        .order('completed_at', { ascending: false })

      if (error) throw error
      setOrders(data || [])
    } catch (error) {
      console.error('Error fetching completed orders:', error)
      toast.error('Failed to load completed orders')
    } finally {
      setLoading(false)
    }
  }

  async function exportToExcel() {
    try {
      setExporting(true)
      
      // Transform data for export
      const exportData = orders.map(order => ({
        'Order ID': order.original_order_id,
        'Customer Name': order.customer_data.full_name,
        'Customer Email': order.customer_data.email,
        'Customer Phone': order.customer_data.phone || 'N/A',
        'Order Date': format(new Date(order.order_data.created_at), 'PPpp'),
        'Completed Date': format(new Date(order.completed_at), 'PPpp'),
        'Total Amount': order.order_data.total_amount,
        'Payment Method': order.order_data.payment_method || 'N/A',
        'Shipping Method': order.order_data.shipping_method || 'N/A'
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
      
      // Update export timestamp in DB
      await supabase
        .from('completed_orders')
        .update({ exported_at: new Date().toISOString(), exported_format: 'xlsx' })
        .in('id', orders.map(o => o.id))

      toast.success('Export completed successfully')
    } catch (error) {
      console.error('Export failed:', error)
      toast.error('Failed to export orders')
    } finally {
      setExporting(false)
    }
  }

  async function exportToCSV() {
    try {
      setExporting(true)
      
      // Transform data for export
      const headers = [
        'Order ID', 'Customer Name', 'Customer Email', 'Customer Phone',
        'Order Date', 'Completed Date', 'Total Amount', 
        'Payment Method', 'Shipping Method'
      ]
      
      const rows = orders.map(order => [
        order.original_order_id,
        order.customer_data.full_name,
        order.customer_data.email,
        order.customer_data.phone || 'N/A',
        format(new Date(order.order_data.created_at), 'PPpp'),
        format(new Date(order.completed_at), 'PPpp'),
        order.order_data.total_amount,
        order.order_data.payment_method || 'N/A',
        order.order_data.shipping_method || 'N/A'
      ])
      
      // Create CSV content
      let csvContent = headers.join(',') + '\n'
      rows.forEach(row => {
        csvContent += row.map(field => `"${field}"`).join(',') + '\n'
      })
      
      // Save file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      saveAs(blob, `completed_orders_${format(new Date(), 'yyyyMMdd_HHmmss')}.csv`)
      
      // Update export timestamp in DB
      await supabase
        .from('completed_orders')
        .update({ exported_at: new Date().toISOString(), exported_format: 'csv' })
        .in('id', orders.map(o => o.id))

      toast.success('CSV export completed successfully')
    } catch (error) {
      console.error('CSV export failed:', error)
      toast.error('Failed to export CSV')
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Completed Orders</h1>
        <div className="flex gap-2">
          <Button onClick={exportToExcel} disabled={exporting || orders.length === 0}>
            {exporting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <FileSpreadsheet className="mr-2 h-4 w-4" />
            )}
            Export to Excel
          </Button>
          <Button variant="outline" onClick={exportToCSV} disabled={exporting || orders.length === 0}>
            {exporting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <FileText className="mr-2 h-4 w-4" />
            )}
            Export to CSV
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Completed Orders History</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center h-40">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : orders.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Order Date</TableHead>
                    <TableHead>Completed Date</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">
                        #{order.original_order_id.slice(0, 8)}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{order.customer_data.full_name}</div>
                          <div className="text-sm text-gray-500">{order.customer_data.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {format(new Date(order.order_data.created_at), 'PP')}
                      </TableCell>
                      <TableCell>
                        {format(new Date(order.completed_at), 'PP')}
                      </TableCell>
                      <TableCell>
                        ${order.order_data.total_amount.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        {order.order_data.payment_method || 'N/A'}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">
                          <Download className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-10">
              <p className="text-gray-500">No completed orders found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}