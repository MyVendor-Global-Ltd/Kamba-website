'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { apiJson } from '@/lib/api'
import type { Product } from '@/types/commerce'
import { formatKobo } from '@/lib/formatting'
import { useCart } from '@/hooks/useCart'
import { useToast } from '@/components/ui/toast'
import {
  ArrowLeft, ChevronLeft, ChevronRight, Heart, Share2, ShoppingBag,
  Star, Plus, Minus, Store, Play,
} from 'lucide-react'

type ProductResponse = Product & {
  product?: Product
  original_price?: number
  store_slug?: string
  average_rating?: number
  review_count?: number
}

export default function ProductDetailPage({ initialProduct }: { initialProduct?: Product | null }) {
  const params = useParams()
  const id = params.id as string
  const [product, setProduct] = useState<Product | null>(initialProduct ?? null)
  const [loading, setLoading] = useState(!initialProduct)
  const [error, setError] = useState('')
  const [selectedImage, setSelectedImage] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [addingToCart, setAddingToCart] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([])
  const [relatedLoading, setRelatedLoading] = useState(false)
  const { addItem } = useCart()
  const { addToast } = useToast()

  useEffect(() => {
    let active = true
    if (initialProduct?.id === id) {
      setProduct(initialProduct)
      setLoading(false)
      apiJson<{ items: Array<{ product_id: string }> }>('/marketplace/wishlist')
        .then((wishlist) => {
          if (active) setIsSaved(wishlist.items.some((item) => item.product_id === id))
        })
        .catch(() => undefined)
      return () => { active = false }
    }
    setLoading(true)
    apiJson<ProductResponse>(`/commerce/products/${id}`)
      .then((data) => {
        if (!active) return
        const item = data.product || data
        setProduct({
          ...item,
          // The public product endpoint only returns active products; older response shapes omit is_active.
          is_active: item.is_active ?? true,
          image_url: item.image_url || item.images?.[0],
          compare_at_price: item.compare_at_price ?? data.original_price,
          store_slug: item.store_slug || data.store_slug,
        })
        setLoading(false)
        apiJson<{ items: Array<{ product_id: string }> }>('/marketplace/wishlist')
          .then((wishlist) => {
            if (active) setIsSaved(wishlist.items.some((item) => item.product_id === id))
          })
          .catch(() => undefined)
      })
      .catch((err) => {
        if (!active) return
        setError(err instanceof Error ? err.message : 'Failed to load product')
        setLoading(false)
      })
    return () => { active = false }
  }, [id, initialProduct])

  useEffect(() => {
    if (!product?.store_slug && !product?.store_id) {
      setRelatedProducts([])
      return
    }
    let active = true
    setRelatedLoading(true)
    apiJson<{ products: Product[] }>('/commerce/products', {
      params: { store: product.store_slug || product.store_id, limit: 24, stock_status: 'in_stock' },
    })
      .then((data) => {
        if (!active) return
        const items = (data.products || [])
          .filter((item) => item.id !== product.id && item.is_active && item.stock_quantity > 0 && (item.in_stock ?? true))
          .sort((a, b) => Number(b.category === product.category) - Number(a.category === product.category))
          .slice(0, 8)
        setRelatedProducts(items)
      })
      .catch(() => { if (active) setRelatedProducts([]) })
      .finally(() => { if (active) setRelatedLoading(false) })
    return () => { active = false }
  }, [product?.id, product?.store_slug, product?.store_id, product?.category])

  const handleToggleWishlist = async () => {
    if (!product) return
    try {
      await apiJson(`/marketplace/wishlist/${product.id}`, { method: isSaved ? 'DELETE' : 'POST' })
      setIsSaved(!isSaved)
      addToast({
        type: 'success',
        title: isSaved ? 'Removed from saved items' : 'Saved for later',
        message: isSaved ? 'This product was removed from your wishlist.' : 'This product is now in your wishlist.',
      })
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Could not update wishlist',
        message: err instanceof Error ? err.message : 'Sign in to save products.',
      })
    }
  }

  const handleShare = async () => {
    const url = window.location.href
    try {
      if (navigator.share) await navigator.share({ title: product?.name || 'Kamba product', url })
      else {
        await navigator.clipboard.writeText(url)
        addToast({ type: 'success', title: 'Link copied', message: 'Product link copied to clipboard.' })
      }
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        addToast({ type: 'error', title: 'Could not share product', message: 'Copy the page link from your browser instead.' })
      }
    }
  }

  const handleAddToCart = async () => {
    if (!product || !product.is_active || product.stock_quantity <= 0) return
    setAddingToCart(true)
    try {
      await addItem({
        product_id: product.id,
        quantity,
        name: product.name,
        price_kobo: product.price,
        store_id: product.store_id || '',
        image_url: product.image_url,
      })
      addToast({
        type: 'success',
        title: 'Added to cart',
        message: `${product.name} (x${quantity}) has been added to your cart.`,
      })
    } catch {
      addToast({ type: 'error', title: 'Failed to add to cart', message: 'Please try again.' })
    } finally {
      setAddingToCart(false)
    }
  }

  if (loading) {
    return <main className="min-h-screen bg-[#F7F7F3] px-4 py-8 text-[#1C2A21] sm:px-8"><div className="mx-auto max-w-[1440px] animate-pulse"><div className="h-4 w-36 rounded bg-[#E7E5DA]" /><div className="mt-8 grid gap-8 lg:grid-cols-[1.15fr_.85fr]"><div className="aspect-[4/5] rounded-[2rem] bg-[#E7E5DA]" /><div className="space-y-5 py-8"><div className="h-5 w-28 rounded bg-[#E7E5DA]" /><div className="h-14 w-4/5 rounded bg-[#E7E5DA]" /><div className="h-8 w-1/3 rounded bg-[#E7E5DA]" /><div className="mt-12 h-14 rounded-full bg-[#E7E5DA]" /></div></div></div></main>
  }

  if (!product) {
    return <main className="flex min-h-[70vh] items-center justify-center bg-[#F7F7F3] px-6 text-center text-[#1C2A21]"><div className="max-w-md"><div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[#E8F0E9]"><ShoppingBag className="h-7 w-7 text-[#24543B]" /></div><h1 className="text-3xl font-semibold">Product unavailable</h1><p className="mt-3 text-sm leading-6 text-[#56645A]">{error || "The product you're looking for doesn't exist or has been removed."}</p><Link href="/marketplace/products" className="mt-7 inline-flex h-12 items-center rounded-full bg-[#315B42] px-6 text-sm font-semibold text-white transition hover:bg-[#173D2A]">Browse products</Link></div></main>
  }

  const images = product.images?.length ? product.images : product.image_url ? [product.image_url] : []
  const hasDiscount = Boolean(product.compare_at_price && product.compare_at_price > product.price)
  const discountPercent = hasDiscount ? Math.round(((product.compare_at_price! - product.price) / product.compare_at_price!) * 100) : 0
  const inStock = Boolean(product.is_active && (product.in_stock ?? product.stock_quantity > 0))
  const maxQuantity = Math.max(1, product.stock_quantity || 1)

  return (
    <main className="min-h-screen overflow-hidden bg-[#F7F7F3] text-[#202820]">
      <div className="mx-auto max-w-[1600px] px-4 pt-5 sm:px-8 lg:px-12">
        <div className="flex items-center justify-between border-b border-[#DCD9CE] pb-4">
          <Link href="/marketplace/products" className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[.13em] text-[#56645A] transition hover:text-[#24543B]"><ArrowLeft className="h-4 w-4" /> Back to products</Link>
          <div className="flex items-center gap-2">
            <button type="button" onClick={handleShare} aria-label="Share product" className="flex h-10 w-10 items-center justify-center rounded-full border border-[#DCD9CE] text-[#24543B] transition hover:bg-[#E8F0E9]"><Share2 className="h-[17px] w-[17px]" /></button>
            <button type="button" onClick={handleToggleWishlist} aria-label={isSaved ? 'Remove from wishlist' : 'Save to wishlist'} aria-pressed={isSaved} className="flex h-10 w-10 items-center justify-center rounded-full border border-[#DCD9CE] text-[#24543B] transition hover:bg-[#E8F0E9]"><Heart className={'h-[17px] w-[17px] ' + (isSaved ? 'fill-current text-[#A94338]' : '')} /></button>
            <Link href="/cart" aria-label="Open cart" className="flex h-10 w-10 items-center justify-center rounded-full border border-[#DCD9CE] text-[#24543B] transition hover:bg-[#E8F0E9]"><ShoppingBag className="h-[17px] w-[17px]" /></Link>
          </div>
        </div>
      </div>

      <section className="mx-auto grid max-w-[1600px] items-start gap-8 px-4 pb-14 pt-6 sm:px-8 lg:grid-cols-[minmax(0,1.18fr)_minmax(360px,.82fr)] lg:gap-12 lg:px-12 lg:pb-24 lg:pt-10">
        <div className="min-w-0">
          <div className="relative overflow-hidden rounded-2xl bg-[#ECEDE8]">
            <div className="absolute left-5 top-5 z-10 flex flex-wrap items-center gap-2 sm:left-7 sm:top-7">
              {product.category && <span className="rounded-full border border-white/70 bg-[#F7F7F3]/85 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.16em] text-[#24543B] backdrop-blur">{product.category}</span>}
              {hasDiscount && <span className="rounded-full bg-[#315B42] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.13em] text-white">Save {discountPercent}%</span>}
            </div>
            {images.length > 0 ? <img src={images[Math.min(selectedImage, images.length - 1)]} alt={product.name} fetchPriority="high" className={"aspect-[4/5] max-h-[78svh] w-full object-center sm:aspect-[5/5.5] lg:aspect-[.91/1] lg:max-h-[none] " + "object-contain p-2 sm:p-4"} /> : <div className="flex aspect-[4/5] items-center justify-center bg-[#ECEDE8]"><ShoppingBag className="h-16 w-16 text-[#24543B]/20" /></div>}
            {images.length > 1 && <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-transparent px-5 pb-5 pt-14 sm:px-7 sm:pb-7"><span className="text-xs font-medium tracking-[.12em] text-white">{String(selectedImage + 1).padStart(2, '0')} <span className="text-white/60">/ {String(images.length).padStart(2, '0')}</span></span><div className="flex gap-2"><button type="button" onClick={() => setSelectedImage((value) => value === 0 ? images.length - 1 : value - 1)} aria-label="Previous product image" className="flex h-10 w-10 items-center justify-center rounded-full border border-white/55 bg-white/15 text-white backdrop-blur transition hover:bg-white/30"><ChevronLeft className="h-4 w-4" /></button><button type="button" onClick={() => setSelectedImage((value) => value === images.length - 1 ? 0 : value + 1)} aria-label="Next product image" className="flex h-10 w-10 items-center justify-center rounded-full border border-white/55 bg-white/15 text-white backdrop-blur transition hover:bg-white/30"><ChevronRight className="h-4 w-4" /></button></div></div>}
          </div>
          {images.length > 1 && <div aria-label="More product photos" className="mt-4 flex gap-3 overflow-x-auto pb-2">{images.map((image, index) => <button key={image + index} type="button" onClick={() => setSelectedImage(index)} aria-label={'View product image ' + (index + 1)} aria-current={selectedImage === index ? 'true' : undefined} className={'h-20 w-16 shrink-0 overflow-hidden rounded-xl border-2 transition sm:h-24 sm:w-20 ' + (selectedImage === index ? 'border-[#24543B]' : 'border-transparent opacity-65 hover:opacity-100')}><img src={image} alt="" loading="lazy" className="h-full w-full object-cover" /></button>)}</div>}
        </div>

        <div className="min-w-0 lg:sticky lg:top-8 lg:pt-5">
          <div className="text-[10px] font-medium uppercase tracking-[.12em] text-[#858D84]">Product details</div>
          <div className="mt-5 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[.16em] text-[#56645A]"><span className={'h-2 w-2 rounded-full ' + (inStock ? 'bg-[#347354]' : 'bg-[#A94338]')} />{inStock ? 'Available to order' : 'Currently unavailable'}</div>
          <h1 className="mt-4 max-w-2xl text-[clamp(1.75rem,4vw,2.65rem)] font-semibold leading-[1.1] tracking-[-.04em] text-[#202820] [font-family:Georgia,'Times_New_Roman',serif]">{product.name}</h1>
          <div className="mt-4 flex flex-wrap items-baseline gap-x-4 gap-y-1 border-b border-[#E5E7DF] pb-5"><p className="text-[1.45rem] font-semibold tracking-tight text-[#315B42]">{formatKobo(product.price)}</p>{hasDiscount && <p className="text-sm text-[#7D897F] line-through">{formatKobo(product.compare_at_price!)}</p>}</div>
          {product.description && <p className="mt-5 max-w-xl whitespace-pre-wrap text-sm leading-6 text-[#697269]">{product.description}</p>}
          <div className="mt-6 flex flex-row gap-3">
            <div className="flex h-14 w-fit items-center rounded-full border border-[#D5D2C5] bg-[#FFFDF8] px-1"><button type="button" aria-label="Decrease quantity" onClick={() => setQuantity((value) => Math.max(1, value - 1))} disabled={quantity <= 1} className="flex h-12 w-11 items-center justify-center rounded-full text-[#24543B] transition hover:bg-[#E8F0E9] disabled:opacity-30"><Minus className="h-4 w-4" /></button><span className="w-8 text-center text-sm font-semibold tabular-nums" aria-live="polite">{quantity}</span><button type="button" aria-label="Increase quantity" onClick={() => setQuantity((value) => Math.min(maxQuantity, value + 1))} disabled={quantity >= maxQuantity || !inStock} className="flex h-12 w-11 items-center justify-center rounded-full text-[#24543B] transition hover:bg-[#E8F0E9] disabled:opacity-30"><Plus className="h-4 w-4" /></button></div>
            <button type="button" onClick={handleAddToCart} disabled={addingToCart || !inStock} className="inline-flex h-14 flex-1 items-center justify-center gap-2 rounded-full bg-[#315B42] px-6 text-xs font-semibold text-white transition hover:bg-[#264A35] disabled:cursor-not-allowed disabled:opacity-45 sm:min-w-[210px]"><ShoppingBag className="h-4 w-4" />{addingToCart ? 'Adding to cart…' : inStock ? 'Add to bag' : 'Out of stock'}</button>
          </div>
          <p className="mt-3 text-[11px] leading-5 text-[#7D897F]">Delivery options and applicable fees are confirmed at checkout before payment.</p>
          <div className="mt-6 grid grid-cols-2 gap-3 border-y border-[#E5E7DF] py-4"><div><p className="text-[9px] font-bold uppercase tracking-[.17em] text-[#7D897F]">Stock</p><p className="mt-1.5 text-sm font-semibold text-[#24543B]">{inStock ? product.stock_quantity + ' available' : 'Unavailable'}</p></div><div><p className="text-[9px] font-bold uppercase tracking-[.17em] text-[#7D897F]">Shopping with</p><p className="mt-1.5 text-sm font-semibold text-[#24543B]">Kamba marketplace</p></div></div>
          {product.store_name && <div className="mt-7 flex items-center justify-between gap-4 border-y border-[#E5E7DF] bg-transparent py-4"><div className="flex min-w-0 items-center gap-3"><div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-lg font-semibold text-[#315B42]">{product.store_name.charAt(0).toUpperCase()}</div><div className="min-w-0"><p className="text-[9px] font-bold uppercase tracking-[.16em] text-[#7D897F]">Sold by</p><p className="mt-1 truncate text-sm font-semibold text-[#1C2A21]">{product.store_name}</p></div></div><Link href={'/marketplace/stores/' + (product.store_slug || product.store_id)} className="inline-flex h-10 shrink-0 items-center gap-2 rounded-full border border-[#D5D2C5] px-4 text-[10px] font-bold uppercase tracking-[.1em] text-[#24543B] transition hover:bg-[#E8F0E9]"><Store className="h-3.5 w-3.5" /> Visit shop</Link></div>}
          {product.review_count ? <div className="mt-6 flex items-center gap-2 text-xs text-[#56645A]"><Star className="h-4 w-4 fill-[#B68B3B] text-[#B68B3B]" /><strong className="text-[#24543B]">{Number(product.average_rating || 0).toFixed(1)}</strong><span>{product.review_count} reviews</span></div> : <p className="mt-6 text-xs text-[#7D897F]">No reviews yet</p>}
        </div>
      </section>

      {product.videos && product.videos.length > 0 && <section className="mx-auto max-w-[1600px] px-4 py-12 sm:px-8 sm:py-16 lg:px-12"><div className="mb-6 flex items-end justify-between gap-4"><div><p className="text-[10px] font-bold uppercase tracking-[.22em] text-[#8A7650]">See it closer</p><h2 className="mt-2 text-3xl font-medium text-[#173D2A] [font-family:Georgia,'Times_New_Roman',serif]">Product in motion</h2></div><Play className="mb-1 h-5 w-5 text-[#8A7650]" /></div><div className="grid gap-4 sm:grid-cols-2">{product.videos.map((videoUrl) => <video key={videoUrl} controls preload="metadata" playsInline className="w-full rounded-2xl border border-[#DCD9CE] bg-[#EAE8DE]"><source src={videoUrl} />Your browser does not support embedded videos.</video>)}</div></section>}

      {relatedProducts.length > 0 && <section className="border-t border-[#DCD9CE] bg-[#F7F7F3] px-4 py-9 sm:px-8 sm:py-16 lg:px-12 lg:py-20">
        <div className="mx-auto max-w-[1600px]">
          <div className="mb-7 flex flex-col justify-between gap-4 sm:mb-9 sm:flex-row sm:items-end">
            <div>
              <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.22em] text-[#8A7650]"><span className="h-px w-7 bg-[#B68B3B]" /> From the same store</p>
              <h2 className="mt-3 max-w-2xl text-3xl font-medium leading-[1.04] tracking-[-.045em] text-[#173D2A] [font-family:Georgia,'Times_New_Roman',serif] sm:text-5xl">More to discover at {product.store_name || 'this store'}.</h2>
              <p className="mt-3 max-w-xl text-sm leading-6 text-[#56645A]">Still exploring? Take a look at other pieces from this seller. You might find the one that feels just right.</p>
            </div>
            <Link href={'/marketplace/stores/' + (product.store_slug || product.store_id)} className="inline-flex h-11 shrink-0 items-center gap-2 self-start rounded-full border border-[#BFC5B9] px-5 text-[10px] font-bold uppercase tracking-[.12em] text-[#24543B] transition hover:bg-[#E8F0E9] sm:self-auto">View all from this store <ChevronRight className="h-4 w-4" /></Link>
          </div>
          <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-3 sm:-mx-8 sm:gap-4 sm:px-8 lg:mx-0 lg:grid lg:grid-cols-4 lg:gap-6 lg:overflow-visible lg:px-0">
            {relatedProducts.map((item, index) => {
              const image = item.images?.[0] || item.image_url
              return <article key={item.id} className="group w-[68%] shrink-0 snap-start sm:w-[42%] lg:w-auto">
                <Link href={'/marketplace/products/' + item.id} className="block">
                  <div className="aspect-[4/5] overflow-hidden rounded-xl bg-[#E6E4DA]">
                    {image ? <img src={image} alt={item.name} loading={index < 2 ? 'eager' : 'lazy'} className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.035]" /> : <div className="grid h-full place-items-center text-[#24543B]/40"><ShoppingBag className="h-9 w-9" /></div>}
                  </div>
                  <div className="flex items-start justify-between gap-3 py-3">
                    <h3 className="min-w-0 text-sm font-semibold leading-5 text-[#1C2A21] transition group-hover:text-[#24543B]">{item.name}</h3>
                    <p className="shrink-0 whitespace-nowrap text-sm font-semibold tabular-nums text-[#24543B]">{formatKobo(item.price)}</p>
                  </div>
                </Link>
              </article>
            })}
          </div>
        </div>
      </section>}
      {relatedLoading && <div className="sr-only" role="status">Finding more products from this store…</div>}
      <div className="mx-auto flex max-w-[1600px] flex-col items-start justify-between gap-4 border-t border-[#DCD9CE] px-4 pb-24 pt-8 sm:flex-row sm:items-center sm:px-8 sm:pb-8 lg:px-12"><div><p className="text-sm font-semibold text-[#1C2A21]">Looking for something different?</p><p className="mt-1 text-xs text-[#7D897F]">Explore more independent sellers and local finds on Kamba.</p></div><Link href="/marketplace/products" className="inline-flex h-11 items-center rounded-full border border-[#BFC5B9] px-5 text-xs font-bold uppercase tracking-[.12em] text-[#24543B] transition hover:bg-[#E8F0E9]">Explore all products <ChevronRight className="ml-2 h-4 w-4" /></Link></div>
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[#DCD9CE] bg-[#F7F7F3]/95 px-4 py-3 pb-[calc(.75rem+env(safe-area-inset-bottom))] shadow-[0_-8px_30px_rgba(28,42,33,.08)] backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-xl items-center gap-3">
          <div className="min-w-0 flex-1"><p className="text-[9px] font-bold uppercase tracking-[.14em] text-[#7D897F]">Your selection</p><p className="truncate text-base font-semibold tabular-nums text-[#173D2A]">{formatKobo(product.price)}</p></div>
          <button type="button" onClick={handleAddToCart} disabled={addingToCart || !inStock} className="inline-flex h-12 min-w-[54%] items-center justify-center gap-2 rounded-full bg-[#315B42] px-5 text-xs font-semibold text-white transition hover:bg-[#264A35] disabled:cursor-not-allowed disabled:opacity-45"><ShoppingBag className="h-4 w-4" />{addingToCart ? 'Adding…' : inStock ? 'Add to bag' : 'Out of stock'}</button>
        </div>
      </div>
    </main>
  )
}
