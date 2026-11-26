'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { apiJson } from '@/lib/api'
import { formatKobo, formatDateTime, formatOrderStatus } from '@/lib/formatting'
import { useToast } from '@/components/ui/toast'
import { useAuth } from '@/context/AuthContext'
import { enableWebPush, disableWebPush } from '@/lib/firebase-messaging'
import NotificationContacts from '@/components/account/NotificationContacts'
import { useRouter, useSearchParams } from 'next/navigation'
import { User, MapPin, CreditCard, Settings, Package, Bell, Edit, ChevronRight, ChevronDown, ChevronUp, Save, X, LayoutDashboard, ShoppingBag, Activity, Store, ArrowUpRight } from 'lucide-react'

interface UserProfile {
  id: string
  email: string
  phone?: string
  phone_verified?: boolean
  email_verified?: boolean
  first_name: string
  last_name: string
  username?: string
  avatar_url?: string
  created_at?: string
  display_name?: string
  role?: string
}

interface OrderSummary {
  id: string
  order_number: string
  status: string
  total: number
  created_at: string
  items_count: number
}

interface NotificationPreferences {
  push_enabled: boolean
  email_enabled: boolean
  sms_enabled: boolean
  whatsapp_enabled: boolean
  marketing_enabled: boolean
}

const tabs = [
  { id: 'overview', label: 'Dashboard', icon: LayoutDashboard, group: 'Dashboard' },
  { id: 'profile', label: 'Profile & personal details', icon: User, group: 'Account' },
  { id: 'addresses', label: 'Delivery addresses', icon: MapPin, group: 'Account' },
  { id: 'orders', label: 'Order history', icon: Package, group: 'Activity' },
  { id: 'payment', label: 'Payment preferences', icon: CreditCard, group: 'Preferences' },
  { id: 'settings', label: 'Notifications & security', icon: Settings, group: 'Preferences' },
] as const

type TabId = typeof tabs[number]['id']

