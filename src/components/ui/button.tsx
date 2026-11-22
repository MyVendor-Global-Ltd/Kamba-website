'use client'

import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cn } from '@/lib/utils'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link' | 'gold'
  size?: 'default' | 'sm' | 'lg' | 'icon' | 'xl'
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center rounded-lg text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50',
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'

const variants = {
  default: 'bg-coral text-ink hover:bg-coral/90 shadow-lg shadow-coral/25 active:scale-[0.98]',
  destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-lg shadow-destructive/25 active:scale-[0.98]',
  outline: 'border-2 border-input bg-transparent hover:bg-accent hover:text-accent-foreground active:scale-[0.98]',
  secondary: 'bg-navy text-text-primary hover:bg-navy/80 shadow-lg shadow-navy/25 active:scale-[0.98]',
  ghost: 'hover:bg-accent hover:text-accent-foreground active:scale-[0.98]',
  link: 'text-coral underline-offset-4 hover:underline',
  gold: 'bg-gold text-ink hover:bg-gold/90 shadow-lg shadow-gold/25 active:scale-[0.98] font-bold',
}

const sizes = {
  default: 'h-11 px-6 py-2.5',
  sm: 'h-9 rounded-md px-4',
  lg: 'h-12 rounded-lg px-8 text-base',
  xl: 'h-14 rounded-xl px-10 text-lg',
  icon: 'h-11 w-11',
}

export { Button }