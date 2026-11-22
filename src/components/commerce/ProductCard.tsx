'use client'

import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Product } from '@/types/commerce'
import { useCartContext } from '@/context/CartContext'
import { formatKobo } from '@/lib/formatting'

interface ProductCardProps {
  product: Product
}

export function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCartContext()

  return (
    <Card>
      <CardContent className="p-4">
        <div className="h-48 bg-ink-raised/50 rounded-lg flex items-center justify-center mb-4 flex-shrink-0">
          {product.image_url ? (
            <img src={product.image_url} alt={product.name} className="w-full h-full object-cover rounded-lg" />
          ) : (
            <span className="text-text-tertiary text-xs">Image</span>
          )}
        </div>
        <CardHeader>
          <CardTitle className="text-base text-text-primary">{product.name}</CardTitle>
        </CardHeader>
        {product.description && (
          <p className="text-sm text-text-secondary line-clamp-2 mb-4">{product.description}</p>
        )}
        <div className="flex items-center justify-between">
          <span className="text-lg font-bold text-text-primary">{formatKobo(product.price)}</span>
          <Button
            onClick={() => addItem({ 
              product_id: product.id, 
              quantity: 1,
              name: product.name,
              price_kobo: product.price,
              store_id: product.store_id || '',
              image_url: product.image_url,
            })}
            size="sm"
          >
            Add
          </Button>
        </div>
        <Link href={`/marketplace/products/${product.id}`}>
          <a className="mt-2 block text-sm text-coral hover:underline">View details</a>
        </Link>
      </CardContent>
    </Card>
  )
}
