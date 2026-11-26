'use client'

import { useState, useCallback } from 'react'
import { LocationCoords, GeolocationState } from '@/types/location'

export function useLocation(): GeolocationState & { getLocation: () => void; clearLocation: () => void } {
  const [coords, setCoords] = useState<LocationCoords | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const clearLocation = useCallback(() => {
    setCoords(null)
    setError(null)
    setLoading(false)
  }, [])

  const getLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation not supported')
      return
    }
    setLoading(true)
    setError(null)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setLoading(false)
      },
      (err) => {
        setError(err.message)
        setLoading(false)
      }
    )
  }, [])

  return { coords, error, loading, getLocation, clearLocation }
}