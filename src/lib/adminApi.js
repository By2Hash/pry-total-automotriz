import { adminConfig } from '../config'

const ENDPOINT = adminConfig.appsScriptUrl
const REQUEST_TIMEOUT_MS = 25000

export class AdminApiError extends Error {
  constructor(message, code = 'error') {
    super(message)
    this.name = 'AdminApiError'
    this.code = code
  }
}

export function isAdminConfigured() {
  return Boolean(ENDPOINT)
}

function extractMessage(data, text) {
  if (data && typeof data === 'object') {
    const candidate = data.error || data.mensaje || data.message
    if (typeof candidate === 'string' && candidate.trim()) {
      return candidate.trim()
    }
  }

  const clean = String(text || '').trim()
  if (clean && clean.length < 180 && !/<(?:!doctype|html|body)/i.test(clean)) {
    return clean
  }

  return ''
}

function isOkResponse(data, text) {
  if (data && typeof data === 'object') {
    for (const key of ['ok', 'success', 'exito']) {
      const value = data[key]
      if (value === true || value === 'true' || value === 'ok') return true
      if (value === false || value === 'false') return false
    }
  }

  return /^ok\b/i.test(String(text || '').trim())
}

function looksLikeHtml(text) {
  return /<(?:!doctype|html|body|head)/i.test(String(text || ''))
}

async function postToAppsScript(payload) {
  if (!ENDPOINT) {
    throw new AdminApiError(
      'Falta configurar VITE_APPS_SCRIPT_URL en el archivo .env.',
      'config',
    )
  }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
  let response

  try {
    response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload),
      redirect: 'follow',
      signal: controller.signal,
    })
  } catch (error) {
    const message =
      error?.name === 'AbortError'
        ? 'El servidor tardó demasiado en responder. Probá de nuevo.'
        : 'No pudimos conectar con el servidor. Revisá tu conexión.'
    throw new AdminApiError(message, 'network')
  } finally {
    clearTimeout(timer)
  }

  let text
  try {
    text = await response.text()
  } catch {
    text = ''
  }

  let data
  try {
    data = text ? JSON.parse(text) : null
  } catch {
    data = null
  }

  return { response, data, text }
}

export async function loginAdmin(clave) {
  const { response, data, text } = await postToAppsScript({
    accion: 'login',
    clave,
  })

  if (looksLikeHtml(text)) {
    throw new AdminApiError(
      'La URL de Apps Script no devolvió JSON. Revisá que el Web App esté publicado para cualquiera.',
      'config',
    )
  }

  if (!response.ok) {
    throw new AdminApiError(
      extractMessage(data, text) ||
        `El servidor respondió con error ${response.status}.`,
      'server',
    )
  }

  if (!isOkResponse(data, text)) {
    throw new AdminApiError(
      extractMessage(data, text) ||
        'La clave no es correcta o el servidor no la aprobó.',
      'auth',
    )
  }

  // El Apps Script devuelve el rol según la clave. Si todavía está la versión
  // vieja (sin roles), asumimos administrador y avisamos que hay que actualizar.
  const hasRole =
    typeof data?.rol === 'string' && Boolean(data.rol.trim())

  const role = hasRole ? data.rol.trim().toLowerCase() : 'admin'

  return { role, legacy: !hasRole }
}

export async function submitVehicle(clave, vehicle) {
  const { response, data, text } = await postToAppsScript({
    accion: 'guardarVehiculo',
    clave,
    ...vehicle,
  })

  assertActionOk(response, data, text, 'El servidor no confirmó la carga del vehículo.')

  return true
}

export async function updateVehiclePhotos(clave, id, fotos) {
  const { response, data, text } = await postToAppsScript({
    accion: 'actualizarFotos',
    clave,
    id,
    fotos,
  })

  assertActionOk(
    response,
    data,
    text,
    'El servidor no confirmó la actualización de las fotos.',
  )

  return true
}

export async function updateVehicle(clave, id, vehicle) {
  const { response, data, text } = await postToAppsScript({
    accion: 'actualizarVehiculo',
    clave,
    id,
    ...vehicle,
  })

  assertActionOk(
    response,
    data,
    text,
    'El servidor no confirmó la actualización del vehículo.',
  )

  return true
}

export async function deleteVehicle(clave, id) {
  const { response, data, text } = await postToAppsScript({
    accion: 'eliminarVehiculo',
    clave,
    id,
  })

  assertActionOk(
    response,
    data,
    text,
    'El servidor no confirmó la eliminación del vehículo.',
  )

  return true
}

function assertActionOk(response, data, text, fallbackMessage) {
  const message = extractMessage(data, text)

  if (looksLikeHtml(text)) {
    throw new AdminApiError(
      'La URL de Apps Script no devolvió JSON. Revisá que el Web App esté publicado para cualquiera.',
      'config',
    )
  }

  if (!response.ok) {
    const code =
      response.status === 401 || response.status === 403 ? 'auth' : 'server'
    throw new AdminApiError(
      message || `El servidor respondió con error ${response.status}.`,
      code,
    )
  }

  if (!isOkResponse(data, text)) {
    const code = /clave|sesi[oó]n|login|autoriz/i.test(message) ? 'auth' : 'server'
    throw new AdminApiError(message || fallbackMessage, code)
  }
}
