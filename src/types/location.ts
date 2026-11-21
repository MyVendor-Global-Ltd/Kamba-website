export interface LocationCoords {
  lat: number
  lng: number
}

export interface LocationFilter {
  lat?: number
  lng?: number
  radius?: number
}

export interface GeolocationState {
  coords: LocationCoords | null
  error: string | null
  loading: boolean
}