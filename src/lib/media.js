function extractDriveId(value) {
  const patterns = [
    /drive\.google\.com\/file\/d\/([^/?#]+)/i,
    /drive\.google\.com\/open\?[^#]*id=([^&#]+)/i,
    /docs\.google\.com\/uc\?[^#]*id=([^&#]+)/i,
    /[?&]id=([^&#]+)/i,
  ]

  for (const pattern of patterns) {
    const match = value.match(pattern)
    if (match) return match[1]
  }

  return null
}

export function normalizePhotoUrl(value) {
  const raw = String(value ?? '').trim()
  if (!raw || raw === '-' || raw.toLowerCase() === 'n/a') return null

  const driveId = extractDriveId(raw)
  if (driveId && /google\.com/i.test(raw)) {
    return `https://lh3.googleusercontent.com/d/${driveId}=w1200`
  }

  if (raw.startsWith('//')) return `https:${raw}`
  if (/^https?:\/\//i.test(raw)) return raw
  if (raw.startsWith('/')) return raw
  return `/${raw.replace(/^\.?\//, '')}`
}

export function splitPhotoUrls(value) {
  return String(value ?? '')
    .split('|')
    .map((entry) => normalizePhotoUrl(entry))
    .filter(Boolean)
}

export function getVehiclePhotoUrls(vehicle) {
  if (Array.isArray(vehicle?.fotoUrls) && vehicle.fotoUrls.length) {
    return vehicle.fotoUrls
  }

  return splitPhotoUrls(vehicle?.fotoUrl)
}

export function getPhotoCandidates(vehicle, photos = []) {
  const candidates = []

  photos.forEach((photo) => {
    const src = typeof photo === 'string' ? photo : photo?.src
    if (src) candidates.push(src)
  })

  getVehiclePhotoUrls(vehicle).forEach((url) => candidates.push(url))

  if (vehicle?.id) {
    const id = encodeURIComponent(vehicle.id)
    candidates.push(`/fotos/${id}/1.webp`, `/fotos/${id}.webp`)
  }

  return [...new Set(candidates)]
}

export function getVehiclePhotos(vehicle, photosById = {}) {
  // Las fotos cargadas en la planilla (panel /admin) siempre tienen prioridad
  // sobre el manifest local. El manifest queda como respaldo para los
  // vehículos viejos que solo tienen imágenes en /public/fotos.
  const ownPhotos = getVehiclePhotoUrls(vehicle)
  if (ownPhotos.length) {
    return ownPhotos.map((url) => ({ src: url, thumb: url }))
  }

  const manifest = photosById?.[vehicle?.id]

  if (Array.isArray(manifest)) {
    return manifest
      .map((photo) => {
        if (typeof photo === 'string') {
          return { src: photo, thumb: photo }
        }
        return {
          src: photo?.src ?? '',
          thumb: photo?.thumb || photo?.src || '',
        }
      })
      .filter((photo) => photo.src)
  }

  return []
}
