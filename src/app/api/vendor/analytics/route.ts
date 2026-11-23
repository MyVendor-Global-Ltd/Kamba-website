import { NextRequest, NextResponse } from 'next/server'

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
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || '30d'

    // In production, fetch from database with proper aggregation
    // For now, return mock data based on period
    
    const mockData = {
      revenue: {
        total: 1250000000,
        period: 320000000,
        previousPeriod: 280000000,
        change: 14.3,
        dailyData: [
          { date: '2024-01-01', revenue: 8500000, orders: 12 },
          { date: '2024-01-02', revenue: 12000000, orders: 18 },
          { date: '2024-01-03', revenue: 9200000, orders: 14 },
          { date: '2024-01-04', revenue: 15500000, orders: 22 },
          { date: '2024-01-05', revenue: 11800000, orders: 16 },
          { date: '2024-01-06', revenue: 18200000, orders: 25 },
          { date: '2024-01-07', revenue: 14500000, orders: 20 },
          { date: '2024-01-08', revenue: 16800000, orders: 23 },
          { date: '2024-01-09', revenue: 13200000, orders: 19 },
          { date: '2024-01-10', revenue: 19500000, orders: 27 },
          { date: '2024-01-11', revenue: 17200000, orders: 24 },
          { date: '2024-01-12', revenue: 21000000, orders: 29 },
          { date: '2024-01-13', revenue: 15800000, orders: 21 },
          { date: '2024-01-14', revenue: 22500000, orders: 31 },
          { date: '2024-01-15', revenue: 18900000, orders: 26 },
        ],
      },
      orders: {
        total: 1247,
        period: 89,
        pending: 12,
        confirmed: 15,
        processing: 23,
        shipped: 18,
        out_for_delivery: 8,
        delivered: 1156,
        cancelled: 79,
        statusDistribution: [
          { status: 'delivered', count: 1156 },
          { status: 'processing', count: 23 },
          { status: 'shipped', count: 18 },
          { status: 'confirmed', count: 15 },
          { status: 'pending', count: 12 },
          { status: 'out_for_delivery', count: 8 },
          { status: 'cancelled', count: 79 },
        ],
      },
      products: {
        total: 156,
        active: 142,
        lowStock: 8,
        outOfStock: 6,
        topSelling: [
          { id: 'prod_1', name: 'Wireless Noise-Cancelling Headphones', sales: 234, revenue: 585000000, stock: 45 },
          { id: 'prod_2', name: 'Premium Leather Wallet', sales: 189, revenue: 160650000, stock: 12 },
          { id: 'prod_3', name: 'Organic Green Tea - 50 Pack', sales: 156, revenue: 179400000, stock: 8 },
          { id: 'prod_4', name: 'Stainless Steel Water Bottle', sales: 134, revenue: 107200000, stock: 67 },
          { id: 'prod_5', name: 'Bluetooth Mechanical Keyboard', sales: 98, revenue: 294000000, stock: 23 },
        ],
      },
      customers: {
        total: 892,
        newThisPeriod: 34,
        returning: 456,
        growthData: [
          { month: 'Aug', new: 45, returning: 120 },
          { month: 'Sep', new: 52, returning: 135 },
          { month: 'Oct', new: 48, returning: 142 },
          { month: 'Nov', new: 61, returning: 158 },
          { month: 'Dec', new: 55, returning: 165 },
          { month: 'Jan', new: 67, returning: 178 },
        ],
      },
      rating: {
        average: 4.7,
        totalReviews: 1234,
        distribution: {
          5: 892,
          4: 234,
          3: 67,
          2: 28,
          1: 13,
        },
      },
      paymentMethods: [
        { method: 'card', count: 542, percentage: 48.5, revenue: 1550000000 },
        { method: 'bank_transfer', count: 312, percentage: 27.9, revenue: 890000000 },
        { method: 'ussd', count: 189, percentage: 16.9, revenue: 540000000 },
        { method: 'wallet', count: 75, percentage: 6.7, revenue: 210000000 },
      ],
    }

    return NextResponse.json(mockData)
  } catch (error) {
    console.error('Vendor analytics GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 })
  }
}