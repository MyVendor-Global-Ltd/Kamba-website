'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User, AuthState } from '@/types/auth'
import * as authApi from '@/lib/auth'

const AuthContext = createContext<{
  state: AuthState
  login: (email: string, password: string) => Promise<void>
  register: (data: Parameters<typeof authApi.register>[0]) => Promise<void>
  logout: () => Promise<void>
  refreshProfile: () => Promise<void>
} | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  })

  useEffect(() => {
    authApi.getProfile()
      .then((data: any) => {
        setState({
          user: data.user || data,
          isAuthenticated: true,
          isLoading: false,
        })
      })
      .catch(() => {
        setState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
        })
      })
  }, [])

  const login = async (email: string, password: string) => {
    await authApi.login(email, password)
    await refreshProfile()
  }

  const register = async (data: Parameters<typeof authApi.register>[0]) => {
    await authApi.register(data)
    await refreshProfile()
  }

  const logout = async () => {
    await authApi.logout()
    setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    })
  }

  const refreshProfile = async () => {
    try {
      const data = await authApi.getProfile()
      setState({
        user: data.user || data,
        isAuthenticated: true,
        isLoading: false,
      })
    } catch {
      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      })
    }
  }

  return (
    <AuthContext.Provider value={{ state, login, register, logout, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}