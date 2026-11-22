'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'outlined' | 'glass'
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'rounded-2xl transition-all duration-300',
        variants[variant],
        className
      )}
      {...props}
    />
  )
)
Card.displayName = 'Card'

const variants = {
  default: 'bg-card border border-border shadow-sm hover:shadow-lg hover:shadow-coral/10',
  elevated: 'bg-card border border-border shadow-xl shadow-coral/5 hover:shadow-2xl hover:shadow-coral/15',
  outlined: 'bg-transparent border-2 border-border hover:border-coral/50',
  glass: 'glass shadow-xl',
}

interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {}
const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex flex-col space-y-2 p-6', className)} {...props} />
  )
)
CardHeader.displayName = 'CardHeader'

interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {}
const CardTitle = React.forwardRef<HTMLHeadingElement, CardTitleProps>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn('text-xl font-bold leading-tight tracking-tight text-text-primary', className)}
      {...props}
    />
  )
)
CardTitle.displayName = 'CardTitle'

interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {}
const CardContent = React.forwardRef<HTMLDivElement, CardContentProps>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
  )
)
CardContent.displayName = 'CardContent'

interface CardDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {}
const CardDescription = React.forwardRef<HTMLParagraphElement, CardDescriptionProps>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn('text-sm text-text-tertiary', className)} {...props} />
  )
)
CardDescription.displayName = 'CardDescription'

interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {}
const CardFooter = React.forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex items-center p-6 pt-0', className)} {...props} />
  )
)
CardFooter.displayName = 'CardFooter'

export { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter }