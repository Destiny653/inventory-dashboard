 'use client'

import { useState, useEffect, useRef } from 'react'
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
} from '@/components/ui/dialog'
import { 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  FileText, 
  User, 
  CreditCard, 
  Store, 
  Mail, 
  Phone, 
  ShoppingBag,
  FileSpreadsheet,
  Loader2,
  Printer,
  Receipt as ReceiptIcon
} from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import Image from 'next/image'
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'
import { format } from 'date-fns'
import { toast } from 'sonner'

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
    image_url?: string;
  }>;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  payment_method: string;
  payment_details?: any;
  staff_id?: string;
  staff_info?: {
    id: string;
    full_name: string;
    email?: string;
    phone?: string;
  };
  is_in_person: boolean;
  notes?: string;
}

// Receipt Component
const Receipt = ({ sale, onClose }: { sale: CompletedSale; onClose: () => void }) => {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Receipt - ${sale.order_id || sale.id.slice(0, 8)}</title>
        <style>
          @media print {
            body { margin: 0; padding: 0; }
            .no-print { display: none !important; }
            .receipt { width: 80mm; font-family: 'Courier New', monospace; }
          }
          body { margin: 0; padding: 20px; background: #f5f5f5; }
          .receipt {
            width: 80mm;
            max-width: 300px;
            margin: 0 auto;
            background: white;
            padding: 20px;
            font-family: 'Courier New', monospace;
            font-size: 12px;
            line-height: 1.4;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          }
          .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 15px; }
          .store-name { font-size: 18px; font-weight: bold; margin-bottom: 5px; }
          .store-info { font-size: 10px; margin-bottom: 2px; }
          .divider { border-top: 1px dashed #000; margin: 10px 0; }
          .double-divider { border-top: 2px solid #000; margin: 10px 0; }
          .item-row { display: flex; justify-content: space-between; margin-bottom: 2px; }
          .item-details { font-size: 11px; margin-bottom: 5px; }
          .total-section { margin-top: 10px; }
          .total-row { display: flex; justify-content: space-between; margin-bottom: 2px; }
          .grand-total { font-weight: bold; font-size: 14px; }
          .footer { text-align: center; margin-top: 15px; font-size: 10px; border-top: 1px dashed #000; padding-top: 10px; }
          .thank-you { font-weight: bold; margin-bottom: 5px; }
        </style>
      </head>
      <body>
        ${printContent.innerHTML}
      </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    
    // Wait for content to load before printing
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[400px] bg-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ReceiptIcon className="h-5 w-5 text-green-500" />
            Receipt Preview
          </DialogTitle>
          <DialogDescription>
            Preview and print receipt for this transaction
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Receipt Preview */}
          <div className="max-h-[500px] overflow-y-auto border rounded-lg bg-gray-50 p-4">
            <div ref={printRef} className="receipt bg-white p-4 mx-auto" style={{ width: '80mm', maxWidth: '300px', fontFamily: 'Courier New, monospace', fontSize: '12px', lineHeight: '1.4' }}>
              {/* Header */}
              <div className="header text-center" style={{ borderBottom: '2px solid #000', paddingBottom: '10px', marginBottom: '15px' }}>
                <div className="store-name" style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '5px' }}>
                  MARKETPLACE
                </div>
                <div className="store-info" style={{ fontSize: '10px', marginBottom: '2px' }}>
                  123 Main St, Suite 100
                </div>
                <div className="store-info" style={{ fontSize: '10px', marginBottom: '2px' }}>
                  Bamenda, North West Region, 00237
                </div>
                <div className="store-info" style={{ fontSize: '10px', marginBottom: '2px' }}>
                  Tel: (555) 123-4567
                </div>
                <div className="store-info" style={{ fontSize: '10px' }}>
                  marketplace-five-gold.vercel.app
                </div>
              </div>

              {/* Transaction Info */}
              <div style={{ marginBottom: '15px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                  <span>Receipt #:</span>
                  <span>{sale.order_id || sale.id.slice(0, 8).toUpperCase()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                  <span>Date:</span>
                  <span>{format(new Date(sale.transaction_date), 'MM/dd/yyyy')}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                  <span>Time:</span>
                  <span>{format(new Date(sale.transaction_date), 'HH:mm:ss')}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                  <span>Cashier:</span>
                  <span>{sale.staff_info?.full_name || 'System'}</span>
                </div>
                {sale.customer_name && sale.customer_name !== 'Anonymous' && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                    <span>Customer:</span>
                    <span>{sale.customer_name}</span>
                  </div>
                )}
              </div>

              <div className="divider" style={{ borderTop: '1px dashed #000', margin: '10px 0' }}></div>

              {/* Items */}
              <div style={{ marginBottom: '15px' }}>
                {sale.items.map((item, index) => (
                  <div key={index} style={{ marginBottom: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                      <span style={{ maxWidth: '60%', wordWrap: 'break-word' }}>{item.name}</span>
                      <span>{formatCurrency(item.price * item.quantity)}</span>
                    </div>
                    <div style={{ fontSize: '10px', color: '#666', marginLeft: '2px' }}>
                      {item.quantity} x {formatCurrency(item.price)} each
                    </div>
                  </div>
                ))}
              </div>

              <div className="divider" style={{ borderTop: '1px dashed #000', margin: '10px 0' }}></div>

              {/* Totals */}
              <div className="total-section" style={{ marginTop: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                  <span>Subtotal:</span>
                  <span>{formatCurrency(sale.subtotal)}</span>
                </div>
                
                {sale.discount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px', color: '#008000' }}>
                    <span>Discount:</span>
                    <span>-{formatCurrency(sale.discount)}</span>
                  </div>
                )}
                
                {sale.tax > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                    <span>Tax:</span>
                    <span>{formatCurrency(sale.tax)}</span>
                  </div>
                )}

                <div className="double-divider" style={{ borderTop: '2px solid #000', margin: '10px 0' }}></div>
                
                <div className="grand-total" style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '14px' }}>
                  <span>TOTAL:</span>
                  <span>{formatCurrency(sale.total)}</span>
                </div>

                <div className="divider" style={{ borderTop: '1px dashed #000', margin: '10px 0' }}></div>

                {/* Payment Method */}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                  <span>Payment:</span>
                  <span>{sale.payment_method}</span>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                  <span>Amount Paid:</span>
                  <span>{formatCurrency(sale.total)}</span>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                  <span>Change:</span>
                  <span>{formatCurrency(0)}</span>
                </div>
              </div>

              {/* Footer */}
              <div className="footer text-center" style={{ textAlign: 'center', marginTop: '15px', fontSize: '10px', borderTop: '1px dashed #000', paddingTop: '10px' }}>
                <div className="thank-you" style={{ fontWeight: 'bold', marginBottom: '5px' }}>
                  THANK YOU FOR YOUR BUSINESS!
                </div>
                <div style={{ marginBottom: '3px' }}>
                  Items sold are not returnable
                </div>
                <div style={{ marginBottom: '3px' }}>
                  Keep this receipt for your records
                </div>
                <div style={{ marginBottom: '8px' }}>
                  Visit us again soon!
                </div>
                <div style={{ fontSize: '8px', marginTop: '10px' }}>
                  Transaction ID: {sale.id}
                </div>
                <div style={{ fontSize: '8px' }}>
                  {sale.is_in_person ? 'In-Store Purchase' : 'Online Order'}
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button onClick={handlePrint} className="bg-green-600 hover:bg-green-700">
              <Printer className="mr-2 h-4 w-4" />
              Print Receipt
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default function CompletedSalesPage() {
  const [sales, setSales] = useState<CompletedSale[]>([])
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [selectedSale, setSelectedSale] = useState<CompletedSale | null>(null)
  const [showReceipt, setShowReceipt] = useState<CompletedSale | null>(null)
  const itemsPerPage = 10

  useEffect(() => {
    fetchSales()
  }, [currentPage])

  async function fetchSales() {
    try {
      setLoading(true);

      // 1. Get paginated completed_sales
      const { data: salesData, error: salesError, count } = await supabase
        .from('completed_sales')
        .select('*', { count: 'exact' })
        .order('transaction_date', { ascending: false })
        .range((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage - 1);

      if (salesError) throw salesError;
      setTotalCount(count || 0);

      // 2. Get unique staff_ids
      const uniqueStaffIds = [...new Set((salesData || []).map(sale => sale.staff_id).filter(Boolean))];

      // 3. Fetch user profiles manually
      let staffProfilesMap: Record<string, any> = {};
      if (uniqueStaffIds.length > 0) {
        const { data: staffProfiles, error: profilesError } = await supabase
          .from('user_profiles')
          .select('id, full_name, email, phone')
          .in('id', uniqueStaffIds);

        if (profilesError) throw profilesError;

        // 4. Map profiles by ID for quick lookup
        staffProfilesMap = (staffProfiles || []).reduce((acc, profile) => {
          acc[profile.id] = profile;
          return acc;
        }, {} as Record<string, any>);
      }

      // 5. Attach staff info manually to each sale
      const formattedSales = (salesData || []).map((sale) => ({
        ...sale,
        staff_info: sale.staff_id ? staffProfilesMap[sale.staff_id] : undefined
      }));

      setSales(formattedSales);
    } catch (error) {
      console.error('Error fetching sales:', error);
      toast.error('Failed to load sales data');
    } finally {
      setLoading(false);
    }
  }

  async function exportToExcel() {
    try {
      setExporting(true)
      
      // Transform data for export
      const exportData = sales.map(sale => ({
        'Sale ID': sale.id,
        'Order ID': sale.order_id || 'N/A',
        'Transaction Date': format(new Date(sale.transaction_date), 'yyyy-MM-dd HH:mm:ss'),
        'Customer Name': sale.customer_name || 'Anonymous',
        'Customer Email': sale.customer_email || 'N/A',
        'Customer Phone': sale.customer_phone || 'N/A',
        'Items Count': sale.items.length,
        'Subtotal': sale.subtotal,
        'Tax': sale.tax,
        'Discount': sale.discount,
        'Total': sale.total,
        'Payment Method': sale.payment_method,
        'Processed By': sale.staff_info?.full_name || 'System',
        'Staff Email': sale.staff_info?.email || 'N/A',
        'Staff Phone': sale.staff_info?.phone || 'N/A',
        'Sale Type': sale.is_in_person ? 'In-Person' : 'Online',
        'Notes': sale.notes || 'N/A'
      }))

      // Create worksheet
      const worksheet = XLSX.utils.json_to_sheet(exportData)
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Completed Sales')
      
      // Generate Excel file
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
      const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      
      // Save file
      saveAs(data, `completed_sales_${format(new Date(), 'yyyyMMdd_HHmmss')}.xlsx`)
      
      toast.success('Excel export completed successfully')
    } catch (error) {
      console.error('Export failed:', error)
      toast.error('Failed to export sales data')
    } finally {
      setExporting(false)
    }
  }

  async function exportToCSV() {
    try {
      setExporting(true)
      
      // CSV headers
      const headers = [
        'Sale ID', 'Order ID', 'Transaction Date', 'Customer Name', 'Customer Email',
        'Customer Phone', 'Items Count', 'Subtotal', 'Tax', 'Discount', 'Total',
        'Payment Method', 'Processed By', 'Staff Email', 'Staff Phone', 'Sale Type', 'Notes'
      ]
      
      // CSV rows
      const rows = sales.map(sale => [
        sale.id,
        sale.order_id || 'N/A',
        format(new Date(sale.transaction_date), 'yyyy-MM-dd HH:mm:ss'),
        sale.customer_name || 'Anonymous',
        sale.customer_email || 'N/A',
        sale.customer_phone || 'N/A',
        sale.items.length,
        sale.subtotal,
        sale.tax,
        sale.discount,
        sale.total,
        sale.payment_method,
        sale.staff_info?.full_name || 'System',
        sale.staff_info?.email || 'N/A',
        sale.staff_info?.phone || 'N/A',
        sale.is_in_person ? 'In-Person' : 'Online',
        sale.notes || 'N/A'
      ])
      
      // Create CSV content
      let csvContent = headers.join(',') + '\n'
      rows.forEach(row => {
        csvContent += row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(',') + '\n'
      })
      
      // Save file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      saveAs(blob, `completed_sales_${format(new Date(), 'yyyyMMdd_HHmmss')}.csv`)
      
      toast.success('CSV export completed successfully')
    } catch (error) {
      console.error('CSV export failed:', error)
      toast.error('Failed to export CSV')
    } finally {
      setExporting(false)
    }
  }

  const filteredSales = sales.filter(sale => 
    sale.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sale.customer_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sale.order_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sale.staff_info?.full_name.toLowerCase().includes(searchTerm.toLowerCase())
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
            placeholder="Search by customer, staff, email, or order ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-white border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-200"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        </div>
        
        <div className="flex gap-2">
          <Button 
            onClick={exportToExcel} 
            disabled={exporting || sales.length === 0}
            variant="outline"
            className="border-gray-300 hover:bg-gray-50"
          >
            {exporting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <FileSpreadsheet className="mr-2 h-4 w-4" />
            )}
            Excel
          </Button>
          <Button 
            onClick={exportToCSV} 
            disabled={exporting || sales.length === 0}
            variant="outline"
            className="border-gray-300 hover:bg-gray-50"
          >
            {exporting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <FileText className="mr-2 h-4 w-4" />
            )}
            CSV
          </Button>
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
                <TableHead className="text-gray-700 font-semibold">Staff</TableHead>
                <TableHead className="text-gray-700 font-semibold">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSales.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10 text-gray-500">
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
                    <TableCell className="text-sm">
                      <div className="flex items-center">
                        {sale.is_in_person ? (
                          <Store className="h-4 w-4 mr-1 text-blue-500" />
                        ) : (
                          <User className="h-4 w-4 mr-1 text-gray-500" />
                        )}
                        {sale.staff_info?.full_name || 'System'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedSale(sale)}
                          className="border-gray-300 hover:bg-gray-50"
                        >
                          <FileText className="h-4 w-4 mr-1" />
                          Details
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowReceipt(sale)}
                          className="border-green-300 hover:bg-green-50 text-green-600"
                        >
                          <ReceiptIcon className="h-4 w-4 mr-1" />
                          Receipt
                        </Button>
                      </div>
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

      {/* Receipt Modal */}
      {showReceipt && (
        <Receipt 
          sale={showReceipt} 
          onClose={() => setShowReceipt(null)} 
        />
      )}

      {/* Enhanced Sale Details Dialog */}
      {selectedSale && (
        <Dialog open={!!selectedSale} onOpenChange={() => setSelectedSale(null)}>
          <DialogContent className="sm:max-w-[800px] bg-white">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ShoppingBag className="h-5 w-5 text-blue-500" />
                <span>Sale #{selectedSale.order_id || selectedSale.id.slice(0, 8)}</span>
              </DialogTitle>
              <DialogDescription>
                Processed on {formatDate(selectedSale.transaction_date)}
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column - Customer and Staff Info */}
              <div className="space-y-4">
                {/* Customer Information */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-medium mb-3 flex items-center">
                    <User className="h-4 w-4 mr-2 text-blue-500" />
                    Customer Information
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-500">Name</p>
                      <p className="font-medium">{selectedSale.customer_name || 'Anonymous'}</p>
                    </div>
                    {selectedSale.customer_email && (
                      <div>
                        <p className="text-sm text-gray-500">Email</p>
                        <p className="font-medium">{selectedSale.customer_email}</p>
                      </div>
                    )}
                    {selectedSale.customer_phone && (
                      <div>
                        <p className="text-sm text-gray-500">Phone</p>
                        <p className="font-medium">{selectedSale.customer_phone}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Staff Information */}
                {selectedSale.staff_info && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-medium mb-3 flex items-center">
                      {selectedSale.is_in_person ? (
                        <Store className="h-4 w-4 mr-2 text-green-500" />
                      ) : (
                        <User className="h-4 w-4 mr-2 text-purple-500" />
                      )}
                      Processed By
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-gray-500">Staff Name</p>
                        <p className="font-medium">{selectedSale.staff_info.full_name}</p>
                      </div>
                      {selectedSale.staff_info.email && (
                        <div>
                          <p className="text-sm text-gray-500">Email</p>
                          <p className="font-medium">{selectedSale.staff_info.email}</p>
                        </div>
                      )}
                      {selectedSale.staff_info.phone && (
                        <div>
                          <p className="text-sm text-gray-500">Phone</p>
                          <p className="font-medium">{selectedSale.staff_info.phone}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column - Products and Payment */}
              <div className="space-y-4">
                {/* Items List */}
                <div>
                  <h3 className="font-medium mb-3 flex items-center">
                    <ShoppingBag className="h-4 w-4 mr-2 text-blue-500" />
                    Products Purchased ({selectedSale.items.length})
                  </h3>
                  <div className="border rounded-lg overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200 overflow-y-scroll overflow-scroll">
                      <thead className="bg-gray-50 ">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Qty</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200 ">
                        {selectedSale.items.map((item, index) => (
                          <tr key={index}>
                            <td className="px-4 py-2 whitespace-nowrap">
                              <div className="flex items-center">
                                {item.image_url ? (
                                  <div className="flex-shrink-0 h-10 w-10 mr-2">
                                    <img
                                      src={item.image_url}
                                      alt={item.name}
                                      width={40}
                                      height={40}
                                      className="rounded-md object-cover h-full w-full"
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
                  <h3 className="font-medium mb-3 flex items-center">
                    <CreditCard className="h-4 w-4 mr-2 text-blue-500" />
                    Payment Summary
                  </h3>
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
                    <div className="flex justify-between items-center mt-2">
                      <span>Payment Method:</span>
                      <span className="flex items-center font-medium">
                        {getPaymentMethodIcon(selectedSale.payment_method)}
                        {selectedSale.payment_method}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Notes Section */}
            {selectedSale.notes && (
              <div className="mt-4">
                <h3 className="font-medium mb-2 flex items-center">
                  <FileText className="h-4 w-4 mr-2 text-blue-500" />
                  Additional Notes
                </h3>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-700 whitespace-pre-line">{selectedSale.notes}</p>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-between mt-6">
              <Button
                variant="outline"
                onClick={() => setShowReceipt(selectedSale)}
                className="border-green-300 hover:bg-green-50 text-green-600"
              >
                <ReceiptIcon className="mr-2 h-4 w-4" />
                Print Receipt
              </Button>
              <Button variant="outline" onClick={() => setSelectedSale(null)}>
                Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}