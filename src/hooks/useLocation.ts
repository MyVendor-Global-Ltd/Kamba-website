'use client'

import { useState, useEffect, useCallback } from 'react'
import { LocationCoords, GeolocationState } from '@/types/location'

const LOCATION_SESSION_KEY = 'kamba.search.location'

interface SavedSearchLocation {
  coords: LocationCoords
  label: string
}

export function useLocation(): GeolocationState & {
  locationLabel: string | null
  getLocation: () => void
  setLocation: (coords: LocationCoords, label: string) => void
  clearLocation: () => void
} {
  const [coords, setCoords] = useState<LocationCoords | null>(null)
  const [locationLabel, setLocationLabel] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(LOCATION_SESSION_KEY)
      if (!saved) return
      const parsed = JSON.parse(saved) as SavedSearchLocation
      if (
        Number.isFinite(parsed.coords?.lat) &&
        parsed.coords.lat >= -90 && parsed.coords.lat <= 90 &&
        Number.isFinite(parsed.coords?.lng) &&
        parsed.coords.lng >= -180 && parsed.coords.lng <= 180
      ) {
        setCoords(parsed.coords)
        setLocationLabel(parsed.label || 'Selected area')
      } else {
        sessionStorage.removeItem(LOCATION_SESSION_KEY)
      }
    } catch {
      sessionStorage.removeItem(LOCATION_SESSION_KEY)
    }
  }, [])

  const setLocation = useCallback((nextCoords: LocationCoords, label: string) => {
    setCoords(nextCoords)
    setLocationLabel(label)
    setError(null)
    try {
      sessionStorage.setItem(LOCATION_SESSION_KEY, JSON.stringify({ coords: nextCoords, label }))
    } catch {
      // Search still works if the browser blocks session storage.
    }
  }, [])

  const clearLocation = useCallback(() => {
    setCoords(null)
    setLocationLabel(null)
    setError(null)
    setLoading(false)
    try {
      sessionStorage.removeItem(LOCATION_SESSION_KEY)
    } catch {
      // Ignore storage restrictions; clearing the in-memory filter still works.
    }
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
        setLocation(
          { lat: pos.coords.latitude, lng: pos.coords.longitude },
          'My current location'
        )
        setLoading(false)
      },
      (err) => {
        setError(err.message)
        setLoading(false)
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
    )
  }, [setLocation])

  return { coords, locationLabel, error, loading, getLocation, setLocation, clearLocation }
}
