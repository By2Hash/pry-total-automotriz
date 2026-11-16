import { useCallback, useEffect, useState } from 'react'

const STORAGE_KEY = 'total-automotriz:theme'

function getInitialTheme() {
  if (typeof document === 'undefined') return 'light'

  const current = document.documentElement.dataset.theme
  if (current === 'light' || current === 'dark') return current

  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'light' || stored === 'dark') return stored
  } catch {
    // Sin preferencia guardada.
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light'
}

export function useTheme() {
  const [theme, setTheme] = useState(getInitialTheme)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    document.documentElement.style.colorScheme = theme

    const meta = document.querySelector('meta[name="theme-color"]')
    if (meta) {
      meta.setAttribute('content', theme === 'dark' ? '#0d0d0e' : '#ffffff')
    }

    try {
      localStorage.setItem(STORAGE_KEY, theme)
    } catch {
      // El tema sigue funcionando aunque no se pueda persistir.
    }
  }, [theme])

  const toggleTheme = useCallback(() => {
    setTheme((current) => (current === 'dark' ? 'light' : 'dark'))
  }, [])

  return { theme, toggleTheme }
}
