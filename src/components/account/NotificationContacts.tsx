'use client'

import { type FormEvent, useCallback, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { apiJson } from '@/lib/api'
import { useToast } from '@/components/ui/toast'

type ContactChannel = 'EMAIL' | 'SMS' | 'WHATSAPP'

interface AlternateContact {
  id: string
  channel: ContactChannel
  masked_contact: string
  verified: boolean
  consented: boolean
  revoked: boolean
  created_at: string
}

export default function NotificationContacts() {
  const { addToast } = useToast()
  const [contacts, setContacts] = useState<AlternateContact[]>([])
  const [channel, setChannel] = useState<ContactChannel>('EMAIL')
  const [value, setValue] = useState('')
  const [consent, setConsent] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [pending, setPending] = useState<{ id: string; masked: string } | null>(null)
  const [code, setCode] = useState('')

  const loadContacts = useCallback(async () => {
    try {
      const result = await apiJson<{ contacts: AlternateContact[] }>('/notifications/contacts')
      setContacts(result.contacts || [])
    } catch (error) {
      addToast({ type: 'error', title: 'Could not load alternate contacts', message: error instanceof Error ? error.message : 'Please try again.' })
    } finally {
      setLoading(false)
    }
  }, [addToast])

  useEffect(() => {
    void loadContacts()
  }, [loadContacts])

  const requestCode = async (event: FormEvent) => {
    event.preventDefault()
    if (!consent || !value.trim()) return
    setSaving(true)
    try {
      const result = await apiJson<{ id: string; masked_contact: string }>('/notifications/contacts', {
        method: 'POST',
        body: JSON.stringify({ channel, contact: value.trim(), consent: true }),
      })
      setPending({ id: result.id, masked: result.masked_contact })
      setCode('')
      addToast({ type: 'success', title: 'Verification code sent', message: `Check ${result.masked_contact} for the code.` })
      await loadContacts()
    } catch (error) {
      addToast({ type: 'error', title: 'Could not send verification code', message: error instanceof Error ? error.message : 'Please try again.' })
    } finally {
      setSaving(false)
    }
  }

  const verifyCode = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!pending || !/^\d{6}$/.test(code)) return
    setSaving(true)
    try {
      await apiJson(`/notifications/contacts/${pending.id}/verify`, {
        method: 'POST',
        body: JSON.stringify({ code }),
      })
      setPending(null)
      setCode('')
      setValue('')
      setConsent(false)
      await loadContacts()
      addToast({ type: 'success', title: 'Alternate contact verified', message: 'This contact can now receive notifications when its channel is enabled.' })
    } catch (error) {
      addToast({ type: 'error', title: 'Verification failed', message: error instanceof Error ? error.message : 'Check the code and try again.' })
    } finally {
      setSaving(false)
    }
  }

  const revokeContact = async (contactId: string) => {
    setSaving(true)
    try {
      await apiJson(`/notifications/contacts/${contactId}`, { method: 'DELETE' })
      await loadContacts()
      if (pending?.id === contactId) setPending(null)
      addToast({ type: 'success', title: 'Contact revoked', message: 'Kamba will no longer use this alternate contact.' })
    } catch (error) {
      addToast({ type: 'error', title: 'Could not revoke contact', message: error instanceof Error ? error.message : 'Please try again.' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card variant="elevated">
      <CardHeader>
        <CardTitle className="text-text-primary">Alternate notification contacts</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <p className="text-sm text-text-tertiary">
          Add another email address or phone number for notifications. Kamba only uses a contact after you verify it and explicitly consent. Turning off a channel preference also stops notifications to its alternate contacts.
        </p>

        {loading ? (
          <p className="text-sm text-text-secondary" role="status">Loading contacts…</p>
        ) : contacts.length ? (
          <div className="space-y-3">
            {contacts.map((contact) => (
              <div key={contact.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border p-3">
                <div>
                  <p className="font-medium text-text-primary">{contact.masked_contact}</p>
                  <p className="text-xs text-text-tertiary">{contact.channel} · {contact.revoked ? 'Revoked' : contact.verified ? 'Verified and opted in' : 'Verification pending'}</p>
                </div>
                {!contact.revoked && (
                  <Button size="sm" variant="outline" disabled={saving} onClick={() => void revokeContact(contact.id)}>Revoke</Button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-text-secondary">No alternate contacts have been added.</p>
        )}

        {!pending ? (
          <form onSubmit={requestCode} className="space-y-3 border-t border-border pt-4">
            <div>
              <label htmlFor="alternate-contact-channel" className="mb-1 block text-sm font-medium text-text-primary">Contact type</label>
              <select id="alternate-contact-channel" value={channel} onChange={(event) => setChannel(event.target.value as ContactChannel)} className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm text-text-primary">
                <option value="EMAIL">Email</option>
                <option value="SMS">SMS</option>
                <option value="WHATSAPP">WhatsApp</option>
              </select>
            </div>
            <Input label={channel === 'EMAIL' ? 'Alternate email address' : 'Phone number (include country code)'} type={channel === 'EMAIL' ? 'email' : 'tel'} value={value} onChange={(event) => setValue(event.target.value)} placeholder={channel === 'EMAIL' ? 'name@example.com' : '+234…'} required />
            <label className="flex items-start gap-2 text-sm text-text-secondary">
              <input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} className="mt-1 accent-coral" />
              I own or am authorized to use this contact, and I agree that Kamba may send account and transaction notifications to it.
            </label>
            <Button type="submit" disabled={saving || !value.trim() || !consent}>{saving ? 'Sending code…' : 'Verify alternate contact'}</Button>
          </form>
        ) : (
          <form onSubmit={verifyCode} className="space-y-3 border-t border-border pt-4">
            <p className="text-sm text-text-secondary">Enter the 6-digit code sent to {pending.masked}. The code expires in 5 minutes.</p>
            <Input label="Verification code" inputMode="numeric" maxLength={6} value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="000000" required />
            <div className="flex flex-wrap gap-2">
              <Button type="submit" disabled={saving || code.length !== 6}>{saving ? 'Verifying…' : 'Confirm contact'}</Button>
              <Button type="button" variant="outline" disabled={saving} onClick={() => { setPending(null); setCode('') }}>Cancel</Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  )
}
