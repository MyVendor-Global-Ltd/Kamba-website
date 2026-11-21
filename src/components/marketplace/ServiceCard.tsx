'use client'

import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ServiceProfile } from '@/types/vendor'

interface ServiceCardProps {
  service: ServiceProfile
}

export function ServiceCard({ service }: ServiceCardProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <CardTitle className="text-base">{service.name}</CardTitle>
          {service.category && (
            <Badge variant="outline" className="text-xs">{service.category}</Badge>
          )}
        </div>
        {service.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{service.description}</p>
        )}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
          {service.city && <span>{service.city}</span>}
          {service.state && <span>{service.state}</span>}
        </div>
        <Link href={`/marketplace/services/${service.slug}`}>
          <a className="w-full py-2 border rounded-lg text-sm font-medium text-center hover:bg-accent">
            View service
          </a>
        </Link>
      </CardContent>
    </Card>
  )
}
