'use client'

import { Component, ErrorInfo, ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { AlertCircle, RefreshCw } from 'lucide-react'

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = {
    hasError: false,
    error: null,
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    this.props.onError?.(error, errorInfo)
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="flex flex-col items-center justify-center p-8 text-center min-h-[300px]">
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
            <AlertCircle className="w-8 h-8 text-destructive" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
          <p className="text-muted-foreground mb-6 max-w-md">
            We encountered an unexpected error. Please try again or contact support if the problem persists.
          </p>
          <div className="flex gap-3">
            <Button onClick={this.handleRetry} variant="default">
              <RefreshCw className="w-4 h-4 mr-2" />
              Try again
            </Button>
            <Button variant="ghost" onClick={() => window.location.reload()}>
              Reload page
            </Button>
          </div>
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <details className="mt-6 w-full max-w-md text-left">
              <summary className="cursor-pointer text-sm text-muted-foreground">Error details</summary>
              <pre className="mt-2 p-3 bg-muted rounded text-xs overflow-auto text-destructive">
                {this.state.error.toString()}
              </pre>
            </details>
          )}
        </div>
      )
    }

    return this.props.children
  }
}

export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) {
  return function WithErrorBoundary(props: P) {
    return (
      <ErrorBoundary {...errorBoundaryProps}>
        <Component {...props} />
      </ErrorBoundary>
    )
  }
}