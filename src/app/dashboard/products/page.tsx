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
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import { Plus, Edit, Trash, Image as ImageIcon, ChevronLeft, ChevronRight, Eye, Star, Search } from 'lucide-react'
import ProductForm from '@/components/dashboard/ProductForm'
import ProductDetails from '@/components/dashboard/ProductDetails'

export default function ProductsPage() {
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [products, setProducts] = useState<{
    category_id: null
    slug: string
    id: number;
    name: string;
    description?: string;
    categories?: { id: string; name: string };
    price: number;
    stock_quantity: number;
    avg_rating: number;
    image_url: string;
  }[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const itemsPerPage = 10

  useEffect(() => {
    fetchProducts()
    fetchCategories()
  }, [currentPage, selectedCategory])

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

  async function fetchProducts() {
    try {
      setLoading(true)
      
      let query = supabase
        .from('products')
        .select('*, categories(id, name)')
      
      if (selectedCategory !== 'all') {
        query = query.eq('category_id', selectedCategory)
      }
      
      const countQuery = supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
      
      if (selectedCategory !== 'all') {
        countQuery.eq('category_id', selectedCategory)
      }
      
      const { count, error: countError } = await countQuery
      
      if (countError) throw countError
      setTotalCount(count || 0)
      
      const { data, error } = await query
        .range((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage - 1)
      
      if (error) throw error
      setProducts(data || [])
    } catch (error) {
      console.error('Error fetching products:', error)
    } finally {
      setLoading(false)
    }
  }
  
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm])

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  interface Product {
    id: number
    name: string
    description?: string
    price: number
    stock_quantity: number
    category_id?: string
    image_url?: string
    categories?: {
      id: string
      name: string
    }
    avg_rating?: number
  }

  async function deleteProduct(id: number): Promise<void> {
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id)

      if (error) throw error
      fetchProducts()
    } catch (error) {
      console.error('Error deleting product:', error)
    }
  }

  function openImagePreview(imageUrl: string) {
    setImagePreview(imageUrl)
  }

  function closeImagePreview() {
    setImagePreview(null)
  }

  const totalPages = Math.ceil(totalCount / itemsPerPage)

  const getStockColor = (quantity: number) => {
    if (quantity === 0) return 'bg-red-100 text-red-800'
    if (quantity < 10) return 'bg-yellow-100 text-yellow-800'
    return 'bg-green-100 text-green-800'
  }

  const getRatingColor = (rating: number) => {
    if (rating >= 4) return 'bg-green-100 text-green-800'
    if (rating >= 2.5) return 'bg-yellow-100 text-yellow-800'
    return 'bg-red-100 text-red-800'
  }

  return (
    <div className="space-y-4 p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Products Management</h1>
        <Dialog>
          <DialogTrigger asChild>
            <Button className='border border-blue-500 bg-blue-600 hover:bg-blue-700 text-white shadow-sm'>
              <Plus className="mr-2 h-4 w-4" />
              Add Product
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] bg-white rounded-lg">
            <DialogHeader>
              <DialogTitle className="text-gray-800">Add Product</DialogTitle>
            </DialogHeader>
            <ProductForm onSubmitSuccess={fetchProducts} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
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
          onChange={(e) => {
            setSelectedCategory(e.target.value)
            setCurrentPage(1)
          }}
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

      {loading ? (
        <div className="text-center py-10 text-gray-500">Loading products...</div>
      ) : (
        <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
          <Table>
            <TableHeader className="bg-gray-50">
              <TableRow className="hover:bg-gray-50">
                <TableHead className="text-gray-700 font-semibold">Image</TableHead>
                <TableHead className="text-gray-700 font-semibold">Name</TableHead>
                <TableHead className="text-gray-700 font-semibold">Category</TableHead>
                <TableHead className="text-gray-700 font-semibold">Price</TableHead>
                <TableHead className="text-gray-700 font-semibold">Stock</TableHead>
                <TableHead className="text-gray-700 font-semibold">Rating</TableHead>
                <TableHead className="text-gray-700 font-semibold">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10 text-gray-500">
                    No products found matching your criteria
                  </TableCell>
                </TableRow>
              ) : (
                filteredProducts.map((product) => (
                  <TableRow key={product.id} className="hover:bg-gray-50">
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
                    <TableCell className="font-medium text-gray-800">{product.name}</TableCell>
                    <TableCell>
                      <span className="px-2 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-medium">
                        {product.categories?.name || 'Uncategorized'}
                      </span>
                    </TableCell>
                    <TableCell className="font-semibold text-green-600">
                      ${product?.price?.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStockColor(product.stock_quantity)}`}>
                        {product.stock_quantity} in stock
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className={`flex items-center px-2 py-1 rounded-full ${getRatingColor(product?.avg_rating || 0)}`}>
                        <Star className="h-3 w-3 mr-1 fill-current" />
                        <span className="text-xs font-medium">
                          {product?.avg_rating?.toFixed(1) || '0.0'}/5.0
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="icon" className="border-gray-300 hover:bg-gray-50">
                              <Eye className="h-4 w-4 text-blue-600" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-[800px] bg-white rounded-lg">
                            <DialogHeader>
                              <DialogTitle className="text-gray-800">{product.name}</DialogTitle>
                            </DialogHeader>
                            <ProductDetails productId={product.id} />
                          </DialogContent>
                        </Dialog>

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
                              onSubmitSuccess={fetchProducts}
                            />
                          </DialogContent>
                        </Dialog>

                        <Button
                          variant="outline"
                          size="icon"
                          className="border-red-300 hover:bg-red-50"
                          onClick={() => deleteProduct(product.id)}
                        >
                          <Trash className="h-4 w-4 text-red-600" />
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
              of <span className="font-medium text-gray-800">{totalCount}</span> products
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