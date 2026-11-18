export const ADMIN_SESSION_KEY = 'total-automotriz:admin-clave'
export const ADMIN_ROLE_KEY = 'total-automotriz:admin-rol'
export const ADMIN_LEGACY_KEY = 'total-automotriz:admin-backend-viejo'
export const ADMIN_DRAFT_KEY = 'total-automotriz:admin-draft'

export function readAdminKey() {
  try {
    return sessionStorage.getItem(ADMIN_SESSION_KEY) || ''
  } catch {
    return ''
  }
}

export function writeAdminKey(value) {
  try {
    sessionStorage.setItem(ADMIN_SESSION_KEY, value)
  } catch {
    // Si el navegador bloquea sessionStorage, la sesión vive solo en memoria.
  }
}

export function readAdminRole() {
  try {
    return sessionStorage.getItem(ADMIN_ROLE_KEY) || ''
  } catch {
    return ''
  }
}

export function writeAdminRole(value) {
  try {
    sessionStorage.setItem(ADMIN_ROLE_KEY, value)
  } catch {
    // Nada que guardar.
  }
}

export function readAdminBackendLegacy() {
  try {
    return sessionStorage.getItem(ADMIN_LEGACY_KEY) === '1'
  } catch {
    return false
  }
}

export function writeAdminBackendLegacy(value) {
  try {
    if (value) {
      sessionStorage.setItem(ADMIN_LEGACY_KEY, '1')
    } else {
      sessionStorage.removeItem(ADMIN_LEGACY_KEY)
    }
  } catch {
    // Nada que guardar.
  }
}

export function clearAdminSession() {
  try {
    sessionStorage.removeItem(ADMIN_SESSION_KEY)
    sessionStorage.removeItem(ADMIN_ROLE_KEY)
    sessionStorage.removeItem(ADMIN_LEGACY_KEY)
    sessionStorage.removeItem(ADMIN_DRAFT_KEY)
  } catch {
    // Nada que limpiar.
  }
}

export function clearAdminKey() {
  try {
    sessionStorage.removeItem(ADMIN_SESSION_KEY)
    sessionStorage.removeItem(ADMIN_ROLE_KEY)
    sessionStorage.removeItem(ADMIN_LEGACY_KEY)
  } catch {
    // Nada que limpiar.
  }
}
