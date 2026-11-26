'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { apiJson } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowUpRight, CheckCircle2, Clock3, ImageIcon, Package, Store } from 'lucide-react'

type DayHours = { closed: boolean; open: string | null; close: string | null }
type OperatingHours = Record<string, DayHours>
type DeliverySetup = { management_method: 'vendor_managed' | 'kamba_managed'; delivery_areas: string[]; vendor_delivery_fee: number | null }
interface StoreData {
  store_name?: string
  slug?: string
  store_image_url?: string | null
  store_logo_url?: string | null
  store_slideshow_images?: string[] | null
  store_logo_in_slideshow?: boolean
  launch_review_completed?: boolean
  business_profiles?: { operating_hours?: OperatingHours | null } | Array<{ operating_hours?: OperatingHours | null }> | null
}
interface ProductData { is_active?: boolean; is_available?: boolean }
interface StoreResponse { store: StoreData; delivery_settings?: DeliverySetup | null }

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
const DEFAULT_HOURS: OperatingHours = Object.fromEntries(DAYS.map((day) => [day, { closed: day === 'sunday', open: '09:00', close: '18:00' }]))

function firstBusiness(value: StoreData['business_profiles']) {
  return Array.isArray(value) ? value[0] || null : value || null
}

function validHours(value?: OperatingHours | null) {
  return !!value && DAYS.every((day) => {
    const item = value[day]
    return !!item && (item.closed === true || (!!item.open && !!item.close && item.open < item.close))
  })
}

