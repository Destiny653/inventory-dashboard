 'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { v4 as uuidv4 } from 'uuid'
import { ImageIcon, X, Upload, Loader2, Plus, Trash2 } from 'lucide-react'

// UI Components
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

// Types
interface Product {
  id: string
  name: string
  description: string
  price: number
  stock_quantity: number
  category_id: string | null
  image_url: string
}

interface PendingProduct {
  id: string
  name: string
  description: string
  price: string
  stock_quantity: string
  category_id: string
  image_url: string
  imagePreview?: string
  imageFile?: File
}

interface Category {
  id: string
  name: string
}

interface ProductFormProps {
  editProduct?: Product
  onSubmitSuccess: () => void
}

const STORAGE_KEY = 'pending_products'
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/gif']

export default function ProductForm({ editProduct, onSubmitSuccess }: ProductFormProps) {
  const initialFormState = {
    name: editProduct?.name || '',
    description: editProduct?.description || '',
    price: editProduct?.price?.toString() || '',
    stock_quantity: editProduct?.stock_quantity?.toString() || '',
    category_id: editProduct?.category_id || '',
    image_url: editProduct?.image_url || '',
  }

  const [formData, setFormData] = useState(initialFormState)
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(editProduct?.image_url || null)
  const [pendingProducts, setPendingProducts] = useState<PendingProduct[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchCategories()
    if (!editProduct) {
      loadPendingProducts()
    }
  }, [editProduct])

  useEffect(() => {
    if (!editProduct) {
      savePendingProducts()
    }
  }, [pendingProducts, editProduct])

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name')
        .order('name')
      
      if (error) throw error
      setCategories(data || [])
    } catch (error: any) {
      console.error('Error fetching categories:', error)
      toast.error('Failed to load categories')
    }
  }

  const loadPendingProducts = () => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      setPendingProducts(JSON.parse(stored))
    }
  }

  const savePendingProducts = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pendingProducts))
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      setError('Please select a valid image file (JPEG, PNG, or GIF)')
      return
    }
    
    if (file.size > MAX_FILE_SIZE) {
      setError('Image must be less than 5MB')
      return
    }
    
    setImageFile(file)
    setError(null)
    
    const reader = new FileReader()
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleRemoveImage = () => {
    setImageFile(null)
    setImagePreview(null)
    setFormData(prev => ({ ...prev, image_url: '' }))
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    if (editProduct) {
      await updateProduct()
    } else {
      addToPendingProducts()
    }
  }

  const addToPendingProducts = () => {
    if (!formData.name || !formData.price || !formData.stock_quantity) {
      setError('Please fill in all required fields')
      return
    }

    const newProduct: PendingProduct = {
      id: uuidv4(),
      ...formData,
      imagePreview: imagePreview || undefined,
      imageFile: imageFile || undefined,
    }

    setPendingProducts(prev => [...prev, newProduct])
    resetForm()
    toast.success('Product added to queue')
  }

  const removePendingProduct = (id: string) => {
    setPendingProducts(prev => prev.filter(product => product.id !== id))
    toast.success('Product removed from queue')
  }

  const resetForm = () => {
    setFormData(initialFormState)
    setImageFile(null)
    setImagePreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    setError(null)
  }

  const uploadImage = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop()
    const fileName = `${uuidv4()}.${fileExt}`
    const filePath = `product-images/${fileName}`
    
    try {
      const { error: uploadError } = await supabase.storage
        .from('products')
        .upload(filePath, file)
      
      if (uploadError) throw uploadError
      
      const { data: publicUrlData } = supabase.storage
        .from('products')
        .getPublicUrl(filePath)
      
      return publicUrlData.publicUrl
    } catch (error) {
      throw error
    }
  }

  const updateProduct = async () => {
    if (!editProduct?.id) return
    
    setLoading(true)
    setError(null)

    try {
      let imageUrl = formData.image_url

      if (imageFile) {
        imageUrl = await uploadImage(imageFile)
      }

      const updatedData = {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        stock_quantity: parseInt(formData.stock_quantity),
        category_id: formData.category_id === "none" ? null : formData.category_id,
        image_url: imageUrl,
      }

      const { error } = await supabase
        .from('products')
        .update(updatedData)
        .eq('id', editProduct.id)

      if (error) throw error

      toast.success('Product updated successfully')
      onSubmitSuccess()
    } catch (error: any) {
      console.error('Error updating product:', error)
      setError(error.message)
      toast.error('Failed to update product')
    } finally {
      setLoading(false)
    }
  }

  const submitAllProducts = async () => {
    if (pendingProducts.length === 0) {
      toast.error('No products to submit')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const productsToInsert = await Promise.all(
        pendingProducts.map(async (product) => {
          let imageUrl = product.image_url

          if (product.imageFile) {
            imageUrl = await uploadImage(product.imageFile)
          }

          return {
            name: product.name,
            description: product.description,
            price: parseFloat(product.price),
            stock_quantity: parseInt(product.stock_quantity),
            category_id: product.category_id === "none" ? null : product.category_id,
            image_url: imageUrl,
          }
        })
      )

      const { error } = await supabase
        .from('products')
        .insert(productsToInsert)

      if (error) throw error

      setPendingProducts([])
      localStorage.removeItem(STORAGE_KEY)
      onSubmitSuccess()
      toast.success('All products uploaded successfully')
    } catch (error: any) {
      console.error('Error saving products:', error)
      setError(error.message)
      toast.error('Failed to upload products')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-6 h-full max-h-[calc(100vh-2rem)] overflow-y-auto p-4">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>
            {editProduct ? 'Edit Product' : 'Add New Products'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 text-red-500 p-4 rounded-md text-sm border border-red-200">
                {error}
              </div>
            )}
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Product Name</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={5}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price">Price ($)</Label>
                    <Input
                      id="price"
                      name="price"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.price}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="stock_quantity">Stock</Label>
                    <Input
                      id="stock_quantity"
                      name="stock_quantity"
                      type="number"
                      min="0"
                      value={formData.stock_quantity}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={formData.category_id}
                    onValueChange={(value) => handleSelectChange('category_id', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-4">
                <Label>Product Image</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                  
                  {!imagePreview ? (
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className="flex flex-col items-center justify-center h-48 cursor-pointer"
                    >
                      <ImageIcon className="h-8 w-8 text-gray-400 mb-2" />
                      <p className="text-sm text-gray-500">Click to upload image</p>
                      <p className="text-xs text-gray-400">PNG, JPG, GIF up to 5MB</p>
                    </div>
                  ) : (
                    <div className="relative h-48">
                      <img 
                        src={imagePreview} 
                        alt="Preview"
                        className="h-full w-full object-contain rounded-md"
                      />
                      <button 
                        type="button"
                        onClick={handleRemoveImage}
                        className="absolute top-2 right-2 p-1 bg-white rounded-full shadow-md"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex gap-4 pt-4">
              {editProduct ? (
                <Button 
                  type="submit"
                  disabled={loading}
                  className="w-full  border"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    'Update Product'
                  )}
                </Button>
              ) : (
                <>
                  <Button type="submit" className="flex-1">
                    <Plus className="mr-2 h-4 w-4" />
                    Add to Queue
                  </Button>
                  
                  <Button
                    type="button"
                    onClick={submitAllProducts}
                    disabled={loading || pendingProducts.length === 0}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      `Upload All (${pendingProducts.length})`
                    )}
                  </Button>
                </>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {!editProduct && pendingProducts.length > 0 && (
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Pending Products ({pendingProducts.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <div className="max-h-[300px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Image</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Stock</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingProducts.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell>
                          {product.imagePreview ? (
                            <img 
                              src={product.imagePreview} 
                              alt={product.name}
                              className="h-12 w-12 object-cover rounded"
                            />
                          ) : (
                            <div className="h-12 w-12 bg-gray-100 rounded flex items-center justify-center">
                              <ImageIcon className="h-6 w-6 text-gray-400" />
                            </div>
                          )}
                        </TableCell>
                        <TableCell>{product.name}</TableCell>
                        <TableCell>${product.price}</TableCell>
                        <TableCell>{product.stock_quantity}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removePendingProduct(product.id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
