'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface AdminStatsCardProps {
  title: string
  value: string | number
  subtitle?: string
}

export function AdminStatsCard({ title, value, subtitle }: AdminStatsCardProps) {
  return (
    <Card>
      <CardContent>
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className="text-2xl font-bold">{value}</div>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      </CardContent>
    </Card>
  )
}
