import type { Metadata } from 'next'
import { Suspense } from 'react'
import { Space_Grotesk, Plus_Jakarta_Sans } from 'next/font/google'
import { AuthProvider } from '@/context/AuthContext'
import { CartProvider } from '@/context/CartContext'
import { ThemeProvider } from '@/context/ThemeContext'
import { ToastProvider } from '@/components/ui/toast'
import { AppChrome } from '@/components/layout/app-chrome'
import { FirebaseForegroundNotifications } from '@/components/notifications/FirebaseForegroundNotifications'
import './globals.css'

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-display-loaded',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
})

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-ui-loaded',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
})

export const metadata: Metadata = {
  title: 'Kamba Marketplace',
  description: 'Buy and sell products and services with Kamba',
}

function HeaderSkeleton() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-surface">
      <div className="container mx-auto">
        <div className="flex h-16 items-center justify-between gap-4 animate-pulse">
          <div className="h-8 w-32 bg-ink-raised/50 rounded" />
          <div className="flex-1" />
          <div className="h-10 w-64 bg-ink-raised/50 rounded" />
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 bg-ink-raised/50 rounded-full" />
            <div className="h-10 w-10 bg-ink-raised/50 rounded-full" />
          </div>
        </div>
      </div>
    </header>
  )
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${plusJakartaSans.variable} scroll-smooth`}>
      <body className="min-h-screen flex flex-col antialiased bg-background text-foreground font-ui">
        <ThemeProvider>
          <AuthProvider>
            <CartProvider>
              <ToastProvider>
                <FirebaseForegroundNotifications />
                <Suspense fallback={<HeaderSkeleton />}>
                  <AppChrome>{children}</AppChrome>
                </Suspense>
              </ToastProvider>
            </CartProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
