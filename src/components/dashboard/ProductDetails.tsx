 'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { StarIcon, ThumbsUp } from 'lucide-react'

interface ProductDetailsProps {
  productId: number
}

export default function ProductDetails({ productId }: ProductDetailsProps) {
  const [product, setProduct] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchProductDetails() {
      try {
        setLoading(true)
        const { data, error } = await supabase
          .from('products')
          .select(`
            *,
            categories(name)
          `)
          .eq('id', productId)
          .single()

        if (error) throw error
        setProduct(data)
      } catch (error) {
        console.error('Error fetching product details:', error)
      } finally {
        setLoading(false)
      }
    }

    if (productId) {
      fetchProductDetails()
    }
  }, [productId])

  if (loading) {
    return <div className="py-8 text-center">Loading product details...</div>
  }

  if (!product) {
    return <div className="py-8 text-center">Product not found</div>
  }

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        {/* Product Image */}
        <div className="rounded-lg overflow-hidden border bg-white flex items-center justify-center h-[300px]">
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.name}
              className="object-contain w-full h-full"
            />
          ) : (
            <div className="text-gray-400">No image available</div>
          )}
        </div>

        {/* Product Info */}
        <div className="space-y-4">
          <div>
            <h3 className="text-sm text-gray-500">Category</h3>
            <p className="font-medium">{product.categories?.name || 'Uncategorized'}</p>
          </div>
          
          <div>
            <h3 className="text-sm text-gray-500">Price</h3>
            <p className="text-xl font-bold">${product.price?.toFixed(2)}</p>
          </div>
          
          <div>
            <h3 className="text-sm text-gray-500">Stock</h3>
            <p className="font-medium">{product.stock_quantity} units available</p>
          </div>
          
          <div className="flex space-x-8">
            {/* Rating */}
            <div>
              <h3 className="text-sm text-gray-500">Rating</h3>
              <div className="flex items-center">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <StarIcon 
                      key={star} 
                      className={`h-5 w-5 ${
                        star <= Math.round(product.avg_rating || 0) 
                          ? 'text-yellow-400 fill-yellow-400' 
                          : 'text-gray-300'
                      }`} 
                    />
                  ))}
                </div>
                <span className="ml-2 text-sm text-gray-600">
                  ({product.avg_rating?.toFixed(1) || '0'}/5.0)
                </span>
              </div>
            </div>
            
            {/* Likes */}
            <div>
              <h3 className="text-sm text-gray-500">Likes</h3>
              <div className="flex items-center">
                <ThumbsUp className="h-5 w-5 text-blue-500 mr-2" />
                <span className="text-sm text-gray-600">
                  {product.total_likes || 0}
                </span>
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="text-sm text-gray-500">Description</h3>
            <p className="text-gray-700">{product.description || 'No description available'}</p>
          </div>
        </div>
      </div>

      {/* Placeholder for future comments section */}
      <div className="mt-8 border-t pt-6">
        <h3 className="text-lg font-medium mb-4">Customer Comments</h3>
        <p className="text-gray-500 italic">Comments feature coming soon!</p>
      </div>
    </div>
  )
}
