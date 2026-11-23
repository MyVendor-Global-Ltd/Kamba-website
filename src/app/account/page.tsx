'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { apiJson } from '@/lib/api'
import { formatKobo, formatDateTime } from '@/lib/formatting'
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
  created_at: string
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
  const [formData, setFormData] = useState<Record<string, any>>({})
  const [showAddAddress, setShowAddAddress] = useState(false)
  const [showAddPayment, setShowAddPayment] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [profileRes, addressesRes, paymentsRes, ordersRes] = await Promise.allSettled([
        apiJson<{ user: UserProfile }>('/api/auth/me'),
        apiJson<{ addresses: Address[] }>('/api/user/addresses'),
        apiJson<{ payment_methods: PaymentMethod[] }>('/api/user/payment-methods'),
        apiJson<{ orders: OrderSummary[] }>('/api/orders?limit=10'),
      ])

      if (profileRes.status === 'fulfilled') setProfile(profileRes.value.user)
      if (addressesRes.status === 'fulfilled') setAddresses(addressesRes.value.addresses)
      if (paymentsRes.status === 'fulfilled') setPaymentMethods(paymentsRes.value.payment_methods)
      if (ordersRes.status === 'fulfilled') setOrders(ordersRes.value.orders)
    } catch (err) {
      console.error('Failed to load account data:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveProfile = async () => {
    try {
      await apiJson('/api/auth/me', {
        method: 'PATCH',
        body: JSON.stringify(formData),
      })
      updateUser({ ...user, ...formData })
      setEditing(null)
      addToast({ type: 'success', title: 'Profile updated', message: 'Your profile has been saved.' })
    } catch (err) {
      addToast({ type: 'error', title: 'Failed to update', message: 'Please try again.' })
    }
  }

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await apiJson('/api/user/addresses', {
        method: 'POST',
        body: JSON.stringify(formData),
      })
      addToast({ type: 'success', title: 'Address added', message: 'Your new address has been saved.' })
      setShowAddAddress(false)
      setFormData({})
      loadData()
    } catch (err) {
      addToast({ type: 'error', title: 'Failed to add address', message: 'Please try again.' })
    }
  }

  const handleDeleteAddress = async (id: string) => {
    if (!confirm('Are you sure you want to delete this address?')) return
    try {
      await apiJson(`/api/user/addresses/${id}`, { method: 'DELETE' })
      addToast({ type: 'success', title: 'Address deleted' })
      loadData()
    } catch (err) {
      addToast({ type: 'error', title: 'Failed to delete', message: 'Please try again.' })
    }
  }

  const handleSetDefaultAddress = async (id: string) => {
    try {
      await apiJson(`/api/user/addresses/${id}/default`, { method: 'POST' })
      loadData()
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
                  {profile.first_name} {profile.last_name}
                </h2>
                <p className="text-text-tertiary mt-1">{profile.email}</p>
                {profile.phone && <p className="text-text-tertiary text-sm mt-1">{profile.phone}</p>}
                <p className="text-text-tertiary text-sm mt-2">Member since {formatDateTime(profile.created_at)}</p>
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
                          value={formData.first_name}
                          onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                          required
                        />
                        <Input
                          label="Last Name"
                          value={formData.last_name}
                          onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                          required
                        />
                      </div>
                      <Input
                        label="Phone Number"
                        type="tel"
                        value={formData.phone}
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
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h2 className="text-xl font-semibold text-text-primary">Saved Addresses</h2>
              <Button onClick={() => {
                setFormData({ label: '', address: '', city: '', state: '', postal_code: '', is_default: false })
                setShowAddAddress(true)
              }}>
                <Plus className="w-4 h-4 mr-2" />
                Add Address
              </Button>
            </div>

            {addresses.length === 0 && !showAddAddress ? (
              <Card variant="outlined" className="p-8 text-center">
                <MapPin className="w-16 h-16 mx-auto text-text-tertiary mb-4" />
                <h3 className="text-lg font-semibold text-text-primary mb-2">No addresses saved</h3>
                <p className="text-text-secondary mb-4">Add an address to speed up checkout.</p>
                <Button onClick={() => {
                  setFormData({ label: '', address: '', city: '', state: '', postal_code: '', is_default: false })
                  setShowAddAddress(true)
                }}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Address
                </Button>
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
                        value={formData.label}
                        onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                        required
                      />
                      <Input
                        label="Street Address"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        required
                      />
                      <div className="grid grid-cols-2 gap-4">
                        <Input
                          label="City"
                          value={formData.city}
                          onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                          required
                        />
                        <Input
                          label="State"
                          value={formData.state}
                          onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                          required
                        />
                      </div>
                      <Input
                        label="Postal Code (Optional)"
                        value={formData.postal_code}
                        onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                      />
                      <label className="flex items-center gap-2 text-sm text-text-secondary">
                        <input
                          type="checkbox"
                          checked={formData.is_default}
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
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h2 className="text-xl font-semibold text-text-primary">Payment Methods</h2>
              <Button onClick={() => {
                setFormData({ type: 'card', is_default: false })
                setShowAddPayment(true)
              }}>
                <Plus className="w-4 h-4 mr-2" />
                Add Payment Method
              </Button>
            </div>

            {paymentMethods.length === 0 && !showAddPayment ? (
              <Card variant="outlined" className="p-8 text-center">
                <CreditCard className="w-16 h-16 mx-auto text-text-tertiary mb-4" />
                <h3 className="text-lg font-semibold text-text-primary mb-2">No payment methods saved</h3>
                <p className="text-text-secondary mb-4">Add a payment method for faster checkout.</p>
                <Button onClick={() => {
                  setFormData({ type: 'card', is_default: false })
                  setShowAddPayment(true)
                }}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Payment Method
                </Button>
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
                          value={formData.type}
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
                          checked={formData.is_default}
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
                              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
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
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-text-primary">Push Notifications</p>
                    <p className="text-sm text-text-tertiary">Receive order updates and promotions</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" defaultChecked className="sr-only peer" />
                    <div className="w-11 h-6 bg-ink-raised/50 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-coral rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-coral"></div>
                  </label>
                </div>
                <div className="border-t border-ink-raised/30" />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-text-primary">Email Notifications</p>
                    <p className="text-sm text-text-tertiary">Receive order confirmations and receipts</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" defaultChecked className="sr-only peer" />
                    <div className="w-11 h-6 bg-ink-raised/50 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-coral rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-coral"></div>
                  </label>
                </div>
                <div className="border-t border-ink-raised/30" />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-text-primary">SMS Notifications</p>
                    <p className="text-sm text-text-tertiary">Receive delivery updates via SMS</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" />
                    <div className="w-11 h-6 bg-ink-raised/50 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-coral rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-coral"></div>
                  </label>
                </div>
              </CardContent>
                          </Card>

            <Card variant="elevated">
              <CardHeader>
                <CardTitle className="text-text-primary">Privacy & Security</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Link href="/account/security" className="flex items-center justify-between p-4 hover:bg-ink-raised/30 rounded-lg transition-colors">
                  <div>
                    <p className="font-medium text-text-primary">Password & Security</p>
                    <p className="text-sm text-text-tertiary">Change password, enable 2FA</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-text-tertiary" />
                </Link>
                <div className="border-t border-ink-raised/30" />
                <Link href="/account/privacy" className="flex items-center justify-between p-4 hover:bg-ink-raised/30 rounded-lg transition-colors">
                  <div>
                    <p className="font-medium text-text-primary">Privacy Settings</p>
                    <p className="text-sm text-text-tertiary">Manage your data and visibility</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-text-tertiary" />
                </Link>
              </CardContent>
                          </Card>

            <Card variant="elevated">
              <CardHeader>
                <CardTitle className="text-text-primary">Danger Zone</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-destructive/10 rounded-lg border border-destructive/20">
                  <div>
                    <p className="font-medium text-destructive">Delete Account</p>
                    <p className="text-sm text-text-tertiary">Permanently delete your account and all data</p>
                  </div>
                  <Button variant="destructive" size="sm">Delete Account</Button>
                </div>
                            </CardContent>
                          </Card>
          </div>
        )}
      </div>
    </div>
  )
}