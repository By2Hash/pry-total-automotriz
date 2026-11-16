const numberFormatter = new Intl.NumberFormat('es-AR', {
  maximumFractionDigits: 0,
})

const dateFormatter = new Intl.DateTimeFormat('es-AR', {
  dateStyle: 'short',
  timeStyle: 'short',
})

export function formatPrice(value, currency) {
  if (value == null || value === '' || !Number.isFinite(Number(value))) {
    return 'Consultar precio'
  }

  const formatted = numberFormatter.format(Number(value))
  return currency === 'USD' ? `USD ${formatted}` : `$ ${formatted}`
}

export function formatNumber(value) {
  if (value == null || !Number.isFinite(Number(value))) return ''
  return numberFormatter.format(Number(value))
}

export function formatSavedAt(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return dateFormatter.format(date)
}

export function normalizeText(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

export function parseNumberInput(value) {
  const digits = String(value ?? '').replace(/[^\d]/g, '')
  if (!digits) return null
  const parsed = Number(digits)
  return Number.isFinite(parsed) ? parsed : null
}

export function formatPriceRange(currency, range) {
  if (!range?.active) return ''

  const prefix = currency === 'USD' ? 'USD' : '$'
  if (range.min != null && range.max != null) {
    return `${prefix} ${formatNumber(range.min)} – ${prefix} ${formatNumber(range.max)}`
  }
  if (range.min != null) {
    return `Desde ${prefix} ${formatNumber(range.min)}`
  }
  return `Hasta ${prefix} ${formatNumber(range.max)}`
}

export function pluralize(count, singular, plural) {
  return count === 1 ? singular : plural
}
