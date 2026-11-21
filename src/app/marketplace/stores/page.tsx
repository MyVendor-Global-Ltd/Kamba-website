'use client'

import { useEffect, useState } from 'react'
import { Link } from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatDistance } from '@/lib/haversine'
import { apiJson } from '@/lib/api'
import { Store } from '@/types/vendor'

export default function StoresPage() {
  const [stores, setStores] = useState<Store[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    apiJson<{ stores: Store[] }>('/vendors/stores')
      .then((data) => {
        setStores(data.stores || [])
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message || 'Failed to load stores')
        setLoading(false)
      })
  }, [])

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Stores</h1>
          <p className="text-muted-foreground">Browse local shops near you</p>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded bg-destructive/10 border border-destructive/20 text-destructive text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {stores.map((store) => (
          <Card key={store.id}>
            <CardHeader>
              <CardTitle>{store.name}</CardTitle>
              {store.distance_km !== undefined && (
                <Badge variant="outline" className="text-xs">
                  {formatDistance(store.distance_km)}
                </Badge>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              {store.description && <p className="text-sm text-muted-foreground line-clamp-2">{store.description}</p>}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                {store.city && <span>{store.city}</span>}
                {store.state && <span>{store.state}</span>}
              </div>
              <Link href={`/marketplace/stores/${store.slug}`} className="w-full">
                <button className="w-full py-2 border rounded-lg text-sm font-medium hover:bg-accent">
                  View store
                </button>
              </Link>
            </CardContent>
          </Card>
        ))}
        {stores.length === 0 && (
          <div className="col-span-full text-center py-12">
            <p className="text-muted-foreground">No stores found.</p>
          </div>
        )}
      </div>
    </div>
  )
}
