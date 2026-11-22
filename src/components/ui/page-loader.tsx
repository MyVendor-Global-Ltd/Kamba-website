'use client'

import { Spinner } from '@/components/ui/spinner'

export function PageLoader({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <Spinner size="lg" color="coral" />
      <p className="text-muted-foreground text-sm">{message}</p>
    </div>
  )
}

export function SectionLoader({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 gap-4">
      <Spinner size="md" color="coral" />
      <p className="text-muted-foreground text-sm">{message}</p>
    </div>
  )
}

export function InlineLoader({ size = 'sm' }: { size?: 'sm' | 'md' }) {
  return <Spinner size={size} color="coral" />
}

export function ButtonLoader({ isLoading, children, loadingText = 'Loading...' }: { 
  isLoading: boolean
  children: React.ReactNode
  loadingText?: string
}) {
  return (
    <span className="flex items-center justify-center gap-2">
      {isLoading && <Spinner size="sm" color="white" />}
      <span>{isLoading ? loadingText : children}</span>
    </span>
  )
}