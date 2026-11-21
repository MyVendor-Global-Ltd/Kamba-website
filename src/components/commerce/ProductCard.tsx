'use client'

import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Product } from '@/types/commerce'
import { useCart } from '@/hooks/useCart'

interface ProductCardProps {
  product: Product
}

export function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCart()

  return (
    <Card>
      <CardContent className="p-4">
        <div className="h-48 bg-muted rounded-lg flex items-center justify-center mb-4 flex-shrink-0">
          {product.image_url ? (
            <img src={product.image_url} alt={product.name} className="w-full h-full object-cover rounded-lg" />
          ) : (
            <span className="text-muted-foreground text-xs">Image</span>
          )}
        </div>
        <CardHeader>
          <CardTitle className="text-base">{product.name}</CardTitle>
        </CardHeader>
        {product.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{product.description}</p>
        )}
        <div className="flex items-center justify-between">
          <span className="text-lg font-bold">₦{(product.price / 100).toFixed(2)}</span>
          <Button
            onClick={() => addItem({ product_id: product.id, quantity: 1 })}
            size="sm"
          >
            Add
          </Button>
        </div>
        <Link href={`/marketplace/products/${product.id}`}>
          <a className="mt-2 block text-sm text-primary hover:underline">View details</a>
        </Link>
      </CardContent>
    </Card>
  )
}
