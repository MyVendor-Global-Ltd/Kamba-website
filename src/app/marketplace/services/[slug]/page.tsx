'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { apiJson } from '@/lib/api'
import { ServiceProfile } from '@/types/vendor'
import { useToast } from '@/components/ui/toast'
import { Calendar, Star, MapPin, Phone, Mail, Shield, CheckCircle, ChevronLeft, ChevronRight, MessageSquare, User, Briefcase } from 'lucide-react'

export default function ServiceDetailPage() {
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string
  const [service, setService] = useState<ServiceProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState<'details' | 'booking' | 'reviews'>('details')
  const [bookingStep, setBookingStep] = useState<'select' | 'details' | 'confirm'>('select')
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedTime, setSelectedTime] = useState<string>('')
  const [bookingDetails, setBookingDetails] = useState({ notes: '', address: '' })
  const { toast } = useToast()

  useEffect(() => {
    apiJson<{ service_profile?: ServiceProfile & { service_title?: string; location_text?: string; service_area_text?: string; vendor_profiles?: { is_verified?: boolean; verification_tier?: string } }; service?: ServiceProfile }>(`/vendors/services/${slug}`)
      .then((data) => {
        const raw = data.service_profile || data.service
        if (!raw) throw new Error('This service is not available.')
        const tier = raw.vendor_profiles?.verification_tier
        const verificationStatus: ServiceProfile['verification_status'] = raw.verification_status || (raw.vendor_profiles?.is_verified ? (tier === 'business' ? 'business' : tier === 'nin' ? 'nin' : 'basic') : 'pending')
        setService({ ...raw, name: raw.name || raw.service_title || 'Service', city: raw.city || raw.location_text || raw.service_area_text, vendor_id: raw.vendor_id || '', is_active: raw.is_active ?? true, created_at: raw.created_at || '', updated_at: raw.updated_at || '', verification_status: verificationStatus })
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message || 'Failed to load service')
        setLoading(false)
      })
  }, [slug])

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!service) return

    try {
      if (!selectedDate || !selectedTime || !bookingDetails.address.trim()) {
        toast({ type: 'error', title: 'Missing booking details', description: 'Choose a preferred date and time, and enter the service location.' })
        return
      }
      const [hours, minutes] = selectedTime.split(':').map(Number)
      const requestedStart = new Date(selectedDate)
      requestedStart.setHours(hours, minutes, 0, 0)
      const description = [bookingDetails.notes.trim(), `Preferred service location: ${bookingDetails.address.trim()}`].filter(Boolean).join('\n')
      await apiJson<{ request: { id: string; status: string } }>('/service-bookings/requests', {
        method: 'POST',
        headers: { 'Idempotency-Key': crypto.randomUUID() },
        body: JSON.stringify({
          service_profile_id: service.id,
          request_type: 'booking',
          description: description.length >= 10 ? description : `Booking request for ${service.name}. ${description}`,
          requested_start_at: requestedStart.toISOString(),
          service_location: { address: bookingDetails.address.trim() },
        }),
      })
      toast({
        type: 'success',
        title: 'Booking request submitted',
        description: 'Your preferred time has been sent to the provider. It is not confirmed until the provider accepts it.',
      })
      setBookingStep('select')
      setSelectedDate(null)
      setSelectedTime('')
      setBookingDetails({ notes: '', address: '' })
    } catch {
      toast({
        type: 'error',
        title: 'Booking Failed',
        description: 'Please try again or contact the provider directly.',
      })
    }
  }

  const availableTimes = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00']

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 lg:py-12 space-y-8 animate-fade-in">
        <div className="space-y-4 animate-pulse">
          <div className="h-10 w-1/3 bg-ink-raised/50 rounded-lg" />
          <div className="h-6 w-1/2 bg-ink-raised/50 rounded-lg" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card variant="elevated">
            <CardHeader>
              <div className="h-6 w-1/4 bg-ink-raised/50 rounded" />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="h-4 w-full bg-ink-raised/50 rounded" />
              <div className="h-4 w-3/4 bg-ink-raised/50 rounded" />
              <div className="h-4 w-1/2 bg-ink-raised/50 rounded" />
              <div className="h-4 w-2/3 bg-ink-raised/50 rounded" />
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (!service) {
    return (
      <div className="container mx-auto px-4 py-8 lg:py-12 flex h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-ink-raised/50 flex items-center justify-center mx-auto mb-4 text-text-tertiary">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 7v3m0-7h3m-3 0H7" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-text-primary mb-2">Service not found</h2>
          <p className="text-text-tertiary">The service you're looking for doesn't exist or has been removed.</p>
          <Button variant="outline" className="mt-4" onClick={() => router.back()}>
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back to services
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 lg:py-12 space-y-8">
      {/* Header */}
      <header className="animate-fade-in">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <Link href="/marketplace/services" className="inline-flex items-center gap-2 text-sm text-text-tertiary hover:text-coral transition-colors mb-4">
              <ChevronLeft className="w-4 h-4" />
              All Services
            </Link>
            <h1 className="text-3xl lg:text-4xl font-bold font-display text-text-primary">{service.name}</h1>
            <p className="text-text-secondary mt-2">{service.description || 'No description available'}</p>
            <div className="flex flex-wrap items-center gap-3 mt-4">
              {service.verification_status !== 'pending' && (
                <Badge variant="verification" size="md">
                  <Shield className="w-3.5 h-3.5 mr-1.5" />
                  {service.verification_status === 'business' ? 'Business Verified' : 
                   service.verification_status === 'nin' ? 'NIN Verified' : 'Basic Verified'}
                </Badge>
              )}
              {service.category && (
                <Badge variant="secondary" size="sm">
                  <Briefcase className="w-3.5 h-3.5 mr-1.5" />
                  {service.category}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </header>

      {error && (
        <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm animate-slide-up">
          {error}
        </div>
      )}

      {/* Main Content */}
      <section className="animate-slide-up" style={{ animationDelay: '100ms' }}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Service Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Tabs */}
            <div className="flex border-b border-ink-raised/30">
              {[
                { id: 'details', label: 'Details', icon: Briefcase },
                { id: 'booking', label: 'Book Service', icon: Calendar },
                { id: 'reviews', label: 'Reviews', icon: Star },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all duration-200 border-b-2 -mb-px ${
                    activeTab === tab.id
                      ? 'text-coral border-coral'
                      : 'text-text-tertiary hover:text-text-secondary border-transparent'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Details Tab */}
            {activeTab === 'details' && (
              <Card variant="elevated">
                <CardContent className="space-y-6 p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-text-primary">Service Information</h3>
                      {service.category && (
                        <div className="flex items-center gap-3 p-3 bg-ink-raised/30 rounded-xl">
                          <Briefcase className="w-5 h-5 text-coral" />
                          <div>
                            <p className="text-xs text-text-tertiary">Category</p>
                            <p className="font-medium text-text-primary">{service.category}</p>
                          </div>
                        </div>
                      )}
                      {(service.city || service.state) && (
                        <div className="flex items-center gap-3 p-3 bg-ink-raised/30 rounded-xl">
                          <MapPin className="w-5 h-5 text-coral" />
                          <div>
                            <p className="text-xs text-text-tertiary">Location</p>
                            <p className="font-medium text-text-primary">{[service.city, service.state].filter(Boolean).join(', ')}</p>
                          </div>
                        </div>
                      )}
                      {service.address && (
                        <div className="flex items-center gap-3 p-3 bg-ink-raised/30 rounded-xl">
                          <MapPin className="w-5 h-5 text-coral" />
                          <div>
                            <p className="text-xs text-text-tertiary">Address</p>
                            <p className="font-medium text-text-primary">{service.address}</p>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-text-primary">Contact Details</h3>
                      {service.phone && (
                        <div className="flex items-center gap-3 p-3 bg-ink-raised/30 rounded-xl">
                          <Phone className="w-5 h-5 text-coral" />
                          <div>
                            <p className="text-xs text-text-tertiary">Phone</p>
                            <a href={`tel:${service.phone}`} className="font-medium text-coral hover:text-coral/80 transition-colors">
                              {service.phone}
                            </a>
                          </div>
                        </div>
                      )}
                      {service.email && (
                        <div className="flex items-center gap-3 p-3 bg-ink-raised/30 rounded-xl">
                          <Mail className="w-5 h-5 text-coral" />
                          <div>
                            <p className="text-xs text-text-tertiary">Email</p>
                            <a href={`mailto:${service.email}`} className="font-medium text-coral hover:text-coral/80 transition-colors">
                              {service.email}
                            </a>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {service.description && (
                    <div className="pt-4 border-t border-ink-raised/30">
                      <h3 className="text-lg font-semibold text-text-primary mb-3">About this Service</h3>
                      <p className="text-text-secondary leading-relaxed">{service.description}</p>
                    </div>
                  )}

                  {/* Verification Badges */}
                  <div className="pt-4 border-t border-ink-raised/30">
                    <h3 className="text-lg font-semibold text-text-primary mb-3">Verification Status</h3>
                    <div className="flex flex-wrap gap-3">
                      <Badge variant={service.verification_status === 'business' ? 'success' : 'outline'} size="md">
                        <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
                        Business Registration
                      </Badge>
                      <Badge variant={service.verification_status === 'nin' ? 'success' : 'outline'} size="md">
                        <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
                        NIN Verified
                      </Badge>
                      <Badge variant="outline" size="md">
                        <Shield className="w-3.5 h-3.5 mr-1.5" />
                        Platform Protected
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Booking Tab */}
            {activeTab === 'booking' && (
              <Card variant="elevated">
                <CardContent className="p-6">
                  {bookingStep === 'select' && (
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-semibold text-text-primary mb-4">Select Date & Time</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-text-secondary mb-2">Date</label>
                            <input
                              type="date"
                              min={new Date().toISOString().split('T')[0]}
                              value={selectedDate ? selectedDate.toISOString().split('T')[0] : ''}
                              onChange={(e) => setSelectedDate(e.target.value ? new Date(e.target.value) : null)}
                              className="w-full flex h-12 px-4 py-2.5 text-sm text-text-primary placeholder:text-text-tertiary transition-all duration-200 bg-ink-raised/50 border border-border/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-coral focus:border-coral focus:bg-ink-raised"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-text-secondary mb-2">Time</label>
                            <select
                              value={selectedTime}
                              onChange={(e) => setSelectedTime(e.target.value)}
                              className="w-full flex h-12 px-4 py-2.5 text-sm text-text-primary placeholder:text-text-tertiary transition-all duration-200 bg-ink-raised/50 border border-border/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-coral focus:border-coral focus:bg-ink-raised"
                            >
                              <option value="">Select a time</option>
                              {availableTimes.map((time) => (
                                <option key={time} value={time}>{time}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-3 pt-4">
                        <Button variant="outline" className="flex-1" onClick={() => setBookingStep('select')}>
                          Cancel
                        </Button>
                        <Button 
                          variant="default" 
                          className="flex-1" 
                          onClick={() => {
                            if (selectedDate && selectedTime) {
                              setBookingStep('details')
                            } else {
                              toast({
                                type: 'error',
                                title: 'Missing Information',
                                description: 'Please select both date and time.',
                              })
                            }
                          }}
                        >
                          Continue
                          <ChevronRight className="w-4 h-4 ml-2" />
                        </Button>
                      </div>
                    </div>
                  )}

                  {bookingStep === 'details' && (
                    <form onSubmit={handleBookingSubmit} className="space-y-6">
                      <div>
                        <h3 className="text-lg font-semibold text-text-primary mb-4">Booking Details</h3>
                        <div className="p-4 bg-ink-raised/30 rounded-xl mb-4">
                          <p className="text-sm text-text-secondary">Service: <span className="font-medium text-text-primary">{service.name}</span></p>
                          <p className="text-sm text-text-secondary">Date: <span className="font-medium text-text-primary">{selectedDate?.toLocaleDateString()}</span></p>
                          <p className="text-sm text-text-secondary">Time: <span className="font-medium text-text-primary">{selectedTime}</span></p>
                        </div>
                      </div>

                      <div>
                        <label htmlFor="address" className="block text-sm font-medium text-text-secondary mb-2">
                          Service Address <span className="text-coral">*</span>
                        </label>
                        <textarea
                          id="address"
                          value={bookingDetails.address}
                          onChange={(e) => setBookingDetails({ ...bookingDetails, address: e.target.value })}
                          rows={3}
                          min={new Date().toISOString().slice(0, 10)}
                          placeholder="Enter the service address or agreed meeting location"
                          className="w-full px-4 py-3 text-sm text-text-primary placeholder:text-text-tertiary transition-all duration-200 bg-ink-raised/50 border border-border/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-coral focus:border-coral focus:bg-ink-raised"
                          required
                        />
                      </div>

                      <div>
                        <label htmlFor="notes" className="block text-sm font-medium text-text-secondary mb-2">
                          Additional Notes
                        </label>
                        <textarea
                          id="notes"
                          value={bookingDetails.notes}
                          onChange={(e) => setBookingDetails({ ...bookingDetails, notes: e.target.value })}
                          rows={3}
                          placeholder="Any special requirements or instructions for the provider..."
                          className="w-full px-4 py-3 text-sm text-text-primary placeholder:text-text-tertiary transition-all duration-200 bg-ink-raised/50 border border-border/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-coral focus:border-coral focus:bg-ink-raised"
                        />
                      </div>

                      <div className="flex gap-3 pt-4">
                        <Button variant="outline" type="button" className="flex-1" onClick={() => setBookingStep('select')}>
                          <ChevronLeft className="w-4 h-4 mr-2" />
                          Back
                        </Button>
                        <Button variant="default" type="submit" className="flex-1">
                          Confirm Booking
                        </Button>
                      </div>
                    </form>
                  )}
                </CardContent>
              </Card>
            )}

            {activeTab === 'reviews' && (
              <Card variant="outlined">
                <CardContent className="p-6 text-sm text-text-secondary">
                  Service reviews are not available yet. Kamba will only display reviews after verified review data is connected.
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Quick Actions */}
          <div className="space-y-6">
            <Card variant="elevated">
              <CardHeader>
                <CardTitle className="text-text-primary">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {service.phone && (
                  <a href={`tel:${service.phone}`}>
                    <Button variant="default" className="w-full justify-start gap-3">
                      <Phone className="w-5 h-5" />
                      <span>Call Now</span>
                    </Button>
                  </a>
                )}
                {service.email && (
                  <a href={`mailto:${service.email}`}>
                    <Button variant="outline" className="w-full justify-start gap-3">
                      <Mail className="w-5 h-5" />
                      <span>Email Provider</span>
                    </Button>
                  </a>
                )}
                <Button variant="outline" className="w-full justify-start gap-3" onClick={() => setActiveTab('booking')}>
                  <Calendar className="w-5 h-5" />
                  <span>Book Service</span>
                </Button>
                <Button variant="ghost" className="w-full justify-start gap-3" onClick={() => toast({ type: 'info', title: 'Messaging is not available yet', description: 'Send a booking or quote request to start the service conversation.' })}>
                  <MessageSquare className="w-5 h-5" />
                  <span>Message Provider</span>
                </Button>
                <Button variant="ghost" className="w-full justify-start gap-3" onClick={async () => { try { if (navigator.share) await navigator.share({ title: service.name, url: window.location.href }); else { await navigator.clipboard.writeText(window.location.href); toast({ type: 'success', title: 'Link copied', description: 'Service link copied to clipboard.' }) } } catch { toast({ type: 'error', title: 'Could not share service', description: 'Copy the page link from your browser instead.' }) } }}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                  <span>Share Service</span>
                </Button>
              </CardContent>
            </Card>

            {/* Provider Info Card */}
            <Card variant="elevated">
              <CardHeader>
                <CardTitle className="text-text-primary">Provider</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-coral/20 flex items-center justify-center">
                    <User className="w-7 h-7 text-coral" />
                  </div>
                  <div>
                    <p className="font-semibold text-text-primary">{service.name}</p>
                    <p className="text-sm text-text-tertiary">Service Provider</p>
                  </div>
                </div>
                <div className="pt-4 border-t border-ink-raised/30 space-y-2">
                  <div className="flex items-center gap-2 text-sm text-text-secondary">
                    <Briefcase className="w-4 h-4 text-coral" />
                    <span>{service.category || 'General Services'}</span>
                  </div>
                  {(service.city || service.state) && (
                    <div className="flex items-center gap-2 text-sm text-text-secondary">
                      <MapPin className="w-4 h-4 text-coral" />
                      <span>{[service.city, service.state].filter(Boolean).join(', ')}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm text-text-secondary">
                    <Shield className="w-4 h-4 text-coral" />
                    <span>{service.verification_status === 'business' ? 'Business Verified' : service.verification_status === 'nin' ? 'NIN Verified' : 'Basic Verified'}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  )
}
