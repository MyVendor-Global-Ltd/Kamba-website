import { isMockMode } from '@/lib/mock-api'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9001'
const MOCK_USER_KEY = 'kamba_demo_user'

type AuthInput = { email: string; password: string; first_name?: string; last_name?: string; phone?: string; role?: string }
function readMockUser() {
  if (typeof window === 'undefined') return null
  try { return JSON.parse(window.localStorage.getItem(MOCK_USER_KEY) || 'null') } catch { return null }
}
function writeMockUser(user: any) {
  if (typeof window !== 'undefined') window.localStorage.setItem(MOCK_USER_KEY, JSON.stringify(user))
}

export async function login(email: string, password: string) {
  if (isMockMode) {
    if (!email.trim() || !password) throw new Error('Enter your email and password to continue.')
    const vendorDemo = email.toLowerCase() === 'vendor@kamba.demo'
    const user = { id: vendorDemo ? 'demo-vendor' : 'demo-buyer', email, first_name: vendorDemo ? 'Demo' : 'Kamba', last_name: vendorDemo ? 'Vendor' : 'Buyer', role: vendorDemo ? 'vendor' : 'buyer', is_verified: false, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), is_demo: true }
    writeMockUser(user)
    return { success: true, user, prototype: true }
  }
  const res = await fetch(`${API_BASE}/api/v1/auth/login`, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) })
  if (!res.ok) { const error = await res.json().catch(() => ({})); throw new Error(error.message || 'Login failed') }
  return res.json()
}

export async function register(data: AuthInput) {
  if (isMockMode) {
    if (!data.email.trim() || data.password.length < 8) throw new Error('Use a valid email and a password with at least 8 characters.')
    const user = { id: `demo-${Date.now()}`, email: data.email, first_name: data.first_name || 'New', last_name: data.last_name || 'Buyer', phone: data.phone, role: data.role || 'buyer', is_verified: false, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), is_demo: true }
    writeMockUser(user)
    return { success: true, user, prototype: true }
  }
  const res = await fetch(`${API_BASE}/api/v1/auth/register`, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
  if (!res.ok) { const error = await res.json().catch(() => ({})); throw new Error(error.message || 'Registration failed') }
  return res.json()
}

export async function logout() {
  if (isMockMode) {
    if (typeof window !== 'undefined') window.localStorage.removeItem(MOCK_USER_KEY)
    return { success: true, prototype: true }
  }
  const res = await fetch(`${API_BASE}/api/v1/auth/logout`, { method: 'POST', credentials: 'include' })
  if (!res.ok) { const error = await res.json().catch(() => ({})); throw new Error(error.message || 'Logout failed') }
  return res.json()
}

export async function getProfile() {
  if (isMockMode) {
    const user = readMockUser()
    if (!user) throw new Error('No development session')
    return { user, cartCount: 0, prototype: true }
  }
  const res = await fetch(`${API_BASE}/api/v1/auth/dashboard`, { credentials: 'include' })
  if (!res.ok) { const error = await res.json().catch(() => ({})); throw new Error(error.message || 'Failed to fetch profile') }
  return res.json()
}

export async function requestPhoneOTP(phone: string) {
  if (isMockMode) return { success: true, prototype: true, message: `Development-only OTP flow for ${phone}. No message was sent.` }
  const res = await fetch(`${API_BASE}/api/v1/auth/phone/send-otp`, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone }) })
  if (!res.ok) { const error = await res.json().catch(() => ({})); throw new Error(error.message || 'Failed to send OTP') }
  return res.json()
}

export async function verifyPhoneOTP(phone: string, otp: string) {
  if (isMockMode) {
    if (!phone.trim() || otp !== '000000') throw new Error('For the prototype only, enter 000000. No real phone verification is performed.')
    return { success: true, prototype: true, verified: false }
  }
  const res = await fetch(`${API_BASE}/api/v1/auth/phone/verify-otp`, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone, otp }) })
  if (!res.ok) { const error = await res.json().catch(() => ({})); throw new Error(error.message || 'OTP verification failed') }
  return res.json()
}

export async function forgotPassword(email: string) {
  if (isMockMode) return { success: true, prototype: true, message: `Password reset is simulated for ${email}. No email was sent.` }
  const res = await fetch(`${API_BASE}/api/v1/auth/forgot-password`, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) })
  if (!res.ok) { const error = await res.json().catch(() => ({})); throw new Error(error.message || 'Failed to send reset link') }
  return res.json()
}

export async function resetPassword(token: string, password: string) {
  if (isMockMode) return { success: true, prototype: true, message: 'Password reset simulated. No real account was changed.' }
  const res = await fetch(`${API_BASE}/api/v1/auth/reset-password`, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token, password }) })
  if (!res.ok) { const error = await res.json().catch(() => ({})); throw new Error(error.message || 'Password reset failed') }
  return res.json()
}
