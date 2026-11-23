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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = getUserId(request)
    const { id } = await params
    const userAddresses = addressesStore.get(userId) || []
    const index = userAddresses.findIndex(addr => addr.id === id)

    if (index === -1) {
      return NextResponse.json({ error: 'Address not found' }, { status: 404 })
    }

    userAddresses.splice(index, 1)
    addressesStore.set(userId, userAddresses)

    return NextResponse.json({ message: 'Address deleted' })
  } catch (error) {
    console.error('Address DELETE error:', error)
    return NextResponse.json({ error: 'Failed to delete address' }, { status: 500 })
  }
}