 "use client"

import { Suspense } from 'react'
import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
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
  DialogFooter,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Search, MoreVertical, PlusCircle, Eye, Edit, Trash2 } from 'lucide-react'

// Define TypeScript interfaces
interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  stock_quantity: number;
  category_id: number;
  category_name: string;
  vendor_id: number;
  vendor_name: string;
  status: 'active' | 'pending_review' | 'out_of_stock';
  featured: boolean;
  image_url: string;
  created_at: string;
}

interface Category {
  id: number;
  name: string;
}

interface Vendor {
  id: number;
  name: string;
}

// ProductsContent component that uses client-side features
function ProductsContent() {
  const searchParams = useSearchParams()
  const vendorFilter = searchParams.get('vendor')

  const [products, setProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [stockFilter, setStockFilter] = useState<string>('all')
  const [selectedProducts, setSelectedProducts] = useState<number[]>([])
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState<boolean>(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [vendors, setVendors] = useState<Vendor[]>([])

  useEffect(() => {
    fetchProducts()
    fetchCategories()
    fetchVendors()
  }, [vendorFilter])

  useEffect(() => {
    filterProducts()
  }, [products, searchTerm, categoryFilter, stockFilter])

  async function fetchProducts(): Promise<void> {
    try {
      setLoading(true)

      // In a real app, this would be a Supabase query
      // Mock data for demonstration
      const mockProducts: Product[] = [
        {
          id: 1,
          name: 'Wireless Earbuds',
          description: 'High-quality wireless earbuds with noise cancellation',
          price: 59.99,
          stock_quantity: 45,
          category_id: 1,
          category_name: 'Electronics',
          vendor_id: 1,
          vendor_name: 'Cooper Crafts',
          status: 'active',
          featured: true,
          image_url: 'https://placehold.co/100x100/eee/ccc',
          created_at: '2024-12-10T00:00:00Z',
        },
        {
          id: 2,
          name: 'Smart Watch',
          description: 'Fitness tracker with heart rate monitoring',
          price: 129.99,
          stock_quantity: 28,
          category_id: 1,
          category_name: 'Electronics',
          vendor_id: 2,
          vendor_name: 'Fox Electronics',
          status: 'active',
          featured: false,
          image_url: 'https://placehold.co/100x100/eee/ccc',
          created_at: '2025-01-15T00:00:00Z',
        },
        {
          id: 3,
          name: 'Leather Wallet',
          description: 'Handcrafted genuine leather wallet',
          price: 39.99,
          stock_quantity: 62,
          category_id: 2,
          category_name: 'Accessories',
          vendor_id: 1,
          vendor_name: 'Cooper Crafts',
          status: 'active',
          featured: false,
          image_url: 'https://placehold.co/100x100/eee/ccc',
          created_at: '2025-02-05T00:00:00Z',
        },
        {
          id: 4,
          name: 'Bluetooth Speaker',
          description: 'Portable waterproof bluetooth speaker',
          price: 79.99,
          stock_quantity: 0,
          category_id: 1,
          category_name: 'Electronics',
          vendor_id: 2,
          vendor_name: 'Fox Electronics',
          status: 'out_of_stock',
          featured: false,
          image_url: 'https://placehold.co/100x100/eee/ccc',
          created_at: '2025-01-20T00:00:00Z',
        },
        {
          id: 5,
          name: 'Cotton T-Shirt',
          description: 'Premium cotton t-shirt, various colors',
          price: 24.99,
          stock_quantity: 120,
          category_id: 3,
          category_name: 'Clothing',
          vendor_id: 3,
          vendor_name: 'Alexander Apparel',
          status: 'pending_review',
          featured: false,
          image_url: 'https://placehold.co/100x100/eee/ccc',
          created_at: '2025-03-18T00:00:00Z',
        },
        {
          id: 6,
          name: 'Ceramic Mug',
          description: 'Handcrafted ceramic coffee mug',
          price: 18.99,
          stock_quantity: 35,
          category_id: 4,
          category_name: 'Home Goods',
          vendor_id: 4,
          vendor_name: 'Howard Home Goods',
          status: 'active',
          featured: true,
          image_url: 'https://placehold.co/100x100/eee/ccc',
          created_at: '2024-11-25T00:00:00Z',
        },
        {
          id: 7,
          name: 'Desk Lamp',
          description: 'Modern LED desk lamp with adjustable brightness',
          price: 49.99,
          stock_quantity: 3,
          category_id: 4,
          category_name: 'Home Goods',
          vendor_id: 4,
          vendor_name: 'Howard Home Goods',
          status: 'active',
          featured: false,
          image_url: 'https://placehold.co/100x100/eee/ccc',
          created_at: '2025-01-08T00:00:00Z',
        },
      ]

      // Filter by vendor if specified in URL
      const filteredMockProducts = vendorFilter
        ? mockProducts.filter(product => product.vendor_id === parseInt(vendorFilter))
        : mockProducts

      setProducts(filteredMockProducts)
      setFilteredProducts(filteredMockProducts)
    } catch (error) {
      console.error('Error fetching products:', error)
    } finally {
      setLoading(false)
    }
  }

  async function fetchCategories(): Promise<void> {
    // Mock categories data
    setCategories([
      { id: 1, name: 'Electronics' },
      { id: 2, name: 'Accessories' },
      { id: 3, name: 'Clothing' },
      { id: 4, name: 'Home Goods' },
      { id: 5, name: 'Books' },
    ])
  }

  async function fetchVendors(): Promise<void> {
    // Mock vendors data
    setVendors([
      { id: 1, name: 'Cooper Crafts' },
      { id: 2, name: 'Fox Electronics' },
      { id: 3, name: 'Alexander Apparel' },
      { id: 4, name: 'Howard Home Goods' },
      { id: 5, name: 'Williamson Wares' },
    ])
  }

  function filterProducts(): void {
    let filtered = [...products]

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Apply category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(product => product.category_id === parseInt(categoryFilter))
    }

    // Apply stock filter
    if (stockFilter === 'in_stock') {
      filtered = filtered.filter(product => product.stock_quantity > 0)
    } else if (stockFilter === 'low_stock') {
      filtered = filtered.filter(product => product.stock_quantity > 0 && product.stock_quantity <= 10)
    } else if (stockFilter === 'out_of_stock') {
      filtered = filtered.filter(product => product.stock_quantity === 0)
    }

    setFilteredProducts(filtered)
  }

  function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  function getStatusBadge(status: string): React.ReactElement {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Active</Badge>
      case 'pending_review':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending Review</Badge>
      case 'out_of_stock':
        return <Badge className="bg-red-100 text-red-800">Out of Stock</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>
    }
  }

  function toggleSelectProduct(productId: number): void {
    setSelectedProducts(prev => {
      if (prev.includes(productId)) {
        return prev.filter(id => id !== productId)
      } else {
        return [...prev, productId]
      }
    })
  }

  function toggleSelectAll(): void {
    if (selectedProducts.length === filteredProducts.length) {
      setSelectedProducts([])
    } else {
      setSelectedProducts(filteredProducts.map(product => product.id))
    }
  }

  async function updateProductStatus(productId: number, newStatus: 'active' | 'pending_review' | 'out_of_stock'): Promise<void> {
    try {
      // In a real app, this would update the product in Supabase
      setProducts(products.map(product =>
        product.id === productId ? { ...product, status: newStatus } : product
      ))
    } catch (error) {
      console.error('Error updating product status:', error)
    }
  }

  async function deleteProduct(productId: number): Promise<void> {
    try {
      // In a real app, this would delete the product from Supabase
      setProducts(products.filter(product => product.id !== productId))
      setIsDeleteAlertOpen(false)
      setSelectedProduct(null)
    } catch (error) {
      console.error('Error deleting product:', error)
    }
  }

  async function bulkDeleteProducts(): Promise<void> {
    try {
      // In a real app, this would delete multiple products from Supabase
      setProducts(products.filter(product => !selectedProducts.includes(product.id)))
      setSelectedProducts([])
    } catch (error) {
      console.error('Error bulk deleting products:', error)
    }
  }

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading products...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">
          {vendorFilter
            ? `Products by ${vendors.find(v => v.id === parseInt(vendorFilter))?.name || 'Vendor'}`
            : 'All Products'
          }
        </h1>
        <Button className="flex items-center gap-2">
          <PlusCircle className="h-4 w-4" />
          Add Product
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Products</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex items-center gap-2">
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map(category => (
                      <SelectItem key={category.id} value={category.id.toString()}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <Select value={stockFilter} onValueChange={setStockFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Stock Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Stock Status</SelectItem>
                    <SelectItem value="in_stock">In Stock</SelectItem>
                    <SelectItem value="low_stock">Low Stock (≤10)</SelectItem>
                    <SelectItem value="out_of_stock">Out of Stock</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-gray-500">No products found matching your criteria</p>
            </div>
          ) : (
            <>
              {selectedProducts.length > 0 && (
                <div className="flex items-center justify-between bg-gray-50 p-2 rounded-md mb-2">
                  <span className="text-sm font-medium">
                    {selectedProducts.length} product(s) selected
                  </span>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      Set Featured
                    </Button>
                    <Button variant="outline" size="sm" className="text-red-500" onClick={bulkDeleteProducts}>
                      Delete Selected
                    </Button>
                  </div>
                </div>
              )}

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={selectedProducts.length === filteredProducts.length && filteredProducts.length > 0}
                          onCheckedChange={toggleSelectAll}
                          aria-label="Select all products"
                        />
                      </TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Stock</TableHead>
                      <TableHead>Vendor</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProducts.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedProducts.includes(product.id)}
                            onCheckedChange={() => toggleSelectProduct(product.id)}
                            aria-label={`Select ${product.name}`}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-md overflow-hidden">
                              <img
                                src={product.image_url}
                                alt={product.name}
                                className="h-full w-full object-cover"
                              />
                            </div>
                            <div>
                              <div className="font-medium">{product.name}</div>
                              <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                                {product.description}
                              </div>
                              {product.featured && (
                                <Badge variant="outline" className="mt-1 text-xs">Featured</Badge>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{product.category_name}</TableCell>
                        <TableCell>${product.price.toFixed(2)}</TableCell>
                        <TableCell>
                          <div className={
                            product.stock_quantity === 0
                              ? 'text-red-500'
                              : product.stock_quantity <= 10
                                ? 'text-amber-500'
                                : ''
                          }>
                            {product.stock_quantity}
                          </div>
                        </TableCell>
                        <TableCell>{product.vendor_name}</TableCell>
                        <TableCell>{getStatusBadge(product.status)}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                                <span className="sr-only">Open menu</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => setSelectedProduct(product)}>
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <a href={`/dashboard/admin/products/edit/${product.id}`}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit Product
                                </a>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />

                              {product.status !== 'active' && (
                                <DropdownMenuItem onClick={() => updateProductStatus(product.id, 'active')}>
                                  <span className="mr-2 h-4 w-4 text-green-500">✓</span>
                                  Approve Product
                                </DropdownMenuItem>
                              )}

                              <DropdownMenuItem
                                className="text-red-500 focus:text-red-500"
                                onClick={() => {
                                  setSelectedProduct(product)
                                  setIsDeleteAlertOpen(true)
                                }}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete Product
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Product Details Dialog */}
      {selectedProduct && (
        <Dialog open={selectedProduct !== null && !isDeleteAlertOpen} onOpenChange={(open: boolean) => !open && setSelectedProduct(null)}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Product Details</DialogTitle>
              <DialogDescription>
                Detailed information about the product.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              <div className="flex items-center gap-4">
                <div className="h-24 w-24 rounded-md overflow-hidden">
                  <img
                    src={selectedProduct.image_url}
                    alt={selectedProduct.name}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div>
                  <h3 className="text-lg font-medium">{selectedProduct.name}</h3>
                  <p className="text-sm text-muted-foreground">{selectedProduct.category_name}</p>
                  <div className="mt-1">{getStatusBadge(selectedProduct.status)}</div>
                  {selectedProduct.featured && (
                    <Badge variant="outline" className="mt-1">Featured</Badge>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Product Information</h4>
                  <div className="mt-1 space-y-1">
                    <p className="text-sm">Price: ${selectedProduct.price.toFixed(2)}</p>
                    <p className="text-sm">
                      Stock:
                      <span className={
                        selectedProduct.stock_quantity === 0
                          ? 'text-red-500 ml-1'
                          : selectedProduct.stock_quantity <= 10
                            ? 'text-amber-500 ml-1'
                            : 'ml-1'
                      }>
                        {selectedProduct.stock_quantity}
                      </span>
                    </p>
                    <p className="text-sm">Added: {formatDate(selectedProduct.created_at)}</p>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Vendor Information</h4>
                  <div className="mt-1 space-y-1">
                    <p className="text-sm">Vendor: {selectedProduct.vendor_name}</p>
                    <p className="text-sm">
                      <a
                        href={`/dashboard/admin/vendors?search=${selectedProduct.vendor_name}`}
                        className="text-blue-500 hover:underline"
                      >
                        View Vendor
                      </a>
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Description</h4>
                <p className="mt-1 text-sm">{selectedProduct.description}</p>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground">Actions</h4>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <a href={`/dashboard/admin/products/edit/${selectedProduct.id}`}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit Product
                    </a>
                  </Button>

                  {selectedProduct.status !== 'active' && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-green-500"
                      onClick={() => {
                        updateProductStatus(selectedProduct.id, 'active')
                        setSelectedProduct({ ...selectedProduct, status: 'active' })
                      }}
                    >
                      <span className="mr-2 h-4 w-4">✓</span>
                      Approve
                    </Button>
                  )}

                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-500"
                    onClick={() => setIsDeleteAlertOpen(true)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the product
              and remove it from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-500 hover:bg-red-600"
              onClick={() => selectedProduct && deleteProduct(selectedProduct.id)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

// Main component with Suspense boundary
export default function AdminProductsPage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center h-64">Loading products...</div>}>
      <ProductsContent />
    </Suspense>
  )
}
