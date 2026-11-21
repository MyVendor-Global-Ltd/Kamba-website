'use client'

import { Store } from '@/types/vendor'
import { StoreCard } from '@/components/marketplace/StoreCard'

interface StoreGridProps {
  stores: Store[]
}

export function StoreGrid({ stores }: StoreGridProps) {
  if (stores.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No stores found.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {stores.map((store) => (
        <StoreCard key={store.id} store={store} />
      ))}
    </div>
  )
}
