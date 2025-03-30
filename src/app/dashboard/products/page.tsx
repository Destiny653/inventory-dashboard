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
import { Plus, Edit, Trash, Image as ImageIcon, ChevronLeft, ChevronRight, Eye } from 'lucide-react'
import ProductForm from '@/components/dashboard/ProductForm'
import ProductDetails from '@/components/dashboard/ProductDetails'



export default function ProductsPage() {

  const [products, setProducts] = useState<{
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

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const itemsPerPage = 8

  useEffect(() => {
    fetchProducts()
  }, [currentPage]) // Refetch when page changes

  async function fetchProducts() {
    try {
      setLoading(true)

      // First get the total count for pagination
      const { count, error: countError } = await supabase
        .from('products')
        .select('id', { count: 'exact', head: true })

      if (countError) throw countError
      setTotalCount(count || 0)

      // Then fetch the current page of data
      const { data, error } = await supabase
        .from('products')
        .select('*, categories(id, name)')
        .range((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage - 1)

      if (error) throw error
      setProducts(data || [])
    } catch (error) {
      console.error('Error fetching products:', error)
    } finally {
      setLoading(false)
    }
  }

  // When searching, we need to reset pagination
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Products Management</h1>
        <Dialog>
          <DialogTrigger asChild>
            <Button className='border bg-white text-gray-800 hover:bg-gray-50'>
              <Plus className="mr-2 h-4 w-4" />
              Add Product
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] bg-white">
            <DialogHeader>
              <DialogTitle>Add Product</DialogTitle>
            </DialogHeader>
            <ProductForm onSubmitSuccess={fetchProducts} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center">
        <Input
          placeholder="Search products..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm bg-white"
        />
      </div>

      {loading ? (
        <div className="text-center py-10">Loading products...</div>
      ) : (
        <div className="rounded-md border bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Image</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center">
                    No products found
                  </TableCell>
                </TableRow>
              ) : (
                filteredProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      {product.image_url ? (
                        <div
                          className="relative w-12 h-12 rounded overflow-hidden cursor-pointer border bg-white"
                          onClick={() => openImagePreview(product.image_url)}
                        >
                          <img
                            src={product.image_url}
                            alt={product.name}
                            className="object-cover w-full h-full"
                          />
                        </div>
                      ) : (
                        <div className="w-12 h-12 flex items-center justify-center bg-gray-100 rounded border">
                          <ImageIcon className="h-6 w-6 text-gray-400" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell>{product.name}</TableCell>
                    <TableCell>{product.categories?.name || 'Uncategorized'}</TableCell>
                    <TableCell>${product?.price?.toFixed(2)}</TableCell>
                    <TableCell>{product.stock_quantity}</TableCell>
                    <TableCell>{product?.avg_rating?.toFixed(1)}/5.0</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        {/* View Details Button */}
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="icon">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-[800px] bg-white">
                            <DialogHeader>
                              <DialogTitle>{product.name}</DialogTitle>
                            </DialogHeader>
                            <ProductDetails productId={product.id} />
                          </DialogContent>
                        </Dialog>

                        {/* Edit Button */}
                        {/* Edit Button */}
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="icon">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className='sm:max-w-[600px] bg-white'>
                            <DialogHeader>
                              <DialogTitle>Edit Product</DialogTitle>
                            </DialogHeader>
                            <ProductForm
                              editProduct={{
                                id: product.id.toString(), // Convert to string as expected by the form
                                name: product.name,
                                description: product.description || '',
                                price: product.price,
                                stock_quantity: product.stock_quantity,
                                category_id: product.categories?.id || null,
                                image_url: product.image_url || ''
                              }}
                              onSubmitSuccess={() => {
                                fetchProducts()
                              }}
                            />
                          </DialogContent>
                        </Dialog>

                        {/* Delete Button */}
                        <Button
                          variant="destructive"
                          size="icon"
                          className="bg-white text-red-600 hover:bg-red-50 border"
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
          <div className="flex items-center justify-between px-4 py-3 border-t">
            <div className="text-sm text-gray-700">
              Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to{" "}
              <span className="font-medium">
                {Math.min(currentPage * itemsPerPage, totalCount)}
              </span>{" "}
              of <span className="font-medium">{totalCount}</span> products
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                <span className="sr-only">Previous</span>
              </Button>
              <div className="flex items-center space-x-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  // Show pages around current page
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
                      className="w-8 h-8 p-0"
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
          <div className="relative max-w-3xl max-h-[80vh] p-2 bg-white rounded-lg">
            <Button
              variant="outline"
              size="icon"
              className="absolute top-2 right-2 z-10 bg-white"
              onClick={closeImagePreview}
            >
              <Trash className="h-4 w-4" />
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
