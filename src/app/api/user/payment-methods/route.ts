import { NextRequest, NextResponse } from 'next/server'

// In-memory payment methods storage (in production, use database)
const paymentsStore = new Map<string, any[]>()

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
    const methods = paymentsStore.get(userId) || []

    return NextResponse.json({ payment_methods: methods })
  } catch (error) {
    console.error('Payment methods GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch payment methods' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = getUserId(request)
    const body = await request.json()
    const { type, last4, brand, bank_name, account_name, is_default } = body

    if (!type) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const userMethods = paymentsStore.get(userId) || []

    // If this is default, unset other defaults
    if (is_default) {
      userMethods.forEach(method => { method.is_default = false })
    }

    const newMethod = {
      id: `pm-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      user_id: userId,
      type,
      last4: last4 || '',
      brand: brand || '',
      bank_name: bank_name || '',
      account_name: account_name || '',
      is_default: is_default || userMethods.length === 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    userMethods.push(newMethod)
    paymentsStore.set(userId, userMethods)

    return NextResponse.json({ payment_method: newMethod }, { status: 201 })
  } catch (error) {
    console.error('Payment methods POST error:', error)
    return NextResponse.json({ error: 'Failed to add payment method' }, { status: 500 })
  }
}