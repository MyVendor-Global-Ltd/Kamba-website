export function formatKobo(amount: number): string {
  const naira = amount / 100
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(naira)
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) return 'Date unavailable'
  return date.toLocaleDateString('en-NG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function formatDateTime(dateString: string): string {
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) return 'Date unavailable'
  return date.toLocaleString('en-NG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
export function formatOrderStatus(status: string): string {
  const labels: Record<string, string> = {
    pending: 'Awaiting payment',
    awaiting_payment: 'Awaiting payment',
    paid_held: 'Payment secured — awaiting vendor confirmation',
    awaiting_confirmation: 'Awaiting confirmation',
    paid: 'Payment confirmed',
    confirmed: 'Confirmed',
    processing: 'Preparing order',
    preparing: 'Preparing order',
    ready_for_pickup: 'Ready for pickup',
    shipped: 'Out for delivery',
    out_for_delivery: 'Out for delivery',
    delivered: 'Delivered',
    collected: 'Collected',
    awaiting_dispute_window: 'Awaiting dispute-window completion',
    payout_processing: 'Payout processing',
    payout_completed: 'Payout completed',
    disputed: 'Disputed',
    refund_processing: 'Refund processing',
    refunded: 'Refunded',
    cancelled: 'Cancelled',
    return_requested: 'Return requested',
    payment_pending: 'Awaiting payment',
    payment_failed: 'Payment failed',
    payout_eligible: 'Eligible for payout processing',
  }
  return labels[status.toLowerCase()] || status.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase())
}
