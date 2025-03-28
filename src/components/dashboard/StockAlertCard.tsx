import { useState } from 'react'
import Link from 'next/link'
import { AlertTriangle, ChevronRight, X, Package } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export function StockAlertCard({ products, onDismiss }: { products: { id: string; name: string; image_url?: string; stock_quantity: number }[]; onDismiss?: () => void }) {
  const [dismissedItems, setDismissedItems] = useState<string[]>([])
  
interface DismissItemHandler {
    (productId: string): void;
}

const handleDismissItem: DismissItemHandler = (productId: string) => {
    setDismissedItems((prev: string[]) => [...prev, productId])
}
  
  const filteredProducts = products.filter(product => !dismissedItems.includes(product.id))
  
  if (filteredProducts.length === 0) {
    if (onDismiss) {
      onDismiss()
    }
    return null
  }
  
  return (
    <Card className="border-amber-200 bg-amber-50">
      <CardContent className="pt-6">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <h3 className="font-medium text-amber-800">Low Stock Alert</h3>
            <p className="text-sm text-amber-700 mt-1">
              The following products are running low on inventory and need attention.
            </p>
            
            <div className="mt-3 space-y-2">
              {filteredProducts.map(product => (
                <div 
                  key={product.id} 
                  className="flex items-center justify-between bg-white rounded-md p-2 border border-amber-200"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-md overflow-hidden flex-shrink-0">
                      <img 
                        src={product.image_url || 'https://placehold.co/100x100/eee/ccc'} 
                        alt={product.name}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{product.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${
                            product.stock_quantity === 0 
                              ? 'bg-red-100 text-red-800 border-red-200' 
                              : 'bg-amber-100 text-amber-800 border-amber-200'
                          }`}
                        >
                          <Package className="mr-1 h-3 w-3" />
                          {product.stock_quantity === 0 
                            ? 'Out of Stock' 
                            : `${product.stock_quantity} remaining`
                          }
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-amber-500 hover:text-amber-600 hover:bg-amber-100"
                      onClick={() => handleDismissItem(product.id)}
                    >
                      <X className="h-4 w-4" />
                      <span className="sr-only">Dismiss</span>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="border-t border-amber-200 bg-amber-50/50 flex justify-between">
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-amber-700 hover:text-amber-800 hover:bg-amber-100"
          onClick={() => {
            setDismissedItems(products.map(p => p.id))
            if (onDismiss) onDismiss()
          }}
        >
          Dismiss All
        </Button>
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-amber-700 hover:text-amber-800 hover:bg-amber-100"
          asChild
        >
          <Link href="/dashboard/inventory" className="flex items-center">
            View Inventory
            <ChevronRight className="ml-1 h-4 w-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  )
}
