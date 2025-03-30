 'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { v4 as uuidv4 } from 'uuid'
import { ImageIcon, X, Upload, Loader2 } from 'lucide-react'

export default function ProductForm({ product = null, onSubmitSuccess }: { product?: any, onSubmitSuccess: () => void }) {
  const [formData, setFormData] = useState({
    name: product?.name || '',
    description: product?.description || '',
    price: product?.price || '',
    stock_quantity: product?.stock_quantity || '',
    category_id: product?.category_id || '',
    image_url: product?.image_url || '',
  })
  const [categories, setCategories] = useState<{ id: any; name: any }[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(product?.image_url || null)
  const [uploadProgress, setUploadProgress] = useState<number | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  useEffect(() => {
    fetchCategories()
  }, [])
  
  async function fetchCategories() {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name')
      
      if (error) throw error
      setCategories(data || [])
      console.log("Data Category: ",data)
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }
  
  interface HandleChangeEvent extends React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> {}

  function handleChange(e: HandleChangeEvent): void {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }
  
  interface ProductFormData {
    name: string
    description: string
    price: string
    stock_quantity: string
    category_id: string
    image_url: string
  }

  function handleSelectChange(name: keyof ProductFormData, value: ProductFormData[keyof ProductFormData]) {
    setFormData((prev: ProductFormData) => ({ ...prev, [name]: value }))
  }
  
  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    
    // Check file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file')
      return
    }
    
    // Check file size (limit to 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be less than 5MB')
      return
    }
    
    setImageFile(file)
    setError(null)
    
    // Create preview URL
    const reader = new FileReader()
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)
  }
  
  function handleRemoveImage() {
    setImageFile(null)
    setImagePreview(null)
    setFormData(prev => ({ ...prev, image_url: '' }))
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }
  
  function triggerFileInput() {
    fileInputRef.current?.click()
  }
  
  interface ProductData {
    name: string
    description: string
    price: number
    stock_quantity: number
    category_id: string | null
    image_url: string | null
  }

  interface SubmitResult {
    error: any
  }

  async function uploadImage(file: File): Promise<string> {
    const fileExt = file.name.split('.').pop()
    const fileName = `${uuidv4()}.${fileExt}`
    const filePath = `product-images/${fileName}`
    
    setUploadProgress(0)
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev === null) return 0
        if (prev >= 90) {
          clearInterval(interval)
          return 90
        }
        return prev + 10
      })
    }, 200)
    
    try {
      // Upload the file
      const { error: uploadError } = await supabase.storage
        .from('products')
        .upload(filePath, file)
        
      clearInterval(interval)
      setUploadProgress(100)
      
      if (uploadError) {
        if (uploadError.message.includes('Bucket not found')) {
          throw new Error("The 'products' bucket doesn't exist. Please create it in your Supabase dashboard.")
        }
        throw uploadError
      }
      
      // Try to get public URL first
      const { data: publicUrlData } = supabase.storage
        .from('products')
        .getPublicUrl(filePath)
      
      // If the bucket is private, get a signed URL instead
      if (!publicUrlData.publicUrl || publicUrlData.publicUrl.includes('null')) {
        const { data: signedUrlData, error: signedUrlError } = await supabase.storage
          .from('products')
          .createSignedUrl(filePath, 60 * 60 * 24) // URL valid for 24 hours
        
        if (signedUrlError) throw signedUrlError
        
        setTimeout(() => setUploadProgress(null), 500)
        return signedUrlData.signedUrl
      }
      
      setTimeout(() => setUploadProgress(null), 500)
      return publicUrlData.publicUrl
    } catch (error) {
      clearInterval(interval)
      setUploadProgress(null)
      throw error
    }
  }
  

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault()
    setLoading(true)
    setError(null)
    
    try {
      let imageUrl = formData.image_url
      
      // Upload image if a new one was selected
      if (imageFile) {
        imageUrl = await uploadImage(imageFile)
      }
      
      const productData: ProductData = {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        stock_quantity: parseInt(formData.stock_quantity), 
        category_id: formData.category_id === "none" ? null : formData.category_id,
        image_url: imageUrl,
      }
      
      let result: SubmitResult
      
      if (product) {
        // Update existing product
        result = await supabase
          .from('products')
          .update(productData)
          .eq('id', product.id)
      } else {
        // Create new product
        result = await supabase
          .from('products')
          .insert([productData])
      }
      
      if (result.error) throw result.error
      
      onSubmitSuccess()
      
      // Reset form if creating new product
      if (!product) {
        setFormData({
          name: '',
          description: '',
          price: '',
          stock_quantity: '',
          category_id: '',
          image_url: '',
        })
        setImageFile(null)
        setImagePreview(null)
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
      }
    } catch (error: any) {
      console.error('Error saving product:', error)
      if (error instanceof Error) {
        setError(error.message)
      } else {
        setError(String(error.message))
      }
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <Card className="w-full max-w-3xl mx-auto bg-white">
      {/* <CardHeader className="bg-white">
        <CardTitle className="text-2xl font-bold text-center">
          {product ? 'Edit Product' : 'Add New Product'}
        </CardTitle>
      </CardHeader> */}
      <CardContent className="bg-white">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 text-red-500 p-4 rounded-md text-sm border border-red-200">
              {error}
            </div>
          )}
          
          <div className="grid md:grid-cols-2 gap-6"> 
            {/* Left Column - Product Details */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-base font-medium">Product Name</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter product name"
                  className="h-10 bg-white"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description" className="text-base font-medium">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Describe your product"
                  rows={5}
                  className="resize-none bg-white"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price" className="text-base font-medium">Price ($)</Label>
                  <Input
                    id="price"
                    name="price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={handleChange}
                    placeholder="0.00"
                    className="h-10 bg-white"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="stock_quantity" className="text-base font-medium">Stock Quantity</Label>
                  <Input
                    id="stock_quantity"
                    name="stock_quantity"
                    type="number"
                    min="0"
                    value={formData.stock_quantity}
                    onChange={handleChange}
                    placeholder="0"
                    className="h-10 bg-white"
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="category" className="text-base font-medium">Category</Label>
                <Select
                  value={formData.category_id}
                  onValueChange={(value) => handleSelectChange('category_id', value)}
                >
                  <SelectTrigger className="h-10 bg-white">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
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
            
            {/* Right Column - Image Upload */}
            <div className="space-y-4">
              <Label className="text-base font-medium">Product Image</Label>
              
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 transition-all hover:bg-gray-50 bg-white">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
                
                {!imagePreview ? (
                  <div 
                    onClick={triggerFileInput}
                    className="flex flex-col items-center justify-center h-48 cursor-pointer bg-white"
                  >
                    <div className="p-3 rounded-full bg-gray-100 mb-2">
                      <ImageIcon className="h-6 w-6 text-gray-500" />
                    </div>
                    <p className="text-sm text-gray-500 mb-1">Click to upload product image</p>
                    <p className="text-xs text-gray-400">PNG, JPG, GIF up to 5MB</p>
                  </div>
                ) : (
                  <div className="relative h-48 flex items-center justify-center bg-white">
                    <img 
                      src={imagePreview} 
                      alt="Product preview" 
                      className="max-h-full max-w-full object-contain rounded-md"
                    />
                    <button 
                      type="button"
                      onClick={handleRemoveImage}
                      className="absolute top-2 right-2 bg-white rounded-full p-1 shadow-md hover:bg-gray-100"
                      aria-label="Remove image"
                    >
                      <X className="h-4 w-4 text-gray-500" />
                    </button>
                    
                    <button 
                      type="button"
                      onClick={triggerFileInput}
                      className="absolute bottom-2 right-2 bg-white rounded-full p-1 shadow-md hover:bg-gray-100"
                      aria-label="Change image"
                    >
                      <Upload className="h-4 w-4 text-gray-500" />
                    </button>
                  </div>
                )}
                
                {uploadProgress !== null && (
                  <div className="mt-2">
                    <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-500 transition-all duration-300 ease-out"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 text-center mt-1">
                      Uploading: {uploadProgress}%
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="pt-4">
            <Button 
              type="submit" 
              disabled={loading} 
              className="w-full h-11 text-base font-medium border"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {product ? 'Updating...' : 'Creating...'}
                </span>
              ) : (
                product ? 'Update Product' : 'Create Product'
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
