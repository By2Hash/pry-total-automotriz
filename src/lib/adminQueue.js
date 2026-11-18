const DB_NAME = 'total-automotriz-admin'
const DB_VERSION = 1
const STORE = 'pendientes'

let dbPromise = null

function openDatabase() {
  if (dbPromise) return dbPromise

  dbPromise = new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('Este navegador no permite guardar datos sin conexión.'))
      return
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = () => {
      const database = request.result
      if (!database.objectStoreNames.contains(STORE)) {
        const store = database.createObjectStore(STORE, { keyPath: 'id' })
        store.createIndex('createdAt', 'createdAt')
      }
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => {
      dbPromise = null
      reject(request.error || new Error('No pudimos abrir el almacenamiento local.'))
    }
  })

  return dbPromise
}

function runTransaction(mode, operation) {
  return openDatabase().then(
    (database) =>
      new Promise((resolve, reject) => {
        const transaction = database.transaction(STORE, mode)
        const store = transaction.objectStore(STORE)
        let result

        try {
          result = operation(store)
        } catch (error) {
          reject(error)
          return
        }

        transaction.oncomplete = () => resolve(result)
        transaction.onerror = () => reject(transaction.error)
        transaction.onabort = () => reject(transaction.error)
      }),
  )
}

export function createQueueId() {
  try {
    return crypto.randomUUID()
  } catch {
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`
  }
}

export function listQueuedVehicles() {
  return openDatabase().then(
    (database) =>
      new Promise((resolve, reject) => {
        const request = database
          .transaction(STORE, 'readonly')
          .objectStore(STORE)
          .getAll()

        request.onsuccess = () => {
          const items = Array.isArray(request.result) ? request.result : []
          resolve(items.sort((a, b) => a.createdAt - b.createdAt))
        }
        request.onerror = () => reject(request.error)
      }),
  )
}

export function saveQueuedVehicle(item) {
  return runTransaction('readwrite', (store) => store.put(item))
}

export function deleteQueuedVehicle(id) {
  return runTransaction('readwrite', (store) => store.delete(id))
}

export function buildQueuedVehicle(values, files) {
  const precio = Number(String(values.precio ?? '').replace(/\D/g, '')) || 0

  return {
    id: createQueueId(),
    createdAt: Date.now(),
    status: 'pendiente',
    attempts: 0,
    nextRetryAt: 0,
    error: '',
    payload: {
      categoria: String(values.categoria || '').trim(),
      modelo: String(values.modelo || '').trim(),
      anio: String(values.anio || '').trim(),
      combustible: String(values.combustible || '').trim(),
      detalle: String(values.detalle || '').trim(),
      moneda: String(values.moneda || 'ARS').trim(),
      precio,
      descripcion: String(values.descripcion || '').trim(),
    },
    photos: files.map((file, index) => ({
      name: `foto-${index + 1}.webp`,
      type: 'image/webp',
      size: file.size,
      blob: file,
      url: '',
    })),
  }
}

export function buildSubmissionPayload(item) {
  return {
    ...item.payload,
    fotos: item.photos.map((photo) => photo.url).filter(Boolean),
  }
}

export async function ensurePersistentStorage() {
  if (typeof navigator === 'undefined' || !navigator.storage) return false

  try {
    if (typeof navigator.storage.persisted === 'function') {
      const alreadyPersisted = await navigator.storage.persisted()
      if (alreadyPersisted) return true
    }

    if (typeof navigator.storage.persist === 'function') {
      return Boolean(await navigator.storage.persist())
    }
  } catch {
    return false
  }

  return false
}
