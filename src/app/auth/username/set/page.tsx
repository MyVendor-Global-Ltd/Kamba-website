'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { apiJson } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function SetUsernamePage() {
  const [username, setUsername] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await apiJson('/auth/username/set', {
        method: 'POST',
        body: JSON.stringify({ username: username.trim().replace(/^@+/, '').toLowerCase() }),
      })
      router.push('/auth/profile')
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'Failed to set username')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto mt-10">
      <CardHeader>
        <CardTitle>Set username</CardTitle>
        <CardDescription>Choose a unique username for your profile.</CardDescription>
      </CardHeader>
      <CardContent>
        {error && <div role="alert" className="mb-4 p-3 rounded bg-destructive/10 text-destructive text-sm border border-destructive/20">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="username" className="text-sm font-medium">Username</label>
            <Input id="username" placeholder="johndoe" value={username} onChange={(e) => setUsername(e.target.value)} required minLength={3} maxLength={16} />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>{loading ? 'Saving...' : 'Save username'}</Button>
        </form>
      </CardContent>
    </Card>
  )
}
