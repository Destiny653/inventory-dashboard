'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent } from '@/components/ui/card'
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
  AlertTriangle,
  Search,
  AlertCircle,
  Package,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'

export interface Product {
  id: number;
  name: string;
  stock_quantity: number;
  price: number;
  categories: { name: string };
}

export default function StockAlertsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [threshold, setThreshold] = useState(10) // Default low stock threshold
  
  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  )
  
  useEffect(() => {
    fetchLowStockProducts()
  }, [threshold])
  
  async function fetchLowStockProducts() {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('products')
        .select('*, categories(name)')
        .lte('stock_quantity', threshold)
        .order('stock_quantity', { ascending: true })
      
      if (error) throw error
      setProducts(data || [])
    } catch (error) {
      console.error('Error fetching low stock products:', error)
    } finally {
      setLoading(false)
    }
  }
  
  // For demonstration purposes, using mock data
  useEffect(() => {
    const mockProducts = [
      { id: 1, name: 'Wireless Earbuds', stock_quantity: 3, price: 59.99, categories: { name: 'Electronics' } },
      { id: 2, name: 'Smart Watch', stock_quantity: 5, price: 129.99, categories: { name: 'Electronics' } },
      { id: 3, name: 'Bluetooth Speaker', stock_quantity: 0, price: 79.99, categories: { name: 'Electronics' } },
      { id: 4, name: 'Laptop Stand', stock_quantity: 2, price: 29.99, categories: { name: 'Accessories' } },
      { id: 5, name: 'Phone Case', stock_quantity: 8, price: 19.99, categories: { name: 'Accessories' } },
      { id: 6, name: 'USB-C Cable', stock_quantity: 7, price: 12.99, categories: { name: 'Accessories' } },
      { id: 7, name: 'Wireless Charger', stock_quantity: 4, price: 34.99, categories: { name: 'Electronics' } },
    ]
    setProducts(mockProducts)
  }, [])
  
interface StockStatus {
    label: string;
    color: string;
}

function getStockStatus(quantity: number): StockStatus {
    if (quantity === 0) return { label: 'Out of Stock', color: 'bg-red-100 text-red-800' }
    if (quantity <= 5) return { label: 'Critical', color: 'bg-orange-100 text-orange-800' }
    return { label: 'Low Stock', color: 'bg-yellow-100 text-yellow-800' }
}
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Stock Alerts</h1>
        <Button onClick={() => fetchLowStockProducts()}>
          Refresh
        </Button>
      </div>
      
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              <span className="text-lg font-medium">
                {filteredProducts.length} products below threshold
              </span>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 items-center">
              <div className="flex items-center gap-2">
                <span className="text-sm">Threshold:</span>
                <Input
                  type="number"
                  min="1"
                  value={threshold}
                  onChange={(e) => setThreshold(Number(e.target.value))}
                  className="w-20"
                />
                <span className="text-sm">units</span>
              </div>
              
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 w-full sm:w-[250px]"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {loading ? (
        <div className="flex justify-center items-center h-64">Loading stock data...</div>
      ) : filteredProducts.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <Package className="h-16 w-16 text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No low stock products found</h3>
          <p className="text-gray-500 mt-1">All your products have sufficient stock levels.</p>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Stock Level</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Price</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((product) => {
                const status = getStockStatus(product.stock_quantity)
                return (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>{product.categories?.name || 'Uncategorized'}</TableCell>
                    <TableCell>{product.stock_quantity}</TableCell>
                    <TableCell>
                      <Badge className={status.color}>{status.label}</Badge>
                    </TableCell>
                    <TableCell>${product.price.toFixed(2)}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" asChild>
                        <a href={`/dashboard/products?edit=${product.id}`}>
                          Restock
                        </a>
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}
      
      <div className="bg-blue-50 border border-blue-200 rounded-md p-4 flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-blue-500 mt-0.5" />
        <div>
          <h4 className="text-sm font-medium text-blue-800">Stock Management Tips</h4>
          <ul className="text-sm text-blue-700 mt-1 list-disc list-inside space-y-1">
            <li>Consider restocking items when they reach 25% of your ideal inventory level</li>
            <li>Products marked as "Critical" should be restocked immediately</li>
            <li>Review your sales history to optimize reordering quantities</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
