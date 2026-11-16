import { useCallback, useEffect, useLayoutEffect, useRef } from 'react'

export function CategoryTabs({ categories, value, onChange }) {
  const listRef = useRef(null)
  const pillRef = useRef(null)
  const tabRefs = useRef(new Map())
  const previousValueRef = useRef(null)

  const movePill = useCallback((category, animate) => {
    const tab = tabRefs.current.get(category)
    const pill = pillRef.current
    if (!tab || !pill) return

    if (!animate) pill.style.transition = 'none'
    pill.style.setProperty('--x', `${tab.offsetLeft}px`)
    pill.style.setProperty('--w', `${tab.offsetWidth}px`)

    if (!animate) {
      void pill.offsetWidth
      pill.style.transition = ''
    }
  }, [])

  useLayoutEffect(() => {
    const animate =
      previousValueRef.current != null && previousValueRef.current !== value
    movePill(value, animate)
    previousValueRef.current = value
  }, [value, movePill])

  useEffect(() => {
    const list = listRef.current
    if (!list) return undefined

    const observer = new ResizeObserver(() => movePill(value, false))
    observer.observe(list)
    return () => observer.disconnect()
  }, [value, movePill])

  useEffect(() => {
    if (!document.fonts?.ready) return
    document.fonts.ready
      .then(() => movePill(value, false))
      .catch(() => {})
  }, [value, movePill])

  const select = (category, focus = true) => {
    movePill(category, true)
    onChange(category)

    const tab = tabRefs.current.get(category)
    if (!tab) return

    const reduceMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches
    tab.scrollIntoView({
      inline: 'nearest',
      block: 'nearest',
      behavior: reduceMotion ? 'auto' : 'smooth',
    })

    if (focus) tab.focus({ preventScroll: true })
  }

  const handleKeyDown = (event, index) => {
    let nextIndex = null

    if (event.key === 'ArrowRight') {
      nextIndex = (index + 1) % categories.length
    } else if (event.key === 'ArrowLeft') {
      nextIndex = (index - 1 + categories.length) % categories.length
    } else if (event.key === 'Home') {
      nextIndex = 0
    } else if (event.key === 'End') {
      nextIndex = categories.length - 1
    }

    if (nextIndex == null) return
    event.preventDefault()
    select(categories[nextIndex].value)
  }

  return (
    <div
      className="category-tabs"
      ref={listRef}
      role="tablist"
      aria-label="Categorías"
    >
      <span className="category-tabs__pill" ref={pillRef} aria-hidden="true" />
      {categories.map((category, index) => {
        const selected = category.value === value

        return (
          <button
            key={category.value}
            ref={(node) => {
              if (node) tabRefs.current.set(category.value, node)
              else tabRefs.current.delete(category.value)
            }}
            className="category-tab"
            type="button"
            role="tab"
            aria-selected={selected}
            aria-controls="catalog-results"
            tabIndex={selected ? 0 : -1}
            onClick={() => select(category.value, false)}
            onKeyDown={(event) => handleKeyDown(event, index)}
          >
            {category.value}
          </button>
        )
      })}
    </div>
  )
}
