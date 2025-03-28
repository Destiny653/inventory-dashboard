import React from 'react'
import { useState } from 'react'
import { 
  Package, 
  Truck, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  FileText,
  User,
  MapPin,
  CreditCard,
  ChevronDown,
  ChevronUp,
  ExternalLink
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

interface Order {
  order_number: string;
  status: string;
  tracking_number?: string;
  created_at: string;
  delivered_at?: string;
  cancelled_at?: string;
  items: Array<{
    id: string;
    name: string;
    image_url?: string;
    variant_name?: string;
    quantity: number;
    price: number;
  }>;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  shipping_address: {
    name: string;
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  payment_method: string;
  payment_details?: {
    last4?: string;
  };
  transaction_id?: string;
  subtotal: number;
  shipping_cost: number;
  discount: number;
  tax: number;
  total: number;
  notes?: Array<{
    content: string;
    author: string;
    created_at: string;
  }>;
}

export function OrderDetails({ 
  order, 
  onClose, 
  onUpdateStatus 
}: { 
  order: Order | null;
  onClose: () => void;
  onUpdateStatus: (order: Order, note: string) => void;
}) {
  const [newStatus, setNewStatus] = useState(order?.status || 'pending')
  const [trackingNumber, setTrackingNumber] = useState(order?.tracking_number || '')
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  
  if (!order) return null
  
interface StatusBadgeConfig {
    pending: string;
    processing: string;
    shipped: string;
    delivered: string;
    cancelled: string;
    [key: string]: string;
}

type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | string;

const getStatusBadge = (status: OrderStatus): React.ReactElement => {
    switch (status) {
        case 'pending':
            return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
        case 'processing':
            return <Badge className="bg-blue-100 text-blue-800">Processing</Badge>
        case 'shipped':
            return <Badge className="bg-purple-100 text-purple-800">Shipped</Badge>
        case 'delivered':
            return <Badge className="bg-green-100 text-green-800">Delivered</Badge>
        case 'cancelled':
            return <Badge className="bg-red-100 text-red-800">Cancelled</Badge>
        default:
            return <Badge>{status}</Badge>
    }
}
  
interface StatusIconProps {
    status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | string;
}

const getStatusIcon = (status: StatusIconProps['status']): React.ReactElement | null => {
    switch (status) {
        case 'pending':
            return <Clock className="h-5 w-5 text-yellow-500" />
        case 'processing':
            return <Package className="h-5 w-5 text-blue-500" />
        case 'shipped':
            return <Truck className="h-5 w-5 text-purple-500" />
        case 'delivered':
            return <CheckCircle className="h-5 w-5 text-green-500" />
        case 'cancelled':
            return <AlertTriangle className="h-5 w-5 text-red-500" />
        default:
            return null
    }
}
  
  const handleUpdateStatus = async () => {
    try {
      setLoading(true)
      
      // In a real app, this would update the order in the database
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const updatedOrder = {
        ...order,
        status: newStatus,
        tracking_number: trackingNumber,
      }
      
      onUpdateStatus(updatedOrder, note)
      onClose()
      
    } catch (error) {
      console.error('Error updating order status:', error)
    } finally {
      setLoading(false)
    }
  }
  
interface DateOptions extends Intl.DateTimeFormatOptions {}

const formatDate = (date: string | Date): string => {
    const options: DateOptions = {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }
    
    return new Date(date).toLocaleDateString('en-US', options)
}
  
interface CurrencyOptions extends Intl.NumberFormatOptions {}

const formatCurrency = (amount: number): string => {
    const options: CurrencyOptions = {
        style: 'currency',
        currency: 'USD'
    }
    return new Intl.NumberFormat('en-US', options).format(amount)
}
  
  return (
    <DialogContent className="sm:max-w-[700px]">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <span>Order #{order.order_number}</span>
          {getStatusBadge(order.status)}
        </DialogTitle>
        <DialogDescription>
          Placed on {formatDate(order.created_at)}
        </DialogDescription>
      </DialogHeader>
      
      <div className="grid gap-6 py-4 max-h-[70vh] overflow-y-auto pr-2">
        {/* Order Timeline */}
        <div>
          <h3 className="text-sm font-medium mb-3">Order Status</h3>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              {getStatusIcon(order.status)}
              <div>
                <p className="font-medium">{order.status.charAt(0).toUpperCase() + order.status.slice(1)}</p>
                <p className="text-sm text-muted-foreground">
                  {order.status === 'pending' && 'Your order has been received and is awaiting processing.'}
                  {order.status === 'processing' && 'Your order is being prepared for shipping.'}
                  {order.status === 'shipped' && `Your order has been shipped. Tracking number: ${order.tracking_number || 'N/A'}`}
                  {order.status === 'delivered' && `Your order was delivered on ${formatDate(order.delivered_at || new Date())}.`}
                  {order.status === 'cancelled' && `Your order was cancelled on ${formatDate(order.cancelled_at || new Date())}.`}
                </p>
                {order.tracking_number && order.status === 'shipped' && (
                  <a 
                    href={`https://track.example.com/${order.tracking_number}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline inline-flex items-center mt-1"
                  >
                    Track Package
                    <ExternalLink className="ml-1 h-3 w-3" />
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
        
        <Separator />
        
        {/* Order Items */}
        <div>
          <h3 className="text-sm font-medium mb-3">Order Items</h3>
          <div className="space-y-3">
            {order.items.map((item) => (
              <div key={item.id} className="flex items-start gap-3">
                <div className="h-16 w-16 rounded-md overflow-hidden flex-shrink-0">
                  <img 
                    src={item.image_url || 'https://placehold.co/100x100/eee/ccc'} 
                    alt={item.name}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium">{item.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {item.variant_name && `${item.variant_name} • `}
                    Qty: {item.quantity}
                  </p>
                  <p className="text-sm">
                    {formatCurrency(item.price)} each
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium">
                    {formatCurrency(item.price * item.quantity)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <Separator />
        
        {/* Order Details Accordion */}
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="customer">
            <AccordionTrigger className="text-sm font-medium">
              Customer Information
            </AccordionTrigger>
            <AccordionContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-xs font-medium text-muted-foreground mb-1">
                    Customer Details
                  </h4>
                  <div className="flex items-start gap-2">
                    <User className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm">{order.customer_name}</p>
                      <p className="text-sm">{order.customer_email}</p>
                      <p className="text-sm">{order.customer_phone || 'No phone provided'}</p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-xs font-medium text-muted-foreground mb-1">
                    Shipping Address
                  </h4>
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm">{order.shipping_address.name}</p>
                      <p className="text-sm">{order.shipping_address.street}</p>
                      <p className="text-sm">
                        {order.shipping_address.city}, {order.shipping_address.state} {order.shipping_address.zip}
                      </p>
                      <p className="text-sm">{order.shipping_address.country}</p>
                    </div>
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="payment">
            <AccordionTrigger className="text-sm font-medium">
              Payment Information
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <CreditCard className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm">
                      {order.payment_method === 'credit_card' 
                        ? `Credit Card (${order.payment_details?.last4 || '****'})` 
                        : order.payment_method === 'paypal'
                          ? 'PayPal'
                          : order.payment_method}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Transaction ID: {order.transaction_id || 'N/A'}
                    </p>
                  </div>
                </div>
                
                <div className="bg-muted p-3 rounded-md">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal</span>
                    <span>{formatCurrency(order.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm mt-1">
                    <span>Shipping</span>
                    <span>{formatCurrency(order.shipping_cost)}</span>
                  </div>
                  {order.discount > 0 && (
                    <div className="flex justify-between text-sm mt-1 text-green-600">
                      <span>Discount</span>
                      <span>-{formatCurrency(order.discount)}</span>
                    </div>
                  )}
                  {order.tax > 0 && (
                    <div className="flex justify-between text-sm mt-1">
                      <span>Tax</span>
                      <span>{formatCurrency(order.tax)}</span>
                    </div>
                  )}
                  <Separator className="my-2" />
                  <div className="flex justify-between font-medium">
                    <span>Total</span>
                    <span>{formatCurrency(order.total)}</span>
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="notes">
            <AccordionTrigger className="text-sm font-medium">
              Order Notes & History
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-3">
                {order.notes && order.notes.length > 0 ? (
                  order.notes.map((note, index) => (
                    <div key={index} className="bg-muted p-3 rounded-md">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                          <div>
                            <p className="text-sm">{note.content}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              By {note.author} on {formatDate(note.created_at)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No notes for this order.</p>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
        
        {/* Update Status Form */}
        <Separator />
        <div>
          <h3 className="text-sm font-medium mb-3">Update Order Status</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger id="status">
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
              </div>
              
              {newStatus === 'shipped' && (
                <div className="space-y-2">
                  <Label htmlFor="tracking">Tracking Number</Label>
                  <input
                    id="tracking"
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    placeholder="Enter tracking number"
                  />
                </div>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="note">Add a Note (Optional)</Label>
              <Textarea
                id="note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Add details about this status update"
                rows={3}
              />
            </div>
          </div>
        </div>
      </div>
      
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={handleUpdateStatus} disabled={loading}>
          {loading ? 'Updating...' : 'Update Order'}
        </Button>
      </DialogFooter>
    </DialogContent>
  )
}
