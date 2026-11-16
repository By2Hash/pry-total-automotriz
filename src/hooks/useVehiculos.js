import { useCallback, useEffect, useRef, useState } from 'react'
import { catalogConfig } from '../config'
import { readCache, writeCache } from '../data/cache'
import { fetchVehiculos } from '../data/sheet'
import { useOnlineStatus } from './useOnlineStatus'

const initialState = {
  vehicles: [],
  status: 'loading',
  error: null,
  source: null,
  savedAt: null,
  isRefreshing: false,
}

export function useVehiculos() {
  const [state, setState] = useState(initialState)
  const isOnline = useOnlineStatus()
  const requestRef = useRef(null)
  const previousOnlineRef = useRef(isOnline)

  const load = useCallback(async ({ background = false } = {}) => {
    requestRef.current?.abort()
    const controller = new AbortController()
    requestRef.current = controller

    const cached = readCache(catalogConfig.csvUrl)
    const currentOnline =
      typeof navigator === 'undefined' ? true : navigator.onLine

    setState((current) => ({
      ...current,
      status:
        background || current.vehicles.length > 0 ? current.status : 'loading',
      isRefreshing: background || current.vehicles.length > 0,
      error: null,
    }))

    try {
      const { vehicles, warnings } = await fetchVehiculos({
        signal: controller.signal,
      })

      if (import.meta.env.DEV && warnings.length) {
        console.warn('[catálogo] Filas omitidas:', warnings)
      }

      const savedAt = currentOnline
        ? new Date().toISOString()
        : (cached?.savedAt ?? new Date().toISOString())

      if (currentOnline) {
        writeCache(catalogConfig.csvUrl, vehicles)
      }

      setState({
        vehicles,
        status: 'success',
        error: null,
        source: currentOnline ? 'network' : 'cache',
        savedAt,
        isRefreshing: false,
      })
    } catch (error) {
      if (error?.name === 'AbortError') return

      if (import.meta.env.DEV) {
        console.error('[catálogo]', error)
      }

      if (cached) {
        setState({
          vehicles: cached.vehicles,
          status: 'success',
          error,
          source: 'cache',
          savedAt: cached.savedAt,
          isRefreshing: false,
        })
        return
      }

      setState((current) => ({
        ...current,
        vehicles: [],
        status: 'error',
        error,
        source: null,
        savedAt: null,
        isRefreshing: false,
      }))
    }
  }, [])

  useEffect(() => {
    load()
    return () => requestRef.current?.abort()
  }, [load])

  useEffect(() => {
    if (
      isOnline &&
      !previousOnlineRef.current &&
      (state.source === 'cache' || state.status === 'error')
    ) {
      load({ background: state.vehicles.length > 0 })
    }
    previousOnlineRef.current = isOnline
  }, [isOnline, state.source, state.status, state.vehicles.length, load])

  const reload = useCallback(() => {
    load({ background: true })
  }, [load])

  return { ...state, isOnline, reload }
}
