import { useCallback, useEffect, useRef, useState } from 'react'
import { submitVehicle } from '../lib/adminApi'
import {
  buildSubmissionPayload,
  deleteQueuedVehicle,
  listQueuedVehicles,
  saveQueuedVehicle,
} from '../lib/adminQueue'
import { uploadToCloudinary } from '../lib/cloudinary'

const RETRY_BASE_MS = 60_000
const RETRY_MAX_MS = 15 * 60_000
const AUTO_INTERVAL_MS = 45_000

export function useAdminQueue({ clave, online, onCompleted }) {
  const [items, setItems] = useState([])
  const [progress, setProgress] = useState(null)
  const [running, setRunning] = useState(false)
  const [error, setError] = useState('')
  const [authRequired, setAuthRequired] = useState(false)

  const runningRef = useRef(false)
  const mountedRef = useRef(true)
  const claveRef = useRef(clave)
  const onlineRef = useRef(online)
  const completedRef = useRef(onCompleted)

  useEffect(() => {
    claveRef.current = clave
  }, [clave])

  useEffect(() => {
    onlineRef.current = online
  }, [online])

  useEffect(() => {
    completedRef.current = onCompleted
  }, [onCompleted])

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  // Un login nuevo limpia el aviso de sesión vencida sin pasar por un efecto.
  const [claveAnterior, setClaveAnterior] = useState(clave)
  if (clave !== claveAnterior) {
    setClaveAnterior(clave)
    if (clave) setAuthRequired(false)
  }

  const refresh = useCallback(async () => {
    try {
      const list = await listQueuedVehicles()
      if (mountedRef.current) setItems(list)
      return list
    } catch (storageError) {
      if (mountedRef.current) {
        setError(
          storageError.message ||
            'No pudimos leer los vehículos guardados en este dispositivo.',
        )
      }
      return []
    }
  }, [])

  const processItem = useCallback(async (item) => {
    let current = { ...item, status: 'subiendo', error: '' }

    try {
      await saveQueuedVehicle(current)
    } catch {
      // Si no se puede actualizar el estado, seguimos con la subida.
    }

    const total = current.photos.length

    try {
      for (let index = 0; index < total; index += 1) {
        if (current.photos[index]?.url) continue

        if (mountedRef.current) {
          setProgress({
            id: item.id,
            phase: 'upload',
            percent: Math.round((index / total) * 100),
            message: `Subiendo foto ${index + 1} de ${total}…`,
          })
        }

        const photo = current.photos[index]
        const file = new File([photo.blob], photo.name || `foto-${index + 1}.webp`, {
          type: photo.type || 'image/webp',
        })

        const url = await uploadToCloudinary(file, {
          onProgress: (fraction) => {
            if (!mountedRef.current) return
            setProgress({
              id: item.id,
              phase: 'upload',
              percent: Math.min(
                99,
                Math.round(((index + fraction) / total) * 100),
              ),
              message: `Subiendo foto ${index + 1} de ${total}…`,
            })
          },
        })

        current = {
          ...current,
          photos: current.photos.map((entry, photoIndex) =>
            photoIndex === index ? { ...entry, url } : entry,
          ),
        }

        // Guardamos cada URL para no volver a subir esta foto si se corta.
        await saveQueuedVehicle(current)
      }

      if (mountedRef.current) {
        setProgress({
          id: item.id,
          phase: 'save',
          percent: 100,
          message: 'Guardando vehículo…',
        })
      }

      await submitVehicle(claveRef.current, buildSubmissionPayload(current))
      await deleteQueuedVehicle(item.id)

      if (mountedRef.current) {
        setProgress(null)
        setAuthRequired(false)
      }

      completedRef.current?.(current)
      return true
    } catch (uploadError) {
      const attempts = (item.attempts || 0) + 1
      const retryDelay = Math.min(
        RETRY_BASE_MS * 2 ** Math.min(attempts - 1, 4),
        RETRY_MAX_MS,
      )

      try {
        await saveQueuedVehicle({
          ...current,
          status: 'error',
          attempts,
          nextRetryAt: onlineRef.current ? Date.now() + retryDelay : 0,
          error: uploadError.message || 'No se pudo subir el vehículo.',
        })
      } catch {
        // Si tampoco se puede guardar el error, se informa en pantalla.
      }

      if (mountedRef.current) {
        setError(uploadError.message || 'No se pudo subir el vehículo.')
        if (uploadError.code === 'auth') setAuthRequired(true)
      }

      return false
    }
  }, [])

  const processAll = useCallback(
    async (manual) => {
      if (runningRef.current) return

      runningRef.current = true
      if (mountedRef.current) {
        setRunning(true)
        setError('')
      }

      try {
        const pending = await refresh()

        for (const item of pending) {
          if (!claveRef.current || !onlineRef.current) break
          if (!manual && item.nextRetryAt && item.nextRetryAt > Date.now()) {
            continue
          }

          const completed = await processItem(item)
          if (!completed) break
        }
      } finally {
        runningRef.current = false
        if (mountedRef.current) {
          setRunning(false)
          setProgress(null)
        }
        await refresh()
      }
    },
    [processItem, refresh],
  )

  const run = useCallback(
    ({ manual = false } = {}) => {
      if (!claveRef.current || !onlineRef.current || runningRef.current) {
        return Promise.resolve()
      }

      const task = () => processAll(manual)

      if (typeof navigator !== 'undefined' && navigator.locks?.request) {
        return navigator.locks
          .request(
            'total-automotriz-admin-queue',
            { ifAvailable: true },
            async (lock) => {
              if (!lock) return
              await task()
            },
          )
          .catch((lockError) => {
            if (mountedRef.current) {
              setError(
                lockError.message ||
                  'No pudimos coordinar la subida entre pestañas.',
              )
            }
          })
      }

      return task()
    },
    [processAll],
  )

  const enqueue = useCallback(
    async (item) => {
      await saveQueuedVehicle(item)
      await refresh()
      run()
    },
    [refresh, run],
  )

  const retry = useCallback(
    async (id) => {
      try {
        const queue = await listQueuedVehicles()
        const item = queue.find((entry) => entry.id === id)
        if (!item) return

        if (!onlineRef.current) {
          setError('Necesitás conexión a internet para reintentar la subida.')
          return
        }

        await saveQueuedVehicle({
          ...item,
          status: 'pendiente',
          nextRetryAt: 0,
          error: '',
        })
        await refresh()
        await run({ manual: true })
      } catch (retryError) {
        if (mountedRef.current) {
          setError(retryError.message || 'No pudimos reintentar la subida.')
        }
      }
    },
    [refresh, run],
  )

  const remove = useCallback(
    async (id) => {
      try {
        await deleteQueuedVehicle(id)
        await refresh()
      } catch (removeError) {
        if (mountedRef.current) {
          setError(removeError.message || 'No pudimos eliminar la carga pendiente.')
        }
      }
    },
    [refresh],
  )

  useEffect(() => {
    if (!clave) return undefined

    let cancelled = false

    listQueuedVehicles()
      .then((list) => {
        if (!cancelled && mountedRef.current) setItems(list)
      })
      .catch((storageError) => {
        if (!cancelled && mountedRef.current) {
          setError(
            storageError.message ||
              'No pudimos leer los vehículos guardados en este dispositivo.',
          )
        }
      })

    if (online) run()

    return () => {
      cancelled = true
    }
  }, [clave, online, run])

  useEffect(() => {
    if (!clave) return undefined

    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && onlineRef.current) {
        run()
      }
    }

    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [clave, run])

  useEffect(() => {
    if (!clave) return undefined

    const timer = window.setInterval(() => {
      if (onlineRef.current) run()
    }, AUTO_INTERVAL_MS)

    return () => window.clearInterval(timer)
  }, [clave, run])

  return {
    items,
    progress,
    running,
    error,
    authRequired,
    enqueue,
    retry,
    remove,
    run,
    refresh,
  }
}
