'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatKobo } from '@/lib/formatting'
import { apiJson } from '@/lib/api'

export default function VendorPaymentsPage() {
  const [payments, setPayments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    apiJson<{ payments: any[] }>('/vendors/payments')
      .then((data) => {
        setPayments(data.payments || [])
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message || 'Failed to load payments')
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
      <div>
        <h1 className="text-3xl font-bold">Payouts</h1>
        <p className="text-muted-foreground">View your earnings and payout history.</p>
      </div>

      {error && (
        <div className="p-4 rounded bg-destructive/10 border border-destructive/20 text-destructive text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardContent>
            <h3 className="text-lg font-semibold">Total earnings</h3>
            <p className="text-2xl font-bold">{formatKobo(payments.reduce((sum, p) => sum + (p.amount || 0), 0))}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <h3 className="text-lg font-semibold">Pending payouts</h3>
            <p className="text-2xl font-bold">{formatKobo(payments.filter((p) => p.status === 'pending').reduce((sum, p) => sum + (p.amount || 0), 0))}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <h3 className="text-lg font-semibold">Paid out</h3>
            <p className="text-2xl font-bold">{formatKobo(payments.filter((p) => p.status === 'paid').reduce((sum, p) => sum + (p.amount || 0), 0))}</p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        {payments.map((payment) => (
          <Card key={payment.id}>
            <CardContent className="p-4">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="font-semibold">{payment.description || 'Payout'}</h4>
                  <p className="text-sm text-muted-foreground">{payment.created_at}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold">{formatKobo(payment.amount || 0)}</p>
                  <Badge variant={payment.status === 'paid' ? 'default' : 'outline'} className="text-xs">
                    {payment.status}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {payments.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No payouts yet.</p>
          </div>
        )}
      </div>
    </div>
  )
}
