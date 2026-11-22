"use client";

import Link from 'next/link'
import { useEffect, useState } from "react";

export function Footer() {
  const [year, setYear] = useState(2024);

  useEffect(() => {
    const updateYear = () => {
      setYear(new Date().getFullYear());
    };
    updateYear();
    const interval = setInterval(updateYear, 60 * 60 * 24 * 1000); // update daily
    return () => clearInterval(interval);
  }, []);

  const footerLinks = {
    marketplace: [
      { label: 'All Products', href: '/marketplace/products' },
      { label: 'All Services', href: '/marketplace/services' },
      { label: 'Stores', href: '/marketplace/stores' },
      { label: 'Categories', href: '/categories' },
    ],
    support: [
      { label: 'Help Center', href: '/help' },
      { label: 'Contact Us', href: '/contact' },
      { label: 'FAQ', href: '/faq' },
      { label: 'Escrow Policy', href: '/escrow-policy' },
    ],
    company: [
      { label: 'About Kamba', href: '/about' },
      { label: 'How It Works', href: '/how-it-works' },
      { label: 'Careers', href: '/careers' },
      { label: 'Press', href: '/press' },
    ],
    legal: [
      { label: 'Terms of Service', href: '/terms' },
      { label: 'Privacy Policy', href: '/privacy' },
      { label: 'Cookie Policy', href: '/cookies' },
      { label: 'Seller Agreement', href: '/seller-agreement' },
    ],
  }

  const socialLinks = [
    { label: 'Twitter', href: 'https://twitter.com/kamba', icon: 'twitter' },
    { label: 'Instagram', href: 'https://instagram.com/kamba', icon: 'instagram' },
    { label: 'LinkedIn', href: 'https://linkedin.com/company/kamba', icon: 'linkedin' },
  ]

  return (
    <footer className="border-t border-border/50 mt-auto bg-ink-raised/50">
      <div className="container mx-auto px-4 py-12 lg:py-16">
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-8 lg:gap-12">
          {/* Brand */}
          <div className="lg:col-span-2 space-y-4">
            <Link href="/" className="flex items-center gap-2" aria-label="Kamba Home">
              <span className="text-2xl font-bold font-display text-text-primary gradient-text">Kamba</span>
            </Link>
            <p className="text-text-secondary text-sm leading-relaxed max-w-xs">
              Nigeria's trusted marketplace for local products and services. Buy with confidence, sell with ease.
            </p>
            <div className="flex gap-4">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg bg-ink text-text-tertiary hover:text-coral hover:bg-coral-dim transition-all duration-200"
                  aria-label={social.label}
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    {social.icon === 'twitter' && (
                                        <>
                                          <path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z" />
                                        </>
                    )}
                    {social.icon === 'instagram' && (
                                        <>
                                          <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                                          <path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z" />
                                          <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                                        </>
                    )}
                    {social.icon === 'linkedin' && (
                                        <>
                                          <path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6z" />
                                          <rect x="2" y="9" width="4" height="12" />
                                          <circle cx="4" cy="4" r="2" />
                                        </>
                    )}
                  </svg>
                </a>
              ))}
            </div>
          </div>

          {/* Marketplace */}
          <nav aria-label="Marketplace links">
            <h4 className="font-semibold text-text-primary mb-4">Marketplace</h4>
            <ul className="space-y-3">
              {footerLinks.marketplace.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-text-tertiary hover:text-coral transition-colors duration-200"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Support */}
          <nav aria-label="Support links">
            <h4 className="font-semibold text-text-primary mb-4">Support</h4>
            <ul className="space-y-3">
              {footerLinks.support.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-text-tertiary hover:text-coral transition-colors duration-200"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Company */}
          <nav aria-label="Company links">
            <h4 className="font-semibold text-text-primary mb-4">Company</h4>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-text-tertiary hover:text-coral transition-colors duration-200"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Legal */}
          <nav aria-label="Legal links">
            <h4 className="font-semibold text-text-primary mb-4">Legal</h4>
            <ul className="space-y-3">
              {footerLinks.legal.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-text-tertiary hover:text-coral transition-colors duration-200"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-8 border-t border-border/50 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-text-tertiary">
            © {year} Kamba Marketplace. All rights reserved.
          </p>
          <div className="flex flex-wrap justify-center gap-6 text-sm text-text-tertiary">
            <span>Made with ❤️ for Nigeria</span>
            <span>Secure payments with Paystack</span>
          </div>
        </div>
      </div>
    </footer>
  )
}