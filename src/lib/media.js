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

export function getPhotoCandidates(vehicle) {
  const candidates = []

  if (vehicle?.fotoUrl) candidates.push(vehicle.fotoUrl)
  if (vehicle?.id) {
    candidates.push(`/fotos/${encodeURIComponent(vehicle.id)}.webp`)
  }

  return [...new Set(candidates)]
}
