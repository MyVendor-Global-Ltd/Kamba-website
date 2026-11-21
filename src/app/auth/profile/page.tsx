'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function ProfilePage() {
  const { state, refreshProfile } = useAuth()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    refreshProfile().finally(() => setLoading(false))
  }, [refreshProfile])

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!state.isAuthenticated || !state.user) {
    return (
      <Card className="w-full max-w-md mx-auto mt-10">
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>You are not signed in.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild className="w-full">
            <a href="/auth/login">Sign in</a>
          </Button>
        </CardContent>
      </Card>
    )
  }

  const user = state.user

  return (
    <Card className="w-full max-w-md mx-auto mt-10">
      <CardHeader>
        <CardTitle>Profile</CardTitle>
        <CardDescription>Manage your account details.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-2xl">
            {user.first_name?.[0]?.toUpperCase()}{user.last_name?.[0]?.toUpperCase()}
          </div>
          <div>
            <h2 className="text-lg font-semibold">{user.first_name} {user.last_name}</h2>
            <p className="text-sm text-muted-foreground">{user.email}</p>
            {user.phone && <p className="text-sm text-muted-foreground">{user.phone}</p>}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="bg-muted p-3 rounded">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Role</p>
            <p className="font-medium">{user.role}</p>
          </div>
          <div className="bg-muted p-3 rounded">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Verified</p>
            <p className="font-medium">{user.is_verified ? 'Yes' : 'No'}</p>
          </div>
        </div>
        <Button onClick={refreshProfile} className="w-full">
          Refresh profile
        </Button>
      </CardContent>
    </Card>
  )
}
