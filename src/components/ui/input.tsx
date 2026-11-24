'use client'

import * as React from 'react'
import { Eye, EyeOff } from 'lucide-react'
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
    const [passwordVisible, setPasswordVisible] = React.useState(false)
    const isPassword = type === 'password'
    const inputType = isPassword && passwordVisible ? 'text' : type

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
        <div className={cn('relative w-full', isPassword && 'flex items-center')}>
          <input
            type={inputType}
            id={inputId}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={describedBy}
            className={cn(
              'flex h-11 w-full rounded-lg border bg-ink-raised/50 px-4 py-2.5 text-sm text-text-primary placeholder:text-text-tertiary transition-all duration-200',
              'focus:outline-none focus:ring-2 focus:ring-coral focus:border-coral focus:bg-ink-raised',
              'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-ink-raised/30',
              error && 'border-destructive/50 focus:ring-destructive focus:border-destructive',
              isPassword && 'pr-11',
              className
            )}
            ref={ref}
            {...props}
          />
          {isPassword && (
            <button
              type="button"
              onClick={() => setPasswordVisible((visible) => !visible)}
              disabled={props.disabled}
              aria-label={passwordVisible ? 'Hide password' : 'Show password'}
              aria-pressed={passwordVisible}
              className="absolute right-3 inline-flex h-8 w-8 items-center justify-center rounded-md text-text-tertiary transition-colors hover:bg-ink-raised hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral disabled:pointer-events-none disabled:opacity-50"
            >
              {passwordVisible ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
            </button>
          )}
        </div>
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
