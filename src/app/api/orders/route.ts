import { NextRequest, NextResponse } from 'next/server'
import { apiJson } from '@/lib/api'

// In-memory orders storage (in production, use database)
const ordersStore = new Map<string, any[]>()

function getUserId(request: NextRequest): string {
  // In production, extract from auth token/session
  const authHeader = request.headers.get('authorization')
  if (authHeader) {
    return authHeader.replace('Bearer ', '')
  }
  // Fallback to session/cookie
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
      user_id: userId,
      items: items.map(item => ({
        product_id: item.product_id,
        quantity: item.quantity,
        price_kobo: item.price_kobo,
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
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    // Store order
    const userOrders = ordersStore.get(userId) || []
    userOrders.unshift(order)
    ordersStore.set(userId, userOrders)

    // Clear cart after successful order
    // In production, this would be done via the cart API

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
    const orders = ordersStore.get(userId) || []

    return NextResponse.json({ orders })
  } catch (error) {
    console.error('Orders GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 })
  }
}