import { adminConfig } from '../config'

const CLOUD = adminConfig.cloudinaryCloud
const PRESET = adminConfig.cloudinaryPreset
const UPLOAD_TIMEOUT_MS = 120000

export function isCloudinaryConfigured() {
  return Boolean(CLOUD && PRESET)
}

export function getCloudinaryMissingVars() {
  const missing = []
  if (!CLOUD) missing.push('VITE_CLOUDINARY_CLOUD')
  if (!PRESET) missing.push('VITE_CLOUDINARY_PRESET')
  return missing
}

export function uploadToCloudinary(file, { onProgress } = {}) {
  return new Promise((resolve, reject) => {
    if (!CLOUD || !PRESET) {
      reject(
        new Error(
          'Falta configurar Cloudinary. Revisá VITE_CLOUDINARY_CLOUD y VITE_CLOUDINARY_PRESET.',
        ),
      )
      return
    }

    const form = new FormData()
    form.append('file', file, file.name || 'foto.webp')
    form.append('upload_preset', PRESET)

    const request = new XMLHttpRequest()
    request.open(
      'POST',
      `https://api.cloudinary.com/v1_1/${encodeURIComponent(CLOUD)}/image/upload`,
    )
    request.timeout = UPLOAD_TIMEOUT_MS

    let lastPercent = -1

    request.upload.onprogress = (event) => {
      if (!event.lengthComputable || !onProgress) return
      const percent = Math.min(100, Math.round((event.loaded / event.total) * 100))
      if (percent === lastPercent) return
      lastPercent = percent
      onProgress(percent / 100)
    }

    request.onload = () => {
      let data
      try {
        data = JSON.parse(request.responseText)
      } catch {
        data = null
      }

      if (request.status >= 200 && request.status < 300 && data?.secure_url) {
        resolve(data.secure_url)
        return
      }

      reject(
        new Error(
          data?.error?.message ||
            `Cloudinary respondió con error ${request.status}. Revisá el preset.`,
        ),
      )
    }

    request.onerror = () => {
      reject(
        new Error(
          'No pudimos conectar con Cloudinary. La foto quedó guardada para reintentar.',
        ),
      )
    }

    request.ontimeout = () => {
      reject(
        new Error(
          'Cloudinary tardó demasiado. La foto quedó guardada para reintentar.',
        ),
      )
    }

    request.send(form)
  })
}
