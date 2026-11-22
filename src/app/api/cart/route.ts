import { NextRequest, NextResponse } from 'next/server'
import { apiJson } from '@/lib/api'

// In-memory cart storage (in production, use Redis or database)
const cartStore = new Map<string, any[]>()

function getCartKey(request: NextRequest): string {
  // Use session/cookie or IP for anonymous carts
  const sessionId = request.headers.get('x-session-id') || 
                    request.headers.get('cookie')?.match(/session=([^;]+)/)?.[1] ||
                    'anonymous'
  return sessionId
}

export async function GET(request: NextRequest) {
  try {
    const cartKey = getCartKey(request)
    const items = cartStore.get(cartKey) || []
    
    // Calculate totals
    const subtotal = items.reduce((sum, item) => sum + (item.price_kobo || 0) * (item.quantity || 1), 0)
    const platform_fee = Math.round(subtotal * 0.05) // 5% platform fee
    const delivery_fee = subtotal > 500000 ? 0 : 150000 // Free delivery over ₦5,000
    const total = subtotal + platform_fee + delivery_fee

    return NextResponse.json({
      items,
      subtotal,
      platform_fee,
      delivery_fee,
      total,
      itemCount: items.reduce((sum, item) => sum + (item.quantity || 1), 0),
    })
  } catch (error) {
    console.error('Cart GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch cart' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const cartKey = getCartKey(request)
    const body = await request.json()
    const { product_id, quantity = 1, name, price_kobo, image_url, store_id, store_name } = body

    if (!product_id || !name || !price_kobo) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const items = cartStore.get(cartKey) || []
    const existingIndex = items.findIndex(item => item.product_id === product_id)

    if (existingIndex >= 0) {
      items[existingIndex].quantity += quantity
    } else {
      items.push({
        id: `${product_id}-${Date.now()}`,
        product_id,
        quantity,
        name,
        price_kobo,
        image_url,
        store_id,
        store_name,
      })
    }

    cartStore.set(cartKey, items)

    const subtotal = items.reduce((sum, item) => sum + item.price_kobo * item.quantity, 0)
    const platform_fee = Math.round(subtotal * 0.05)
    const delivery_fee = subtotal > 500000 ? 0 : 150000
    const total = subtotal + platform_fee + delivery_fee

    return NextResponse.json({
      items,
      subtotal,
      platform_fee,
      delivery_fee,
      total,
      itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
    })
  } catch (error) {
    console.error('Cart POST error:', error)
    return NextResponse.json({ error: 'Failed to add to cart' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const cartKey = getCartKey(request)
    const body = await request.json()
    const { product_id, quantity } = body

    if (!product_id || quantity === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const items = cartStore.get(cartKey) || []
    const itemIndex = items.findIndex(item => item.product_id === product_id)

    if (itemIndex === -1) {
      return NextResponse.json({ error: 'Item not found in cart' }, { status: 404 })
    }

    if (quantity <= 0) {
      items.splice(itemIndex, 1)
    } else {
      items[itemIndex].quantity = quantity
    }

    cartStore.set(cartKey, items)

    const subtotal = items.reduce((sum, item) => sum + item.price_kobo * item.quantity, 0)
    const platform_fee = Math.round(subtotal * 0.05)
    const delivery_fee = subtotal > 500000 ? 0 : 150000
    const total = subtotal + platform_fee + delivery_fee

    return NextResponse.json({
      items,
      subtotal,
      platform_fee,
      delivery_fee,
      total,
      itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
    })
  } catch (error) {
    console.error('Cart PUT error:', error)
    return NextResponse.json({ error: 'Failed to update cart' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const cartKey = getCartKey(request)
    const { searchParams } = new URL(request.url)
    const productId = searchParams.get('product_id')

    if (productId) {
      // Remove specific item
      const items = cartStore.get(cartKey) || []
      const filteredItems = items.filter(item => item.product_id !== productId)
      cartStore.set(cartKey, filteredItems)
    } else {
      // Clear entire cart
      cartStore.delete(cartKey)
    }

    const items = cartStore.get(cartKey) || []
    const subtotal = items.reduce((sum, item) => sum + item.price_kobo * item.quantity, 0)
    const platform_fee = Math.round(subtotal * 0.05)
    const delivery_fee = subtotal > 500000 ? 0 : 150000
    const total = subtotal + platform_fee + delivery_fee

    return NextResponse.json({
      items,
      subtotal,
      platform_fee,
      delivery_fee,
      total,
      itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
    })
  } catch (error) {
    console.error('Cart DELETE error:', error)
    return NextResponse.json({ error: 'Failed to remove from cart' }, { status: 500 })
  }
}