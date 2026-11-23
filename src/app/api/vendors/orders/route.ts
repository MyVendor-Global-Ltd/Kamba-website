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

export async function GET(request: NextRequest) {
  try {
    const userId = getUserId(request)
    const orders = ordersStore.get(userId) || []

    // Transform orders for vendor view
    const vendorOrders = orders.map(order => ({
      ...order,
      customer: {
        name: 'John Doe',
        email: 'customer@example.com',
        phone: '+234 800 000 0000',
      },
    }))

    return NextResponse.json({ orders: vendorOrders })
  } catch (error) {
    console.error('Vendor orders GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 })
  }
}