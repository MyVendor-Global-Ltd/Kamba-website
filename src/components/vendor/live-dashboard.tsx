'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { apiJson } from '@/lib/api'
import { formatDateTime, formatKobo, formatOrderStatus } from '@/lib/formatting'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, Package, RefreshCw, ShoppingBag } from 'lucide-react'

interface DashboardOrder {
  id: string
  status: string
  total_amount: number
  total?: number
  created_at: string
  item_count: number
  store_name?: string
}
interface DashboardProduct {
  id: string
  name: string
  price: number
  stock_quantity: number
  is_active: boolean
  image_url?: string
}

export function LiveVendorDashboard() {
  const [orders, setOrders] = useState<DashboardOrder[]>([])
  const [products, setProducts] = useState<DashboardProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')

  const loadData = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true)
    try {
      setError('')
      const [orderResponse, productResponse] = await Promise.all([
        apiJson<{ orders: DashboardOrder[] }>('/commerce/vendor/orders', { params: { limit: 100, offset: 0 } }),
        apiJson<{ products: DashboardProduct[] }>('/commerce/vendor/products', { params: { limit: 100, offset: 0 } }),
      ])
      setOrders((orderResponse.orders || []).map((order) => ({ ...order, total_amount: Number(order.total ?? order.total_amount ?? 0) })))
      setProducts(productResponse.products || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load your vendor data.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => { void Promise.resolve().then(() => loadData()) }, [loadData])

  const paidStatuses = new Set(['paid_held', 'confirmed', 'processing', 'shipped', 'out_for_delivery', 'delivered', 'ready_for_pickup', 'collected'])
  const grossOrderValue = orders.filter((order) => paidStatuses.has(order.status)).reduce((sum, order) => sum + Number(order.total_amount || 0), 0)
  const awaitingConfirmation = orders.filter((order) => order.status === 'paid_held').length
  const inProgress = orders.filter((order) => ['confirmed', 'processing', 'shipped', 'out_for_delivery', 'ready_for_pickup'].includes(order.status)).length
  const completed = orders.filter((order) => ['delivered', 'collected'].includes(order.status)).length
  const activeProducts = products.filter((product) => product.is_active).length
  const lowStock = products.filter((product) => product.stock_quantity > 0 && product.stock_quantity <= 5).length
  const outOfStock = products.filter((product) => product.stock_quantity <= 0).length

  if (loading) return <div className="container mx-auto space-y-5 px-4 py-10"><div className="h-9 w-1/3 animate-pulse rounded bg-surface-muted" /><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{[1,2,3,4].map((item) => <div key={item} className="h-28 animate-pulse rounded-xl bg-surface-muted" />)}</div></div>

  return (
    <div className="container mx-auto max-w-7xl space-y-8 px-4 py-8 lg:py-12">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="text-sm font-semibold uppercase tracking-wider text-primary">Vendor workspace</p><h1 className="mt-2 font-display text-3xl font-bold text-text-primary">Dashboard</h1><p className="mt-2 text-sm text-text-secondary">Live order and product information from your Kamba account.</p></div>
        <div className="flex flex-wrap gap-2"><Button type="button" variant="outline" onClick={() => void loadData(true)} disabled={refreshing}><RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} /> Refresh</Button><Link href="/vendor/orders"><Button>Manage orders</Button></Link></div>
      </header>

      {error && <div role="alert" className="flex items-start gap-3 rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />{error}</div>}

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card variant="outlined"><CardContent className="p-5"><p className="text-sm text-text-secondary">Gross order value</p><p className="mt-2 font-display text-2xl font-bold text-text-primary">{formatKobo(grossOrderValue)}</p><p className="mt-1 text-xs text-text-tertiary">Not vendor payout or net earnings</p></CardContent></Card>
        <Card variant="outlined"><CardContent className="p-5"><p className="text-sm text-text-secondary">Total orders</p><p className="mt-2 font-display text-2xl font-bold text-text-primary">{orders.length}</p><p className="mt-1 text-xs text-text-tertiary">{awaitingConfirmation} paid and awaiting confirmation</p></CardContent></Card>
        <Card variant="outlined"><CardContent className="p-5"><p className="text-sm text-text-secondary">Active products</p><p className="mt-2 font-display text-2xl font-bold text-text-primary">{activeProducts}</p><p className="mt-1 text-xs text-text-tertiary">{products.length} products in the vendor list</p></CardContent></Card>
        <Card variant="outlined"><CardContent className="p-5"><p className="text-sm text-text-secondary">Stock attention</p><p className="mt-2 font-display text-2xl font-bold text-text-primary">{lowStock + outOfStock}</p><p className="mt-1 text-xs text-text-tertiary">{lowStock} low stock · {outOfStock} out of stock</p></CardContent></Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <Card variant="outlined">
          <CardHeader className="flex flex-row items-center justify-between"><CardTitle>Recent orders</CardTitle><Link href="/vendor/orders" className="text-sm font-medium text-primary hover:underline">View all</Link></CardHeader>
          <CardContent className="space-y-3">
            {orders.length === 0 ? <p className="py-8 text-center text-sm text-text-secondary">No vendor orders yet.</p> : orders.slice(0, 8).map((order) => (
              <div key={order.id} className="flex items-center justify-between gap-3 border-b border-border pb-3 last:border-0">
                <div className="min-w-0"><p className="truncate text-sm font-medium text-text-primary">{order.id}</p><p className="text-xs text-text-tertiary">{order.store_name || 'Your store'} · {order.item_count} item(s) · {formatDateTime(order.created_at)}</p></div>
                <div className="shrink-0 text-right"><p className="text-sm font-semibold text-text-primary">{formatKobo(order.total_amount)}</p><Badge variant={order.status === 'paid_held' ? 'warning' : order.status === 'delivered' || order.status === 'collected' ? 'success' : 'outline'}>{formatOrderStatus(order.status)}</Badge></div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card variant="outlined">
          <CardHeader className="flex flex-row items-center justify-between"><CardTitle>Product stock</CardTitle><Link href="/vendor/products" className="text-sm font-medium text-primary hover:underline">Manage products</Link></CardHeader>
          <CardContent className="space-y-3">
            {products.length === 0 ? <p className="py-8 text-center text-sm text-text-secondary">No products found. Add your first product to start selling.</p> : products.slice(0, 8).map((product) => (
              <div key={product.id} className="flex items-center justify-between gap-3 border-b border-border pb-3 last:border-0">
                <div className="flex min-w-0 items-center gap-3"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-secondary"><Package className="h-4 w-4 text-primary" /></span><div className="min-w-0"><p className="truncate text-sm font-medium text-text-primary">{product.name}</p><p className="text-xs text-text-tertiary">{formatKobo(product.price)}</p></div></div>
                <Badge variant={product.stock_quantity <= 0 ? 'destructive' : product.stock_quantity <= 5 ? 'warning' : 'outline'}>{product.stock_quantity <= 0 ? 'Out of stock' : `${product.stock_quantity} in stock`}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <Card variant="outlined"><CardContent className="p-5"><p className="text-sm text-text-secondary">Orders in progress</p><p className="mt-2 text-2xl font-bold text-text-primary">{inProgress}</p></CardContent></Card>
        <Card variant="outlined"><CardContent className="p-5"><p className="text-sm text-text-secondary">Completed orders</p><p className="mt-2 text-2xl font-bold text-text-primary">{completed}</p></CardContent></Card>
        <Card variant="outlined"><CardContent className="p-5"><p className="text-sm text-text-secondary">Customer and review analytics</p><p className="mt-2 text-lg font-semibold text-text-primary">Not available yet</p><p className="mt-1 text-xs text-text-tertiary">The current backend does not expose these dashboard metrics.</p></CardContent></Card>
      </section>

      <Card variant="outlined"><CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="font-semibold text-text-primary">Need to update your storefront?</h2><p className="mt-1 text-sm text-text-secondary">Manage products, stock and storefront details from your vendor tools.</p></div><Link href="/vendor/products"><Button variant="outline"><ShoppingBag className="mr-2 h-4 w-4" /> Open product management</Button></Link></CardContent></Card>
    </div>
  )
}
