import type { Product } from '@/types/commerce'
import type { Store, ServiceProfile } from '@/types/vendor'

export const isMockMode = process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_KAMBA_MOCK_MODE === 'true'

function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const radians = (degrees: number) => degrees * Math.PI / 180
  const dLat = radians(lat2 - lat1)
  const dLng = radians(lng2 - lng1)
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(radians(lat1)) * Math.cos(radians(lat2)) * Math.sin(dLng / 2) ** 2
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export const mockProducts: Product[] = [
  { id: 'prd-001', name: 'Wireless Headphones', description: 'Comfortable everyday headphones with clear sound and long battery life.', price: 2850000, stock_quantity: 18, category: 'Electronics', image_url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop', store_id: 'store-techhub', store_name: 'TechHub Electronics', is_active: true, in_stock: true, created_at: '2026-10-12T09:00:00.000Z', updated_at: '2026-11-10T09:00:00.000Z' },
  { id: 'prd-002', name: 'Leather Crossbody Bag', description: 'Locally finished crossbody bag for work and everyday use.', price: 4200000, stock_quantity: 7, category: 'Fashion', image_url: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800&auto=format&fit=crop', store_id: 'store-stylecraft', store_name: 'StyleCraft', is_active: true, in_stock: true, created_at: '2026-10-20T09:00:00.000Z', updated_at: '2026-11-12T09:00:00.000Z' },
  { id: 'prd-003', name: 'Insulated Water Bottle', description: 'Reusable stainless-steel bottle for campus, work and travel.', price: 950000, stock_quantity: 31, category: 'Home & Living', image_url: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=800&auto=format&fit=crop', store_id: 'store-techhub', store_name: 'TechHub Electronics', is_active: true, in_stock: true, created_at: '2026-10-25T09:00:00.000Z', updated_at: '2026-11-08T09:00:00.000Z' },
  { id: 'prd-004', name: 'African Print Notebook Set', description: 'Three notebooks with locally inspired fabric covers.', price: 1250000, stock_quantity: 0, category: 'Books & Stationery', image_url: 'https://images.unsplash.com/photo-1531346878377-a5be20888e57?w=800&auto=format&fit=crop', store_id: 'store-paperhouse', store_name: 'Paper House', is_active: true, in_stock: false, created_at: '2026-10-28T09:00:00.000Z', updated_at: '2026-11-14T09:00:00.000Z' },
  { id: 'prd-005', name: 'Minimal Desk Lamp', description: 'Compact warm-light desk lamp for study spaces.', price: 3600000, stock_quantity: 12, category: 'Home & Living', image_url: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800&auto=format&fit=crop', store_id: 'store-homefound', store_name: 'Home Found', is_active: true, in_stock: true, created_at: '2026-11-01T09:00:00.000Z', updated_at: '2026-11-13T09:00:00.000Z' },
  { id: 'prd-006', name: 'Everyday Leather Wallet', description: 'Slim handcrafted wallet with multiple card slots.', price: 1850000, stock_quantity: 24, category: 'Fashion', image_url: 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=800&auto=format&fit=crop', store_id: 'store-stylecraft', store_name: 'StyleCraft', is_active: true, in_stock: true, created_at: '2026-11-03T09:00:00.000Z', updated_at: '2026-11-15T09:00:00.000Z' },
]

let productsHydrated = false
function hydrateProducts() {
  if (productsHydrated || typeof window === 'undefined') return
  productsHydrated = true
  try {
    const saved: unknown = JSON.parse(window.localStorage.getItem('kamba_demo_products') || 'null')
    if (Array.isArray(saved)) mockProducts.splice(0, mockProducts.length, ...(saved as Product[]))
  } catch { /* Keep the bundled prototype catalogue if storage is invalid. */ }
}
function persistProducts() {
  if (typeof window !== 'undefined') window.localStorage.setItem('kamba_demo_products', JSON.stringify(mockProducts))
}


export const mockStores: Store[] = [
  { id: 'store-techhub', name: 'TechHub Electronics', slug: 'techhub-electronics', description: 'Everyday tech, accessories and practical gadgets.', city: 'Port Harcourt', state: 'Rivers', country: 'Nigeria', latitude: 4.8156, longitude: 7.0498, vendor_id: 'vendor-01', is_active: true, verification_status: 'pending', created_at: '2026-08-01T09:00:00.000Z', updated_at: '2026-11-12T09:00:00.000Z', category: 'Electronics' },
  { id: 'store-stylecraft', name: 'StyleCraft', slug: 'stylecraft', description: 'Locally made fashion pieces and accessories.', city: 'Port Harcourt', state: 'Rivers', country: 'Nigeria', latitude: 4.8200, longitude: 7.0350, vendor_id: 'vendor-02', is_active: true, verification_status: 'pending', created_at: '2026-08-04T09:00:00.000Z', updated_at: '2026-11-10T09:00:00.000Z', category: 'Fashion' },
  { id: 'store-paperhouse', name: 'Paper House', slug: 'paper-house', description: 'Stationery and thoughtful gifts for study and work.', city: 'Obio/Akpor', state: 'Rivers', country: 'Nigeria', latitude: 4.8500, longitude: 7.0500, vendor_id: 'vendor-03', is_active: true, verification_status: 'pending', created_at: '2026-08-09T09:00:00.000Z', updated_at: '2026-11-08T09:00:00.000Z', category: 'Books & Stationery' },
  { id: 'store-homefound', name: 'Home Found', slug: 'home-found', description: 'Useful home and study essentials.', city: 'Port Harcourt', state: 'Rivers', country: 'Nigeria', latitude: 4.8100, longitude: 7.0600, vendor_id: 'vendor-04', is_active: true, verification_status: 'pending', created_at: '2026-08-12T09:00:00.000Z', updated_at: '2026-11-13T09:00:00.000Z', category: 'Home & Living' },
]

export const mockServices: ServiceProfile[] = [
  { id: 'svc-001', name: 'Home Cleaning', slug: 'bright-home-cleaning', description: 'One-off and recurring home cleaning with clear quotes before booking.', category: 'Cleaning', city: 'Port Harcourt', state: 'Rivers', country: 'Nigeria', latitude: 4.8156, longitude: 7.0498, vendor_id: 'service-01', is_active: true, verification_status: 'pending', created_at: '2026-09-01T09:00:00.000Z', updated_at: '2026-11-10T09:00:00.000Z' },
  { id: 'svc-002', name: 'Phone & Laptop Repairs', slug: 'fixpoint-repairs', description: 'Diagnostics and repairs for common phone and laptop issues.', category: 'Repairs', city: 'Port Harcourt', state: 'Rivers', country: 'Nigeria', latitude: 4.8200, longitude: 7.0350, vendor_id: 'service-02', is_active: true, verification_status: 'pending', created_at: '2026-09-05T09:00:00.000Z', updated_at: '2026-11-11T09:00:00.000Z' },
  { id: 'svc-003', name: 'Event Photography', slug: 'frame-by-frame', description: 'Portraits, small events and product photography. Request a quote.', category: 'Photography', city: 'Obio/Akpor', state: 'Rivers', country: 'Nigeria', latitude: 4.8500, longitude: 7.0500, vendor_id: 'service-03', is_active: true, verification_status: 'pending', created_at: '2026-09-12T09:00:00.000Z', updated_at: '2026-11-09T09:00:00.000Z' },
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
let wishlistHydrated = false
function hydrateWishlist() {
  if (wishlistHydrated || typeof window === 'undefined') return
  wishlistHydrated = true
  try { (JSON.parse(window.localStorage.getItem('kamba_demo_wishlist') || '[]') as string[]).forEach((id) => wishlist.add(id)) } catch { /* Ignore invalid prototype data. */ }
}
function persistWishlist() { if (typeof window !== 'undefined') window.localStorage.setItem('kamba_demo_wishlist', JSON.stringify([...wishlist])) }
type MockEntity = Record<string, unknown> & { id: string; status: string }
type MockUser = Record<string, unknown> & { id: string; email: string; role: string }

const serviceRequests: Record<string, MockEntity> = {}
let serviceRequestsHydrated = false
function hydrateServiceRequests() {
  if (serviceRequestsHydrated || typeof window === 'undefined') return
  serviceRequestsHydrated = true
  try { Object.assign(serviceRequests, JSON.parse(window.localStorage.getItem('kamba_demo_service_requests') || '{}')) } catch { /* Ignore invalid prototype data. */ }
}
function persistServiceRequests() { if (typeof window !== 'undefined') window.localStorage.setItem('kamba_demo_service_requests', JSON.stringify(serviceRequests)) }
const orders: Record<string, MockEntity> = {}
const marketplaceCheckouts: Record<string, MockEntity> = {}
let checkoutsHydrated = false
function hydrateCheckouts() {
  if (checkoutsHydrated || typeof window === 'undefined') return
  checkoutsHydrated = true
  try { Object.assign(marketplaceCheckouts, JSON.parse(window.localStorage.getItem('kamba_demo_checkouts') || '{}')) } catch { /* Ignore invalid prototype data. */ }
}
function persistCheckouts() { if (typeof window !== 'undefined') window.localStorage.setItem('kamba_demo_checkouts', JSON.stringify(marketplaceCheckouts)) }
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
function bodyOf(options: RequestInit): Record<string, unknown> {
  if (typeof options.body !== 'string') return {}
  try {
    const parsed: unknown = JSON.parse(options.body)
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed as Record<string, unknown> : {}
  } catch { return {} }
}
function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : null
}

export async function mockApiJson<T>(path: string, options: RequestInit & { params?: Record<string, string | number | boolean | undefined> } = {}): Promise<T> {
  await Promise.resolve()
  const method = (options.method || 'GET').toUpperCase()
  hydrateCart()
  hydrateWishlist()
  hydrateServiceRequests()
  hydrateCheckouts()
  hydrateOrders()
  const url = new URL(path, 'http://kamba.local')
  Object.entries(options.params || {}).forEach(([key, value]) => { if (value !== undefined && value !== null) url.searchParams.set(key, String(value)) })
  const pathname = url.pathname
  const query = url.searchParams
  const body = bodyOf(options)

  if (pathname === '/auth/dashboard' && method === 'GET') {
    let user = null
    if (typeof window !== 'undefined') {
      try { user = JSON.parse(window.localStorage.getItem('kamba_demo_user') || 'null') as MockUser | null } catch { user = null }
    }
    if (!user) throw new Error('Sign in to view your development account.')
    return response({ user, cartCount: cart.itemCount, prototype: true }) as T
  }
  if (pathname === '/auth/profile' && method === 'PATCH') {
    if (typeof window === 'undefined') throw new Error('Profile editing requires a browser session.')
    let user: MockUser | null = null
    try { user = JSON.parse(window.localStorage.getItem('kamba_demo_user') || 'null') } catch { user = null }
    if (!user) throw new Error('Sign in to edit your development profile.')
    user = { ...user, display_name: body.displayName, username: body.username, phone: body.phone, email: typeof body.email === 'string' ? body.email : user.email, updated_at: new Date().toISOString() }
    window.localStorage.setItem('kamba_demo_user', JSON.stringify(user))
    return response({ success: true, user, prototype: true }) as T
  }
  if (pathname === '/vendors/stores') return response({ stores: mockStores }) as T
  const publicServiceMatch = pathname.match(/^\/vendors\/services\/([^/]+)$/)
  if (publicServiceMatch && method === 'GET') {
    const service = mockServices.find((item) => item.slug === publicServiceMatch[1])
    return response({ service_profile: service || null }) as T
  }
  if (pathname === '/service-bookings/requests' && method === 'POST') {
    const id = `demo-service-request-${Object.keys(serviceRequests).length + 1}`
    const request: MockEntity = { id, ...body, status: 'requested', created_at: new Date().toISOString(), updated_at: new Date().toISOString(), prototype: true }
    serviceRequests[id] = request
    persistServiceRequests()
    return response({ request, idempotent: false }) as T
  }
  if (pathname === '/service-bookings/requests' && method === 'GET') return response({ requests: Object.values(serviceRequests) }) as T
  const serviceRequestMatch = pathname.match(/^\/service-bookings\/requests\/([^/]+)$/)
  if (serviceRequestMatch && method === 'GET') {
    const request = serviceRequests[serviceRequestMatch[1]]
    if (!request) throw new Error('Service request not found in the prototype session.')
    return response({ request }) as T
  }
  if (pathname === '/marketplace/wishlist' && method === 'GET') return response({ items: [...wishlist].map((product_id) => ({ product_id })) }) as T
  const wishlistMatch = pathname.match(/^\/marketplace\/wishlist\/([^/]+)$/)
  if (wishlistMatch && method === 'POST') { wishlist.add(wishlistMatch[1]); persistWishlist(); return response({ saved: true, product_id: wishlistMatch[1] }) as T }
  if (wishlistMatch && method === 'DELETE') { wishlist.delete(wishlistMatch[1]); persistWishlist(); return response({ removed: true, product_id: wishlistMatch[1] }) as T }
  const storeMatch = pathname.match(/^\/vendors\/stores\/([^/]+)$/)
  if (storeMatch) { const store = mockStores.find(s => s.slug === storeMatch[1]); return response({ store: store || null, products: mockProducts.filter(p => p.store_id === store?.id) }) as T }
  const storeProductsMatch = pathname.match(/^\/commerce\/stores\/([^/]+)\/products$/)
  if (storeProductsMatch) { const store = mockStores.find(s => s.slug === storeProductsMatch[1]); return response({ products: mockProducts.filter(p => p.store_id === store?.id) }) as T }
  if (pathname === '/vendors/services') {
    const q = (query.get('search') || '').toLowerCase()
    const category = (query.get('category') || '').toLowerCase()
    const location = (query.get('location') || '').toLowerCase()
    const lat = query.get('lat') === null ? null : Number(query.get('lat'))
    const lng = query.get('lng') === null ? null : Number(query.get('lng'))
    const radius = Number(query.get('radius') || 15)
    const rows = mockServices.filter((service) =>
      (!q || `${service.name} ${service.description} ${service.category}`.toLowerCase().includes(q)) &&
      (!category || service.category?.toLowerCase() === category) &&
      (!location || `${service.city} ${service.state}`.toLowerCase().includes(location)) &&
      (lat === null || lng === null || (service.latitude !== undefined && service.longitude !== undefined && distanceKm(lat, lng, service.latitude, service.longitude) <= radius))
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

  if (pathname === '/commerce/vendor/products' && method === 'GET') {
    return response({ products: mockProducts.filter((product) => product.store_id === mockStores[0]?.id), pagination: { page: 1, limit: 100, total: mockProducts.length } }) as T
  }
  if (pathname === '/commerce/vendor/products' && method === 'POST') {
    const store = mockStores[0]
    if (!store) throw new Error('Create a storefront before adding products.')
    if (typeof body.name !== 'string' || !body.name.trim() || typeof body.price !== 'number' || body.price <= 0) throw new Error('Product name and a valid price are required.')
    const product = {
      id: `demo-product-${Date.now()}`,
      name: body.name.trim(),
      description: typeof body.description === 'string' ? body.description : '',
      price: body.price,
      original_price: typeof body.original_price === 'number' ? body.original_price : null,
      stock_quantity: typeof body.stock_quantity === 'number' ? body.stock_quantity : 0,
      in_stock: typeof body.stock_quantity === 'number' && body.stock_quantity > 0,
      category: typeof body.category === 'string' ? body.category : '',
      tags: Array.isArray(body.tags) ? body.tags.filter((tag): tag is string => typeof tag === 'string') : [],
      images: Array.isArray(body.images) ? body.images.filter((image): image is string => typeof image === 'string') : [],
      is_available: body.is_available !== false,
      is_active: true,
      store_id: store.id,
      store_name: store.name,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      view_count: 0,
    } as Product
    mockProducts.unshift(product)
    persistProducts()
    return response({ product }) as T
  }
  const vendorProductMatch = pathname.match(/^\/commerce\/vendor\/products\/([^/]+)$/)
  if (vendorProductMatch && method === 'PATCH') {
    const product = mockProducts.find((item) => item.id === vendorProductMatch[1])
    if (!product) throw new Error('Product not found in the prototype catalogue.')
    Object.assign(product, body, { updated_at: new Date().toISOString() })
    if (typeof body.stock_quantity === 'number') product.in_stock = body.stock_quantity > 0
    persistProducts()
    return response({ product }) as T
  }
  if (vendorProductMatch && method === 'DELETE') {
    const product = mockProducts.find((item) => item.id === vendorProductMatch[1])
    if (!product) throw new Error('Product not found in the prototype catalogue.')
    product.is_active = false
    product.is_available = false
    persistProducts()
    return response({ product: { id: product.id, is_active: false } }) as T
  }
  const productMatch = pathname.match(/^\/commerce\/products\/([^/]+)$/)
  if (productMatch) { const product = mockProducts.find(p => p.id === productMatch[1]); if (!product) throw new Error('Product not found in the prototype catalogue.'); return response({ product: { ...product, store_slug: mockStores.find((store) => store.id === product.store_id)?.slug } }) as T }
  if (pathname === '/commerce/products') {
    const q = (query.get('search') || '').toLowerCase()
    const category = (query.get('category') || '').toLowerCase()
    const location = (query.get('location') || '').toLowerCase()
    const lat = query.get('lat') === null ? null : Number(query.get('lat'))
    const lng = query.get('lng') === null ? null : Number(query.get('lng'))
    const radius = Number(query.get('radius') || 15)
    const storeSlug = query.get('store') || ''
    const min = query.get('min_price') ? Number(query.get('min_price')) : 0
    const max = query.get('max_price') ? Number(query.get('max_price')) : Number.MAX_SAFE_INTEGER
    const stockStatus = query.get('stock_status') || 'in_stock'
    const rows = mockProducts.filter((product) => {
      const store = mockStores.find((candidate) => candidate.id === product.store_id)
      const matchesStock = stockStatus === 'all' || (stockStatus === 'in_stock' ? product.stock_quantity > 0 : product.stock_quantity <= 0)
      return product.is_active &&
        (!q || `${product.name} ${product.description} ${product.store_name} ${(product as Product & { tags?: string[] }).tags?.join(' ') || ''}`.toLowerCase().includes(q)) &&
        (!category || product.category?.toLowerCase() === category) &&
        (!storeSlug || store?.slug === storeSlug) &&
        (!location || `${store?.city || ''} ${store?.state || ''}`.toLowerCase().includes(location)) &&
        (lat === null || lng === null || (store?.latitude !== undefined && store.longitude !== undefined && distanceKm(lat, lng, store.latitude, store.longitude) <= radius)) &&
        product.price >= min && product.price <= max && matchesStock
    })
    const sort = query.get('sort') || 'newest'
    if (sort === 'price_asc') rows.sort((a, b) => a.price - b.price)
    else if (sort === 'price_desc') rows.sort((a, b) => b.price - a.price)
    else if (sort === 'popular') rows.sort((a, b) => (Number((b as Product & { view_count?: number }).view_count) || 0) - (Number((a as Product & { view_count?: number }).view_count) || 0))
    else rows.sort((a, b) => b.created_at.localeCompare(a.created_at))
    const limit = Math.max(1, Math.min(100, Number(query.get('limit') || 24)))
    const offset = Math.max(0, Number(query.get('offset') || 0))
    return response({
      products: rows.slice(offset, offset + limit).map((product) => ({ ...product, images: product.images || (product.image_url ? [product.image_url] : []), original_price: product.compare_at_price, store_slug: mockStores.find((store) => store.id === product.store_id)?.slug })),
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
  if (pathname === '/delivery/universities' && method === 'GET') return response({ universities: [] }) as T
  const universityZonesMatch = pathname.match(/^\/delivery\/universities\/([^/]+)\/zones$/)
  if (universityZonesMatch && method === 'GET') return response({ zones: [] }) as T
  if (pathname === '/delivery/quote' && method === 'POST') throw new Error('No delivery university or route pricing is configured in the development prototype. Choose pickup.')
  if (pathname === '/commerce/marketplace-checkouts' && method === 'POST') {
    if (!cart.items.length) throw new Error('Add an item to your cart before checkout.')
    const checkoutId = `demo-checkout-${Object.keys(marketplaceCheckouts).length + 1}`
    const deliveryType = typeof body.delivery_type === 'string' ? body.delivery_type : 'pickup'
    const deliveryAddress = asRecord(body.delivery_address)
    const storeGroups = new Map<string, MockCartItem[]>()
    for (const item of cart.items) {
      const group = storeGroups.get(item.store_id) || []
      group.push(item)
      storeGroups.set(item.store_id, group)
    }
    const childOrders = [...storeGroups.entries()].map(([storeId, items], index) => {
      const subtotal = items.reduce((sum, item) => sum + item.price_kobo * item.quantity, 0)
      const platform_fee = Math.round(subtotal * 0.05)
      const orderId = `demo-order-${Object.keys(orders).length + index + 1}`
      return {
        id: orderId,
        order_number: `KMB-DEMO-${String(Object.keys(orders).length + index + 1).padStart(4, '0')}`,
        status: 'pending',
        payment_status: 'pending',
        delivery_status: 'pending',
        delivery_type: deliveryType,
        subtotal,
        platform_fee,
        delivery_fee: 0,
        shipping_amount: 0,
        total: subtotal + platform_fee,
        store_id: storeId,
        store_name: items[0]?.store_name,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        shipping_address: deliveryAddress ? { address: String(deliveryAddress.address_line || ''), city: String(deliveryAddress.city || ''), state: String(deliveryAddress.state || '') } : { address: 'Vendor pickup', city: '', state: '' },
        payment_method: 'not-configured',
        customer: { name: 'Demo Buyer', email: 'buyer@kamba.demo' },
        items: items.map((item, itemIndex) => ({ id: `item-${index + 1}-${itemIndex + 1}`, product_id: item.product_id, product_name: item.name, quantity: item.quantity, price: item.price_kobo, image_url: item.image_url })),
      }
    })
    childOrders.forEach((order) => { orders[order.id] = order })
    const amount = childOrders.reduce((sum, order) => sum + order.total, 0)
    const checkout = { id: checkoutId, amount, currency: 'NGN', status: 'pending', delivery_type: deliveryType, created_at: new Date().toISOString(), prototype: true }
    marketplaceCheckouts[checkoutId] = { id: checkoutId, status: 'pending', checkout, orders: childOrders.map((order) => ({ order_id: order.id, store_id: order.store_id, store_name: order.store_name, order_status: order.status, payment_status: order.payment_status, subtotal: order.subtotal, platform_fee: order.platform_fee, shipping_amount: order.shipping_amount, total: order.total })) }
    persistOrders()
    persistCheckouts()
    cart = emptyCart()
    if (typeof window !== 'undefined') window.localStorage.setItem('kamba_cart', JSON.stringify(cart))
    return response({ checkout, orders: childOrders, idempotent: false, prototype: true }) as T
  }
  const marketplaceCheckoutMatch = pathname.match(/^\/commerce\/marketplace-checkouts\/([^/]+)$/)
  if (marketplaceCheckoutMatch && method === 'GET') {
    const data = marketplaceCheckouts[marketplaceCheckoutMatch[1]]
    if (!data) throw new Error('Checkout not found in the prototype session.')
    return response(data) as T
  }
  const marketplacePaymentMatch = pathname.match(/^\/commerce\/marketplace-checkouts\/([^/]+)\/payment$/)
  if (marketplacePaymentMatch && method === 'POST') {
    throw new Error('Payment collection is disabled in prototype mode. No money has been collected.')
  }
  if ((pathname === '/api/orders' || pathname === '/commerce/checkout') && method === 'POST') {
    if (!cart.items.length) throw new Error('Add an item to your cart before checkout.')
    const id = `demo-order-${Object.keys(orders).length + 1}`
    const deliveryAddress = asRecord(body.delivery_address)
    const order = { id, order_number: `KMB-DEMO-${String(Object.keys(orders).length + 1).padStart(4,'0')}`, status: 'pending', payment_status: 'pending', delivery_status: 'pending', delivery_type: typeof body.delivery_type === 'string' ? body.delivery_type : 'delivery', subtotal: cart.subtotal, platform_fee: cart.platform_fee, delivery_fee: cart.delivery_fee, total: cart.total, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), shipping_address: deliveryAddress ? { address: String(deliveryAddress.address_line || ''), city: String(deliveryAddress.city || ''), state: String(deliveryAddress.state || '') } : { address: 'Vendor pickup', city: '', state: '' }, payment_method: 'not-selected', customer: { name: 'Demo Buyer', email: 'buyer@kamba.demo' }, items: cart.items.map((i,index) => ({ id: `item-${index+1}`, product_id: i.product_id, product_name: i.name, quantity: i.quantity, price: i.price_kobo, image_url: i.image_url })) }
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
  if ((pathname === '/vendors/orders' || pathname === '/commerce/vendor/orders') && method === 'GET') return response({ orders: Object.values(orders).map((order) => ({ ...order, total_amount: Number(order.total || 0), item_count: Array.isArray(order.items) ? order.items.reduce((sum, item) => sum + Number((item as Record<string, unknown>).quantity || 0), 0) : 0 })) }) as T
  const vendorOrderMatch = pathname.match(/^\/(?:vendors\/orders\/([^/]+)\/status|commerce\/vendor\/orders\/([^/]+))$/)
  if (vendorOrderMatch && method === 'PATCH') {
    const order = orders[vendorOrderMatch[1] || vendorOrderMatch[2]]
    if (!order) throw new Error('Order not found in the prototype session.')
    order.status = typeof body.status === 'string' ? body.status : order.status; order.updated_at = new Date().toISOString(); persistOrders()
    return response({ order }) as T
  }
  throw new Error(`Prototype service has no fixture for ${method} ${pathname}. This action is not available in mock mode yet.`)
}
