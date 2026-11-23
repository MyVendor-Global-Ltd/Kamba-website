import { NextRequest, NextResponse } from 'next/server'

// In-memory orders storage (in production, use database)
const ordersStore = new Map<string, any[]>()

function getUserId(request: NextRequest): string {
  const authHeader = request.headers.get('authorization')
  if (authHeader) {
    return authHeader.replace('Bearer ', '')
  }
  const sessionId = request.headers.get('x-session-id') || 
                    request.headers.get('cookie')?.match(/session=([^;]+)/)?.[1] ||
                    'anonymous'
  return sessionId
}

export async function POST(request: NextRequest) {
  try {
    const userId = getUserId(request)
    const body = await request.json()
    const { items, shipping_address, payment_method } = body

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'No items in order' }, { status: 400 })
    }

    if (!shipping_address || !shipping_address.address || !shipping_address.city || !shipping_address.state) {
      return NextResponse.json({ error: 'Invalid shipping address' }, { status: 400 })
    }

    // Calculate totals
    const subtotal = items.reduce((sum, item) => sum + (item.price_kobo || 0) * (item.quantity || 1), 0)
    const platform_fee = Math.round(subtotal * 0.05)
    const delivery_fee = subtotal > 500000 ? 0 : 150000
    const total = subtotal + platform_fee + delivery_fee

    // Create order
    const orderId = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
    const order = {
      id: orderId,
      order_number: orderId.replace('ORD-', ''),
      user_id: userId,
      items: items.map(item => ({
        id: `${item.product_id}-${Date.now()}`,
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.price_kobo,
        name: item.name,
        image_url: item.image_url,
        store_id: item.store_id,
      })),
      shipping_address,
      payment_method,
      subtotal,
      platform_fee,
      delivery_fee,
      total,
      status: 'pending',
      payment_status: 'pending',
      delivery_status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    // Store order
    const userOrders = ordersStore.get(userId) || []
    userOrders.unshift(order)
    ordersStore.set(userId, userOrders)

    return NextResponse.json({
      order,
      message: 'Order placed successfully',
    }, { status: 201 })
  } catch (error) {
    console.error('Orders POST error:', error)
    return NextResponse.json({ error: 'Failed to place order' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const userId = getUserId(request)
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const status = searchParams.get('status')

    let orders = ordersStore.get(userId) || []

    // Filter by status if provided
    if (status && status !== 'all') {
      orders = orders.filter(order => order.status.toLowerCase() === status.toLowerCase())
    }

    // Sort by created_at descending (newest first)
    orders.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    // Pagination
    const total = orders.length
    const totalPages = Math.ceil(total / limit)
    const start = (page - 1) * limit
    const paginatedOrders = orders.slice(start, start + limit)

    return NextResponse.json({
      orders: paginatedOrders,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    })
  } catch (error) {
    console.error('Orders GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 })
  }
}