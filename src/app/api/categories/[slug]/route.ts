import { NextRequest, NextResponse } from 'next/server'
import { apiFetch } from '@/lib/api'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const searchParams = request.nextUrl.searchParams
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '12')
  const sort = searchParams.get('sort') || 'relevance'
  const minPrice = searchParams.get('min_price')
  const maxPrice = searchParams.get('max_price')
  const inStock = searchParams.get('in_stock')

  try {
    // Build query params for backend
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      sort,
      ...(minPrice && { min_price: minPrice }),
      ...(maxPrice && { max_price: maxPrice }),
      ...(inStock && { in_stock: inStock }),
    })

    // In a real implementation, this would call the backend category API
    const response = await apiFetch(`/categories/${slug}?${queryParams.toString()}`)
    const data = await response.json()

    return NextResponse.json(data)
  } catch (error) {
    console.error('Category API error:', error)

    // Fallback mock data for development
    const mockCategory = {
      id: '1',
      name: slug.charAt(0).toUpperCase() + slug.slice(1).replace(/-/g, ' '),
      slug,
      description: `Browse our collection of ${slug.replace(/-/g, ' ')} products, stores, and services.`,
      image_url: '/placeholder-category.jpg',
      parent_id: null,
    }

    const mockProducts = [
      { id: '1', name: 'Premium Wireless Headphones', price: 25000, compare_at_price: 35000, image_url: '/placeholder-product.jpg', store_name: 'Tech Store', in_stock: true, category: slug },
      { id: '2', name: 'Smart Watch Series 5', price: 45000, compare_at_price: 55000, image_url: '/placeholder-product.jpg', store_name: 'Gadget Hub', in_stock: true, category: slug },
      { id: '3', name: 'Bluetooth Speaker Pro', price: 18000, image_url: '/placeholder-product.jpg', store_name: 'Audio World', in_stock: true, category: slug },
      { id: '4', name: 'USB-C Hub 7-in-1', price: 12000, compare_at_price: 15000, image_url: '/placeholder-product.jpg', store_name: 'Tech Store', in_stock: true, category: slug },
      { id: '5', name: 'Mechanical Keyboard RGB', price: 35000, image_url: '/placeholder-product.jpg', store_name: 'Gadget Hub', in_stock: false, category: slug },
      { id: '6', name: 'Portable Power Bank 20000mAh', price: 15000, compare_at_price: 18000, image_url: '/placeholder-product.jpg', store_name: 'Power Solutions', in_stock: true, category: slug },
    ]

    const mockStores = [
      { id: '1', name: 'Tech Store Lagos', slug: 'tech-store-lagos', category: 'Electronics', city: 'Lagos', state: 'Lagos', logo_url: '/placeholder-store.jpg', verification_status: 'business', description: 'Your one-stop shop for all tech needs' },
      { id: '2', name: 'Gadget Hub', slug: 'gadget-hub', category: 'Electronics', city: 'Abuja', state: 'FCT', logo_url: '/placeholder-store.jpg', verification_status: 'nin', description: 'Latest gadgets at competitive prices' },
      { id: '3', name: 'Audio World', slug: 'audio-world', category: 'Electronics', city: 'Lagos', state: 'Lagos', logo_url: '/placeholder-store.jpg', verification_status: 'business', description: 'Premium audio equipment' },
    ]

    const mockServices = [
      { id: '1', name: 'Device Repair Service', slug: 'device-repair', category: 'Repair', city: 'Lagos', state: 'Lagos', logo_url: '/placeholder-service.jpg', verification_status: 'business', description: 'Professional repair for phones, laptops, and tablets' },
      { id: '2', name: 'Tech Setup & Installation', slug: 'tech-setup', category: 'Installation', city: 'Abuja', state: 'FCT', logo_url: '/placeholder-service.jpg', verification_status: 'nin', description: 'Home and office tech installation services' },
    ]

    const mockSubcategories = [
      { id: '1', name: 'Smartphones', slug: 'smartphones' },
      { id: '2', name: 'Laptops', slug: 'laptops' },
      { id: '3', name: 'Accessories', slug: 'accessories' },
      { id: '4', name: 'Audio', slug: 'audio' },
    ]

    // Apply filters to mock data
    let filteredProducts = mockProducts
    if (minPrice) filteredProducts = filteredProducts.filter(p => p.price >= parseInt(minPrice))
    if (maxPrice) filteredProducts = filteredProducts.filter(p => p.price <= parseInt(maxPrice))
    if (inStock) filteredProducts = filteredProducts.filter(p => p.in_stock)
    if (sort === 'price_asc') filteredProducts.sort((a, b) => a.price - b.price)
    if (sort === 'price_desc') filteredProducts.sort((a, b) => b.price - a.price)
    if (sort === 'newest') filteredProducts.reverse()

    const start = (page - 1) * limit
    const end = start + limit
    const paginatedProducts = filteredProducts.slice(start, end)
    const totalPages = Math.ceil(filteredProducts.length / limit)

    return NextResponse.json({
      category: mockCategory,
      products: paginatedProducts,
      stores: mockStores,
      services: mockServices,
      subcategories: mockSubcategories,
      pagination: {
        page,
        pageSize: limit,
        total: filteredProducts.length,
        totalPages,
      },
    })
  }
}