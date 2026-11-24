import { apiJson } from '@/lib/api'
import { isMockMode } from '@/lib/mock-api'

type UploadUrlResponse = {
  bucket: string
  path: string
  token: string
  signed_url: string
  public_url: string
  media_type: 'image' | 'video'
  mime_type: string
  max_size_bytes: number
  expires_in_seconds: number
}

const IMAGE_LIMIT = 5 * 1024 * 1024
const VIDEO_LIMIT = 25 * 1024 * 1024

export async function uploadProductMedia(file: File): Promise<{ url: string; kind: 'image' | 'video' }> {
  if (isMockMode) {
    throw new Error('Product media uploads are disabled in demo mode. Switch to the live API to upload files.')
  }

  const kind = file.type.startsWith('image/') ? 'image' : file.type.startsWith('video/') ? 'video' : null
  if (!kind) throw new Error('Choose a supported image or video file.')

  const maxSize = kind === 'image' ? IMAGE_LIMIT : VIDEO_LIMIT
  if (file.size <= 0 || file.size > maxSize) {
    throw new Error(kind === 'image' ? 'Each product image must be 5 MB or smaller.' : 'Each product video must be 25 MB or smaller.')
  }

  const allowedTypes = kind === 'image'
    ? ['image/jpeg', 'image/png', 'image/webp']
    : ['video/mp4', 'video/webm', 'video/quicktime']
  if (!allowedTypes.includes(file.type)) {
    throw new Error(kind === 'image'
      ? 'Images must be JPEG, PNG or WebP.'
      : 'Videos must be MP4, WebM or QuickTime.')
  }

  const upload = await apiJson<UploadUrlResponse>('/commerce/vendor/products/media-upload-url', {
    method: 'POST',
    body: JSON.stringify({ kind, mime_type: file.type }),
  })

  const response = await fetch(upload.signed_url, {
    method: 'PUT',
    headers: { 'Content-Type': file.type },
    body: file,
  })

  if (!response.ok) {
    const detail = await response.json().catch(() => ({}))
    throw new Error(detail.message || `Upload failed (${response.status}). Please try again.`)
  }

  return { url: upload.public_url, kind }
}
