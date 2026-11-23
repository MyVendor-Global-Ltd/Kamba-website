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

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = getUserId(request)
    const { id } = await params
    const body = await request.json()
    const { status } = body

    if (!status) {
      return NextResponse.json({ error: 'Status is required' }, { status: 400 })
    }

    const orders = ordersStore.get(userId) || []
    const orderIndex = orders.findIndex(o => o.id === id)

    if (orderIndex === -1) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Validate status transition
    const validTransitions: Record<string, string[]> = {
      pending: ['confirmed', 'cancelled'],
      confirmed: ['processing', 'cancelled'],
      processing: ['shipped', 'cancelled'],
      shipped: ['delivered', 'cancelled'],
      delivered: [],
      cancelled: [],
      return_requested: [],
    }

    const currentStatus = orders[orderIndex].status.toLowerCase()
    if (!validTransitions[currentStatus]?.includes(status.toLowerCase())) {
      return NextResponse.json({ error: `Cannot transition from ${currentStatus} to ${status}` }, { status: 400 })
    }

    orders[orderIndex] = {
      ...orders[orderIndex],
      status: status.toLowerCase(),
      updated_at: new Date().toISOString(),
    }
    ordersStore.set(userId, orders)

    return NextResponse.json({ order: orders[orderIndex] })
  } catch (error) {
    console.error('Order status PATCH error:', error)
    return NextResponse.json({ error: 'Failed to update order status' }, { status: 500 })
  }
}