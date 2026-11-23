'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { apiJson } from '@/lib/api'
import type { Product } from '@/types/commerce'
import { formatKobo } from '@/lib/formatting'
import { useCart } from '@/hooks/useCart'
import { useToast } from '@/components/ui/toast'
import { ChevronLeft, ChevronRight, Heart, Share2, Truck, Shield, RotateCcw, Star } from 'lucide-react'

export default function ProductDetailPage() {
  const params = useParams()
  const id = params.id as string
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [selectedImage, setSelectedImage] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [addingToCart, setAddingToCart] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const { addItem } = useCart()
  const { addToast } = useToast()

  useEffect(() => {
    apiJson<Product & { product?: Product; original_price?: number; store_slug?: string; average_rating?: number; review_count?: number }>(`/commerce/products/${id}`)
      .then((data) => {
        const item = data.product || data
        setProduct({ ...item, image_url: item.image_url || item.images?.[0], compare_at_price: item.compare_at_price ?? item.original_price, store_slug: item.store_slug })
        setLoading(false)
        apiJson<{ items: Array<{ product_id: string }> }>('/marketplace/wishlist')
          .then((wishlist) => setIsSaved(wishlist.items.some((item) => item.product_id === id)))
          .catch(() => undefined)
      })
      .catch((err) => {
        setError(err.message || "Failed to load product")
        setLoading(false)
      })
  }, [id])

  const handleToggleWishlist = async () => {
    if (!product) return
    try {
      await apiJson(`/marketplace/wishlist/${product.id}`, { method: isSaved ? 'DELETE' : 'POST' })
      setIsSaved(!isSaved)
      addToast({ type: 'success', title: isSaved ? 'Removed from saved items' : 'Saved for later', message: isSaved ? 'This product was removed from your wishlist.' : 'This product is now in your wishlist.' })
    } catch (err) {
      addToast({ type: 'error', title: 'Could not update wishlist', message: err instanceof Error ? err.message : 'Sign in to save products.' })
    }
  }

  const handleShare = async () => {
    const url = window.location.href
    try {
      if (navigator.share) await navigator.share({ title: product?.name || 'Kamba product', url })
      else { await navigator.clipboard.writeText(url); addToast({ type: 'success', title: 'Link copied', message: 'Product link copied to clipboard.' }) }
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') addToast({ type: 'error', title: 'Could not share product', message: 'Copy the page link from your browser instead.' })
    }
  }

  const handleAddToCart = async () => {
    if (!product) return
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
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Failed to add to cart',
        message: 'Please try again.',
      })
    } finally {
      setAddingToCart(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 lg:py-12 space-y-8 animate-fade-in">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-pulse">
          <Card variant="elevated">
            <CardContent>
              <div className="w-full h-64 bg-ink-raised/50 rounded-xl" />
            </CardContent>
          </Card>
          <div className="space-y-6">
            <div className="h-10 w-1/2 bg-ink-raised/50 rounded-lg" />
            <div className="h-8 w-1/4 bg-ink-raised/50 rounded-lg" />
            <div className="h-20 bg-ink-raised/50 rounded-xl" />
            <div className="h-12 w-1/3 bg-ink-raised/50 rounded-lg" />
          </div>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-8 lg:py-12 flex h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-ink-raised/50 flex items-center justify-center mx-auto mb-4 text-text-tertiary">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-text-primary mb-2">Product not found</h2>
          <p className="text-text-tertiary">The product you're looking for doesn't exist or has been removed.</p>
          <Button variant="outline" className="mt-4" onClick={() => window.history.back()}>
            Back to products
          </Button>
        </div>
      </div>
    )
  }

  const images = product.images?.length ? product.images : product.image_url ? [product.image_url] : []
  const hasDiscount = product.compare_at_price && product.compare_at_price > product.price
  const discountPercent = hasDiscount ? Math.round(((product.compare_at_price! - product.price) / product.compare_at_price!) * 100) : 0

  return (
    <div className="container mx-auto px-4 py-8 lg:py-12 space-y-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-text-tertiary animate-fade-in">
        <Link href="/" className="hover:text-text-secondary">Home</Link>
        <ChevronRight className="w-4 h-4" />
        <Link href="/marketplace/products" className="hover:text-text-secondary">Products</Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-text-primary truncate max-w-[200px]">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-fade-in">
        {/* Image Gallery */}
        <Card variant="elevated" className="overflow-hidden">
          <CardContent className="p-0">
            <div className="relative aspect-[4/3] md:aspect-[3/4]">
              {images.length > 0 ? (
                <img
                  src={images[selectedImage]}
                  alt={product.name}
                  className="w-full h-full object-cover transition-opacity duration-300"
                />
              ) : (
                <div className="w-full h-full bg-ink-raised/50 flex items-center justify-center">
                  <svg className="w-16 h-16 text-text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              )}
              
              {/* Discount Badge */}
              {hasDiscount && (
                <div className="absolute top-4 left-4">
                  <Badge variant="destructive" size="md">
                    -{discountPercent}%
                  </Badge>
                </div>
              )}

              {/* Wishlist Button */}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute top-4 right-4 bg-surface/90 text-primary hover:bg-surface"
                aria-label={isSaved ? 'Remove from wishlist' : 'Save to wishlist'}
                aria-pressed={isSaved}
                onClick={handleToggleWishlist}
              >
                <Heart className={`h-5 w-5 ${isSaved ? 'fill-current' : ''}`} />
              </Button>

              {/* Image Navigation */}
              {images.length > 1 && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-ink/50 backdrop-blur-sm hover:bg-ink/70"
                    onClick={() => setSelectedImage((prev) => (prev === 0 ? images.length - 1 : prev - 1))}
                    aria-label="Previous image"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-ink/50 backdrop-blur-sm hover:bg-ink/70"
                    onClick={() => setSelectedImage((prev) => (prev === images.length - 1 ? 0 : prev + 1))}
                    aria-label="Next image"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </Button>
                </>
              )}
            </div>

            {/* Thumbnail Strip */}
            {images.length > 1 && (
              <div className="flex gap-2 p-4 overflow-x-auto">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                      idx === selectedImage ? 'border-coral' : 'border-transparent hover:border-border/50'
                    }`}
                    aria-label={`View image ${idx + 1}`}
                    aria-current={idx === selectedImage ? 'true' : 'false'}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Product Info */}
        <div className="space-y-6 animate-slide-up" style={{ animationDelay: '100ms' }}>
          {/* Store & Category Badges */}
          <div className="flex flex-wrap items-center gap-3">
            {product.store_name && (
              <Link href={`/marketplace/stores/${product.store_slug || product.store_id}`}>
                <Badge variant="secondary" size="sm" className="cursor-pointer hover:bg-coral-dim hover:text-coral transition-colors">
                  {product.store_name}
                </Badge>
              </Link>
            )}
            {product.category && (
              <Badge variant="outline" size="sm">
                {product.category}
              </Badge>
            )}
            {product.is_active && (product.in_stock ?? product.stock_quantity > 0) ? (
              <Badge variant="success" size="sm">In stock</Badge>
            ) : (
              <Badge variant="outline" size="sm">Out of stock</Badge>
            )}
          </div>

          {/* Title & Rating */}
          <div>
            <h1 className="text-3xl lg:text-4xl font-bold font-display text-text-primary">{product.name}</h1>
            <div className="flex items-center gap-4 mt-3">
              {(product.review_count || 0) > 0 ? (
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-gold text-gold" />
                  <span className="text-sm font-medium text-text-secondary">{Number(product.average_rating || 0).toFixed(1)}</span>
                  <span className="text-sm text-text-tertiary">({product.review_count} verified reviews)</span>
                </div>
              ) : <span className="text-sm text-text-tertiary">No reviews yet</span>}
              <Button type="button" variant="ghost" size="sm" className="text-text-tertiary hover:text-primary" onClick={handleShare}>
                <Share2 className="mr-1 h-4 w-4" /> Share
              </Button>
            </div>
          </div>

          {/* Price */}
          <div className="flex items-baseline gap-4 flex-wrap">
            <span className="text-3xl lg:text-4xl font-bold text-text-primary">{formatKobo(product.price)}</span>
            {hasDiscount && (
              <span className="text-xl text-text-tertiary line-through">{formatKobo(product.compare_at_price!)}</span>
            )}
            {hasDiscount && (
              <Badge variant="gold" size="md">
                Save {formatKobo(product.compare_at_price! - product.price)}
              </Badge>
            )}
          </div>

          {/* Description */}
          {product.description && (
            <Card variant="outlined">
              <CardHeader>
                <CardTitle className="text-lg">Description</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-text-secondary whitespace-pre-wrap">{product.description}</p>
              </CardContent>
            </Card>
          )}

          <p className="text-sm leading-6 text-text-secondary">Delivery options, pickup availability and any applicable fees are confirmed at checkout before you pay.</p>

          {/* Quantity Selector & Add to Cart */}
          <div className="space-y-4 pt-4 border-t border-ink-raised/30">
            <div>
              <label className="text-sm font-medium text-text-secondary mb-2 block">Quantity</label>
              <div className="flex items-center gap-3">
                <div className="flex items-center border border-border/50 rounded-lg overflow-hidden">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-11 w-11"
                    onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                    disabled={quantity <= 1}
                    aria-label="Decrease quantity"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                    </svg>
                  </Button>
                  <Input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-20 text-center border-0 bg-transparent focus:ring-0 h-11"
                    min={1}
                    max={product.stock_quantity || 99}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-11 w-11"
                    onClick={() => setQuantity((prev) => Math.min(product.stock_quantity || 99, prev + 1))}
                    disabled={quantity >= (product.stock_quantity || 99)}
                    aria-label="Increase quantity"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </Button>
                </div>
                <span className="text-sm text-text-tertiary">
                  Available: {product.stock_quantity}
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                variant="default"
                size="lg"
                className="flex-1"
                onClick={handleAddToCart}
                disabled={addingToCart || product.stock_quantity <= 0 || !product.is_active}
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                {addingToCart ? 'Adding...' : 'Add to cart'}
              </Button>
              <Button type="button" variant="outline" size="lg" className="flex-1" onClick={handleToggleWishlist} aria-pressed={isSaved}>
                <Heart className={`mr-2 h-5 w-5 ${isSaved ? 'fill-current' : ''}`} />
                {isSaved ? 'Saved' : 'Save'}
              </Button>
            </div>
          </div>

          {/* Store Info */}
          {product.store_name && (
            <Card variant="outlined">
              <CardContent className="pt-0">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-coral-dim flex items-center justify-center">
                    <span className="text-xl font-bold font-display text-coral">
                      {product.store_name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-text-primary">{product.store_name}</p>
                    <p className="text-sm text-text-tertiary">Local Kamba storefront</p>
                  </div>
                  <Link href={`/marketplace/stores/${product.store_slug || product.store_id}`} className="ml-auto"><Button variant="ghost" size="sm">View store</Button></Link>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm animate-slide-up">
          {error}
        </div>
      )}
    </div>
  )
}
