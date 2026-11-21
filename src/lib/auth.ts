const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://api.kamba.ng'

export async function login(email: string, password: string) {
  const res = await fetch(`${API_BASE}/api/v1/auth/login`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  if (!res.ok) {
    const error = await res.json().catch(() => ({}))
    throw new Error(error.message || 'Login failed')
  }
  return res.json()
}

export async function register(data: {
  email: string
  password: string
  first_name?: string
  last_name?: string
  phone?: string
  role?: string
}) {
  const res = await fetch(`${API_BASE}/api/v1/auth/register`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const error = await res.json().catch(() => ({}))
    throw new Error(error.message || 'Registration failed')
  }
  return res.json()
}

export async function logout() {
  const res = await fetch(`${API_BASE}/api/v1/auth/logout`, {
    method: 'POST',
    credentials: 'include',
  })
  if (!res.ok) {
    const error = await res.json().catch(() => ({}))
    throw new Error(error.message || 'Logout failed')
  }
  return res.json()
}

export async function getProfile() {
  const res = await fetch(`${API_BASE}/api/v1/auth/profile`, {
    credentials: 'include',
  })
  if (!res.ok) {
    const error = await res.json().catch(() => ({}))
    throw new Error(error.message || 'Failed to fetch profile')
  }
  return res.json()
}

export async function requestPhoneOTP(phone: string) {
  const res = await fetch(`${API_BASE}/api/v1/auth/phone/send-otp`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone }),
  })
  if (!res.ok) {
    const error = await res.json().catch(() => ({}))
    throw new Error(error.message || 'Failed to send OTP')
  }
  return res.json()
}

export async function verifyPhoneOTP(phone: string, otp: string) {
  const res = await fetch(`${API_BASE}/api/v1/auth/phone/verify-otp`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, otp }),
  })
  if (!res.ok) {
    const error = await res.json().catch(() => ({}))
    throw new Error(error.message || 'OTP verification failed')
  }
  return res.json()
}

export async function forgotPassword(email: string) {
  const res = await fetch(`${API_BASE}/api/v1/auth/forgot-password`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  })
  if (!res.ok) {
    const error = await res.json().catch(() => ({}))
    throw new Error(error.message || 'Failed to send reset link')
  }
  return res.json()
}

export async function resetPassword(token: string, password: string) {
  const res = await fetch(`${API_BASE}/api/v1/auth/reset-password`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, password }),
  })
  if (!res.ok) {
    const error = await res.json().catch(() => ({}))
    throw new Error(error.message || 'Password reset failed')
  }
  return res.json()
}