export default function AccountPage() {
  const { updateUser, logout } = useAuth()
  const { addToast } = useToast()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState<TabId>('overview')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const requestedTab = searchParams.get('tab')
    if (requestedTab && tabs.some((tab) => tab.id === requestedTab)) setActiveTab(requestedTab as TabId)
    else setActiveTab('overview')
  }, [searchParams])
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [orders, setOrders] = useState<OrderSummary[]>([])
  const [editing, setEditing] = useState<string | null>(null)
  const [formData, setFormData] = useState<Record<string, string | number | boolean | null>>({})
  const [notificationPreferences, setNotificationPreferences] = useState<NotificationPreferences>({
    push_enabled: false,
    email_enabled: true,
    sms_enabled: false,
    whatsapp_enabled: false,
    marketing_enabled: false,
  })
  const [preferencesLoading, setPreferencesLoading] = useState(true)
  const [preferencesSaving, setPreferencesSaving] = useState(false)
  const [preferencesError, setPreferencesError] = useState('')
  const [emailOtp, setEmailOtp] = useState('')
  const [emailOtpSent, setEmailOtpSent] = useState(false)
  const [emailVerificationBusy, setEmailVerificationBusy] = useState(false)
  const [emailVerificationMessage, setEmailVerificationMessage] = useState('')
  const [emailVerificationError, setEmailVerificationError] = useState('')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletePassword, setDeletePassword] = useState('')
  const [deleteConfirmation, setDeleteConfirmation] = useState('')
  const [deletingAccount, setDeletingAccount] = useState(false)

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      setPreferencesLoading(true)
      const [profileRes, ordersRes, preferencesRes] = await Promise.allSettled([
        apiJson<UserProfile | { user: UserProfile } | { result: UserProfile }>('/auth/dashboard'),
        apiJson<{ orders: OrderSummary[] }>('/commerce/orders?limit=10'),
        apiJson<NotificationPreferences>('/auth/notification-preferences'),
      ])

      if (profileRes.status === 'fulfilled') {
        const response = profileRes.value
        const apiProfile = 'user' in response ? response.user : 'result' in response ? response.result : response
        setProfile({
          ...apiProfile,
          first_name: apiProfile.first_name || apiProfile.display_name || apiProfile.username || 'Kamba member',
          last_name: apiProfile.last_name || '',
        })
      }
      if (ordersRes.status === 'fulfilled') setOrders(ordersRes.value.orders)
      if (preferencesRes.status === 'fulfilled') {
        setNotificationPreferences(preferencesRes.value)
        setPreferencesError('')
      } else {
        setPreferencesError('We could not load your notification preferences. Try refreshing the account page.')
      }
    } catch (err) {
      console.error('Failed to load account data:', err)
    } finally {
      setLoading(false)
      setPreferencesLoading(false)
    }
  }, [])

  useEffect(() => {
    void Promise.resolve().then(loadData)
  }, [loadData])

  const requestEmailVerification = async () => {
    if (!profile?.id || !profile.email) return
    setEmailVerificationBusy(true)
    setEmailVerificationError('')
    setEmailVerificationMessage('')
    try {
      await apiJson('/auth/email/verify', {
        method: 'POST',
      })
      setEmailOtpSent(true)
      setEmailVerificationMessage('A verification code has been sent to ' + profile.email + '. Check your inbox and spam folder.')
    } catch (error) {
      setEmailVerificationError(error instanceof Error ? error.message : 'Could not send the email verification code.')
    } finally {
      setEmailVerificationBusy(false)
    }
  }

  const verifyEmailAddress = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!profile?.id || !/^\d{6}$/.test(emailOtp)) {
      setEmailVerificationError('Enter the 6-digit code sent to your email.')
      return
    }
    setEmailVerificationBusy(true)
    setEmailVerificationError('')
    setEmailVerificationMessage('')
    try {
      await apiJson('/auth/email/verify/confirm', {
        method: 'POST',
        body: JSON.stringify({ otp_code: emailOtp }),
      })
      setProfile((current) => current ? { ...current, email_verified: true } : current)
      updateUser({ email_verified: true })
      setEmailOtp('')
      setEmailOtpSent(false)
      setEmailVerificationMessage('Your email address is verified.')
    } catch (error) {
      setEmailVerificationError(error instanceof Error ? error.message : 'That verification code could not be confirmed.')
    } finally {
      setEmailVerificationBusy(false)
    }
  }

  const handleSaveProfile = async () => {
    try {
      await apiJson('/auth/profile', {
        method: 'PATCH',
        body: JSON.stringify({
          displayName: [formData.first_name, formData.last_name].filter(Boolean).join(' '),
          username: formData.username,
          ...(String(formData.phone || '').trim() !== (profile?.phone || '')
            ? { phone: String(formData.phone || '').trim() || null }
            : {}),
        }),
      })
      updateUser({ display_name: [formData.first_name, formData.last_name].filter(Boolean).join(' ') })
      setEditing(null)
      await loadData()
      addToast({
        type: 'success',
        title: 'Profile updated',
        message: 'Your profile has been saved. If you changed your phone number, verify it again before vendor onboarding.',
      })
    } catch (err) {
      addToast({ type: 'error', title: 'Failed to update', message: err instanceof Error ? err.message : 'Please try again.' })
    }
  }

  const handlePreferenceChange = async (key: keyof NotificationPreferences, value: boolean) => {
    const previous = notificationPreferences
    setNotificationPreferences({ ...previous, [key]: value })
    setPreferencesSaving(true)
    setPreferencesError('')
    try {
      if (key === 'push_enabled' && value) {
        const token = await enableWebPush()
        await apiJson('/notifications/devices', {
          method: 'POST',
          body: JSON.stringify({ token, platform: 'web', device_label: navigator.userAgent.slice(0, 100) }),
        })
      } else if (key === 'push_enabled' && !value) {
        const token = await disableWebPush()
        if (token) {
          await apiJson('/notifications/devices', { method: 'DELETE', body: JSON.stringify({ token }) })
        }
      }
      const saved = await apiJson<NotificationPreferences>('/auth/notification-preferences', {
        method: 'PATCH',
        body: JSON.stringify({ [key]: value }),
      })
      setNotificationPreferences(saved)
      addToast({ type: 'success', title: 'Preference saved', message: 'Your notification preference has been updated.' })
    } catch (error) {
      setNotificationPreferences(previous)
      const message = error instanceof Error ? error.message : 'Please try again.'
      setPreferencesError(message)
      addToast({ type: 'error', title: 'Could not save preference', message })
    } finally {
      setPreferencesSaving(false)
    }
  }

  const handleDeleteAccount = async (event: React.FormEvent) => {
    event.preventDefault()
    if (deleteConfirmation !== 'DELETE' || !deletePassword) return
    setDeletingAccount(true)
    try {
      await apiJson('/auth/account', {
        method: 'DELETE',
        body: JSON.stringify({ password: deletePassword, confirmation: deleteConfirmation }),
      })
      await logout()
      router.replace('/')
      router.refresh()
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Account deletion failed',
        message: error instanceof Error ? error.message : 'Your account has not been changed. Please try again.',
      })
    } finally {
      setDeletingAccount(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="space-y-3 animate-pulse">
          <div className="h-9 w-56 rounded-lg bg-ink-raised/60" />
          <div className="h-5 w-72 max-w-full rounded-lg bg-ink-raised/60" />
        </div>
        {[...Array(3)].map((_, index) => (
          <Card key={index} variant="elevated">
            <CardContent className="space-y-3 p-5">
              <div className="h-5 w-1/3 rounded bg-ink-raised/60" />
              <div className="h-4 w-2/3 rounded bg-ink-raised/60" />
              <div className="h-4 w-1/2 rounded bg-ink-raised/60" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <header className="animate-fade-in">
        <h2 className="text-2xl font-bold font-display text-text-primary lg:text-3xl">{activeTab === 'overview' ? 'Your dashboard' : tabs.find((tab) => tab.id === activeTab)?.label}</h2>
        <p className="mt-2 text-text-secondary">{activeTab === 'overview' ? 'Your Kamba activity and account shortcuts.' : 'Manage your Kamba account and preferences.'}</p>
      </header>

      <div className="min-w-0">
      {/* Tab Content */}
      <div className="animate-slide-up">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {profile?.role === 'buyer' && profile.email_verified && profile.phone_verified && profile.username && (
              <Card variant="elevated" className="overflow-hidden border-primary/30">
                <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
                  <div className="flex min-w-0 items-start gap-4">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary"><Store className="h-6 w-6" /></span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2"><h3 className="font-display text-lg font-semibold text-text-primary">Your business can be on Kamba</h3><Badge variant="gold">NEW</Badge></div>
                      <p className="mt-1 max-w-2xl text-sm leading-6 text-text-secondary">Create your business page in a few steps. Your storefront can go live before you add your first product or service. Google indexing may take additional time after launch.</p>
                    </div>
                  </div>
                  <Link href="/vendor/onboard" className="shrink-0"><Button>Start your business <ArrowUpRight className="ml-2 h-4 w-4" /></Button></Link>
                </CardContent>
              </Card>
            )}
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <Link replace href="/orders" className="group">
                <Card variant="elevated" className="h-full transition-colors group-hover:border-primary/40">
                  <CardContent className="flex items-center gap-4 p-5">
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-soft text-primary"><ShoppingBag className="h-5 w-5" /></span>
                    <span><span className="block text-sm text-text-secondary">Recent orders loaded</span><strong className="text-2xl text-text-primary">{orders.length}</strong></span>
                    <ChevronRight className="ml-auto h-5 w-5 text-text-tertiary" />
                  </CardContent>
                </Card>
              </Link>
              <Link replace href="/service-requests" className="group">
                <Card variant="elevated" className="h-full transition-colors group-hover:border-primary/40">
                  <CardContent className="flex items-center gap-4 p-5">
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-soft text-primary"><Activity className="h-5 w-5" /></span>
                    <span><span className="block text-sm text-text-secondary">Service requests</span><strong className="text-base text-text-primary">View requests</strong></span>
                    <ChevronRight className="ml-auto h-5 w-5 text-text-tertiary" />
                  </CardContent>
                </Card>
              </Link>
              <Link replace href="/notifications" className="group">
                <Card variant="elevated" className="h-full transition-colors group-hover:border-primary/40">
                  <CardContent className="flex items-center gap-4 p-5">
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-soft text-primary"><Bell className="h-5 w-5" /></span>
                    <span><span className="block text-sm text-text-secondary">Notifications</span><strong className="text-base text-text-primary">Open inbox</strong></span>
                    <ChevronRight className="ml-auto h-5 w-5 text-text-tertiary" />
                  </CardContent>
                </Card>
              </Link>
            </div>
            <Card variant="elevated">
              <CardHeader><CardTitle className="text-text-primary">Account shortcuts</CardTitle></CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-2">
                <Link replace href="/account?tab=profile" className="flex items-center justify-between rounded-xl border border-border p-4 text-sm font-medium text-text-primary transition-colors hover:bg-ink-raised/60">Profile details <ChevronRight className="h-4 w-4 text-text-tertiary" /></Link>
                <Link replace href="/account?tab=addresses" className="flex items-center justify-between rounded-xl border border-border p-4 text-sm font-medium text-text-primary transition-colors hover:bg-ink-raised/60">Delivery addresses <ChevronRight className="h-4 w-4 text-text-tertiary" /></Link>
                <Link replace href="/account?tab=payment" className="flex items-center justify-between rounded-xl border border-border p-4 text-sm font-medium text-text-primary transition-colors hover:bg-ink-raised/60">Payment preferences <ChevronRight className="h-4 w-4 text-text-tertiary" /></Link>
                <Link replace href="/account?tab=settings" className="flex items-center justify-between rounded-xl border border-border p-4 text-sm font-medium text-text-primary transition-colors hover:bg-ink-raised/60">Notification preferences & security <ChevronRight className="h-4 w-4 text-text-tertiary" /></Link>
              </CardContent>
            </Card>
            <div className="flex flex-wrap gap-3">
              <Link replace href="/search"><Button>Discover products and services</Button></Link>
              <Link replace href="/cart"><Button variant="outline">View shopping cart</Button></Link>
            </div>
          </div>
        )}
        {/* Profile Tab */}
        {activeTab === 'profile' && profile && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-6">
            <div className="lg:col-span-1">
              <Card variant="elevated" className="p-6 text-center">
                <div className="w-24 h-24 rounded-full bg-coral/10 flex items-center justify-center mx-auto mb-4">
                  {profile.avatar_url ? (
                    <img src={profile.avatar_url} alt={profile.first_name} className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <User className="w-12 h-12 text-coral" />
                  )}
                </div>
                <h2 className="text-xl font-bold font-display text-text-primary">
                  {profile.display_name || [profile.first_name, profile.last_name].filter(Boolean).join(' ')}
                </h2>
                <p className="text-text-tertiary mt-1">{profile.email}</p>
                {profile.phone && (
                  <>
                    <p className="text-text-tertiary text-sm mt-1">{profile.phone}</p>
                    {profile.phone_verified ? (
                      <p className="text-xs text-success mt-1">Phone verified</p>
                    ) : (
                      <p className="text-xs text-warning mt-1">Phone not verified · <Link className="underline" href="/auth/phone?callbackUrl=%2Faccount">Verify phone</Link></p>
                    )}
                  </>
                )}
                <p className="text-text-tertiary text-sm mt-2">Member since {profile.created_at ? formatDateTime(profile.created_at) : '—'}</p>
              </Card>
            </div>
            <div className="lg:col-span-2 space-y-6">
              <Card variant="elevated">
                <CardHeader><CardTitle className="text-text-primary flex items-center justify-between">Email verification {profile.email_verified ? <Badge variant="default">Verified</Badge> : <Badge variant="warning">Not verified</Badge>}</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-text-secondary">{profile.email}</p>
                  {profile.email_verified ? (
                    <p className="text-sm text-success">Your email address is verified.</p>
                  ) : (
                    <>
                      <p className="text-sm text-text-secondary">Verify this email address before starting vendor onboarding. We will send a one-time code to this inbox.</p>
                      {!emailOtpSent ? (
                        <Button type="button" onClick={() => void requestEmailVerification()} disabled={emailVerificationBusy}>{emailVerificationBusy ? 'Sending code…' : 'Send email verification code'}</Button>
                      ) : (
                        <form onSubmit={verifyEmailAddress} className="space-y-3">
                          <Input label="6-digit verification code" value={emailOtp} onChange={(event) => setEmailOtp(event.target.value.replace(/\D/g, '').slice(0, 6))} inputMode="numeric" maxLength={6} placeholder="000000" required />
                          <div className="flex flex-wrap gap-2">
                            <Button type="submit" disabled={emailVerificationBusy || emailOtp.length !== 6}>{emailVerificationBusy ? 'Verifying…' : 'Verify email address'}</Button>
                            <Button type="button" variant="outline" onClick={() => void requestEmailVerification()} disabled={emailVerificationBusy}>Resend code</Button>
                          </div>
                        </form>
                      )}
                    </>
                  )}
                  {emailVerificationMessage && <p role="status" className="text-sm text-success">{emailVerificationMessage}</p>}
                  {emailVerificationError && <p role="alert" className="text-sm text-destructive">{emailVerificationError}</p>}
                </CardContent>
              </Card>
              <Card variant="elevated">
                <CardHeader>
                  <CardTitle className="text-text-primary flex items-center justify-between">
                    Personal Information
                    {editing === 'profile' ? (
                      <Button variant="ghost" size="sm" onClick={() => setEditing(null)}>
                        <X className="w-4 h-4 mr-1" />
                        Cancel
                      </Button>
                    ) : (
                      <Button variant="outline" size="sm" onClick={() => {
                        setFormData({
                          first_name: profile.first_name,
                          last_name: profile.last_name,
                          phone: profile.phone || '',
                        })
                        setEditing('profile')
                      }}>
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {editing === 'profile' ? (
                    <form onSubmit={(e) => { e.preventDefault(); handleSaveProfile() }} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                          label="First Name"
                          value={String(formData.first_name ?? '')}
                          onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                          required
                        />
                        <Input
                          label="Last Name"
                          value={String(formData.last_name ?? '')}
                          onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                          required
                        />
                      </div>
                      <Input
                        label="Phone Number"
                        type="tel"
                        value={String(formData.phone ?? '')}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      />
                      <div className="flex gap-3 pt-4">
                        <Button type="submit">
                          <Save className="w-4 h-4 mr-2" />
                          Save Changes
                        </Button>
                        <Button type="button" variant="outline" onClick={() => setEditing(null)}>
                          Cancel
                        </Button>
                      </div>
                    </form>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-text-tertiary">First Name</p>
                          <p className="font-medium text-text-primary">{profile.first_name}</p>
                        </div>
                        <div>
                          <p className="text-sm text-text-tertiary">Last Name</p>
                          <p className="font-medium text-text-primary">{profile.last_name}</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-text-tertiary">Email</p>
                        <p className="font-medium text-text-primary">{profile.email}</p>
                      </div>
                      <div>
                        <p className="text-sm text-text-tertiary">Phone</p>
                        <p className="font-medium text-text-primary">{profile.phone || 'Not set'}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
                              </Card>

              <Card variant="elevated">
                <CardHeader>
                  <CardTitle className="text-text-primary">Username</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-text-secondary">
                    {profile.username ? `@${profile.username}` : 'Not set'}
                  </p>
                  <p className="text-sm text-text-tertiary mt-2">
                    Your username is your unique handle on Kamba. It appears on your public profile and reviews.
                  </p>
                                </CardContent>
                              </Card>
            </div>
          </div>
        )}

        {/* Addresses Tab */}
        {activeTab === 'addresses' && (
          <div className="mt-6 space-y-6">
            <h2 className="text-xl font-semibold text-text-primary">Saved Addresses</h2>
            <Card variant="outlined" className="p-8 text-center">
              <MapPin className="w-16 h-16 mx-auto text-text-tertiary mb-4" />
              <h3 className="text-lg font-semibold text-text-primary mb-2">Saved addresses are not available yet</h3>
              <p className="text-text-secondary mb-4">The current backend does not expose persistent saved-address management. Add your delivery address during checkout; this page will not pretend to save it.</p>
              <Link href="/marketplace/"><Button variant="outline">Browse marketplace</Button></Link>
            </Card>
          </div>
        )}

        {/* Payment Methods Tab */}
        {activeTab === 'payment' && (
          <div className="mt-6 space-y-6">
            <h2 className="text-xl font-semibold text-text-primary">Payment Methods</h2>
            <Card variant="outlined" className="p-8 text-center">
              <CreditCard className="w-16 h-16 mx-auto text-text-tertiary mb-4" />
              <h3 className="text-lg font-semibold text-text-primary mb-2">Payments are managed at checkout</h3>
              <p className="text-text-secondary mb-4">Kamba does not store card numbers, CVVs or bank credentials in account settings. Choose an available payment method securely when placing an order.</p>
              <Link href="/marketplace/"><Button variant="outline">Browse marketplace</Button></Link>
            </Card>
          </div>
        )}

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <div className="mt-6 space-y-6">
            <h2 className="text-xl font-semibold text-text-primary">Order History</h2>
            
            {orders.length === 0 ? (
              <Card variant="outlined" className="p-8 text-center">
                <Package className="w-16 h-16 mx-auto text-text-tertiary mb-4" />
                <h3 className="text-lg font-semibold text-text-primary mb-2">No orders yet</h3>
                <p className="text-text-secondary mb-4">Start shopping to see your orders here.</p>
                <Link href="/marketplace">
                  <Button>Browse Marketplace</Button>
                </Link>
              </Card>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => (
                  <Card key={order.id} variant="elevated">
                    <CardContent className="p-4">
                      <Link href={`/orders/${order.id}`} className="block">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-lg bg-coral/10 flex items-center justify-center">
                              <Package className="w-6 h-6 text-coral" />
                            </div>
                            <div>
                              <p className="font-medium text-text-primary">Order #{order.order_number}</p>
                              <p className="text-sm text-text-tertiary">{formatDateTime(order.created_at)}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <p className="font-semibold text-text-primary">{formatKobo(order.total)}</p>
                              <p className="text-sm text-text-tertiary">{order.items_count} item{order.items_count !== 1 ? 's' : ''}</p>
                            </div>
                            <Badge variant={
                              order.status.toLowerCase() === 'delivered' ? 'success' :
                              order.status.toLowerCase() === 'cancelled' ? 'destructive' :
                              'secondary'
                            } size="sm">
                              {formatOrderStatus(order.status)}
                            </Badge>
                            <ChevronRight className="w-5 h-5 text-text-tertiary" />
                          </div>
                        </div>
                      </Link>
                                          </CardContent>
                                        </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="mt-6 space-y-6">
            <h2 className="text-xl font-semibold text-text-primary">Settings</h2>

            <Card variant="elevated">
              <CardHeader>
                <CardTitle className="text-text-primary">Notifications</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-text-tertiary">
                  Preferences are saved to your Kamba account and follow you between the website and mobile app.
                  Push alerts are delivered to browsers and devices you have registered. You can turn them off here at any time.
                </p>
                {preferencesError && (
                  <p role="alert" className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
                    {preferencesError}
                  </p>
                )}
                {preferencesLoading ? (
                  <p role="status" className="text-sm text-text-secondary">Loading notification preferences…</p>
                ) : (
                  <>
                    {([
                      ['push_enabled', 'Push notifications', 'App alerts on registered devices.'],
                      ['email_enabled', 'Email notifications', 'Account and order updates by email.'],
                      ['sms_enabled', 'SMS notifications', 'Delivery and account updates by SMS.'],
                      ['whatsapp_enabled', 'WhatsApp notifications', 'Order and account updates through WhatsApp.'],
                      ['marketing_enabled', 'Marketing messages', 'Optional product news and promotions.'],
                    ] as const).map(([key, label, description]) => (
                      <div key={key} className="flex items-center justify-between gap-4">
                        <div>
                          <p className="font-medium text-text-primary">{label}</p>
                          <p className="text-sm text-text-tertiary">{description}</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={notificationPreferences[key]}
                          disabled={preferencesSaving}
                          onChange={(event) => void handlePreferenceChange(key, event.target.checked)}
                          aria-label={label}
                          className="h-5 w-5 accent-coral disabled:opacity-50"
                        />
                      </div>
                    ))}
                    {preferencesSaving && <p className="text-xs text-text-tertiary" role="status">Saving preference…</p>}
                  </>
                )}
              </CardContent>
            </Card>

            <NotificationContacts />

            <Card variant="elevated">
              <CardHeader>
                <CardTitle className="text-text-primary">Privacy & Security</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link href="/auth/forgot-password" className="flex items-center justify-between rounded-lg p-4 hover:bg-ink-raised/30">
                  <span>
                    <span className="block font-medium text-text-primary">Reset password</span>
                    <span className="block text-sm text-text-tertiary">Request a secure password reset code.</span>
                  </span>
                  <ChevronRight className="h-5 w-5 text-text-tertiary" />
                </Link>
              </CardContent>
            </Card>

            <Card variant="elevated">
              <CardHeader>
                <CardTitle className="text-destructive">Danger Zone</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-col gap-3 rounded-lg border border-destructive/20 bg-destructive/10 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-medium text-destructive">Delete Account</p>
                    <p className="text-sm text-text-tertiary">
                      Deactivates your account and removes its login/profile identifiers. Order and financial records are retained where required.
                    </p>
                  </div>
                  <Button variant="destructive" size="sm" onClick={() => setDeleteDialogOpen(true)}>
                    Delete account
                  </Button>
                </div>
              </CardContent>
            </Card>

            {deleteDialogOpen && (
              <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4" role="presentation">
                <Card variant="elevated" className="w-full max-w-md">
                  <CardHeader>
                    <CardTitle className="text-destructive">Confirm account deletion</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleDeleteAccount} className="space-y-4">
                      <p className="text-sm text-text-secondary">
                        This action cannot be undone. Enter your current password and type DELETE. Vendor listings will be hidden; required transaction records will remain. If you sign in without a password, contact Kamba support for an assisted deletion request.
                      </p>
                      <Input
                        label="Current password"
                        type="password"
                        autoComplete="current-password"
                        value={deletePassword}
                        onChange={(event) => setDeletePassword(event.target.value)}
                        required
                      />
                      <Input
                        label="Type DELETE to confirm"
                        value={deleteConfirmation}
                        onChange={(event) => setDeleteConfirmation(event.target.value)}
                        autoComplete="off"
                        required
                      />
                      <div className="flex gap-3">
                        <Button type="submit" variant="destructive" className="flex-1" disabled={deletingAccount || deleteConfirmation !== 'DELETE' || !deletePassword}>
                          {deletingAccount ? 'Deleting…' : 'Permanently delete'}
                        </Button>
                        <Button type="button" variant="outline" className="flex-1" disabled={deletingAccount} onClick={() => {
                          setDeleteDialogOpen(false)
                          setDeletePassword('')
                          setDeleteConfirmation('')
                        }}>
                          Cancel
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        )}
        </div>
      </div>
    </div>
  )
}