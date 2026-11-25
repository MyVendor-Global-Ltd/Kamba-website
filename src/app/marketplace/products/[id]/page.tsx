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
  Star, Plus, Minus, Store, Play, PackageCheck,
} from 'lucide-react'

type ProductResponse = Product & {
  product?: Product
  original_price?: number
  store_slug?: string
  average_rating?: number
  review_count?: number
}

export default function ProductDetailPage() {
  const params = useParams()
  const id = params.id as string
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedImage, setSelectedImage] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [addingToCart, setAddingToCart] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const { addItem } = useCart()
  const { addToast } = useToast()

  useEffect(() => {
    let active = true
    setLoading(true)
    apiJson<ProductResponse>(`/commerce/products/${id}`)
      .then((data) => {
        if (!active) return
        const item = data.product || data
        setProduct({
          ...item,
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
  }, [id])

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
    return (
      <main className="min-h-[80vh] bg-[#0D0D0D] px-4 py-6 text-white">
        <div className="mx-auto max-w-7xl animate-pulse">
          <div className="h-8 w-28 rounded-full bg-white/10" />
          <div className="mt-6 h-[68vh] rounded-[2rem] bg-white/[0.06]" />
          <div className="mt-8 h-8 w-1/3 rounded bg-white/10" />
          <div className="mt-3 h-5 w-1/4 rounded bg-white/10" />
        </div>
      </main>
    )
  }

  if (!product) {
    return (
      <main className="flex min-h-[70vh] items-center justify-center bg-[#0D0D0D] px-6 text-center text-white">
        <div className="max-w-md">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-white/10">
            <ShoppingBag className="h-7 w-7 text-white/60" />
          </div>
          <h1 className="text-2xl font-semibold">Product unavailable</h1>
          <p className="mt-3 text-sm leading-6 text-white/55">{error || "The product you're looking for doesn't exist or has been removed."}</p>
          <Link href="/marketplace/products" className="mt-7 inline-flex h-12 items-center rounded-full bg-white px-6 text-sm font-semibold text-[#111] transition hover:bg-white/85">
            Browse products
          </Link>
        </div>
      </main>
    )
  }

  const images = product.images?.length ? product.images : product.image_url ? [product.image_url] : []
  const hasDiscount = Boolean(product.compare_at_price && product.compare_at_price > product.price)
  const discountPercent = hasDiscount
    ? Math.round(((product.compare_at_price! - product.price) / product.compare_at_price!) * 100)
    : 0
  const inStock = Boolean(product.is_active && (product.in_stock ?? product.stock_quantity > 0))
  const maxQuantity = Math.max(1, product.stock_quantity || 1)

  return (
    <main className="min-h-screen overflow-hidden bg-[#0D0D0D] text-white">
      {/* Editorial image stage. The image and gradient are one continuous surface. */}
      <section className="relative isolate min-h-[790px] h-[min(94svh,1040px)] bg-[#0D0D0D] sm:min-h-[850px]">
        {images.length > 0 ? (
          <img
            src={images[Math.min(selectedImage, images.length - 1)]}
            alt={product.name}
            fetchPriority="high"
            className="absolute inset-0 h-full w-full object-cover object-center"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-[radial-gradient(ellipse_at_50%_35%,#344238_0%,#17221b_42%,#0D0D0D_78%)]">
            <ShoppingBag className="h-16 w-16 text-white/20" />
          </div>
        )}

        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background: 'linear-gradient(to bottom, rgba(13,13,13,.22) 0%, transparent 24%, rgba(13,13,13,.08) 42%, rgba(13,13,13,.78) 68%, #0D0D0D 94%)',
          }}
        />

        {/* Floating image controls */}
        <div className="absolute inset-x-0 top-0 z-20 flex items-center justify-between px-4 pt-[max(1rem,env(safe-area-inset-top))] sm:px-8 lg:px-12">
          <Link
            href="/marketplace/products"
            aria-label="Back to products"
            className="flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-black/25 text-white shadow-lg backdrop-blur-xl transition hover:bg-black/45"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleShare}
              aria-label="Share product"
              className="flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-black/25 text-white shadow-lg backdrop-blur-xl transition hover:bg-black/45"
            >
              <Share2 className="h-[18px] w-[18px]" />
            </button>
            <button
              type="button"
              onClick={handleToggleWishlist}
              aria-label={isSaved ? 'Remove from wishlist' : 'Save to wishlist'}
              aria-pressed={isSaved}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-black/25 text-white shadow-lg backdrop-blur-xl transition hover:bg-black/45"
            >
              <Heart className={`h-[18px] w-[18px] ${isSaved ? 'fill-current text-rose-300' : ''}`} />
            </button>
            <Link
              href="/cart"
              aria-label="Open cart"
              className="flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-black/25 text-white shadow-lg backdrop-blur-xl transition hover:bg-black/45"
            >
              <ShoppingBag className="h-[18px] w-[18px]" />
            </Link>
          </div>
        </div>

        {hasDiscount && (
          <div className="absolute left-5 top-24 z-10 rounded-full border border-white/20 bg-black/30 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.18em] text-white backdrop-blur-xl sm:left-9">
            Save {discountPercent}%
          </div>
        )}

        {/* Product card floats across the gradient boundary */}
        <div className="absolute inset-x-0 bottom-0 z-10 mx-auto w-full max-w-[1440px] px-4 pb-5 sm:px-8 sm:pb-8 lg:px-12 lg:pb-12">
          <div className="max-w-2xl rounded-[1.75rem] border border-white/[0.14] bg-[rgba(255,255,255,0.085)] p-5 shadow-[0_24px_80px_rgba(0,0,0,.32)] backdrop-blur-2xl sm:p-7 lg:p-8">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              {product.category && (
                <span className="text-[10px] font-semibold uppercase tracking-[.2em] text-white/65">{product.category}</span>
              )}
              {product.category && <span className="h-1 w-1 rounded-full bg-white/35" />}
              <span className={`text-[10px] font-semibold uppercase tracking-[.18em] ${inStock ? 'text-[#B8D8C1]' : 'text-white/45'}`}>
                {inStock ? 'Available now' : 'Currently unavailable'}
              </span>
            </div>

            <div className="flex flex-wrap items-end justify-between gap-4">
              <h1 className="max-w-xl text-[clamp(2rem,6vw,4.15rem)] font-bold uppercase leading-[.94] tracking-[-.055em] text-white [font-family:var(--font-display)]">
                {product.name}
              </h1>
              <div className="shrink-0 pb-1 text-right">
                <p className="text-xl font-semibold tracking-tight text-white sm:text-2xl">{formatKobo(product.price)}</p>
                {hasDiscount && <p className="mt-0.5 text-xs text-white/45 line-through">{formatKobo(product.compare_at_price!)}</p>}
              </div>
            </div>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="flex h-12 w-fit items-center rounded-full border border-white/15 bg-black/15 px-1">
                <button
                  type="button"
                  aria-label="Decrease quantity"
                  onClick={() => setQuantity((value) => Math.max(1, value - 1))}
                  disabled={quantity <= 1}
                  className="flex h-10 w-10 items-center justify-center rounded-full text-white/75 transition hover:bg-white/10 disabled:opacity-30"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-8 text-center text-sm font-semibold tabular-nums" aria-live="polite">{quantity}</span>
                <button
                  type="button"
                  aria-label="Increase quantity"
                  onClick={() => setQuantity((value) => Math.min(maxQuantity, value + 1))}
                  disabled={quantity >= maxQuantity || !inStock}
                  className="flex h-10 w-10 items-center justify-center rounded-full text-white/75 transition hover:bg-white/10 disabled:opacity-30"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={addingToCart || !inStock}
                className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-[#F5F2E9] px-7 text-xs font-extrabold uppercase tracking-[.16em] text-[#17251C] transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-45 sm:min-w-[220px]"
              >
                <ShoppingBag className="h-4 w-4" />
                {addingToCart ? 'Adding to cart…' : inStock ? 'Add to cart' : 'Out of stock'}
              </button>
            </div>
            <div className="mt-4 flex items-center justify-between gap-4 text-[10px] uppercase tracking-[.14em] text-white/45">
              <span>{product.stock_quantity > 0 ? `${product.stock_quantity} available` : 'Limited availability'}</span>
              <span className="flex items-center gap-1.5"><PackageCheck className="h-3.5 w-3.5" /> Delivery options at checkout</span>
            </div>
          </div>
        </div>

        {/* Gallery position indicator */}
        {images.length > 1 && (
          <div className="absolute bottom-7 right-5 z-20 hidden items-center gap-2 sm:flex lg:right-12">
            <button
              type="button"
              onClick={() => setSelectedImage((value) => value === 0 ? images.length - 1 : value - 1)}
              aria-label="Previous product image"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-black/25 text-white backdrop-blur-xl hover:bg-black/50"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="min-w-12 text-center text-xs tabular-nums text-white/75">{selectedImage + 1} / {images.length}</span>
            <button
              type="button"
              onClick={() => setSelectedImage((value) => value === images.length - 1 ? 0 : value + 1)}
              aria-label="Next product image"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-black/25 text-white backdrop-blur-xl hover:bg-black/50"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </section>

      {/* The page continues in the same dark canvas; no hard image-to-content edge. */}
      <div className="mx-auto max-w-[1440px] px-4 pb-20 sm:px-8 lg:px-12">
        {images.length > 1 && (
          <section aria-label="More product photos" className="-mt-1 flex gap-3 overflow-x-auto pb-8 pt-2">
            {images.map((image, index) => (
              <button
                key={image + index}
                type="button"
                onClick={() => setSelectedImage(index)}
                aria-label={`View product image ${index + 1}`}
                aria-current={selectedImage === index ? 'true' : undefined}
                className={`h-20 w-16 shrink-0 overflow-hidden rounded-xl border transition sm:h-24 sm:w-20 ${selectedImage === index ? 'border-white/80 opacity-100' : 'border-white/10 opacity-55 hover:opacity-90'}`}
              >
                <img src={image} alt="" loading="lazy" className="h-full w-full object-cover" />
              </button>
            ))}
          </section>
        )}

        <div className="grid gap-12 border-t border-white/10 py-10 lg:grid-cols-[minmax(0,1fr)_minmax(280px,.62fr)] lg:gap-24 lg:py-16">
          <section>
            <p className="text-[10px] font-bold uppercase tracking-[.24em] text-[#A8C6AE]">The details</p>
            <h2 className="mt-3 max-w-2xl text-3xl font-semibold leading-tight tracking-[-.04em] text-white sm:text-4xl">
              Made to stand out. Chosen to fit your life.
            </h2>
            {product.description ? (
              <p className="mt-6 max-w-2xl whitespace-pre-wrap text-sm leading-8 text-white/60 sm:text-base">{product.description}</p>
            ) : (
              <p className="mt-6 text-sm leading-7 text-white/45">More information about this product has not been provided by the seller yet.</p>
            )}
            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 text-xs text-white/45">
              {product.review_count ? (
                <span className="flex items-center gap-2">
                  <Star className="h-4 w-4 fill-[#D0AD68] text-[#D0AD68]" />
                  <strong className="font-semibold text-white">{Number(product.average_rating || 0).toFixed(1)}</strong>
                  {product.review_count} reviews
                </span>
              ) : <span>No reviews yet</span>}
              {product.tags?.length ? product.tags.slice(0, 4).map((tag) => (
                <span key={tag} className="rounded-full border border-white/10 px-3 py-1.5">{tag}</span>
              )) : null}
            </div>
          </section>

          <aside className="space-y-5">
            <div className="border-t border-white/15 pt-5">
              <p className="text-[10px] font-bold uppercase tracking-[.2em] text-white/40">Availability</p>
              <p className="mt-2 text-lg font-medium text-white">{inStock ? 'Ready to order' : 'Currently unavailable'}</p>
              <p className="mt-1 text-sm leading-6 text-white/45">Delivery options, pickup availability and applicable fees are confirmed at checkout before payment.</p>
            </div>
            {product.store_name && (
              <div className="border-t border-white/15 pt-5">
                <p className="text-[10px] font-bold uppercase tracking-[.2em] text-white/40">Sold by</p>
                <div className="mt-3 flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#26382C] text-lg font-semibold text-[#B8D8C1]">
                    {product.store_name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-white">{product.store_name}</p>
                    <p className="mt-0.5 text-xs text-white/40">Kamba storefront</p>
                  </div>
                  <Link
                    href={`/marketplace/stores/${product.store_slug || product.store_id}`}
                    className="inline-flex h-10 items-center gap-2 rounded-full border border-white/15 px-4 text-xs font-semibold text-white transition hover:bg-white/10"
                  >
                    <Store className="h-3.5 w-3.5" /> Visit
                  </Link>
                </div>
              </div>
            )}
          </aside>
        </div>

        {product.videos && product.videos.length > 0 && (
          <section className="border-t border-white/10 py-10 sm:py-14">
            <div className="mb-6 flex items-end justify-between gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[.22em] text-[#A8C6AE]">Watch it</p>
                <h2 className="mt-2 text-2xl font-semibold text-white sm:text-3xl">Product in motion</h2>
              </div>
              <Play className="mb-1 h-5 w-5 text-white/40" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {product.videos.map((videoUrl) => (
                <video key={videoUrl} controls preload="metadata" playsInline className="w-full rounded-2xl border border-white/10 bg-black">
                  <source src={videoUrl} />
                  Your browser does not support embedded videos.
                </video>
              ))}
            </div>
          </section>
        )}

        <div className="flex flex-col items-start justify-between gap-4 border-t border-white/10 py-8 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-semibold text-white">Still looking?</p>
            <p className="mt-1 text-xs text-white/45">Explore more finds from Kamba sellers.</p>
          </div>
          <Link href="/marketplace/products" className="inline-flex h-11 items-center rounded-full border border-white/20 px-5 text-xs font-semibold uppercase tracking-[.12em] text-white transition hover:bg-white/10">
            Explore products <ChevronRight className="ml-2 h-4 w-4" />
          </Link>
        </div>
      </div>
    </main>
  )
}
