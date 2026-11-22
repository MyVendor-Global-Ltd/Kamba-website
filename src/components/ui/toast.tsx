'use client'

import { createContext, useContext, useState, ReactNode, useCallback } from 'react'
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react'

export type ToastType = 'success' | 'error' | 'info' | 'warning'

export interface Toast {
  id: string
  type: ToastType
  title: string
  message?: string
  duration?: number
}

interface ToastContextType {
  toasts: Toast[]
  addToast: (toast: Omit<Toast, 'id'>) => string
  removeToast: (id: string) => void
  toast: (options: { type: ToastType; title: string; description?: string; duration?: number }) => string
}

const ToastContext = createContext<ToastContextType | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = crypto.randomUUID()
    const newToast = { ...toast, id }
    setToasts((prev) => [...prev, newToast])
    
    if (toast.duration !== 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id))
      }, toast.duration || 5000)
    }
    
    return id
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const toast = useCallback((options: { type: ToastType; title: string; description?: string; duration?: number }) => {
    return addToast({
      type: options.type,
      title: options.title,
      message: options.description,
      duration: options.duration,
    })
  }, [addToast])

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, toast }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

function ToastContainer({ toasts, onRemove }: { toasts: Toast[]; onRemove: (id: string) => void }) {
  if (toasts.length === 0) return null

  const icons = {
    success: CheckCircle,
    error: AlertCircle,
    info: Info,
    warning: AlertCircle,
  }

  const colors = {
    success: 'bg-green-500/10 border-green-500/20 text-green-400',
    error: 'bg-destructive/10 border-destructive/20 text-destructive',
    info: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
    warning: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400',
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 w-full max-w-sm">
      {toasts.map((toast) => {
        const Icon = icons[toast.type]
        return (
          <div
            key={toast.id}
            className={`flex items-start gap-3 p-4 rounded-lg border shadow-lg animate-slide-in ${colors[toast.type]}`}
          >
            <Icon className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm">{toast.title}</p>
              {toast.message && (
                <p className="text-sm opacity-80 mt-0.5">{toast.message}</p>
              )}
            </div>
            <button
              onClick={() => onRemove(toast.id)}
              className="flex-shrink-0 opacity-50 hover:opacity-100 transition-opacity"
              aria-label="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )
      })}
    </div>
  )
}