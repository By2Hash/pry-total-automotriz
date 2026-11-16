import { generalWhatsAppMessage, siteConfig } from '../config'

export function normalizeWhatsAppNumber(value) {
  const digits = String(value ?? '').replace(/\D/g, '')
  if (!digits) return ''

  if (digits.startsWith('549')) return digits
  if (digits.startsWith('54')) return `549${digits.slice(2)}`
  if (digits.length === 10) return `549${digits}`
  return digits
}

export function buildWhatsAppUrl(message = generalWhatsAppMessage) {
  const number = normalizeWhatsAppNumber(siteConfig.whatsapp)
  if (!number) return null
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`
}

export function buildVehicleMessage(vehicle) {
  const modelo = String(vehicle?.modelo ?? '').trim() || 'vehículo'
  const anio = String(vehicle?.anio ?? '').trim()
  return `Hola, estoy interesado en el ${modelo}${anio ? ` ${anio}` : ''}. ¿A cuánto está, condición y disponibilidad?`
}

export function buildVehicleWhatsAppUrl(vehicle) {
  return buildWhatsAppUrl(buildVehicleMessage(vehicle))
}

export const generalWhatsAppUrl = buildWhatsAppUrl(generalWhatsAppMessage)
