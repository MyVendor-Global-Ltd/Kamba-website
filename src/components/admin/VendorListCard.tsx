'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface VendorListCardProps {
  vendor: {
    id: string
    business_name?: string
    name?: string
    email?: string
    phone?: string
    verification_status?: string
    business_type?: string
  }
  onApprove: () => void
  onReject: () => void
}

export function VendorListCard({ vendor, onApprove, onReject }: VendorListCardProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-base">{vendor.business_name || vendor.name}</CardTitle>
            <p className="text-sm text-muted-foreground">{vendor.email || vendor.phone}</p>
          </div>
          <Badge variant={vendor.verification_status === 'business' ? 'default' : 'outline'} className="text-sm">
            {vendor.verification_status}
          </Badge>
        </div>
        <div className="mt-4 flex gap-2">
          <button
            onClick={onApprove}
            className="flex-1 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90"
          >
            Approve
          </button>
          <button
            onClick={onReject}
            className="flex-1 py-2 border border-destructive text-destructive rounded-lg text-sm font-medium hover:bg-destructive/10"
          >
            Reject
          </button>
        </div>
      </CardContent>
    </Card>
  )
}
