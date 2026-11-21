'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { apiJson } from '@/lib/api'

type Dispute = {
  dispute_id: string
  service_request_id: string
  reason: string
  dispute_status: 'open' | 'resolved_buyer' | 'resolved_vendor'
  outcome: 'refund_buyer' | 'release_vendor' | null
  resolution: string | null
  opened_at: string
  service_title: string
  request_description: string
  buyer_username: string
  buyer_email: string
  vendor_username: string
  vendor_email: string
  amount: number
  vendor_amount: number
  platform_fee: number
  platform_fee_bps: number
  currency: string
  payment_status: string
  request_status: string
}

const money = (minor: number, currency = 'NGN') => {
  const value = (Number(minor) || 0) / 100
  return currency === 'NGN'
    ? `₦${value.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : `${currency} ${value.toFixed(2)}`
}

export default function AdminServicePaymentDisputesPage() {
  const [status, setStatus] = useState('open')
  const [disputes, setDisputes] = useState<Dispute[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [selected, setSelected] = useState<{ id: string; outcome: 'refund_buyer' | 'release_vendor' } | null>(null)
  const [resolution, setResolution] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const load = useCallback(async (nextStatus = status) => {
    setLoading(true)
    setError('')
    try {
      const data = await apiJson<{ disputes: Dispute[] }>(
        `/api/v1/service-bookings/admin/payment-disputes?status=${encodeURIComponent(nextStatus)}`
      )
      setDisputes(data.disputes || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load service-payment disputes.')
      setDisputes([])
    } finally {
      setLoading(false)
    }
  }, [status])

  useEffect(() => { void load(status) }, [load, status])

  const chooseOutcome = (disputeId: string, outcome: 'refund_buyer' | 'release_vendor') => {
    setSelected({ id: disputeId, outcome })
    setResolution('')
    setNotice('')
  }

  const submitResolution = async () => {
    if (!selected) return
    if (resolution.trim().length < 10 || resolution.trim().length > 3000) {
      setError('Write a resolution of at least 10 characters and no more than 3,000 characters.')
      return
    }
    setSubmitting(true)
    setError('')
    setNotice('')
    try {
      const result = await apiJson<{ status: string }>(
        `/api/v1/service-bookings/admin/payment-disputes/${selected.id}/resolve`,
        {
          method: 'POST',
          body: JSON.stringify({ outcome: selected.outcome, resolution: resolution.trim() }),
        }
      )
      setNotice(
        result.status === 'refunding'
          ? 'Refund requested. The payment provider has not confirmed completion yet.'
          : result.status === 'releasing'
            ? 'Vendor release requested. The payment provider has not confirmed completion yet.'
            : result.status === 'refunded'
              ? 'Refund completed and confirmed by the payment provider.'
              : result.status === 'released'
                ? 'Vendor settlement completed and confirmed by the payment provider.'
                : `Resolution submitted. Current payment status: ${result.status || 'unknown'}.`
      )
      setSelected(null)
      setResolution('')
      await load(status)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not submit this resolution.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold tracking-[0.18em] text-muted-foreground">KAMBA ADMINISTRATION</p>
          <h1 className="mt-2 text-3xl font-bold">Service payment disputes</h1>
          <p className="mt-1 text-sm text-muted-foreground">Review buyer complaints and make an auditable refund or vendor-release decision.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline"><Link href="/admin/vendors">Vendor management</Link></Button>
          <Button variant="outline" onClick={() => void load(status)} disabled={loading}>Refresh</Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {[
          ['open', 'Open'],
          ['resolved_buyer', 'Refund decisions'],
          ['resolved_vendor', 'Vendor releases'],
          ['all', 'All disputes'],
        ].map(([value, label]) => (
          <Button key={value} size="sm" variant={status === value ? 'default' : 'outline'} onClick={() => setStatus(value)}>
            {label}
          </Button>
        ))}
      </div>

      {error ? <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">{error}</div> : null}
      {notice ? <div role="status" className="rounded-lg border border-border bg-muted/40 p-4 text-sm">{notice}</div> : null}

      {loading ? (
        <div className="py-16 text-center text-sm text-muted-foreground">Loading disputes…</div>
      ) : disputes.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-sm text-muted-foreground">No disputes in this view.</CardContent></Card>
      ) : (
        <div className="space-y-4">
          {disputes.map((dispute) => (
            <Card key={dispute.dispute_id}>
              <CardHeader className="pb-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <CardTitle className="text-lg">{dispute.service_title || 'Service request'}</CardTitle>
                    <p className="mt-1 text-xs text-muted-foreground">Dispute {dispute.dispute_id.slice(0, 8).toUpperCase()} · Opened {new Date(dispute.opened_at).toLocaleString()}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant={dispute.dispute_status === 'open' ? 'destructive' : 'outline'}>{dispute.dispute_status.replaceAll('_', ' ')}</Badge>
                    <Badge variant="outline">Payment: {dispute.payment_status}</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-1">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Buyer</p>
                    <p className="text-sm font-medium">@{dispute.buyer_username}</p>
                    <p className="text-sm text-muted-foreground">{dispute.buyer_email}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Service provider</p>
                    <p className="text-sm font-medium">@{dispute.vendor_username}</p>
                    <p className="text-sm text-muted-foreground">{dispute.vendor_email}</p>
                  </div>
                </div>
                <div className="rounded-lg bg-muted/40 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Buyer complaint</p>
                  <p className="mt-2 whitespace-pre-wrap text-sm">{dispute.reason}</p>
                  <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Service request</p>
                  <p className="mt-2 whitespace-pre-wrap text-sm">{dispute.request_description}</p>
                </div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div><p className="text-xs text-muted-foreground">Buyer paid</p><p className="font-semibold">{money(dispute.amount, dispute.currency)}</p></div>
                  <div><p className="text-xs text-muted-foreground">Vendor amount</p><p className="font-semibold">{money(dispute.vendor_amount, dispute.currency)}</p></div>
                  <div><p className="text-xs text-muted-foreground">Kamba fee</p><p className="font-semibold">{money(dispute.platform_fee, dispute.currency)}</p></div>
                  <div><p className="text-xs text-muted-foreground">Fee rate</p><p className="font-semibold">{(dispute.platform_fee_bps / 100).toFixed(2)}%</p></div>
                </div>

                {dispute.dispute_status === 'open' ? (
                  <div className="space-y-3 border-t pt-4">
                    <p className="text-sm font-semibold">Choose a resolution</p>
                    <div className="flex flex-wrap gap-2">
                      <Button variant="destructive" onClick={() => chooseOutcome(dispute.dispute_id, 'refund_buyer')} disabled={submitting}>Refund buyer</Button>
                      <Button variant="outline" onClick={() => chooseOutcome(dispute.dispute_id, 'release_vendor')} disabled={submitting}>Release vendor payment</Button>
                    </div>
                    {selected?.id === dispute.dispute_id ? (
                      <div className="space-y-3 rounded-lg border p-4">
                        <p className="text-sm font-medium">{selected.outcome === 'refund_buyer' ? 'Confirm buyer refund' : 'Confirm vendor release'}</p>
                        <p className="text-xs text-muted-foreground">This action sends a financial instruction to the configured payment provider. Record the evidence and reason for your decision. It cannot be treated as complete until the provider confirms it.</p>
                        <textarea
                          value={resolution}
                          onChange={(event) => setResolution(event.target.value)}
                          rows={4}
                          maxLength={3000}
                          placeholder="Explain the evidence reviewed and why this outcome is appropriate…"
                          className="w-full rounded-md border bg-background p-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                        />
                        <div className="flex flex-wrap gap-2">
                          <Button onClick={() => void submitResolution()} disabled={submitting || resolution.trim().length < 10}>
                            {submitting ? 'Submitting…' : selected.outcome === 'refund_buyer' ? 'Confirm refund' : 'Confirm vendor release'}
                          </Button>
                          <Button variant="ghost" onClick={() => { setSelected(null); setResolution('') }} disabled={submitting}>Cancel</Button>
                        </div>
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <div className="rounded-lg border p-4 text-sm">
                    <p className="font-semibold">Recorded resolution: {dispute.outcome?.replaceAll('_', ' ')}</p>
                    <p className="mt-1 whitespace-pre-wrap text-muted-foreground">{dispute.resolution}</p>
                    <p className="mt-2 text-xs text-muted-foreground">Current provider payment state: {dispute.payment_status}. A resolved decision can still be awaiting provider confirmation.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
