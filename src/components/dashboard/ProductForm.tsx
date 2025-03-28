'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'

export default function ProductForm({ product = null, onSubmitSuccess }: { product?: any, onSubmitSuccess: () => void }) {
  const [formData, setFormData] = useState({
    name: product?.name || '',
    description: product?.description || '',
    price: product?.price || '',
    stock_quantity: product?.stock_quantity || '',
    category_id: product?.category_id || '',
  })
  const [categories, setCategories] = useState<{ id: any; name: any }[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
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
}

function handleSelectChange(name: keyof ProductFormData, value: ProductFormData[keyof ProductFormData]) {
    setFormData((prev: ProductFormData) => ({ ...prev, [name]: value }))
}
  
interface ProductData {
    name: string
    description: string
    price: number
    stock_quantity: number
    category_id: string | null
}

interface SubmitResult {
    error: any
    // You can extend this interface with additional properties if needed.
}

async function handleSubmit(e: React.FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault()
    setLoading(true)
    setError(null)
    
    try {
        const productData: ProductData = {
            name: formData.name,
            description: formData.description,
            price: parseFloat(formData.price),
            stock_quantity: parseInt(formData.stock_quantity),
            category_id: formData.category_id || null,
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
            })
        }
    } catch (error: any) {
        console.error('Error saving product:', error)
        if (error instanceof Error) {
            setError(error.message)
        } else {
            setError(String(error))
        }
    } finally {
        setLoading(false)
    }
}
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4 py-4">
      {error && (
        <div className="bg-red-50 text-red-500 p-3 rounded-md text-sm">
          {error}
        </div>
      )}
      
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
          rows={4}
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
          <Label htmlFor="stock_quantity">Stock Quantity</Label>
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
            <SelectItem value="">None</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <Button type="submit" disabled={loading} className="w-full">
        {loading ? 'Saving...' : product ? 'Update Product' : 'Add Product'}
      </Button>
    </form>
  )
}
