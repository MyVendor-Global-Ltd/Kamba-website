'use client'

import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from 'react'
import { User, AuthState } from '@/types/auth'
import * as authApi from '@/lib/auth'

const AuthContext = createContext<{
  state: AuthState
  user: AuthState['user']
  login: (email: string, password: string) => Promise<void>
  register: (data: Parameters<typeof authApi.register>[0]) => Promise<void>
  logout: () => Promise<void>
  refreshProfile: () => Promise<void>
  updateUser: (data: Partial<User>) => void
} | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    cartCount: 0,
  })

  const refreshProfile = useCallback(async () => {
    try {
      const data = await authApi.getProfile()
      const profile = data.user || data
      if (!profile?.id) throw new Error('The API did not return an authenticated user.')

      setState({
        user: profile,
        isAuthenticated: true,
        isLoading: false,
        cartCount: data.cartCount || profile.cartCount || 0,
      })
    } catch {
      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        cartCount: 0,
      })
    }
  }, [])

  useEffect(() => {
    void Promise.resolve().then(refreshProfile)
  }, [refreshProfile])

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
      cartCount: 0,
    })
  }

  const updateUser = useCallback((data: Partial<User>) => {
    setState((previous) => ({
      ...previous,
      user: previous.user ? { ...previous.user, ...data } : null,
    }))
  }, [])

  return (
    <AuthContext.Provider value={{ state, user: state.user, login, register, logout, refreshProfile, updateUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within an AuthProvider')
  return context
}
