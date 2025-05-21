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
  ImageIcon,
  Trash,
  Edit,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import ProductForm from '@/components/dashboard/ProductForm'

export interface Product {
  category_id: null
  slug: string
  description: string
  avg_rating: number
  image_url: string
  id: number;
  name: string;
  stock_quantity: number;
  price: number;
  categories: {
    id: null | string
    name: string
  };
}

export default function StockAlertsPage() {

  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
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


  interface StockStatus {
    label: string;
    color: string;
  }

  function openImagePreview(imageUrl: string) {
    setImagePreview(imageUrl)
  }

  function closeImagePreview() {
    setImagePreview(null)
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
                <TableHead className="w-[100px]">Image</TableHead>
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
                    <TableCell>
                      {product.image_url ? (
                        <div
                          className="relative w-12 h-12 rounded-md overflow-hidden cursor-pointer border border-gray-200 hover:border-blue-300 transition-all"
                          onClick={() => openImagePreview(product.image_url)}
                        >
                          <img
                            src={product.image_url}
                            alt={product.name}
                            className="object-cover w-full h-full"
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-10 transition-all" />
                        </div>
                      ) : (
                        <div className="w-12 h-12 flex items-center justify-center bg-gray-100 rounded-md border border-gray-200">
                          <ImageIcon className="h-6 w-6 text-gray-400" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>{product.categories?.name || 'Uncategorized'}</TableCell>
                    <TableCell>{product.stock_quantity}</TableCell>
                    <TableCell>
                      <Badge className={status.color}>{status.label}</Badge>
                    </TableCell>
                    <TableCell>${product.price.toFixed(2)}</TableCell>
                    <TableCell className="text-right"> 
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="icon" className="border-gray-300 hover:bg-gray-50">
                            <Edit className="h-4 w-4 text-yellow-600" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className='sm:max-w-[600px] bg-white rounded-lg'>
                          <DialogHeader>
                            <DialogTitle className="text-gray-800">Edit Product</DialogTitle>
                          </DialogHeader>
                          <ProductForm
                            editProduct={{
                              id: product.id.toString(),
                              slug: product.slug,
                              avg_rating: product.avg_rating,
                              name: product.name,
                              description: product.description || '',
                              price: product.price,
                              stock_quantity: product.stock_quantity,
                              category_id: product.category_id || null,
                              image_url: product.image_url || ''
                            }}
                            onSubmitSuccess={fetchLowStockProducts}
                          />
                        </DialogContent>
                      </Dialog>
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

      {/* Image Preview Modal */}
      {imagePreview && (
        <div
          className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50"
          onClick={closeImagePreview}
        >
          <div className="relative max-w-3xl max-h-[80vh] p-2 bg-white rounded-lg shadow-xl">
            <Button
              variant="outline"
              size="icon"
              className="absolute top-2 right-2 z-10 bg-white hover:bg-gray-100 border-gray-300"
              onClick={closeImagePreview}
            >
              <Trash className="h-4 w-4 text-gray-600" />
            </Button>
            <img
              src={imagePreview}
              alt="Product preview"
              className="max-h-[calc(80vh-2rem)] max-w-full object-contain rounded"
            />
          </div>
        </div>
      )}
    </div>
  )
}
