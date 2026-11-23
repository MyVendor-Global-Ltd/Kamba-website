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
    const { order_ids, action } = body

    if (!order_ids || !Array.isArray(order_ids) || order_ids.length === 0) {
      return NextResponse.json({ error: 'Order IDs array is required' }, { status: 400 })
    }

    if (!action) {
      return NextResponse.json({ error: 'Action is required' }, { status: 400 })
    }

    const orders = ordersStore.get(userId) || []
    const validActions = ['confirm', 'process', 'ship', 'deliver', 'cancel']
    
    if (!validActions.includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    const actionToStatus: Record<string, string> = {
      confirm: 'confirmed',
      process: 'processing',
      ship: 'shipped',
      deliver: 'delivered',
      cancel: 'cancelled',
    }

    const targetStatus = actionToStatus[action]
    const validTransitions: Record<string, string[]> = {
      pending: ['confirmed', 'cancelled'],
      confirmed: ['processing', 'cancelled'],
      processing: ['shipped', 'cancelled'],
      shipped: ['delivered', 'cancelled'],
      delivered: [],
      cancelled: [],
    }

    const updatedOrders = []
    const errors = []

    for (const orderId of order_ids) {
      const orderIndex = orders.findIndex(o => o.id === orderId)
      
      if (orderIndex === -1) {
        errors.push({ order_id: orderId, error: 'Order not found' })
        continue
      }

      const currentStatus = orders[orderIndex].status.toLowerCase()
      if (!validTransitions[currentStatus]?.includes(targetStatus)) {
        errors.push({ order_id: orderId, error: `Cannot transition from ${currentStatus} to ${targetStatus}` })
        continue
      }

      orders[orderIndex] = {
        ...orders[orderIndex],
        status: targetStatus,
        updated_at: new Date().toISOString(),
      }
      updatedOrders.push(orders[orderIndex])
    }

    ordersStore.set(userId, orders)

    return NextResponse.json({ 
      updated: updatedOrders.length,
      orders: updatedOrders,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (error) {
    console.error('Bulk orders POST error:', error)
    return NextResponse.json({ error: 'Failed to process bulk action' }, { status: 500 })
  }
}