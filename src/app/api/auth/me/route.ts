import { NextRequest, NextResponse } from 'next/server'

// In-memory user storage (in production, use database)
const usersStore = new Map<string, any>()

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
    let user = usersStore.get(userId)

    if (!user) {
      // Create default user
      user = {
        id: userId,
        email: 'user@example.com',
        phone: '+234 800 000 0000',
        first_name: 'John',
        last_name: 'Doe',
        username: 'johndoe',
        avatar_url: null,
        created_at: new Date().toISOString(),
      }
      usersStore.set(userId, user)
    }

    return NextResponse.json({ user })
  } catch (error) {
    console.error('Auth me GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const userId = getUserId(request)
    const body = await request.json()
    const { first_name, last_name, phone } = body

    let user = usersStore.get(userId)
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    user = {
      ...user,
      first_name: first_name || user.first_name,
      last_name: last_name || user.last_name,
      phone: phone || user.phone,
      updated_at: new Date().toISOString(),
    }
    usersStore.set(userId, user)

    return NextResponse.json({ user })
  } catch (error) {
    console.error('Auth me PATCH error:', error)
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
  }
}