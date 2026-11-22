'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'gold' | 'verification' | 'warning' | 'info'
  size?: 'default' | 'sm' | 'md' | 'lg'
}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-all duration-200',
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      />
    )
  }
)
Badge.displayName = 'Badge'

const variants = {
  default: 'bg-coral text-ink shadow-sm shadow-coral/20',
  secondary: 'bg-navy text-text-primary',
  destructive: 'bg-destructive/20 text-destructive border border-destructive/30',
  outline: 'border-2 border-border bg-transparent hover:bg-accent hover:text-accent-foreground',
  success: 'bg-green-500/20 text-green-400 border border-green-500/30',
  gold: 'bg-gold/20 text-gold border border-gold/30',
  verification: 'bg-coral-dim text-coral border border-coral/30',
  warning: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
  info: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
}

const sizes = {
  default: 'px-3 py-1 text-xs',
  sm: 'px-2.5 py-0.5 text-[10px]',
  md: 'px-3 py-1 text-xs',
  lg: 'px-4 py-1.5 text-sm',
}

export { Badge }