 'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog'
import { Plus, Minus, Trash, ShoppingCart, User, CreditCard, DollarSign, Mail, Phone, CheckCircle, Search, ChevronLeft, ChevronRight } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { Textarea } from '@/components/ui/textarea'
import Image from 'next/image'

interface Product {
  id: number;
  name: string;
  price: number;
  stock_quantity: number;
  image_url?: string;
  category_id?: string;
}

interface Category {
  id: string;
  name: string;
}

export default function DirectSalesPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loadingProducts, setLoadingProducts] = useState(true)
  const [cart, setCart] = useState<Array<{
    id: number;
    name: string;
    price: number;
    quantity: number;
    image_url?: string;
  }>>([])
  const [customerName, setCustomerName] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [discount, setDiscount] = useState(0)
  const [taxRate, setTaxRate] = useState(0.08)
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [user, setUser] = useState<any>(null)
  
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1)
  const [totalProducts, setTotalProducts] = useState(0)
  const itemsPerPage = 12

  useEffect(() => {
    const fetchUser = async () => {
      const { data, error } = await supabase.auth.getUser()
      if (data?.user) setUser(data.user)
    }
    fetchUser()
    fetchCategories()
    fetchProducts()
  }, [])

  useEffect(() => {
    // Reset to page 1 when filters change
    setCurrentPage(1)
    filterProducts()
  }, [searchTerm, selectedCategory, products])

  async function fetchProducts() {
    try {
      setLoadingProducts(true)
      
      // First get the total count
      const { count } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
      
      setTotalProducts(count || 0)
      
      // Then fetch the first page
      const { data, error } = await supabase
        .from('products')
        .select('id, name, price, stock_quantity, image_url, category_id')
        .order('name')
        .range(0, itemsPerPage - 1)

      if (error) throw error
      setProducts(data || [])
    } catch (error) {
      console.error('Error fetching products:', error)
    } finally {
      setLoadingProducts(false)
    }
  }

  async function fetchCategories() {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name')
        .order('name')

      if (error) throw error
      setCategories(data || [])
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  async function loadMoreProducts() {
    try {
      setLoadingProducts(true)
      const { data, error } = await supabase
        .from('products')
        .select('id, name, price, stock_quantity, image_url, category_id')
        .order('name')
        .range((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage - 1)

      if (error) throw error
      setProducts(prev => [...prev, ...(data || [])])
    } catch (error) {
      console.error('Error loading more products:', error)
    } finally {
      setLoadingProducts(false)
    }
  }

  const filterProducts = () => {
    let result = products
    
    // Apply category filter
    if (selectedCategory !== 'all') {
      result = result.filter(product => product.category_id === selectedCategory)
    }
    
    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      result = result.filter(product => 
        product.name.toLowerCase().includes(term))
    }
    
    setFilteredProducts(result)
  }

  const handlePageChange = async (newPage: number) => {
    setCurrentPage(newPage)
    
    // Check if we need to load more products
    const hasEnoughProducts = products.length >= newPage * itemsPerPage
    if (!hasEnoughProducts) {
      await loadMoreProducts()
    }
  }

  const addToCart = (product: Product) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === product.id)
      if (existingItem) {
        return prevCart.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      } else {
        return [...prevCart, {
          id: product.id,
          name: product.name,
          price: product.price,
          quantity: 1,
          image_url: product.image_url
        }]
      }
    })
  }
    const removeFromCart = (productId: number) => {
        setCart(prevCart => prevCart.filter(item => item.id !== productId))
    }

    const updateQuantity = (productId: number, newQuantity: number) => {
        if (newQuantity < 1) {
            removeFromCart(productId)
            return
        }

        setCart(prevCart =>
            prevCart.map(item =>
                item.id === productId
                    ? { ...item, quantity: newQuantity }
                    : item
            )
        )
    }

  // ... (rest of your existing functions: removeFromCart, updateQuantity, handleSubmit, etc.)
   const handleSubmit = async () => {
        try {
            setIsSubmitting(true)

            const saleData = {
                transaction_date: new Date().toISOString(),
                customer_name: customerName || 'Anonymous',
                customer_email: customerEmail || null,
                customer_phone: customerPhone || null,
                items: cart.map(item => ({
                    id: item.id,
                    name: item.name,
                    price: item.price,
                    quantity: item.quantity
                })),
                subtotal,
                tax,
                discount,
                total,
                payment_method: paymentMethod,
                staff_id: user?.id,
                is_in_person: true,
                notes: notes || null
            }

            const { error } = await supabase
                .from('completed_sales')
                .insert(saleData)

            if (error) throw error

            // Update product stock quantities
            for (const item of cart) {
                const { error: updateError } = await supabase.rpc('decrement_product_stock', {
                    product_id: item.id,
                    amount: item.quantity
                })

                if (updateError) throw updateError
            }

            setSuccess(true)
            resetForm()

            // Reset success message after 3 seconds
            setTimeout(() => setSuccess(false), 3000)
        } catch (error) {
            console.error('Error processing sale:', error)
        } finally {
            setIsSubmitting(false)
        }
    }

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  const tax = subtotal * taxRate
  const total = subtotal + tax - discount

  const totalPages = Math.ceil(totalProducts / itemsPerPage)

  return (
    <div className="space-y-4 p-4 bg-white rounded-lg">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Direct Sales</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Product Selection */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            {/* Search and Filter Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
              <div className="relative flex-1">
                <Input
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-white border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-200"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              </div>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="h-10 px-3 py-2 rounded-md border border-gray-300 bg-white text-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-200"
              >
                <option value="all">All Categories</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <h2 className="text-lg font-medium mb-4">Available Products</h2>

            {loadingProducts && currentPage === 1 ? (
              <div className="text-center py-10 text-gray-500">Loading products...</div>
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {filteredProducts.map((product, i )=> (
                    <div
                      key={i}
                      className="border rounded-lg p-3 hover:shadow-md transition-shadow cursor-pointer flex flex-col"
                      onClick={() => addToCart(product)}
                    >
                      <div className="relative aspect-square mb-2 bg-gray-100 rounded-md overflow-hidden">
                        {product.image_url ? (
                          <img
                            src={product.image_url}
                            alt={product.name} 
                            className="object-cover w-full h-full"
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <ShoppingCart className="h-8 w-8" />
                          </div>
                        )}
                      </div>
                      <h3 className="font-medium text-sm line-clamp-2">{product.name}</h3>
                      <p className="text-green-600 font-semibold text-sm mt-1">
                        {formatCurrency(product.price)}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {product.stock_quantity} in stock
                      </p>
                    </div>
                  ))}
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-6">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="border-gray-300 hover:bg-gray-100"
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Previous
                    </Button>
                    <span className="text-sm text-gray-600">
                      Page {currentPage} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="border-gray-300 hover:bg-gray-100"
                    >
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Cart and Checkout */}
        <div className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h2 className="text-lg font-medium mb-4 flex items-center">
              <ShoppingCart className="h-5 w-5 mr-2" />
              Current Sale
            </h2>

            {cart.length === 0 ? (
              <div className="text-center py-6 text-gray-500">
                Add products to begin a sale
              </div>
            ) : (
              <div className="space-y-3">
                {cart.map(item => (
                  <div key={item.id} className="border-b pb-3 last:border-b-0 last:pb-0">
                    <div className="flex gap-3 items-start">
                      {item.image_url && (
                        <div className="relative w-12 h-12 flex-shrink-0 rounded-md overflow-hidden">
                          <img
                            src={item.image_url}
                            alt={item.name}
                            className="object-cover w-full h-full"
                            sizes="48px"
                          />
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-medium">{item.name}</h3>
                            <p className="text-sm text-gray-500">{formatCurrency(item.price)} each</p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={(e) => {
                                e.stopPropagation()
                                updateQuantity(item.id, item.quantity - 1)
                              }}
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            <span className="w-8 text-center">{item.quantity}</span>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={(e) => {
                                e.stopPropagation()
                                updateQuantity(item.id, item.quantity + 1)
                              }}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-red-500 hover:text-red-600"
                              onClick={(e) => {
                                e.stopPropagation()
                                removeFromCart(item.id)
                              }}
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="flex justify-between mt-1">
                          <span className="text-sm text-gray-500">Subtotal</span>
                          <span className="font-medium">{formatCurrency(item.price * item.quantity)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Order Summary */}
                <div className="bg-white p-3 rounded-md border mt-4">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal</span>
                    <span>{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm mt-1">
                    <span>Tax ({taxRate * 100}%)</span>
                    <span>{formatCurrency(tax)}</span>
                  </div>
                  <div className="flex justify-between text-sm mt-1 text-green-600">
                    <span>Discount</span>
                    <span>-{formatCurrency(discount)}</span>
                  </div>
                  <Separator className="my-2" />
                  <div className="flex justify-between font-bold">
                    <span>Total</span>
                    <span>{formatCurrency(total)}</span>
                  </div>
                </div>

                {/* Checkout Dialog */}
                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="w-full text-white mt-4 bg-blue-600 hover:bg-blue-700">
                      Complete Sale
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[600px] bg-white">
                    <DialogHeader>
                      <DialogTitle>Complete Direct Sale</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4">
                      {/* Customer Information */}
                      <div>
                        <h3 className="font-medium mb-3">Customer Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="customer-name">Name (Optional)</Label>
                            <Input
                              id="customer-name"
                              value={customerName}
                              onChange={(e) => setCustomerName(e.target.value)}
                              placeholder="Customer name"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="customer-email">Email (Optional)</Label>
                            <Input
                              id="customer-email"
                              type="email"
                              value={customerEmail}
                              onChange={(e) => setCustomerEmail(e.target.value)}
                              placeholder="customer@example.com"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="customer-phone">Phone (Optional)</Label>
                            <Input
                              id="customer-phone"
                              value={customerPhone}
                              onChange={(e) => setCustomerPhone(e.target.value)}
                              placeholder="(123) 456-7890"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="payment-method">Payment Method</Label>
                            <Select
                              value={paymentMethod}
                              onValueChange={setPaymentMethod}
                            >
                              <SelectTrigger id="payment-method">
                                <SelectValue placeholder="Select method" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="cash">
                                  <div className="flex items-center">
                                    <DollarSign className="h-4 w-4 mr-2" />
                                    Cash
                                  </div>
                                </SelectItem>
                                <SelectItem value="credit card">
                                  <div className="flex items-center">
                                    <CreditCard className="h-4 w-4 mr-2" />
                                    Credit Card
                                  </div>
                                </SelectItem>
                                <SelectItem value="debit card">
                                  <div className="flex items-center">
                                    <CreditCard className="h-4 w-4 mr-2" />
                                    Debit Card
                                  </div>
                                </SelectItem>
                                <SelectItem value="other">
                                  Other
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>

                      {/* Discount */}
                      <div className="space-y-2">
                        <Label htmlFor="discount">Discount</Label>
                        <Input
                          id="discount"
                          type="number"
                          min="0"
                          step="0.01"
                          value={discount}
                          onChange={(e) => setDiscount(Number(e.target.value))}
                          placeholder="0.00"
                        />
                      </div>

                      {/* Notes */}
                      <div className="space-y-2">
                        <Label htmlFor="notes">Notes (Optional)</Label>
                        <Textarea
                          id="notes"
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          placeholder="Any special instructions or notes..."
                          rows={3}
                        />
                      </div>

                      {/* Order Summary */}
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h3 className="font-medium mb-2">Order Summary</h3>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span>Items ({cart.reduce((sum, item) => sum + item.quantity, 0)})</span>
                            <span>{formatCurrency(subtotal)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Tax</span>
                            <span>{formatCurrency(tax)}</span>
                          </div>
                          {discount > 0 && (
                            <div className="flex justify-between text-green-600">
                              <span>Discount</span>
                              <span>-{formatCurrency(discount)}</span>
                            </div>
                          )}
                          <Separator className="my-2" />
                          <div className="flex justify-between font-bold">
                            <span>Total</span>
                            <span>{formatCurrency(total)}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <DialogFooter>
                      <Button
                        onClick={handleSubmit}
                        disabled={isSubmitting || cart.length === 0}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        {isSubmitting ? 'Processing...' : 'Complete Sale'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            )}
          </div>

          {/* Success Message */}
          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 p-3 rounded-lg">
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 mr-2" />
                <span>Sale completed successfully!</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function Separator({ className }: { className?: string }) {
  return <div className={`border-t border-gray-200 ${className}`} />
}

function resetForm() {
    throw new Error('Function not implemented.')
}
