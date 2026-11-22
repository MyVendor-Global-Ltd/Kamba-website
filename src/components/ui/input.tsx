'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, error, helperText, id, ...props }, ref) => {
    const inputId = id || React.useId()
    const errorId = error ? `${inputId}-error` : undefined
    const helperId = helperText ? `${inputId}-helper` : undefined
    const describedBy = [errorId, helperId].filter(Boolean).join(' ') || undefined

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-text-secondary mb-2"
          >
            {label}
          </label>
        )}
        <input
          type={type}
          id={inputId}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={describedBy}
          className={cn(
            'flex h-11 w-full rounded-lg border bg-ink-raised/50 px-4 py-2.5 text-sm text-text-primary placeholder:text-text-tertiary transition-all duration-200',
            'focus:outline-none focus:ring-2 focus:ring-coral focus:border-coral focus:bg-ink-raised',
            'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-ink-raised/30',
            error && 'border-destructive/50 focus:ring-destructive focus:border-destructive',
            className
          )}
          ref={ref}
          {...props}
        />
        {error && (
          <p id={errorId} className="mt-1.5 text-sm text-destructive" role="alert">
            {error}
          </p>
        )}
        {helperText && !error && (
          <p id={helperId} className="mt-1.5 text-sm text-text-tertiary">
            {helperText}
          </p>
        )}
      </div>
    )
  }
)
Input.displayName = 'Input'

export { Input }