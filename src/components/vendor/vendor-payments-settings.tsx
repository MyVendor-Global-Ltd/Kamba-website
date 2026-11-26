'use client'

import { useEffect, useState } from 'react'
import { AlertCircle, CheckCircle2, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { formatKobo } from '@/lib/formatting'
import { apiJson } from '@/lib/api'

type Payment = {
  id: string
  order_id?: string
  order_created_at?: string
  amount?: number
  status?: string
  description?: string
  created_at?: string
}

type Bank = { name: string; code: string }
type PayoutAccount = {
  bank_code: string
  bank_name: string
  account_name: string
  account_last4: string
  currency: string
  status: string
  verified_at?: string
}
type ResolvedAccount = {
  bank_code: string
  bank_name: string
  account_number_last4: string
  resolved_account_name: string
  requires_vendor_confirmation: boolean
}

export function VendorPaymentsSettings() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [banks, setBanks] = useState<Bank[]>([])
  const [payoutAccount, setPayoutAccount] = useState<PayoutAccount | null>(null)
  const [bankCode, setBankCode] = useState('')
  const [manualBankName, setManualBankName] = useState('')
  const [accountNumber, setAccountNumber] = useState('')
  const [accountName, setAccountName] = useState('')
  const [resolved, setResolved] = useState<ResolvedAccount | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [resolving, setResolving] = useState(false)
  const [error, setError] = useState('')
  const [payoutError, setPayoutError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    let active = true
    const load = async () => {
      const [paymentResult, bankResult, accountResult] = await Promise.allSettled([
        apiJson<{ payments: Payment[] }>('/vendor/payments'),
        apiJson<{ banks: Bank[] }>('/vendor/payout-account/banks'),
        apiJson<{ payout_account: PayoutAccount | null }>('/vendor/payout-account'),
      ])
      if (!active) return

      if (paymentResult.status === 'fulfilled') setPayments(paymentResult.value.payments || [])
      else setError(paymentResult.reason instanceof Error ? paymentResult.reason.message : 'Could not load payment history.')

      if (bankResult.status === 'fulfilled') setBanks(bankResult.value.banks || [])
      else setPayoutError(bankResult.reason instanceof Error ? bankResult.reason.message : 'Bank verification is not available yet.')

      if (accountResult.status === 'fulfilled') setPayoutAccount(accountResult.value.payout_account || null)
      else if (!payoutError) setPayoutError(accountResult.reason instanceof Error ? accountResult.reason.message : 'Could not load payout account details.')

      setLoading(false)
    }
    void load()
    return () => { active = false }
  }, [])

  const resolveAccount = async () => {
    setPayoutError('')
    setSuccess('')
    setResolved(null)
    setAccountName('')
    if (!bankCode) return setPayoutError('Select your bank first.')
    if (!/^\d{10}$/.test(accountNumber)) return setPayoutError('Enter a valid 10-digit Nigerian bank account number.')
    setResolving(true)
    try {
      const result = await apiJson<ResolvedAccount>('/vendor/payout-account/resolve', {
        method: 'POST',
        body: JSON.stringify({ bank_code: bankCode, account_number: accountNumber }),
      })
      setResolved(result)
      setAccountName(result.resolved_account_name)
    } catch (err) {
      setPayoutError(err instanceof Error ? err.message : 'Could not verify this bank account.')
    } finally {
      setResolving(false)
    }
  }

  const confirmAccount = async () => {
    if (!resolved || !accountName.trim()) return
    setSaving(true)
    setPayoutError('')
    setSuccess('')
    try {
      const result = await apiJson<{ payout_account: PayoutAccount }>('/vendor/payout-account/confirm', {
        method: 'POST',
        body: JSON.stringify({ bank_code: bankCode, account_number: accountNumber, account_name: accountName.trim() }),
      })
      setPayoutAccount(result.payout_account)
      setAccountNumber('')
      setResolved(null)
      setAccountName('')
      setSuccess('Your verified payout account has been saved.')
    } catch (err) {
      setPayoutError(err instanceof Error ? err.message : 'Could not save your payout account.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="flex h-[60vh] items-center justify-center"><div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary" /></div>
  }

  const total = payments.reduce((sum, payment) => sum + (payment.amount || 0), 0)
  const pending = payments.filter((payment) => payment.status === 'pending' || payment.status === 'held').reduce((sum, payment) => sum + (payment.amount || 0), 0)
  const paid = payments.filter((payment) => payment.status === 'paid' || payment.status === 'released').reduce((sum, payment) => sum + (payment.amount || 0), 0)

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-semibold uppercase tracking-wider text-primary">Vendor workspace</p>
        <h1 className="mt-2 text-3xl font-bold text-text-primary">Payouts and bank account</h1>
        <p className="mt-2 text-sm text-text-secondary">Add the Nigerian bank account Kamba should use for your vendor payouts.</p>
      </header>

      {error && <p role="alert" className="rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">{error}</p>}

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-primary" /> Payout account</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {payoutAccount ? (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border p-4">
              <div>
                <p className="font-semibold text-text-primary">{payoutAccount.account_name}</p>
                <p className="mt-1 text-sm text-text-secondary">{payoutAccount.bank_name} · •••• {payoutAccount.account_last4}</p>
                <p className="mt-1 text-xs text-text-tertiary">NGN · Verified {payoutAccount.verified_at ? new Date(payoutAccount.verified_at).toLocaleDateString('en-NG') : ''}</p>
              </div>
              <Badge variant="default">{payoutAccount.status}</Badge>
            </div>
          ) : (
            <p className="text-sm text-text-secondary">No payout account has been added yet.</p>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            {banks.length > 0 ? (
              <label className="block text-sm font-medium text-text-secondary">Bank
                <select value={bankCode} onChange={(event) => { setBankCode(event.target.value); setResolved(null); setAccountName('') }} className="mt-2 h-11 w-full rounded-lg border border-border bg-surface px-3 text-text-primary">
                  <option value="">Select your bank</option>
                  {banks.map((bank) => <option key={bank.code} value={bank.code}>{bank.name}</option>)}
                </select>
              </label>
            ) : (
              <Input label="Bank name" value={manualBankName} onChange={(event) => setManualBankName(event.target.value)} placeholder="Enter your bank name" />
            )}
            <Input label="Account number" type="text" inputMode="numeric" maxLength={10} value={accountNumber} onChange={(event) => { setAccountNumber(event.target.value.replace(/\D/g, '').slice(0, 10)); setResolved(null); setAccountName('') }} placeholder="10-digit account number" />
          </div>

          {banks.length === 0 && <p className="rounded-lg bg-secondary p-3 text-xs leading-5 text-secondary-foreground">The payout provider has not returned a bank list. You can prepare the account number here, but Kamba will not store or use unverified banking details. Account verification and saving will become available when the payout provider is configured.</p>}

          {resolved && (
            <div className="space-y-3 rounded-lg border border-primary/30 bg-primary/5 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-text-primary"><CheckCircle2 className="h-4 w-4 text-primary" /> Bank account found</div>
              <p className="text-sm text-text-secondary">{resolved.bank_name} · •••• {resolved.account_number_last4}</p>
              <Input label="Account name returned by your bank" value={accountName} onChange={(event) => setAccountName(event.target.value)} />
              <p className="text-xs text-text-tertiary">Confirm that this is your correct account. Kamba verifies the account again before saving it.</p>
              <Button onClick={confirmAccount} disabled={saving || !accountName.trim()}>{saving ? 'Saving account…' : 'Confirm and save payout account'}</Button>
            </div>
          )}

          {payoutError && <p role="alert" className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">{payoutError}</p>}
          {success && <p role="status" className="rounded-lg bg-secondary p-3 text-sm text-secondary-foreground">{success}</p>}

          <Button variant="outline" onClick={resolveAccount} disabled={resolving || banks.length === 0 || accountNumber.length !== 10 || !bankCode}>{resolving ? 'Checking account…' : 'Verify bank account'}</Button>
          <p className="text-xs leading-5 text-text-tertiary">Your full account number is sent only for bank verification. Kamba stores the verified payout beneficiary and masked account details, not a plain-text account number.</p>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card><CardContent className="p-5"><h3 className="text-sm font-medium text-text-secondary">Total earnings</h3><p className="mt-2 text-2xl font-bold text-text-primary">{formatKobo(total)}</p></CardContent></Card>
        <Card><CardContent className="p-5"><h3 className="text-sm font-medium text-text-secondary">Pending / held</h3><p className="mt-2 text-2xl font-bold text-text-primary">{formatKobo(pending)}</p></CardContent></Card>
        <Card><CardContent className="p-5"><h3 className="text-sm font-medium text-text-secondary">Paid / released</h3><p className="mt-2 text-2xl font-bold text-text-primary">{formatKobo(paid)}</p></CardContent></Card>
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-text-primary">Payment history</h2>
        {payments.map((payment) => (
          <Card key={payment.id}><CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
            <div><h3 className="font-semibold text-text-primary">{payment.description || (payment.order_id ? `Order ${payment.order_id.slice(0, 8)}` : 'Vendor payment')}</h3><p className="mt-1 text-xs text-text-tertiary">{payment.order_created_at || payment.created_at ? new Date(payment.order_created_at || payment.created_at || '').toLocaleString('en-NG') : 'Date unavailable'}</p></div>
            <div className="text-right"><p className="font-bold text-text-primary">{formatKobo(payment.amount || 0)}</p><Badge variant={payment.status === 'paid' || payment.status === 'released' ? 'default' : 'outline'}>{payment.status || 'unknown'}</Badge></div>
          </CardContent></Card>
        ))}
        {payments.length === 0 && <p className="rounded-lg border border-dashed border-border py-10 text-center text-sm text-text-secondary">No payout activity yet.</p>}
      </section>
    </div>
  )
}
