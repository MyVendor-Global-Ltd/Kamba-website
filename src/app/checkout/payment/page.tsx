'use client'

import { useCallback, useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { apiJson } from '@/lib/api'
import { isMockMode } from '@/lib/mock-api'
import { formatKobo, formatDateTime, formatOrderStatus } from '@/lib/formatting'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/toast'

interface CheckoutOrder {
  order_id: string
  store_name?: string
  order_status: string
  payment_status: string
  total: number
}
interface Checkout {
  id: string
  amount: number
  currency: string
  status: string
  payment_expires_at?: string | null
  paid_at?: string | null
  created_at?: string
  orders: CheckoutOrder[]
}
interface PaymentInstructions {
  method?: string
  bank_name?: string
  account_name?: string
  account_number?: string
  amount?: number
  amount_minor?: number
  currency?: string
  display_text?: string
  reference?: string
  expires_at?: string
  [key: string]: unknown
}

interface CheckoutApiResponse {
  checkout?: Checkout
  orders?: CheckoutOrder[]
  id?: string
  amount?: number
  currency?: string
  status?: string
  payment_expires_at?: string | null
  paid_at?: string | null
  created_at?: string
}

function CheckoutPaymentContent() {
  const searchParams = useSearchParams()
  const checkoutId = searchParams.get('checkout_id')
  const { addToast } = useToast()
  const [checkout, setCheckout] = useState<Checkout | null>(null)
  const [instructions, setInstructions] = useState<PaymentInstructions | null>(null)
  const [loading, setLoading] = useState(true)
  const [initiating, setInitiating] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')

  const loadCheckout = useCallback(async (showSpinner = true) => {
    if (!checkoutId) {
      setError('No checkout reference was provided.')
      setLoading(false)
      return
    }
    if (showSpinner) setRefreshing(true)
    try {
      const data = await apiJson<CheckoutApiResponse>(`/commerce/marketplace-checkouts/${encodeURIComponent(checkoutId)}`)
      const raw = data.checkout || data
      setCheckout({ ...raw, orders: data.orders || raw.orders || [] } as Checkout)
      setError('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load checkout status.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [checkoutId])

  useEffect(() => { void Promise.resolve().then(() => loadCheckout(false)) }, [loadCheckout])

  const startPayment = async () => {
    if (!checkoutId || isMockMode) return
    setInitiating(true)
    setError('')
    try {
      const result = await apiJson<{
        checkout_id: string
        payment_reference: string
        amount: number
        currency: string
        payment_instructions: PaymentInstructions
        payment_status: string
      }>(`/commerce/marketplace-checkouts/${encodeURIComponent(checkoutId)}/payment`, { method: 'POST', headers: { 'Idempotency-Key': crypto.randomUUID() } })
      setInstructions(result.payment_instructions)
      addToast({ type: 'success', title: 'Payment instructions ready', message: 'Use the exact amount and temporary account details shown below.' })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'The payment provider could not initialize this checkout.')
    } finally {
      setInitiating(false)
    }
  }

  const copyValue = async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value)
      addToast({ type: 'success', title: `${label} copied`, message: 'Copied to clipboard.' })
    } catch {
      addToast({ type: 'error', title: 'Copy failed', message: 'Select and copy the value manually.' })
    }
  }

  if (loading) {
    return <div className="container mx-auto space-y-5 px-4 py-12"><div className="h-9 w-1/3 animate-pulse rounded bg-surface-muted" /><div className="h-64 animate-pulse rounded-xl bg-surface-muted" /></div>
  }

  if (!checkout) {
    return (
      <div className="container mx-auto px-4 py-16">
        <Card variant="outlined" className="mx-auto max-w-lg p-8 text-center">
          <CardContent className="space-y-4">
            <h1 className="text-xl font-semibold text-text-primary">Checkout unavailable</h1>
            <p role="alert" className="text-sm text-text-secondary">{error || 'This checkout could not be found.'}</p>
            <Link href="/orders"><Button className="w-full">View my orders</Button></Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const paid = checkout.status === 'paid' || checkout.status === 'succeeded'

  return (
    <div className="container mx-auto max-w-3xl space-y-6 px-4 py-8 lg:py-12">
      <header className="space-y-2">
        <p className="text-sm font-medium text-primary">Kamba checkout</p>
        <h1 className="font-display text-3xl font-bold text-text-primary">{paid ? 'Payment confirmed' : 'Complete your payment'}</h1>
        <p className="text-sm text-text-secondary">Checkout reference <span className="font-mono">{checkout.id}</span></p>
      </header>

      {error && <p role="alert" className="rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">{error}</p>}

      <Card variant="elevated">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Checkout summary</CardTitle>
          <Badge variant={paid ? 'success' : 'warning'}>{paid ? 'Paid' : 'Awaiting payment'}</Badge>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-4">
            <span className="text-sm text-text-secondary">Total payable</span>
            <span className="font-display text-2xl font-bold text-primary">{formatKobo(checkout.amount)}</span>
          </div>
          {checkout.orders.map((order) => (
            <div key={order.order_id} className="flex flex-col gap-1 border-b border-border pb-3 last:border-0">
              <div className="flex items-center justify-between gap-3">
                <span className="font-medium text-text-primary">{order.store_name || 'Kamba vendor'}</span>
                <span className="text-sm font-semibold text-text-primary">{formatKobo(order.total)}</span>
              </div>
              <p className="text-xs text-text-secondary">Order {order.order_id} · {formatOrderStatus(order.order_status)} · {formatOrderStatus(order.payment_status)}</p>
            </div>
          ))}
          {checkout.created_at && <p className="text-xs text-text-tertiary">Created {formatDateTime(checkout.created_at)}</p>}
        </CardContent>
      </Card>

      {paid ? (
        <Card variant="outlined">
          <CardContent className="space-y-3 p-5">
            <h2 className="font-semibold text-text-primary">Your payment has been confirmed</h2>
            <p className="text-sm text-text-secondary">The payment status came from the backend. You can now follow the individual store orders.</p>
          </CardContent>
        </Card>
      ) : isMockMode ? (
        <Card variant="outlined">
          <CardContent className="space-y-3 p-5">
            <h2 className="font-semibold text-text-primary">Development prototype</h2>
            <p className="text-sm leading-6 text-text-secondary">The checkout and store orders were created for testing. No payment was initiated or collected, and every order remains payment-pending. Real payment instructions require the production payment provider to be configured.</p>
          </CardContent>
        </Card>
      ) : instructions ? (
        <Card variant="elevated">
          <CardHeader><CardTitle>Temporary bank-transfer instructions</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {instructions.display_text && <p className="rounded-lg bg-secondary p-3 text-sm text-secondary-foreground">{instructions.display_text}</p>}
            {instructions.bank_name && <div><p className="text-xs text-text-tertiary">Bank</p><p className="font-semibold text-text-primary">{instructions.bank_name}</p></div>}
            {instructions.account_name && <div><p className="text-xs text-text-tertiary">Account name</p><p className="font-semibold text-text-primary">{instructions.account_name}</p></div>}
            {instructions.account_number && <div className="flex items-center justify-between gap-3"><div><p className="text-xs text-text-tertiary">Temporary account number</p><p className="font-mono text-xl font-bold text-text-primary">{instructions.account_number}</p></div><Button type="button" variant="outline" size="sm" onClick={() => void copyValue(instructions.account_number!, 'Account number')}>Copy</Button></div>}
            <div className="flex items-center justify-between gap-3 border-t border-border pt-4"><div><p className="text-xs text-text-tertiary">Exact amount</p><p className="font-display text-xl font-bold text-primary">{formatKobo(instructions.amount ?? instructions.amount_minor ?? checkout.amount)}</p></div><Button type="button" variant="outline" size="sm" onClick={() => void copyValue(formatKobo(instructions.amount ?? instructions.amount_minor ?? checkout.amount), 'Amount')}>Copy</Button></div>
            {instructions.reference && <div><p className="text-xs text-text-tertiary">Payment reference</p><p className="break-all font-mono text-sm text-text-primary">{instructions.reference}</p></div>}
            {(instructions.expires_at || checkout.payment_expires_at) && <p className="rounded-lg bg-gold-soft p-3 text-sm text-text-primary">These temporary details expire at {formatDateTime(String(instructions.expires_at || checkout.payment_expires_at))}. Transfer the exact amount before expiry.</p>}
            <p className="text-xs leading-5 text-text-secondary">Kamba will update the order only after the payment provider verifies the transfer. Do not treat a bank transfer receipt alone as confirmation.</p>
          </CardContent>
        </Card>
      ) : (
        <Card variant="outlined">
          <CardContent className="space-y-4 p-5">
            <h2 className="font-semibold text-text-primary">Payment has not started</h2>
            <p className="text-sm leading-6 text-text-secondary">Continue to request temporary bank-transfer instructions from the configured provider. If the provider is not configured, the backend will return an explicit error and the checkout will remain pending.</p>
            <Button type="button" onClick={() => void startPayment()} disabled={initiating}>{initiating ? 'Contacting payment provider…' : 'Get payment instructions'}</Button>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button type="button" variant="outline" className="flex-1" onClick={() => void loadCheckout()} disabled={refreshing}>{refreshing ? 'Checking…' : 'Refresh payment status'}</Button>
        <Link href="/orders" className="flex-1"><Button className="w-full">View orders</Button></Link>
      </div>
    </div>
  )
}


export default function CheckoutPaymentPage() {
  return <Suspense fallback={<div className="container mx-auto px-4 py-12"><div className="h-48 animate-pulse rounded-xl bg-surface-muted" /></div>}><CheckoutPaymentContent /></Suspense>
}
