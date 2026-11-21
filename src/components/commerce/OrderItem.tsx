'use client'

import { OrderItem } from '@/types/commerce'
import { formatKobo } from '@/lib/formatting'

interface OrderItemProps {
  item: OrderItem
}

export function OrderItemComponent({ item }: OrderItemProps) {
  return (
    <div className="flex gap-4 border-b pb-4 last:border-0">
      <div className="w-16 h-16 bg-muted rounded-lg flex-shrink-0 flex items-center justify-center text-muted-foreground text-xs">
        {item.product_id.slice(0, 2).toUpperCase()}
      </div>
      <div className="flex-1">
        <h4 className="font-semibold">{item.product?.name || 'Product'}</h4>
        <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
      </div>
      <span className="font-medium">{formatKobo(item.price * item.quantity)}</span>
    </div>
  )
}
