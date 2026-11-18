import { normalizePhotoUrl, splitPhotoUrls } from '../lib/media'
import { normalizeText } from '../lib/format'

const CANONICAL_CATEGORIES = new Map([
  ['autos y utilitarios', 'Autos y utilitarios'],
  ['vehiculos p', 'Vehículos P'],
  ['motos', 'Motos'],
  ['maquinaria y equipos', 'Maquinaria y equipos'],
])

const EMPTY_DETAILS = new Set(['no', 'no aplica', 'ninguno', 'ninguna'])

function cleanText(value) {
  const text = String(value ?? '').trim()
  if (!text || text === '-' || text === '—' || /^n\/?a$/i.test(text)) {
    return ''
  }
  return text
}

export function normalizeCategory(value) {
  const text = cleanText(value)
  if (!text) return 'Otros'
  return CANONICAL_CATEGORIES.get(normalizeText(text)) || text
}

export function normalizeCurrency(value) {
  const text = cleanText(value).toUpperCase()
  if (!text) return null
  if (text.includes('USD') || text.includes('U$S') || text.includes('DOLAR')) {
    return 'USD'
  }
  if (text.includes('ARS') || text.includes('$')) return 'ARS'
  return null
}

export function parsePrice(value) {
  const digits = String(value ?? '').replace(/[^\d]/g, '')
  if (!digits) return null
  const parsed = Number(digits)
  return Number.isFinite(parsed) ? parsed : null
}

export function normalizeYear(value) {
  const text = cleanText(value)
  if (!text) return ''
  const digits = text.replace(/\D/g, '')
  return digits || text
}

export function getFuelTags(value) {
  const text = cleanText(value)
  if (!text) return []

  const labels = text
    .split(/\s*(?:\/|,|\+| y )\s*/i)
    .map((label) => label.trim())
    .filter(Boolean)

  const seen = new Set()
  return labels.filter((label) => {
    const key = normalizeText(label)
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function normalizeDetail(value) {
  const text = cleanText(value)
  return EMPTY_DETAILS.has(normalizeText(text)) ? '' : text
}

export function normalizeRows(rows) {
  const vehicles = []
  const warnings = []
  const seenIds = new Set()

  rows.forEach((row, index) => {
    if (!row || typeof row !== 'object') return

    const disponible = normalizeText(row.disponible)
    if (disponible !== 'si') return

    const modelo = cleanText(row.modelo)
    const categoria = normalizeCategory(row.categoria)
    const moneda = normalizeCurrency(row.moneda)
    const precio = parsePrice(row.precio)

    if (!modelo) {
      warnings.push(`Fila ${index + 2}: sin modelo, se omite.`)
      return
    }
    if (!moneda) {
      warnings.push(`Fila ${index + 2}: moneda inválida, se omite.`)
      return
    }

    const baseId = cleanText(row.id) || `fila-${index + 2}`
    let id = baseId
    if (seenIds.has(id)) id = `${baseId}-${index + 2}`
    seenIds.add(id)

    const fotoUrls = splitPhotoUrls(row.foto_url)

    vehicles.push({
      id,
      categoria,
      modelo,
      anio: normalizeYear(row.anio),
      combustible: cleanText(row.combustible),
      fuelTags: getFuelTags(row.combustible),
      detalle: normalizeDetail(row.detalle),
      moneda,
      precio,
      disponible: 'SI',
      descripcion: cleanText(row.descripcion),
      fotoUrl: fotoUrls[0] || normalizePhotoUrl(row.foto_url),
      fotoUrls,
    })
  })

  return { vehicles, warnings }
}
