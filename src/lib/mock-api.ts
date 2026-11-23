import type { Product } from '@/types/commerce'
import type { Store, ServiceProfile } from '@/types/vendor'

export const isMockMode = process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_KAMBA_MOCK_MODE === 'true'

export const mockProducts: Product[] = [
  { id: 'prd-001', name: 'Wireless Headphones', description: 'Comfortable everyday headphones with clear sound and long battery life.', price: 2850000, stock_quantity: 18, category: 'Electronics', image_url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop', store_id: 'store-techhub', store_name: 'TechHub Electronics', is_active: true, in_stock: true, created_at: '2026-10-12T09:00:00.000Z', updated_at: '2026-11-10T09:00:00.000Z' },
  { id: 'prd-002', name: 'Leather Crossbody Bag', description: 'Locally finished crossbody bag for work and everyday use.', price: 4200000, stock_quantity: 7, category: 'Fashion', image_url: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800&auto=format&fit=crop', store_id: 'store-stylecraft', store_name: 'StyleCraft', is_active: true, in_stock: true, created_at: '2026-10-20T09:00:00.000Z', updated_at: '2026-11-12T09:00:00.000Z' },
  { id: 'prd-003', name: 'Insulated Water Bottle', description: 'Reusable stainless-steel bottle for campus, work and travel.', price: 950000, stock_quantity: 31, category: 'Home & Living', image_url: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=800&auto=format&fit=crop', store_id: 'store-techhub', store_name: 'TechHub Electronics', is_active: true, in_stock: true, created_at: '2026-10-25T09:00:00.000Z', updated_at: '2026-11-08T09:00:00.000Z' },
  { id: 'prd-004', name: 'African Print Notebook Set', description: 'Three notebooks with locally inspired fabric covers.', price: 1250000, stock_quantity: 0, category: 'Books & Stationery', image_url: 'https://images.unsplash.com/photo-1531346878377-a5be20888e57?w=800&auto=format&fit=crop', store_id: 'store-paperhouse', store_name: 'Paper House', is_active: true, in_stock: false, created_at: '2026-10-28T09:00:00.000Z', updated_at: '2026-11-14T09:00:00.000Z' },
  { id: 'prd-005', name: 'Minimal Desk Lamp', description: 'Compact warm-light desk lamp for study spaces.', price: 3600000, stock_quantity: 12, category: 'Home & Living', image_url: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800&auto=format&fit=crop', store_id: 'store-homefound', store_name: 'Home Found', is_active: true, in_stock: true, created_at: '2026-11-01T09:00:00.000Z', updated_at: '2026-11-13T09:00:00.000Z' },
  { id: 'prd-006', name: 'Everyday Leather Wallet', description: 'Slim handcrafted wallet with multiple card slots.', price: 1850000, stock_quantity: 24, category: 'Fashion', image_url: 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=800&auto=format&fit=crop', store_id: 'store-stylecraft', store_name: 'StyleCraft', is_active: true, in_stock: true, created_at: '2026-11-03T09:00:00.000Z', updated_at: '2026-11-15T09:00:00.000Z' },
]

export const mockStores: Store[] = [
  { id: 'store-techhub', name: 'TechHub Electronics', slug: 'techhub-electronics', description: 'Everyday tech, accessories and practical gadgets.', city: 'Port Harcourt', state: 'Rivers', country: 'Nigeria', vendor_id: 'vendor-01', is_active: true, verification_status: 'pending', created_at: '2026-08-01T09:00:00.000Z', updated_at: '2026-11-12T09:00:00.000Z', category: 'Electronics' },
  { id: 'store-stylecraft', name: 'StyleCraft', slug: 'stylecraft', description: 'Locally made fashion pieces and accessories.', city: 'Port Harcourt', state: 'Rivers', country: 'Nigeria', vendor_id: 'vendor-02', is_active: true, verification_status: 'pending', created_at: '2026-08-04T09:00:00.000Z', updated_at: '2026-11-10T09:00:00.000Z', category: 'Fashion' },
  { id: 'store-paperhouse', name: 'Paper House', slug: 'paper-house', description: 'Stationery and thoughtful gifts for study and work.', city: 'Obio/Akpor', state: 'Rivers', country: 'Nigeria', vendor_id: 'vendor-03', is_active: true, verification_status: 'pending', created_at: '2026-08-09T09:00:00.000Z', updated_at: '2026-11-08T09:00:00.000Z', category: 'Books & Stationery' },
  { id: 'store-homefound', name: 'Home Found', slug: 'home-found', description: 'Useful home and study essentials.', city: 'Port Harcourt', state: 'Rivers', country: 'Nigeria', vendor_id: 'vendor-04', is_active: true, verification_status: 'pending', created_at: '2026-08-12T09:00:00.000Z', updated_at: '2026-11-13T09:00:00.000Z', category: 'Home & Living' },
]

export const mockServices: ServiceProfile[] = [
  { id: 'svc-001', name: 'Home Cleaning', slug: 'bright-home-cleaning', description: 'One-off and recurring home cleaning with clear quotes before booking.', category: 'Cleaning', city: 'Port Harcourt', state: 'Rivers', country: 'Nigeria', vendor_id: 'service-01', is_active: true, verification_status: 'pending', created_at: '2026-09-01T09:00:00.000Z', updated_at: '2026-11-10T09:00:00.000Z' },
  { id: 'svc-002', name: 'Phone & Laptop Repairs', slug: 'fixpoint-repairs', description: 'Diagnostics and repairs for common phone and laptop issues.', category: 'Repairs', city: 'Port Harcourt', state: 'Rivers', country: 'Nigeria', vendor_id: 'service-02', is_active: true, verification_status: 'pending', created_at: '2026-09-05T09:00:00.000Z', updated_at: '2026-11-11T09:00:00.000Z' },
  { id: 'svc-003', name: 'Event Photography', slug: 'frame-by-frame', description: 'Portraits, small events and product photography. Request a quote.', category: 'Photography', city: 'Obio/Akpor', state: 'Rivers', country: 'Nigeria', vendor_id: 'service-03', is_active: true, verification_status: 'pending', created_at: '2026-09-12T09:00:00.000Z', updated_at: '2026-11-09T09:00:00.000Z' },
]

export const mockCategories = ['Electronics', 'Fashion', 'Home & Living', 'Books & Stationery']

export function submitMockVendorApplication(data: Record<string, string>) {
  if (typeof window !== 'undefined') window.localStorage.setItem('kamba_demo_vendor_application', JSON.stringify({ ...data, status: 'prototype_received', submitted_at: new Date().toISOString() }))
  return { success: true, prototype: true, status: 'prototype_received' }
}

type MockCartItem = { id: string; product_id: string; quantity: number; name: string; price_kobo: number; image_url?: string; store_id: string; store_name?: string }
type MockCart = { items: MockCartItem[]; subtotal: number; platform_fee: number; delivery_fee: number; total: number; itemCount: number }
const emptyCart = (): MockCart => ({ items: [], subtotal: 0, platform_fee: 0, delivery_fee: 0, total: 0, itemCount: 0 })
let cart: MockCart = emptyCart()
let cartHydrated = false
function hydrateCart() {
  if (cartHydrated || typeof window === 'undefined') return
  cartHydrated = true
  try {
    const stored = window.localStorage.getItem('kamba_cart')
    if (stored) {
      const parsed = JSON.parse(stored) as Partial<MockCart>
      if (Array.isArray(parsed.items)) cart = totals(parsed.items as MockCartItem[])
    }
  } catch { /* Ignore invalid local prototype data. */ }
}
const wishlist = new Set<string>()
const orders: Record<string, any> = {}
let ordersHydrated = false
function hydrateOrders() {
  if (ordersHydrated || typeof window === 'undefined') return
  ordersHydrated = true
  try { Object.assign(orders, JSON.parse(window.localStorage.getItem('kamba_demo_orders') || '{}')) } catch { /* Ignore invalid demo data. */ }
}
function persistOrders() { if (typeof window !== 'undefined') window.localStorage.setItem('kamba_demo_orders', JSON.stringify(orders)) }

function totals(items: MockCartItem[]): MockCart {
  const subtotal = items.reduce((sum, item) => sum + item.price_kobo * item.quantity, 0)
  const platform_fee = Math.round(subtotal * 0.05)
  const delivery_fee = 0
  return { items, subtotal, platform_fee, delivery_fee, total: subtotal + platform_fee + delivery_fee, itemCount: items.reduce((sum, item) => sum + item.quantity, 0) }
}
function response<T>(value: T): T { return JSON.parse(JSON.stringify(value)) as T }
function bodyOf(options: RequestInit): any {
  if (typeof options.body !== 'string') return {}
  try { return JSON.parse(options.body) } catch { return {} }
}

export async function mockApiJson<T>(path: string, options: RequestInit & { params?: Record<string, string | number | boolean | undefined> } = {}): Promise<T> {
  await Promise.resolve()
  const method = (options.method || 'GET').toUpperCase()
  hydrateCart()
  const url = new URL(path, 'http://kamba.local')
  Object.entries(options.params || {}).forEach(([key, value]) => { if (value !== undefined && value !== null) url.searchParams.set(key, String(value)) })
  const pathname = url.pathname
  const query = url.searchParams
  const body = bodyOf(options)

  if (pathname === '/auth/dashboard' && method === 'GET') {
    let user = null
    if (typeof window !== 'undefined') {
      try { user = JSON.parse(window.localStorage.getItem('kamba_demo_user') || 'null') } catch { user = null }
    }
    if (!user) throw new Error('Sign in to view your development account.')
    return response({ user, cartCount: cart.itemCount, prototype: true }) as T
  }
  if (pathname === '/auth/profile' && method === 'PATCH') {
    if (typeof window === 'undefined') throw new Error('Profile editing requires a browser session.')
    let user: any = null
    try { user = JSON.parse(window.localStorage.getItem('kamba_demo_user') || 'null') } catch { user = null }
    if (!user) throw new Error('Sign in to edit your development profile.')
    user = { ...user, display_name: body.displayName, username: body.username, phone: body.phone, email: body.email, updated_at: new Date().toISOString() }
    window.localStorage.setItem('kamba_demo_user', JSON.stringify(user))
    return response({ success: true, user, prototype: true }) as T
  }
  if (pathname === '/vendors/stores') return response({ stores: mockStores }) as T
  if (pathname === '/marketplace/wishlist' && method === 'GET') return response({ items: [...wishlist] }) as T
  const wishlistMatch = pathname.match(/^\\/marketplace\\/wishlist\\/([^/]+)$/)
  if (wishlistMatch && method === 'POST') { wishlist.add(wishlistMatch[1]); return response({ saved: true, product_id: wishlistMatch[1] }) as T }
  if (wishlistMatch && method === 'DELETE') { wishlist.delete(wishlistMatch[1]); return response({ removed: true, product_id: wishlistMatch[1] }) as T }
  const storeMatch = pathname.match(/^\/vendors\/stores\/([^/]+)$/)
  if (storeMatch) { const store = mockStores.find(s => s.slug === storeMatch[1]); return response({ store: store || null, products: mockProducts.filter(p => p.store_id === store?.id) }) as T }
  const storeProductsMatch = pathname.match(/^\/commerce\/stores\/([^/]+)\/products$/)
  if (storeProductsMatch) { const store = mockStores.find(s => s.slug === storeProductsMatch[1]); return response({ products: mockProducts.filter(p => p.store_id === store?.id) }) as T }
  if (pathname === '/vendors/services') {
    const q = (query.get('search') || '').toLowerCase()
    const category = (query.get('category') || '').toLowerCase()
    const location = (query.get('location') || '').toLowerCase()
    const rows = mockServices.filter((service) =>
      (!q || `${service.name} ${service.description} ${service.category}`.toLowerCase().includes(q)) &&
      (!category || service.category?.toLowerCase() === category) &&
      (!location || `${service.city} ${service.state}`.toLowerCase().includes(location))
    ).sort((a, b) => b.created_at.localeCompare(a.created_at))
    const page = Math.max(1, Number(query.get('page') || 1))
    const limit = Math.max(1, Math.min(100, Number(query.get('limit') || 20)))
    const offset = (page - 1) * limit
    return response({ services: rows.slice(offset, offset + limit), page, limit, count: rows.length, has_more: offset + limit < rows.length }) as T
  }
  if (pathname === '/marketplace/categories') {
    const categories = mockCategories.map((category) => ({
      category,
      product_count: mockProducts.filter((product) => product.category === category && product.stock_quantity > 0).length,
    }))
    return response({ categories }) as T
  }
  if (pathname === '/search') {
    const q = (query.get('q') || '').toLowerCase()
    const products = mockProducts.filter(p => p.is_active && `${p.name} ${p.description} ${p.store_name} ${p.category}`.toLowerCase().includes(q))
    const stores = mockStores.filter(s => `${s.name} ${s.description} ${s.city} ${s.category}`.toLowerCase().includes(q))
    const services = mockServices.filter(s => `${s.name} ${s.description} ${s.city} ${s.category}`.toLowerCase().includes(q))
    return response({ products, stores, services, total: products.length + stores.length + services.length }) as T
  }

  const productMatch = pathname.match(/^\/commerce\/products\/([^/]+)$/)
  if (productMatch) { const product = mockProducts.find(p => p.id === productMatch[1]); if (!product) throw new Error('Product not found in the prototype catalogue.'); return response({ product }) as T }
  if (pathname === '/commerce/products') {
    const q = (query.get('search') || '').toLowerCase()
    const category = (query.get('category') || '').toLowerCase()
    const location = (query.get('location') || '').toLowerCase()
    const min = query.get('min_price') ? Number(query.get('min_price')) : 0
    const max = query.get('max_price') ? Number(query.get('max_price')) : Number.MAX_SAFE_INTEGER
    const stockStatus = query.get('stock_status') || 'in_stock'
    const rows = mockProducts.filter((product) => {
      const store = mockStores.find((candidate) => candidate.id === product.store_id)
      const matchesStock = stockStatus === 'all' || (stockStatus === 'in_stock' ? product.stock_quantity > 0 : product.stock_quantity <= 0)
      return product.is_active &&
        (!q || `${product.name} ${product.description} ${product.store_name} ${(product as Product & { tags?: string[] }).tags?.join(' ') || ''}`.toLowerCase().includes(q)) &&
        (!category || product.category?.toLowerCase() === category) &&
        (!location || `${store?.city || ''} ${store?.state || ''}`.toLowerCase().includes(location)) &&
        product.price >= min && product.price <= max && matchesStock
    })
    const sort = query.get('sort') || 'newest'
    if (sort === 'price_asc') rows.sort((a, b) => a.price - b.price)
    else if (sort === 'price_desc') rows.sort((a, b) => b.price - a.price)
    else if (sort === 'popular') rows.sort((a, b) => (Number((b as any).view_count) || 0) - (Number((a as any).view_count) || 0))
    else rows.sort((a, b) => b.created_at.localeCompare(a.created_at))
    const limit = Math.max(1, Math.min(100, Number(query.get('limit') || 24)))
    const offset = Math.max(0, Number(query.get('offset') || 0))
    return response({
      products: rows.slice(offset, offset + limit).map((product) => ({ ...product, images: product.images || (product.image_url ? [product.image_url] : []), original_price: product.compare_at_price })),
      limit,
      offset,
      total_count: rows.length,
      has_more: offset + limit < rows.length,
    }) as T
  }
  const cartItemMatch = pathname.match(/^\/commerce\/cart\/items\/([^/]+)$/)
  if (pathname === '/api/cart' || pathname === '/commerce/cart' || pathname === '/commerce/cart/items' || cartItemMatch) {
    if (method === 'GET') return response(cart) as T
    if (method === 'POST') {
      const product = mockProducts.find(p => p.id === body.product_id)
      if (!product) throw new Error('This product is not available in the prototype catalogue.')
      const existing = cart.items.find(i => i.product_id === product.id)
      const next = existing
        ? cart.items.map(i => i.product_id === product.id ? { ...i, quantity: i.quantity + Number(body.quantity || 1) } : i)
        : [...cart.items, { id: `cart-${product.id}`, product_id: product.id, quantity: Number(body.quantity || 1), name: product.name, price_kobo: product.price, image_url: product.image_url, store_id: product.store_id, store_name: product.store_name }]
      cart = totals(next); if (typeof window !== 'undefined') window.localStorage.setItem('kamba_cart', JSON.stringify(cart)); return response(cart) as T
    }
    if (method === 'PUT') {
      const productId = cartItemMatch?.[1] || body.product_id
      cart = totals(cart.items.map(i => i.product_id === productId ? { ...i, quantity: Math.max(1, Number(body.quantity || 1)) } : i))
      if (typeof window !== 'undefined') window.localStorage.setItem('kamba_cart', JSON.stringify(cart))
      return response(cart) as T
    }
    if (method === 'DELETE') {
      const productId = cartItemMatch?.[1] || body.product_id
      cart = totals(productId ? cart.items.filter(i => i.product_id !== productId) : [])
      if (typeof window !== 'undefined') window.localStorage.setItem('kamba_cart', JSON.stringify(cart))
      return response(cart) as T
    }
  }
  if ((pathname === '/api/orders' || pathname === '/commerce/checkout') && method === 'POST') {
    if (!cart.items.length) throw new Error('Add an item to your cart before checkout.')
    const id = `demo-order-${Object.keys(orders).length + 1}`
    const order = { id, order_number: `KMB-DEMO-${String(Object.keys(orders).length + 1).padStart(4,'0')}`, status: 'pending', payment_status: 'pending', delivery_status: 'pending', delivery_type: body.delivery_type || 'delivery', subtotal: cart.subtotal, platform_fee: cart.platform_fee, delivery_fee: cart.delivery_fee, total: cart.total, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), shipping_address: body.delivery_address ? { address: body.delivery_address.address_line, city: body.delivery_address.city, state: body.delivery_address.state } : { address: 'Vendor pickup', city: '', state: '' }, payment_method: 'not-selected', customer: { name: 'Demo Buyer', email: 'buyer@kamba.demo' }, items: cart.items.map((i,index) => ({ id: `item-${index+1}`, product_id: i.product_id, product_name: i.name, quantity: i.quantity, price: i.price_kobo, image_url: i.image_url })) }
    orders[id] = order; persistOrders(); cart = emptyCart(); if (typeof window !== 'undefined') window.localStorage.setItem('kamba_cart', JSON.stringify(cart))
    return response({ order }) as T
  }
  if ((pathname === '/api/orders' || pathname === '/commerce/orders') && method === 'GET') return response({ orders: Object.values(orders), pagination: { page: 1, limit: Object.keys(orders).length, total: Object.keys(orders).length, totalPages: 1 } }) as T
  const orderMatch = pathname.match(/^\/(?:api\/orders|commerce\/orders)\/([^/]+)$/)
  if (orderMatch && method === 'GET') {
    const order = orders[orderMatch[1]]
    if (!order) throw new Error('Order not found in the prototype session.')
    return response({ order }) as T
  }
  if ((pathname === '/vendors/orders' || pathname === '/commerce/vendor/orders') && method === 'GET') return response({ orders: Object.values(orders) }) as T
  const vendorOrderMatch = pathname.match(/^\/(?:vendors\/orders\/([^/]+)\/status|commerce\/vendor\/orders\/([^/]+))$/)
  if (vendorOrderMatch && method === 'PATCH') {
    const order = orders[vendorOrderMatch[1] || vendorOrderMatch[2]]
    if (!order) throw new Error('Order not found in the prototype session.')
    order.status = body.status; order.updated_at = new Date().toISOString(); persistOrders()
    return response({ order }) as T
  }
  throw new Error(`Prototype service has no fixture for ${method} ${pathname}. This action is not available in mock mode yet.`)
}
