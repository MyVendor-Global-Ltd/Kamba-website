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

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = getUserId(request)
    const { id } = await params
    const orders = ordersStore.get(userId) || []
    const orderIndex = orders.findIndex(o => o.id === id)

    if (orderIndex === -1) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    const order = orders[orderIndex]

    // Check if order can be returned
    if (order.status.toLowerCase() !== 'delivered' || order.delivery_status.toLowerCase() !== 'delivered') {
      return NextResponse.json({ error: 'Order cannot be returned at this time' }, { status: 400 })
    }

    // Update order status
    orders[orderIndex] = {
      ...order,
      status: 'return_requested',
      updated_at: new Date().toISOString(),
    }
    ordersStore.set(userId, orders)

    return NextResponse.json({
      order: orders[orderIndex],
      message: 'Return request submitted successfully',
    })
  } catch (error) {
    console.error('Return POST error:', error)
    return NextResponse.json({ error: 'Failed to request return' }, { status: 500 })
  }
}