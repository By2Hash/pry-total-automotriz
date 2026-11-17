import { useEffect, useState } from 'react'

const EMPTY = {}

export function useFotos() {
  const [fotos, setFotos] = useState(EMPTY)

  useEffect(() => {
    const controller = new AbortController()
    const url = `${import.meta.env.BASE_URL}fotos/manifest.json`

    fetch(url, { signal: controller.signal, cache: 'no-cache' })
      .then((response) => (response.ok ? response.json() : EMPTY))
      .then((data) => {
        if (data && typeof data === 'object' && !Array.isArray(data)) {
          setFotos(data)
        }
      })
      .catch(() => {
        // Sin manifest se usan las fotos del Sheet o el placeholder.
      })

    return () => controller.abort()
  }, [])

  return fotos
}
