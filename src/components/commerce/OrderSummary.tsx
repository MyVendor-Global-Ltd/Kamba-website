'use client'

import { Order } from '@/types/commerce'
import { formatKobo, formatDateTime } from '@/lib/formatting'

interface OrderSummaryProps {
  order: Order
}

export function OrderSummary({ order }: OrderSummaryProps) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">Subtotal</span>
        <span>{formatKobo(order.subtotal)}</span>
      </div>
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">Platform fee</span>
        <span>{formatKobo(order.platform_fee)}</span>
      </div>
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">Delivery fee</span>
        <span>{formatKobo(order.delivery_fee)}</span>
      </div>
      <div className="flex justify-between text-lg font-bold border-t pt-4">
        <span>Total</span>
        <span>{formatKobo(order.total)}</span>
      </div>
      <div className="mt-4">
        <p className="text-sm text-muted-foreground">Payment status</p>
        <p className="font-medium">{order.payment_status}</p>
      </div>
      <div className="mt-4">
        <p className="text-sm text-muted-foreground">Delivery status</p>
        <p className="font-medium">{order.delivery_status}</p>
      </div>
      <div className="mt-4">
        <p className="text-sm text-muted-foreground">Order date</p>
        <p className="font-medium">{formatDateTime(order.created_at)}</p>
      </div>
    </div>
  )
}
