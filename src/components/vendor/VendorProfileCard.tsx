'use client'

import { Store } from '@/types/vendor'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface VendorProfileCardProps {
  store: Store
}

export function VendorProfileCard({ store }: VendorProfileCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{store.name}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground uppercase">Verification status</label>
            <Badge variant={store.verification_status === 'business' ? 'default' : 'outline'}>
              {store.verification_status}
            </Badge>
          </div>
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground uppercase">City</label>
            <p className="font-medium">{store.city}</p>
          </div>
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground uppercase">State</label>
            <p className="font-medium">{store.state}</p>
          </div>
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground uppercase">Phone</label>
            <p className="font-medium">{store.phone}</p>
          </div>
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground uppercase">Email</label>
            <p className="font-medium">{store.email}</p>
          </div>
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground uppercase">Address</label>
            <p className="font-medium">{store.address}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