export function StoreLaunchProgress() {
  const [store, setStore] = useState<StoreData | null>(null)
  const [products, setProducts] = useState<ProductData[]>([])
  const [delivery, setDelivery] = useState<DeliverySetup | null>(null)
  const [hours, setHours] = useState<OperatingHours>(DEFAULT_HOURS)
  const [deliveryMethod, setDeliveryMethod] = useState<'vendor_managed' | 'kamba_managed'>('kamba_managed')
  const [deliveryAreas, setDeliveryAreas] = useState('')
  const [deliveryFee, setDeliveryFee] = useState('0')
  const [savingOperations, setSavingOperations] = useState(false)
  const [savingReview, setSavingReview] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [storeResponse, productResponse] = await Promise.all([
        apiJson<StoreResponse>('/vendors/store'),
        apiJson<{ products: ProductData[] }>('/commerce/vendor/products', { params: { limit: 100, offset: 0 } }),
      ])
      const currentStore = storeResponse.store
      if (!currentStore) throw new Error('Your storefront has not been created yet.')
      setStore(currentStore)
      setProducts(productResponse.products || [])
      const business = firstBusiness(currentStore.business_profiles)
      if (business?.operating_hours) setHours(Object.fromEntries(DAYS.map((day) => [day, { ...DEFAULT_HOURS[day], ...(business.operating_hours?.[day] || {}) }])) as OperatingHours)
      const currentDelivery = storeResponse.delivery_settings || null
      setDelivery(currentDelivery)
      if (currentDelivery) {
        setDeliveryMethod(currentDelivery.management_method)
        setDeliveryAreas((currentDelivery.delivery_areas || []).join(', '))
        setDeliveryFee(String(currentDelivery.vendor_delivery_fee ?? 0))
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load your store launch progress.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void load() }, [load])

  const activeProducts = useMemo(() => products.filter((product) => product.is_active === true && product.is_available !== false).length, [products])
  const business = firstBusiness(store?.business_profiles)
  const brandComplete = !!store?.store_image_url && !!store?.store_logo_url
  const catalogueComplete = activeProducts >= 5
  const operationsComplete = validHours(business?.operating_hours) && !!delivery?.management_method
    && (delivery.management_method !== 'vendor_managed' || ((delivery.delivery_areas || []).length > 0 && Number.isFinite(delivery.vendor_delivery_fee) && Number(delivery.vendor_delivery_fee) >= 0))
  const reviewComplete = store?.launch_review_completed === true
  const stages = [
    { title: 'Storefront is live', detail: 'Your business page is already published and visible.', complete: !!store, href: store?.slug ? '/store/' + store.slug : '/vendor/profile?section=business', icon: Store },
    { title: 'Brand identity', detail: 'Add your business logo and a cover image. Slideshow images are optional.', complete: brandComplete, href: '/vendor/profile?section=business', icon: ImageIcon },
    { title: 'Build your catalogue', detail: activeProducts + ' of 5 published products added.', complete: catalogueComplete, href: '/vendor/products', icon: Package },
    { title: 'Business operations', detail: 'Set your opening hours and decide who handles delivery.', complete: operationsComplete, href: '#business-operations', icon: Clock3 },
    { title: 'Final storefront check', detail: 'Preview your public page and confirm it looks right.', complete: reviewComplete, href: store?.slug ? '/store/' + store.slug : '/vendor/profile?section=business', icon: CheckCircle2 },
  ]
  const completedCount = stages.filter((stage) => stage.complete).length
  const progress = completedCount * 20

  const saveOperations = async (event: React.FormEvent) => {
    event.preventDefault()
    setSavingOperations(true)
    setError('')
    setSuccess('')
    const deliverySetup: DeliverySetup = {
      management_method: deliveryMethod,
      delivery_areas: deliveryMethod === 'vendor_managed' ? deliveryAreas.split(',').map((area) => area.trim()).filter(Boolean) : [],
      vendor_delivery_fee: deliveryMethod === 'vendor_managed' ? Number(deliveryFee) : null,
    }
    if (deliveryMethod === 'vendor_managed' && (!deliverySetup.delivery_areas.length || !Number.isSafeInteger(deliverySetup.vendor_delivery_fee) || Number(deliverySetup.vendor_delivery_fee) < 0)) {
      setError('Enter at least one delivery area and a valid delivery fee in naira.')
      setSavingOperations(false)
      return
    }
    try {
      await apiJson('/vendors/store', { method: 'PATCH', body: JSON.stringify({ operating_hours: hours, delivery_setup: deliverySetup }) })
      await load()
      setSuccess('Your business hours and delivery settings have been saved.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save business operations.')
    } finally {
      setSavingOperations(false)
    }
  }

  const markReviewComplete = async () => {
    setSavingReview(true)
    setError('')
    setSuccess('')
    try {
      await apiJson('/vendors/store', { method: 'PATCH', body: JSON.stringify({ launch_review_completed: true }) })
      await load()
      setSuccess('Your final storefront check is complete. Your launch setup is finished.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save your final storefront check.')
    } finally {
      setSavingReview(false)
    }
  }

  if (loading) return <Card variant="outlined"><CardContent className="space-y-4 p-5"><div className="h-5 w-48 animate-pulse rounded bg-surface-muted" /><div className="h-3 w-full animate-pulse rounded bg-surface-muted" /><div className="h-24 animate-pulse rounded bg-surface-muted" /></CardContent></Card>
  if (!store) return null

  return (
    <Card variant="outlined">
      <CardHeader className="space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-wider text-primary">Store launch progress</p><CardTitle className="mt-1">Get your store ready</CardTitle><p className="mt-1 text-sm text-text-secondary">Five steps. Each completed step adds 20%.</p></div><Badge variant={progress === 100 ? 'success' : 'outline'}>{progress}% complete</Badge></div>
        <div className="h-2 overflow-hidden rounded-full bg-surface-muted"><div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: progress + '%' }} /></div>
      </CardHeader>
      <CardContent className="space-y-5">
        {error && <p role="alert" className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
        {success && <p role="status" className="rounded-lg bg-secondary p-3 text-sm text-secondary-foreground">{success}</p>}
        <ol className="space-y-3">
          {stages.map((stage, index) => {
            const Icon = stage.icon
            return <li key={stage.title} className="flex items-start gap-3 rounded-lg border border-border p-3">
              <span className={'mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full ' + (stage.complete ? 'bg-primary-soft text-primary' : 'bg-surface-muted text-text-tertiary')}>{stage.complete ? <CheckCircle2 className="h-4 w-4" /> : <Icon className="h-4 w-4" />}</span>
              <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="text-sm font-semibold text-text-primary">{index + 1}. {stage.title}</p>{stage.complete && <Badge variant="success">Done</Badge>}</div><p className="mt-1 text-xs leading-5 text-text-secondary">{stage.detail}</p>{!stage.complete && stage.href !== '#business-operations' && <Link href={stage.href} className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">Continue <ArrowUpRight className="h-3 w-3" /></Link>}</div>
            </li>
          })}
        </ol>

        <form id="business-operations" onSubmit={saveOperations} className="space-y-4 rounded-xl border border-border p-4">
          <div><h3 className="font-semibold text-text-primary">Business hours and delivery</h3><p className="mt-1 text-xs leading-5 text-text-secondary">These details can be changed later. They are not required to make your storefront live.</p></div>
          <div className="space-y-2">
            {DAYS.map((day) => {
              const value = hours[day] || { closed: true, open: null, close: null }
              return <div key={day} className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-2 border-b border-border py-2 last:border-0">
                <span className="text-sm font-medium capitalize text-text-primary">{day}</span>
                <label className="flex items-center gap-2 text-xs text-text-secondary"><input type="checkbox" checked={value.closed} onChange={(event) => setHours((current) => ({ ...current, [day]: { ...value, closed: event.target.checked, open: value.open || '09:00', close: value.close || '18:00' } }))} />Closed</label>
                <div className="flex items-center gap-1"><input aria-label={day + ' opening time'} type="time" value={value.open || '09:00'} disabled={value.closed} onChange={(event) => setHours((current) => ({ ...current, [day]: { ...value, open: event.target.value } }))} className="w-[100px] rounded border border-border bg-surface px-1 py-2 text-xs text-text-primary disabled:opacity-40" /><span className="text-xs text-text-tertiary">–</span><input aria-label={day + ' closing time'} type="time" value={value.close || '18:00'} disabled={value.closed} onChange={(event) => setHours((current) => ({ ...current, [day]: { ...value, close: event.target.value } }))} className="w-[100px] rounded border border-border bg-surface px-1 py-2 text-xs text-text-primary disabled:opacity-40" /></div>
              </div>
            })}
          </div>
          <div className="space-y-3 border-t border-border pt-4">
            <label className="block text-sm font-medium text-text-primary">Who handles delivery?<select value={deliveryMethod} onChange={(event) => setDeliveryMethod(event.target.value as typeof deliveryMethod)} className="mt-2 h-11 w-full rounded-lg border border-border bg-surface px-3 text-text-primary"><option value="kamba_managed">Kamba helps arrange delivery</option><option value="vendor_managed">I handle my own delivery</option></select></label>
            {deliveryMethod === 'vendor_managed' && <><label className="block text-sm font-medium text-text-primary">Delivery areas<input value={deliveryAreas} onChange={(event) => setDeliveryAreas(event.target.value)} placeholder="e.g. Umudike, Ikwuano, Isi Gate" className="mt-2 h-11 w-full rounded-lg border border-border bg-surface px-3 text-text-primary" /><span className="mt-1 block text-xs text-text-tertiary">Separate areas with commas.</span></label><label className="block text-sm font-medium text-text-primary">Your delivery fee (₦)<input type="number" min="0" step="1" value={deliveryFee} onChange={(event) => setDeliveryFee(event.target.value)} className="mt-2 h-11 w-full rounded-lg border border-border bg-surface px-3 text-text-primary" /></label></>}
          </div>
          <Button type="submit" disabled={savingOperations}>{savingOperations ? 'Saving…' : 'Save business setup'}</Button>
        </form>

        <div className="flex flex-col gap-3 rounded-xl bg-secondary p-4 sm:flex-row sm:items-center sm:justify-between">
          <div><h3 className="font-semibold text-text-primary">Final check</h3><p className="mt-1 text-xs leading-5 text-text-secondary">Open your public storefront, check your details and listings, then mark this step complete. NIN or selfie verification is not required to finish store launch setup.</p></div>
          <div className="flex shrink-0 flex-wrap gap-2"><Link href={store.slug ? '/store/' + store.slug : '/vendor/profile?section=business'} target="_blank"><Button type="button" variant="outline">Preview store</Button></Link><Button type="button" onClick={() => void markReviewComplete()} disabled={savingReview || reviewComplete || !brandComplete || !catalogueComplete || !operationsComplete}>{savingReview ? 'Saving…' : reviewComplete ? 'Completed' : 'Mark complete'}</Button></div>
        </div>
        {progress === 100 && <p className="text-sm font-semibold text-primary">Your store launch setup is complete. Your storefront stays live while you continue managing it.</p>}
      </CardContent>
    </Card>
  )
}
