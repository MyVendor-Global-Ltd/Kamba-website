import { NextRequest, NextResponse } from 'next/server'
import { apiFetch } from '@/lib/api'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const query = searchParams.get('q')
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '12')

  if (!query || query.trim().length < 2) {
    return NextResponse.json({
      products: [],
      stores: [],
      services: [],
      total: 0,
    })
  }

  try {
    // In a real implementation, this would call the backend search API
    // For now, we'll search across products, stores, and services
    const [productsRes, storesRes, servicesRes] = await Promise.allSettled([
      apiFetch(`/products/search?q=${encodeURIComponent(query)}&page=${page}&limit=${limit}`),
      apiFetch(`/vendors/stores/search?q=${encodeURIComponent(query)}&page=${page}&limit=${limit}`),
      apiFetch(`/vendors/services/search?q=${encodeURIComponent(query)}&page=${page}&limit=${limit}`),
    ])

    const products = productsRes.status === 'fulfilled' ? (await productsRes.value.json()).products || [] : []
    const stores = storesRes.status === 'fulfilled' ? (await storesRes.value.json()).stores || [] : []
    const services = servicesRes.status === 'fulfilled' ? (await servicesRes.value.json()).services || [] : []

    const total = products.length + stores.length + services.length

    return NextResponse.json({
      products,
      stores,
      services,
      total,
    })
  } catch (error) {
    console.error('Search API error:', error)
    
    // Fallback mock data for development
    const mockProducts = [
      { id: '1', name: 'Wireless Headphones', price: 25000, compare_at_price: 35000, image_url: '/placeholder-product.jpg', store_name: 'Tech Store', in_stock: true },
      { id: '2', name: 'Smart Watch', price: 45000, compare_at_price: 55000, image_url: '/placeholder-product.jpg', store_name: 'Gadget Hub', in_stock: true },
      { id: '3', name: 'Bluetooth Speaker', price: 18000, image_url: '/placeholder-product.jpg', store_name: 'Audio World', in_stock: true },
    ].filter(p => p.name.toLowerCase().includes(query.toLowerCase()))

    const mockStores = [
      { id: '1', name: 'Tech Store Lagos', slug: 'tech-store-lagos', category: 'Electronics', city: 'Lagos', state: 'Lagos', logo_url: '/placeholder-store.jpg', verification_status: 'business' },
      { id: '2', name: 'Fashion Hub', slug: 'fashion-hub', category: 'Fashion', city: 'Abuja', state: 'FCT', logo_url: '/placeholder-store.jpg', verification_status: 'nin' },
    ].filter(s => s.name.toLowerCase().includes(query.toLowerCase()) || s.category?.toLowerCase().includes(query.toLowerCase()))

    const mockServices = [
      { id: '1', name: 'Home Cleaning Service', slug: 'home-cleaning', category: 'Cleaning', city: 'Lagos', state: 'Lagos', logo_url: '/placeholder-service.jpg', verification_status: 'business' },
      { id: '2', name: 'Plumbing Repair', slug: 'plumbing-repair', category: 'Plumbing', city: 'Lagos', state: 'Lagos', logo_url: '/placeholder-service.jpg', verification_status: 'nin' },
    ].filter(s => s.name.toLowerCase().includes(query.toLowerCase()) || s.category?.toLowerCase().includes(query.toLowerCase()))

    return NextResponse.json({
      products: mockProducts,
      stores: mockStores,
      services: mockServices,
      total: mockProducts.length + mockStores.length + mockServices.length,
    })
  }
}