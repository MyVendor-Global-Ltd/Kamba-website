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
import { useRouter } from 'next/navigation'
import { User, MapPin, CreditCard, Settings, Package, Bell, LogOut, Edit, Plus, Trash2, ChevronRight, ChevronDown, ChevronUp, Save, X } from 'lucide-react'

interface UserProfile {
  id: string
  email: string
  phone?: string
  first_name: string
  last_name: string
  username?: string
  avatar_url?: string
  created_at?: string
  display_name?: string
  role?: string
}

interface Address {
  id: string
  label: string
  address: string
  city: string
  state: string
  postal_code?: string
  is_default: boolean
  latitude?: number
  longitude?: number
}

interface PaymentMethod {
  id: string
  type: 'card' | 'bank_transfer' | 'ussd'
  last4?: string
  brand?: string
  bank_name?: string
  account_name?: string
  is_default: boolean
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
  marketing_enabled: boolean
}

const tabs = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'addresses', label: 'Addresses', icon: MapPin },
  { id: 'payment', label: 'Payment Methods', icon: CreditCard },
  { id: 'orders', label: 'Order History', icon: Package },
  { id: 'settings', label: 'Settings', icon: Settings },
] as const

type TabId = typeof tabs[number]['id']

export default function AccountPage() {
  const { user, updateUser, logout } = useAuth()
  const { addToast } = useToast()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<TabId>('profile')
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [addresses, setAddresses] = useState<Address[]>([])
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [orders, setOrders] = useState<OrderSummary[]>([])
  const [editing, setEditing] = useState<string | null>(null)
  const [formData, setFormData] = useState<Record<string, string | number | boolean | null>>({})
  const [showAddAddress, setShowAddAddress] = useState(false)
  const [showAddPayment, setShowAddPayment] = useState(false)
  const [notificationPreferences, setNotificationPreferences] = useState<NotificationPreferences>({
    push_enabled: false,
    email_enabled: true,
    sms_enabled: false,
    marketing_enabled: false,
  })
  const [preferencesLoading, setPreferencesLoading] = useState(true)
  const [preferencesSaving, setPreferencesSaving] = useState(false)
  const [preferencesError, setPreferencesError] = useState('')
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
      // Saved-address and saved-payment-method APIs are not in the current backend contract.
      setAddresses([])
      setPaymentMethods([])
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

  const handleSaveProfile = async () => {
    try {
      await apiJson('/auth/profile', {
        method: 'PATCH',
        body: JSON.stringify({
          displayName: [formData.first_name, formData.last_name].filter(Boolean).join(' '),
          username: formData.username,
          ...(String(formData.phone || '').trim() ? { phone: String(formData.phone).trim() } : {}),
        }),
      })
      updateUser({ display_name: [formData.first_name, formData.last_name].filter(Boolean).join(' ') })
      setEditing(null)
      await loadData()
      addToast({ type: 'success', title: 'Profile updated', message: 'Your profile has been saved.' })
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

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      addToast({ type: 'error', title: 'Saved addresses are not connected', message: 'The current backend contract does not expose saved-address management for the website yet.' })
    } catch (err) {
      addToast({ type: 'error', title: 'Failed to add address', message: 'Please try again.' })
    }
  }

  const handleDeleteAddress = async (id: string) => {
    if (!confirm('Are you sure you want to delete this address?')) return
    try {
      addToast({ type: 'error', title: 'Saved addresses are not connected', message: 'The current backend contract does not expose saved-address management for the website yet.' })
    } catch (err) {
      addToast({ type: 'error', title: 'Failed to delete', message: 'Please try again.' })
    }
  }

  const handleSetDefaultAddress = async (id: string) => {
    try {
      addToast({ type: 'error', title: 'Saved addresses are not connected', message: 'The current backend contract does not expose saved-address management for the website yet.' })
    } catch (err) {
      addToast({ type: 'error', title: 'Failed to update', message: 'Please try again.' })
    }
  }

  const handleLogout = () => {
    logout()
    router.push('/')
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 lg:py-12 space-y-8 animate-fade-in">
        <div className="space-y-4 animate-pulse">
          <div className="h-10 w-1/3 bg-ink-raised/50 rounded-lg" />
          <div className="h-6 w-1/2 bg-ink-raised/50 rounded-lg" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-1 space-y-4">
            <Card variant="elevated">
              <CardContent className="p-4">
                <div className="h-12 w-full bg-ink-raised/50 rounded" />
              </CardContent>
            </Card>
          </div>
          <div className="lg:col-span-3 space-y-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i} variant="elevated">
                <CardContent className="p-4">
                  <div className="h-6 w-1/3 bg-ink-raised/50 rounded mb-4" />
                  <div className="space-y-2">
                    <div className="h-4 w-1/2 bg-ink-raised/50 rounded" />
                    <div className="h-4 w-1/3 bg-ink-raised/50 rounded" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 lg:py-12 space-y-8">
      {/* Header */}
      <header className="animate-fade-in flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl lg:text-4xl font-bold font-display text-text-primary">My Account</h1>
          <p className="text-text-secondary mt-2">Manage your profile, addresses, and orders</p>
        </div>
        <Button variant="outline" onClick={handleLogout}>
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>
      </header>

      {/* Tab Navigation */}
      <div className="animate-slide-up" style={{ animationDelay: '100ms' }}>
        <div className="flex flex-wrap gap-2 border-b border-ink-raised/30">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-coral text-coral'
                    : 'border-transparent text-text-tertiary hover:text-text-secondary'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="animate-slide-up" style={{ animationDelay: '200ms' }}>
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
                {profile.phone && <p className="text-text-tertiary text-sm mt-1">{profile.phone}</p>}
                <p className="text-text-tertiary text-sm mt-2">Member since {profile.created_at ? formatDateTime(profile.created_at) : '—'}</p>
              </Card>
            </div>
            <div className="lg:col-span-2 space-y-6">
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

            {addresses.length === 0 && !showAddAddress ? (
              <Card variant="outlined" className="p-8 text-center">
                <MapPin className="w-16 h-16 mx-auto text-text-tertiary mb-4" />
                <h3 className="text-lg font-semibold text-text-primary mb-2">No addresses saved</h3>
                <p className="text-text-secondary mb-4">Saved-address management is not connected yet. Enter delivery details during checkout.</p>
                <p className="text-xs text-text-tertiary">Saved addresses will appear here when persistent address management is available.</p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {addresses.map((address) => (
                  <Card key={address.id} variant="elevated" className={address.is_default ? 'ring-2 ring-coral/50' : ''}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-medium text-text-primary capitalize">{address.label}</span>
                            {address.is_default && (
                              <Badge variant="success" size="sm">Default</Badge>
                            )}
                          </div>
                          <address className="text-text-secondary not-italic space-y-1">
                            <p>{address.address}</p>
                            <p>{address.city}, {address.state} {address.postal_code ? ` ${address.postal_code}` : ''}</p>
                          </address>
                        </div>
                        <div className="flex flex-col gap-2 ml-4">
                          {!address.is_default && (
                            <Button variant="ghost" size="sm" onClick={() => handleSetDefaultAddress(address.id)}>
                              Set Default
                            </Button>
                          )}
                          <Button variant="ghost" size="sm" onClick={() => handleDeleteAddress(address.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                                      </Card>
                ))}
              </div>
            )}

            {/* Add Address Modal */}
            {showAddAddress && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-fade-in">
                <Card variant="elevated" className="w-full max-w-md max-h-[90vh] overflow-y-auto">
                  <CardHeader>
                    <CardTitle className="text-text-primary">Add New Address</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleAddAddress} className="space-y-4">
                      <Input
                        label="Label (e.g., Home, Work)"
                        value={String(formData.label ?? '')}
                        onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                        required
                      />
                      <Input
                        label="Street Address"
                        value={String(formData.address ?? '')}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        required
                      />
                      <div className="grid grid-cols-2 gap-4">
                        <Input
                          label="City"
                          value={String(formData.city ?? '')}
                          onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                          required
                        />
                        <Input
                          label="State"
                          value={String(formData.state ?? '')}
                          onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                          required
                        />
                      </div>
                      <Input
                        label="Postal Code (Optional)"
                        value={String(formData.postal_code ?? '')}
                        onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                      />
                      <label className="flex items-center gap-2 text-sm text-text-secondary">
                        <input
                          type="checkbox"
                          checked={Boolean(formData.is_default)}
                          onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
                          className="w-4 h-4 rounded border-border text-coral focus:ring-coral"
                        />
                        Set as default address
                      </label>
                      <div className="flex gap-3 pt-4">
                        <Button type="submit" className="flex-1">
                          Save Address
                        </Button>
                        <Button type="button" variant="outline" className="flex-1" onClick={() => setShowAddAddress(false)}>
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

        {/* Payment Methods Tab */}
        {activeTab === 'payment' && (
          <div className="mt-6 space-y-6">
            <h2 className="text-xl font-semibold text-text-primary">Payment Methods</h2>

            {paymentMethods.length === 0 && !showAddPayment ? (
              <Card variant="outlined" className="p-8 text-center">
                <CreditCard className="w-16 h-16 mx-auto text-text-tertiary mb-4" />
                <h3 className="text-lg font-semibold text-text-primary mb-2">Kamba does not store payment details here</h3>
                <p className="text-text-secondary mb-4">Payment is completed through the configured checkout provider. This website does not store card details.</p>
                <p className="text-xs text-text-tertiary">Payment methods are managed securely by the checkout provider when you place an order.</p>
              </Card>
            ) : (
              <div className="space-y-4">
                {paymentMethods.map((method) => (
                  <Card key={method.id} variant="elevated" className={method.is_default ? 'ring-2 ring-coral/50' : ''}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-lg bg-coral/10 flex items-center justify-center">
                            {method.type === 'card' ? (
                              <CreditCard className="w-6 h-6 text-coral" />
                            ) : method.type === 'bank_transfer' ? (
                              <MapPin className="w-6 h-6 text-coral" />
                            ) : (
                              <CreditCard className="w-6 h-6 text-coral" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-text-primary capitalize">{method.type.replace('_', ' ')}</p>
                            {method.type === 'card' && method.last4 && (
                              <p className="text-sm text-text-tertiary">Ending in {method.last4} {method.brand ? `• ${method.brand}` : ''}</p>
                            )}
                            {method.type === 'bank_transfer' && method.bank_name && (
                              <p className="text-sm text-text-tertiary">{method.bank_name} • {method.account_name}</p>
                            )}
                            {method.is_default && (
                              <Badge variant="success" size="sm">Default</Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {!method.is_default && (
                            <Button variant="ghost" size="sm">Set Default</Button>
                          )}
                          <Button variant="ghost" size="sm" onClick={() => {}}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                                      </Card>
                ))}
              </div>
            )}

            {/* Add Payment Modal */}
            {showAddPayment && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-fade-in">
                <Card variant="elevated" className="w-full max-w-md max-h-[90vh] overflow-y-auto">
                  <CardHeader>
                    <CardTitle className="text-text-primary">Add Payment Method</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-text-secondary mb-2">Type</label>
                        <select
                          value={String(formData.type ?? '')}
                          onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                          className="w-full px-4 py-3 rounded-lg bg-ink-raised/50 border border-border text-text-primary focus:outline-none focus:ring-2 focus:ring-coral"
                        >
                          <option value="card">Credit/Debit Card</option>
                          <option value="bank_transfer">Bank Transfer</option>
                          <option value="ussd">USSD</option>
                        </select>
                      </div>
                      {formData.type === 'card' && (
                        <div className="space-y-4">
                          <Input label="Card Number" type="text" placeholder="1234 5678 9012 3456" />
                          <div className="grid grid-cols-2 gap-4">
                            <Input label="Expiry" type="text" placeholder="MM/YY" />
                            <Input label="CVV" type="text" placeholder="123" />
                          </div>
                        </div>
                      )}
                      {formData.type === 'bank_transfer' && (
                        <div className="space-y-4">
                          <Input label="Bank Name" placeholder="e.g., GTBank, Access Bank" />
                          <Input label="Account Name" placeholder="John Doe" />
                          <Input label="Account Number" type="text" placeholder="1234567890" />
                        </div>
                      )}
                      {formData.type === 'ussd' && (
                        <p className="text-sm text-text-tertiary">USSD payments are processed at checkout. No details needed now.</p>
                      )}
                      <label className="flex items-center gap-2 text-sm text-text-secondary">
                        <input
                          type="checkbox"
                          checked={Boolean(formData.is_default)}
                          onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
                          className="w-4 h-4 rounded border-border text-coral focus:ring-coral"
                        />
                        Set as default payment method
                      </label>
                      <div className="flex gap-3 pt-4">
                        <Button type="submit" className="flex-1">Save</Button>
                        <Button type="button" variant="outline" className="flex-1" onClick={() => setShowAddPayment(false)}>
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
                  Push delivery still depends on device registration and provider configuration.
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
                          disabled={preferencesSaving || key === 'push_enabled'}
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
                        This action cannot be undone. Enter your current password and type DELETE. Vendor listings will be hidden; required transaction records will remain.
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
  )
}