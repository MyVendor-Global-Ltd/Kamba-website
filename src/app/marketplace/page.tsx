'use client'

import Link from "next/link";
import { useEffect, useState } from 'react';
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatDistance } from "@/lib/haversine";
import { apiJson } from "@/lib/api";
import { Store } from "@/types/vendor";
import { ServiceProfile } from "@/types/vendor";
import { ProductCardSkeleton, StoreCardSkeleton, ServiceCardSkeleton } from "@/components/ui/skeleton";

export default function MarketplacePage() {
  const [stores, setStores] = useState<Store[]>([]);
  const [services, setServices] = useState<ServiceProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      apiJson<{ stores: Store[] }>("/vendors/stores"),
      apiJson<{ services: ServiceProfile[] }>("/vendors/services"),
    ])
      .then(([storesData, servicesData]) => {
        setStores(storesData.stores || []);
        setServices(servicesData.services || []);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || "Failed to load marketplace data");
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="space-y-8 animate-fade-in">
        <div className="space-y-4">
          <div className="h-10 w-1/3 bg-ink-raised/50 rounded-lg animate-pulse" />
          <div className="h-6 w-1/2 bg-ink-raised/50 rounded-lg animate-pulse" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <StoreCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 lg:py-12 space-y-12">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-navy via-ink to-ink border border-border/50 p-8 lg:p-12 animate-fade-in">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--coral-glow)_0%,_transparent_70%)] opacity-50" />
        <div className="relative z-10 max-w-3xl">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-coral-dim text-coral text-sm font-semibold mb-6">
            <span className="w-2 h-2 rounded-full bg-coral animate-pulse" />
            Now serving 50+ cities across Nigeria
          </span>
          <h1 className="text-4xl lg:text-5xl font-bold font-display text-text-primary leading-tight mb-6">
            Discover Local <span className="gradient-text">Products & Services</span>
          </h1>
          <p className="text-lg text-text-secondary mb-8 max-w-xl">
            Nigeria's trusted marketplace connecting you with verified local businesses. Shop products, book services, and pay securely with escrow protection.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link href="/marketplace/stores">
              <Button size="lg" variant="default">
                Browse Stores
                <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Button>
            </Link>
            <Link href="/marketplace/services">
              <Button size="lg" variant="outline">
                Book Services
                <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </Button>
            </Link>
          </div>
        </div>
        {/* Decorative elements */}
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-coral/5 rounded-full blur-3xl -translate-x-1/2 translate-y-1/2" aria-hidden="true" />
        <div className="absolute top-0 left-0 w-72 h-72 bg-gold/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" aria-hidden="true" />
      </section>

      {/* Trust Indicators */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-slide-up" style={{ animationDelay: '100ms' }}>
        {[
          { icon: 'shield', label: 'Verified Vendors', desc: 'NIN & Business verified' },
          { icon: 'lock', label: 'Secure Escrow', desc: 'Pay on delivery' },
          { icon: 'truck', label: 'Fast Delivery', desc: 'Same-day in major cities' },
          { icon: 'star', label: 'Quality Guaranteed', desc: 'Ratings & reviews' },
        ].map((item, i) => (
          <div key={item.label} className="group p-6 rounded-2xl bg-card border border-border/50 hover:border-coral/30 hover:shadow-lg hover:shadow-coral/10 transition-all duration-300">
            <div className="w-12 h-12 rounded-xl bg-coral-dim flex items-center justify-center text-coral mb-4 group-hover:scale-110 transition-transform duration-300">
              {item.icon === 'shield' && (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              )}
              {item.icon === 'lock' && (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              )}
              {item.icon === 'truck' && (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6 0H7" />
                </svg>
              )}
              {item.icon === 'star' && (
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              )}
            </div>
            <h3 className="font-semibold text-text-primary mb-1">{item.label}</h3>
            <p className="text-sm text-text-tertiary">{item.desc}</p>
          </div>
        ))}
      </section>

      {/* Stores Section */}
      <section className="animate-slide-up" style={{ animationDelay: '200ms' }}>
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl lg:text-3xl font-bold font-display text-text-primary">Stores</h2>
            <p className="text-text-secondary mt-1">Shop products from local vendors</p>
          </div>
          <Link href="/marketplace/stores" className="flex items-center gap-2 text-coral hover:underline font-medium">
            View all stores
            <Badge variant="default" className="text-xs">{stores.length}</Badge>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {stores.map((store) => (
            <Card key={store.id} variant="elevated" className="h-full group">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-text-primary group-hover:text-coral transition-colors">{store.name}</CardTitle>
                  {store.distance_km !== undefined && (
                    <Badge variant="outline" size="sm">
                      {formatDistance(store.distance_km)}
                    </Badge>
                  )}
                </div>
                {store.verification_status !== 'pending' && (
                  <Badge variant="verification" size="sm" className="mt-2">
                    {store.verification_status === 'business' ? 'Business Verified' : 
                     store.verification_status === 'nin' ? 'NIN Verified' : 'Basic Verified'}
                  </Badge>
                )}
              </CardHeader>
              <CardContent className="pb-2">
                {store.description && (
                  <p className="text-sm text-text-tertiary line-clamp-3 mb-4">{store.description}</p>
                )}
                {store.city && store.state && (
                  <div className="flex items-center gap-2 text-xs text-text-tertiary">
                    <svg className="w-3.5 h-3.5 text-coral/50" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>{store.city}, {store.state}</span>
                  </div>
                )}
              </CardContent>
              <CardFooter className="pt-0">
                <Link href={`/marketplace/stores/${store.slug}`}>
                  <Button variant="outline" className="w-full group-hover:border-coral group-hover:text-coral transition-colors">
                    View store
                    <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          ))}

          {stores.length === 0 && (
            <div className="col-span-full text-center py-16">
              <div className="w-16 h-16 rounded-full bg-ink-raised/50 flex items-center justify-center mx-auto mb-4 text-text-tertiary">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-text-primary mb-2">No stores found</h3>
              <p className="text-text-tertiary">Check back soon for new vendors in your area.</p>
            </div>
          )}
        </div>
      </section>

      {/* Services Section */}
      <section className="animate-slide-up" style={{ animationDelay: '300ms' }}>
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl lg:text-3xl font-bold font-display text-text-primary">Services</h2>
            <p className="text-text-secondary mt-1">Book local services from verified vendors</p>
          </div>
          <Link href="/marketplace/services" className="flex items-center gap-2 text-coral hover:underline font-medium">
            View all services
            <Badge variant="default" className="text-xs">{services.length}</Badge>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service) => (
            <Card key={service.id} variant="elevated" className="h-full group">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-text-primary group-hover:text-coral transition-colors">{service.name}</CardTitle>
                  {service.category && (
                    <Badge variant="secondary" size="sm">{service.category}</Badge>
                  )}
                </div>
                {service.verification_status !== 'pending' && (
                  <Badge variant="verification" size="sm" className="mt-2">
                    {service.verification_status === 'business' ? 'Business Verified' : 
                     service.verification_status === 'nin' ? 'NIN Verified' : 'Basic Verified'}
                  </Badge>
                )}
              </CardHeader>
              <CardContent className="pb-2">
                {service.description && (
                  <p className="text-sm text-text-tertiary line-clamp-3 mb-4">{service.description}</p>
                )}
                {service.city && service.state && (
                  <div className="flex items-center gap-2 text-xs text-text-tertiary">
                    <svg className="w-3.5 h-3.5 text-coral/50" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>{service.city}, {service.state}</span>
                  </div>
                )}
              </CardContent>
              <CardFooter className="pt-0">
                <Link href={`/marketplace/services/${service.slug}`}>
                  <Button variant="outline" className="w-full group-hover:border-coral group-hover:text-coral transition-colors">
                    View service
                    <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          ))}

          {services.length === 0 && (
            <div className="col-span-full text-center py-16">
              <div className="w-16 h-16 rounded-full bg-ink-raised/50 flex items-center justify-center mx-auto mb-4 text-text-tertiary">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-text-primary mb-2">No services found</h3>
              <p className="text-text-tertiary">Check back soon for new service providers in your area.</p>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative rounded-3xl bg-gradient-to-r from-coral/10 via-ink to-navy/10 border border-coral/20 p-8 lg:p-12 text-center animate-fade-in" style={{ animationDelay: '400ms' }}>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--coral-glow)_0%,_transparent_70%)] opacity-30" />
        <div className="relative z-10 max-w-2xl mx-auto">
          <h2 className="text-2xl lg:text-3xl font-bold font-display text-text-primary mb-4">
            Ready to start selling?
          </h2>
          <p className="text-text-secondary mb-8">
            Join thousands of Nigerian businesses growing on Kamba. Create your store in minutes.
          </p>
          <Link href="/vendor/onboard">
            <Button size="xl" variant="gold">
              Become a Vendor
              <svg className="ml-2 w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </Button>
          </Link>
        </div>
      </section>
    </div>
  )
}
