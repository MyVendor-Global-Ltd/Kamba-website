'use client'

import { forwardRef } from 'react'

export interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  color?: 'primary' | 'coral' | 'gold' | 'white'
}

const sizeClasses = {
  sm: 'h-4 w-4 border-2',
  md: 'h-8 w-8 border-2',
  lg: 'h-12 w-12 border-3',
  xl: 'h-16 w-16 border-4',
}

const colorClasses = {
  primary: 'border-primary border-t-transparent',
  coral: 'border-coral border-t-transparent',
  gold: 'border-gold border-t-transparent',
  white: 'border-white border-t-transparent',
}

export const Spinner = forwardRef<HTMLDivElement, SpinnerProps>(
  ({ className, size = 'md', color = 'primary', ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`animate-spin rounded-full ${sizeClasses[size]} ${colorClasses[color]} ${className || ''}`}
        role="status"
        aria-label="Loading"
        {...props}
      >
        <span className="sr-only">Loading...</span>
      </div>
    )
  }
)

Spinner.displayName = 'Spinner'

export interface LoadingOverlayProps {
  isLoading: boolean
  children: React.ReactNode
  message?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

export function LoadingOverlay({ isLoading, children, message, size = 'md' }: LoadingOverlayProps) {
  return (
    <div className="relative">
      {children}
      {isLoading && (
        <div className="absolute inset-0 bg-ink/80 backdrop-blur-sm flex items-center justify-center z-10 rounded-lg">
          <div className="flex flex-col items-center gap-3 text-white">
            <Spinner size={size} color="coral" />
            {message && <p className="text-sm font-medium">{message}</p>}
          </div>
        </div>
      )}
    </div>
  )
}

export interface ButtonLoaderProps {
  isLoading: boolean
  children: React.ReactNode
  loadingText?: string
}

export function ButtonLoader({ isLoading, children, loadingText = 'Loading...' }: ButtonLoaderProps) {
  return (
    <span className="flex items-center justify-center gap-2">
      {isLoading && <Spinner size="sm" color="white" />}
      <span>{isLoading ? loadingText : children}</span>
    </span>
  )
}