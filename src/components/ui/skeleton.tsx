'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'circular' | 'rectangular' | 'text'
}

const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className, variant = 'default', ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'animate-pulse bg-gradient-to-r from-ink-raised via-border to-ink-raised bg-[length:200%_100%] animate-shimmer rounded-lg',
          variants[variant],
          className
        )}
        {...props}
      />
    )
  }
)
Skeleton.displayName = 'Skeleton'

const variants = {
  default: 'h-4 w-full',
  circular: 'rounded-full',
  rectangular: 'rounded-lg',
  text: 'h-4 w-3/4',
}

export { Skeleton }

/* Pre-built skeleton components */
export function ProductCardSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="aspect-square rounded-xl" variant="rectangular" />
      <div className="space-y-2 px-1">
        <Skeleton className="h-5 w-3/4" variant="text" />
        <Skeleton className="h-4 w-1/2" variant="text" />
        <Skeleton className="h-5 w-1/4" variant="text" />
      </div>
    </div>
  )
}

export function StoreCardSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="aspect-video rounded-xl" variant="rectangular" />
      <div className="space-y-2 px-1">
        <Skeleton className="h-6 w-1/2" variant="text" />
        <Skeleton className="h-4 w-1/3" variant="text" />
        <div className="flex gap-2">
          <Skeleton className="h-5 w-20" variant="circular" />
          <Skeleton className="h-5 w-20" variant="circular" />
        </div>
      </div>
    </div>
  )
}

export function ServiceCardSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="aspect-video rounded-xl" variant="rectangular" />
      <div className="space-y-2 px-1">
        <Skeleton className="h-6 w-2/3" variant="text" />
        <Skeleton className="h-4 w-1/2" variant="text" />
        <div className="flex gap-2">
          <Skeleton className="h-5 w-24" variant="circular" />
        </div>
      </div>
    </div>
  )
}

export function PageSkeleton() {
  return (
    <div className="space-y-8 animate-fade-in">
      <div className="space-y-4">
        <Skeleton className="h-10 w-1/3" variant="text" />
        <Skeleton className="h-6 w-1/2" variant="text" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    </div>
  )
}