'use client'

import { useCallback, useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { apiJson } from '@/lib/api'
import { formatDateTime, formatKobo, formatOrderStatus } from '@/lib/formatting'
import { useToast } from '@/components/ui/toast'
import { CalendarClock, RefreshCw, Briefcase, MessageSquareText } from 'lucide-react'

type Quote = {
  id: string
  amount: number
  currency?: string
  scope?: string
  status: string
  valid_until?: string | null
  estimated_duration_minutes?: number | null
}
type ServiceRequest = {
  id: string
  request_type?: string
  description?: string
  status: string
  created_at: string
  requested_start_at?: string | null
  scheduled_start_at?: string | null
  scheduled_end_at?: string | null
  service_profile?: { name?: string; service_title?: string }
  service?: { name?: string }
  buyer?: { username?: string; email?: string }
  customer?: { name?: string; email?: string }
  quotes?: Quote[]
}
type Props = { mode: 'buyer' | 'vendor' }

const statusVariant = (status: string): React.ComponentProps<typeof Badge>['variant'] => {
  if (['completed', 'accepted'].includes(status)) return 'success'
  if (['declined', 'cancelled'].includes(status)) return 'destructive'
  if (['quoted', 'scheduled', 'in_progress'].includes(status)) return 'warning'
  return 'outline'
}

export function ServiceRequestManager({ mode }: Props) {
  const { addToast } = useToast()
  const [requests, setRequests] = useState<ServiceRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')
  const [quoteAmounts, setQuoteAmounts] = useState<Record<string, string>>({})
  const [quoteScopes, setQuoteScopes] = useState<Record<string, string>>({})
  const [schedules, setSchedules] = useState<Record<string, string>>({})
  const [busyId, setBusyId] = useState<string | null>(null)

  const loadRequests = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true)
    else setLoading(true)
    try {
      setError('')
      const data = await apiJson<{ requests?: ServiceRequest[] }>('/service-bookings/requests')
      setRequests(data.requests || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load service requests.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => { void loadRequests() }, [loadRequests])

  const runAction = async (id: string, action: () => Promise<unknown>, success: string) => {
    setBusyId(id)
    try {
      await action()
      addToast({ type: 'success', title: success })
      await loadRequests(true)
    } catch (err) {
      addToast({ type: 'error', title: 'Action failed', message: err instanceof Error ? err.message : 'Please try again.' })
    } finally {
      setBusyId(null)
    }
  }

  const submitQuote = (request: ServiceRequest) => {
    const naira = Number(quoteAmounts[request.id])
    const scope = (quoteScopes[request.id] || '').trim()
    if (!Number.isFinite(naira) || naira <= 0 || !scope) {
      addToast({ type: 'error', title: 'Quote details required', message: 'Enter a valid amount and describe what the quote covers.' })
      return
    }
    void runAction(request.id, () => apiJson('/service-bookings/requests/' + encodeURIComponent(request.id) + '/quotes', {
      method: 'POST',
      body: JSON.stringify({ amount: Math.round(naira * 100), currency: 'NGN', scope }),
    }), 'Quotation sent')
  }

  const respondToQuote = (request: ServiceRequest, quote: Quote, decision: 'accept' | 'decline') => {
    void runAction(request.id, () => apiJson('/service-bookings/requests/' + encodeURIComponent(request.id) + '/quotes/' + encodeURIComponent(quote.id) + '/respond', {
      method: 'POST',
      body: JSON.stringify({ decision }),
    }), decision === 'accept' ? 'Quotation accepted' : 'Quotation declined')
  }

  const updateStatus = (request: ServiceRequest, status: string) => {
    const scheduled = schedules[request.id]
    const body: Record<string, string> = { status }
    if (status === 'scheduled') {
      if (!scheduled) {
        addToast({ type: 'error', title: 'Choose a schedule', message: 'Select a date and time before scheduling this service.' })
        return
      }
      body.scheduled_start_at = new Date(scheduled).toISOString()
    }
    void runAction(request.id, () => apiJson('/service-bookings/requests/' + encodeURIComponent(request.id) + '/status', {
      method: 'PATCH',
      body: JSON.stringify(body),
    }), 'Request updated')
  }

  const titleFor = (request: ServiceRequest) =>
    request.service_profile?.name || request.service_profile?.service_title || request.service?.name || 'Service request'

  return (
    <main className="container mx-auto max-w-5xl space-y-6 px-4 py-8 lg:py-12">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">{mode === 'vendor' ? 'Vendor workspace' : 'Your activity'}</p>
          <h1 className="font-display text-3xl font-bold text-text-primary">{mode === 'vendor' ? 'Service requests' : 'My service requests'}</h1>
          <p className="mt-2 text-sm text-text-secondary">{mode === 'vendor' ? 'Review incoming requests, send quotations and manage accepted work.' : 'Track booking requests, review provider quotations and follow service progress.'}</p>
        </div>
        <Button variant="outline" onClick={() => void loadRequests(true)} disabled={refreshing}>
          <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} /> Refresh
        </Button>
      </header>

      {error && <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">{error}</p>}
      {loading ? <div className="space-y-3"><div className="h-32 animate-pulse rounded-xl bg-surface-muted" /><div className="h-32 animate-pulse rounded-xl bg-surface-muted" /></div> : requests.length === 0 ? (
        <Card variant="outlined"><CardContent className="space-y-3 p-10 text-center">
          <Briefcase className="mx-auto h-10 w-10 text-text-tertiary" />
          <h2 className="text-lg font-semibold text-text-primary">No service requests yet</h2>
          <p className="text-sm text-text-secondary">{mode === 'vendor' ? 'New customer requests will appear here.' : 'When you request a booking or quotation, it will appear here.'}</p>
        </CardContent></Card>
      ) : requests.map((request) => {
        const quotes = request.quotes || []
        const acceptedQuote = quotes.find((quote) => quote.status === 'accepted')
        const canQuote = mode === 'vendor' && ['requested', 'quoted'].includes(request.status)
        return (
          <Card key={request.id} variant="elevated">
            <CardHeader className="gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-1">
                <CardTitle className="text-text-primary">{titleFor(request)}</CardTitle>
                <p className="text-xs text-text-tertiary">Request {request.id} · {formatDateTime(request.created_at)}</p>
              </div>
              <Badge variant={statusVariant(request.status)}>{formatOrderStatus(request.status)}</Badge>
            </CardHeader>
            <CardContent className="space-y-5">
              {request.description && <p className="whitespace-pre-line text-sm leading-6 text-text-secondary">{request.description}</p>}
              {request.requested_start_at && <p className="flex items-center gap-2 text-sm text-text-secondary"><CalendarClock className="h-4 w-4" /> Preferred: {formatDateTime(request.requested_start_at)}</p>}
              {quotes.length > 0 && <section className="space-y-3">
                <h3 className="text-sm font-semibold text-text-primary">Quotations</h3>
                {quotes.map((quote) => <div key={quote.id} className="rounded-lg border border-border p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold text-text-primary">{formatKobo(quote.amount)}</p>
                    <Badge variant={statusVariant(quote.status)}>{formatOrderStatus(quote.status)}</Badge>
                  </div>
                  {quote.scope && <p className="mt-2 text-sm text-text-secondary">{quote.scope}</p>}
                  {quote.valid_until && <p className="mt-2 text-xs text-text-tertiary">Valid until {formatDateTime(quote.valid_until)}</p>}
                  {mode === 'buyer' && quote.status === 'pending' && request.status !== 'cancelled' && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button size="sm" onClick={() => respondToQuote(request, quote, 'accept')} disabled={busyId === request.id}>Accept quote</Button>
                      <Button size="sm" variant="outline" onClick={() => respondToQuote(request, quote, 'decline')} disabled={busyId === request.id}>Decline</Button>
                    </div>
                  )}
                </div>)}
              </section>}
              {canQuote && <section className="space-y-3 rounded-lg bg-surface-muted p-4">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-text-primary"><MessageSquareText className="h-4 w-4" /> Send a quotation</h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Input label="Amount (₦)" type="number" min="1" step="0.01" value={quoteAmounts[request.id] || ''} onChange={(event) => setQuoteAmounts((current) => ({ ...current, [request.id]: event.target.value }))} placeholder="e.g. 25000" />
                  <Input label="Scope of work" value={quoteScopes[request.id] || ''} onChange={(event) => setQuoteScopes((current) => ({ ...current, [request.id]: event.target.value }))} placeholder="What is included in this quote?" />
                </div>
                <Button size="sm" onClick={() => submitQuote(request)} disabled={busyId === request.id}>{busyId === request.id ? 'Sending…' : 'Send quotation'}</Button>
              </section>}
              {mode === 'vendor' && request.status === 'accepted' && (
                <section className="space-y-3 rounded-lg bg-surface-muted p-4">
                  <label className="block text-sm font-medium text-text-secondary">Agreed appointment</label>
                  <Input type="datetime-local" value={schedules[request.id] || ''} onChange={(event) => setSchedules((current) => ({ ...current, [request.id]: event.target.value }))} />
                  <Button size="sm" onClick={() => updateStatus(request, 'scheduled')} disabled={busyId === request.id}>Confirm schedule</Button>
                </section>
              )}
              {mode === 'vendor' && request.status === 'scheduled' && <Button size="sm" onClick={() => updateStatus(request, 'in_progress')} disabled={busyId === request.id}>Mark work started</Button>}
              {mode === 'vendor' && request.status === 'in_progress' && <Button size="sm" onClick={() => updateStatus(request, 'completed')} disabled={busyId === request.id}>Mark work completed</Button>}
              {mode === 'buyer' && acceptedQuote && <p className="rounded-lg bg-secondary p-3 text-sm text-secondary-foreground">Accepted quotation: {formatKobo(acceptedQuote.amount)}. Payment is not enabled in this prototype; no money has been collected.</p>}
            </CardContent>
          </Card>
        )
      })}
      {mode === 'buyer' && <p className="text-xs leading-5 text-text-tertiary">Service payments are not enabled in the website prototype. Accepting a quotation does not charge you or release money to a provider.</p>}
    </main>
  )
}
