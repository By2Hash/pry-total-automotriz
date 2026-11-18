export const MAX_SIDE = 1600
export const WEBP_QUALITY = 0.82
const MAX_INPUT_BYTES = 30 * 1024 * 1024

function toWebpName(name) {
  const base = String(name || 'foto')
    .replace(/\.[^.]+$/, '')
    .replace(/[^\w.-]+/g, '-')
    .slice(0, 60)
  return `${base || 'foto'}.webp`
}

function canvasToWebp(canvas) {
  return new Promise((resolve) => {
    if (typeof canvas.toBlob !== 'function') {
      resolve(null)
      return
    }
    canvas.toBlob((blob) => resolve(blob), 'image/webp', WEBP_QUALITY)
  })
}

async function loadImageSource(file) {
  if (typeof createImageBitmap === 'function') {
    try {
      const bitmap = await createImageBitmap(file, {
        imageOrientation: 'from-image',
      })
      return {
        image: bitmap,
        width: bitmap.width,
        height: bitmap.height,
        release: () => bitmap.close?.(),
      }
    } catch {
      // Fallback para navegadores sin soporte de createImageBitmap con opciones.
    }
  }

  const url = URL.createObjectURL(file)

  try {
    const image = await new Promise((resolve, reject) => {
      const element = new Image()
      element.onload = () => resolve(element)
      element.onerror = () =>
        reject(
          new Error(
            `No pudimos leer "${file.name}". Si es HEIC, convertila a JPG antes de subirla.`,
          ),
        )
      element.src = url
    })

    return {
      image,
      width: image.naturalWidth,
      height: image.naturalHeight,
      release: () => URL.revokeObjectURL(url),
    }
  } catch (error) {
    URL.revokeObjectURL(url)
    throw error
  }
}

export async function compressImage(file) {
  if (!file || !file.type?.startsWith('image/')) {
    throw new Error('El archivo elegido no es una imagen.')
  }

  if (file.size > MAX_INPUT_BYTES) {
    throw new Error(
      `"${file.name}" supera los 30 MB. Elegí una imagen más liviana.`,
    )
  }

  const source = await loadImageSource(file)

  try {
    if (!source.width || !source.height) {
      throw new Error(`No pudimos obtener el tamaño de "${file.name}".`)
    }

    const scale = Math.min(1, MAX_SIDE / Math.max(source.width, source.height))
    const width = Math.max(1, Math.round(source.width * scale))
    const height = Math.max(1, Math.round(source.height * scale))

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height

    const context = canvas.getContext('2d')
    if (!context) {
      throw new Error('Este navegador no pudo procesar la imagen.')
    }

    context.imageSmoothingEnabled = true
    context.imageSmoothingQuality = 'high'
    context.drawImage(source.image, 0, 0, width, height)

    const blob = await canvasToWebp(canvas)

    if (!blob) {
      throw new Error(
        'Este navegador no pudo generar la imagen en WebP. Actualizalo e intentá de nuevo.',
      )
    }

    if (blob.type && blob.type !== 'image/webp') {
      throw new Error(
        'Este navegador no soporta la conversión a WebP. Actualizalo e intentá de nuevo.',
      )
    }

    return new File([blob], toWebpName(file.name), {
      type: 'image/webp',
      lastModified: Date.now(),
    })
  } finally {
    source.release?.()
  }
}
