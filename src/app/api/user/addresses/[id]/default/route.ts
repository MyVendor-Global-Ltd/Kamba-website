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

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = getUserId(request)
    const { id } = await params
    const userAddresses = addressesStore.get(userId) || []
    const address = userAddresses.find(addr => addr.id === id)

    if (!address) {
      return NextResponse.json({ error: 'Address not found' }, { status: 404 })
    }

    // Unset all defaults
    userAddresses.forEach(addr => { addr.is_default = false })
    // Set this one as default
    address.is_default = true
    address.updated_at = new Date().toISOString()

    addressesStore.set(userId, userAddresses)

    return NextResponse.json({ address })
  } catch (error) {
    console.error('Address default POST error:', error)
    return NextResponse.json({ error: 'Failed to set default address' }, { status: 500 })
  }
}