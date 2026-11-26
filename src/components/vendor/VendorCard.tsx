'use client'

import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Store } from '@/types/vendor'

interface VendorCardProps {
  store: Store
}

export function VendorCard({ store }: VendorCardProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <CardHeader>
          <CardTitle className="text-base">{store.name}</CardTitle>
        </CardHeader>
        <Badge variant={store.verification_status === 'business' ? 'default' : 'outline'} className="text-xs mb-2">
          {store.verification_status}
        </Badge>
        {store.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{store.description}</p>
        )}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
          {store.city && <span>{store.city}</span>}
          {store.state && <span>{store.state}</span>}
        </div>
        <Link href={`/store/${store.slug}`}>
          <a className="w-full py-2 border rounded-lg text-sm font-medium text-center hover:bg-accent">
            View store
          </a>
        </Link>
      </CardContent>
    </Card>
  )
}
