import { NextRequest, NextResponse } from 'next/server'

// In-memory addresses storage (in production, use database)
const addressesStore = new Map<string, any[]>()

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
    const addresses = addressesStore.get(userId) || []

    return NextResponse.json({ addresses })
  } catch (error) {
    console.error('Addresses GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch addresses' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = getUserId(request)
    const body = await request.json()
    const { label, address, city, state, postal_code, is_default } = body

    if (!label || !address || !city || !state) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const userAddresses = addressesStore.get(userId) || []

    // If this is default, unset other defaults
    if (is_default) {
      userAddresses.forEach(addr => { addr.is_default = false })
    }

    const newAddress = {
      id: `addr-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      user_id: userId,
      label,
      address,
      city,
      state,
      postal_code: postal_code || '',
      is_default: is_default || userAddresses.length === 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    userAddresses.push(newAddress)
    addressesStore.set(userId, userAddresses)

    return NextResponse.json({ address: newAddress }, { status: 201 })
  } catch (error) {
    console.error('Addresses POST error:', error)
    return NextResponse.json({ error: 'Failed to add address' }, { status: 500 })
  }
}