import { catalogConfig } from '../config'

const CACHE_PREFIX = 'total-automotriz:catalogo'

function hashString(value) {
  let hash = 5381
  const text = String(value ?? '')
  for (let index = 0; index < text.length; index += 1) {
    hash = (hash * 33) ^ text.charCodeAt(index)
  }
  return (hash >>> 0).toString(36)
}

function cacheKey(url) {
  return `${CACHE_PREFIX}:v${catalogConfig.cacheVersion}:${hashString(url)}`
}

export function readCache(url) {
  if (!url) return null

  try {
    const raw = localStorage.getItem(cacheKey(url))
    if (!raw) return null

    const payload = JSON.parse(raw)
    if (
      payload?.version !== catalogConfig.cacheVersion ||
      payload?.url !== url ||
      !Array.isArray(payload?.vehicles)
    ) {
      return null
    }

    return payload
  } catch {
    return null
  }
}

export function writeCache(url, vehicles) {
  if (!url || !Array.isArray(vehicles)) return

  const payload = {
    version: catalogConfig.cacheVersion,
    url,
    savedAt: new Date().toISOString(),
    vehicles,
  }

  try {
    localStorage.setItem(cacheKey(url), JSON.stringify(payload))
  } catch {
    // Si el navegador no permite almacenar, la app sigue funcionando en línea.
  }
}

export function clearCache(url) {
  if (!url) return
  try {
    localStorage.removeItem(cacheKey(url))
  } catch {
    // Sin acción.
  }
}
