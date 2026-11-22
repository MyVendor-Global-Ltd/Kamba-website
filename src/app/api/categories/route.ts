import { NextResponse } from 'next/server'
import { apiJson } from '@/lib/api'

export async function GET() {
  try {
    // Try to fetch categories from backend
    const data = await apiJson<{ categories: string[] }>('/commerce/categories')
    return NextResponse.json({ categories: data.categories || [] })
  } catch {
    // Fallback categories
    return NextResponse.json({
      categories: [
        'Electronics',
        'Fashion',
        'Home & Garden',
        'Beauty & Personal Care',
        'Sports & Outdoors',
        'Books & Media',
        'Toys & Games',
        'Automotive',
        'Health & Wellness',
        'Food & Beverages',
      ],
    })
  }
}