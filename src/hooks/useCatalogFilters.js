import { useCallback, useMemo, useState } from 'react'
import { catalogConfig } from '../config'
import {
  formatPriceRange,
  normalizeText,
  parseNumberInput,
} from '../lib/format'

const EMPTY_RANGE = { min: '', max: '' }
const INACTIVE_RANGE = { active: false, min: null, max: null }

export const sortOptions = [
  { value: 'ars-asc', label: 'ARS: menor a mayor' },
  { value: 'ars-desc', label: 'ARS: mayor a menor' },
  { value: 'usd-asc', label: 'USD: menor a mayor' },
  { value: 'usd-desc', label: 'USD: mayor a menor' },
]

function parseRange(range) {
  const min = parseNumberInput(range.min)
  const max = parseNumberInput(range.max)

  if (min == null && max == null) return INACTIVE_RANGE

  const lower = min ?? -Infinity
  const upper = max ?? Infinity

  return {
    active: true,
    min: Math.min(lower, upper),
    max: Math.max(lower, upper),
  }
}

function matchesPrice(vehicle, range) {
  if (!range?.active) return true
  if (vehicle.precio == null) return false
  return vehicle.precio >= range.min && vehicle.precio <= range.max
}

function matchesCriteria(vehicle, criteria) {
  if (criteria.searchTokens.length) {
    const model = normalizeText(vehicle.modelo)
    const matchesSearch = criteria.searchTokens.every((token) =>
      model.includes(token),
    )
    if (!matchesSearch) return false
  }

  if (
    criteria.categoria !== 'Todos' &&
    vehicle.categoria !== criteria.categoria
  ) {
    return false
  }

  if (
    criteria.fuels.length &&
    !vehicle.fuelTags.some((fuel) => criteria.fuels.includes(fuel))
  ) {
    return false
  }

  return matchesPrice(vehicle, criteria.ranges[vehicle.moneda])
}

function sortVehicles(vehicles, order) {
  const currencyRank = order.startsWith('ars')
    ? { ARS: 0, USD: 1 }
    : { USD: 0, ARS: 1 }
  const direction = order.endsWith('desc') ? -1 : 1

  return vehicles.sort((a, b) => {
    const rankA = currencyRank[a.moneda] ?? 2
    const rankB = currencyRank[b.moneda] ?? 2
    if (rankA !== rankB) return rankA - rankB

    if (a.precio == null && b.precio == null) {
      return a.modelo.localeCompare(b.modelo, 'es')
    }
    if (a.precio == null) return 1
    if (b.precio == null) return -1

    if (a.precio !== b.precio) return (a.precio - b.precio) * direction
    return a.modelo.localeCompare(b.modelo, 'es')
  })
}

export function useCatalogFilters(vehicles) {
  const [search, setSearch] = useState('')
  const [categoria, setCategoria] = useState('Todos')
  const [fuels, setFuels] = useState([])
  const [precioARS, setPrecioARS] = useState(EMPTY_RANGE)
  const [precioUSD, setPrecioUSD] = useState(EMPTY_RANGE)
  const [orden, setOrden] = useState('ars-asc')

  const availableCategories = useMemo(
    () => new Set(vehicles.map((vehicle) => vehicle.categoria)),
    [vehicles],
  )

  const availableFuels = useMemo(
    () => new Set(vehicles.flatMap((vehicle) => vehicle.fuelTags)),
    [vehicles],
  )

  const effectiveCategoria =
    categoria === 'Todos' || availableCategories.has(categoria)
      ? categoria
      : 'Todos'

  const effectiveFuels = useMemo(
    () => fuels.filter((fuel) => availableFuels.has(fuel)),
    [fuels, availableFuels],
  )

  const searchTokens = useMemo(
    () => normalizeText(search).split(/\s+/).filter(Boolean),
    [search],
  )
  const rangeARS = useMemo(() => parseRange(precioARS), [precioARS])
  const rangeUSD = useMemo(() => parseRange(precioUSD), [precioUSD])

  const criteria = useMemo(
    () => ({
      searchTokens,
      categoria: effectiveCategoria,
      fuels: effectiveFuels,
      ranges: { ARS: rangeARS, USD: rangeUSD },
    }),
    [searchTokens, effectiveCategoria, effectiveFuels, rangeARS, rangeUSD],
  )

  const categoryCounts = useMemo(() => {
    const counts = new Map()

    vehicles.forEach((vehicle) => {
      counts.set(vehicle.categoria, (counts.get(vehicle.categoria) ?? 0) + 1)
    })

    const known = catalogConfig.categorias
      .filter((category) => counts.has(category))
      .map((category) => ({ value: category, count: counts.get(category) }))

    const extras = [...counts.keys()]
      .filter((category) => !catalogConfig.categorias.includes(category))
      .sort((a, b) => a.localeCompare(b, 'es'))
      .map((category) => ({ value: category, count: counts.get(category) }))

    return [{ value: 'Todos', count: vehicles.length }, ...known, ...extras]
  }, [vehicles])

  const fuelOptions = useMemo(() => {
    const counts = new Map()

    vehicles.forEach((vehicle) => {
      vehicle.fuelTags.forEach((fuel) => {
        counts.set(fuel, (counts.get(fuel) ?? 0) + 1)
      })
    })

    return [...counts.entries()]
      .map(([value, count]) => ({ value, count }))
      .sort((a, b) => a.value.localeCompare(b.value, 'es'))
  }, [vehicles])

  const priceBounds = useMemo(() => {
    const bounds = { ARS: null, USD: null }

    vehicles.forEach((vehicle) => {
      if (vehicle.precio == null) return
      const current = bounds[vehicle.moneda]
      if (!current) {
        bounds[vehicle.moneda] = {
          min: vehicle.precio,
          max: vehicle.precio,
          count: 1,
        }
        return
      }

      current.min = Math.min(current.min, vehicle.precio)
      current.max = Math.max(current.max, vehicle.precio)
      current.count += 1
    })

    return bounds
  }, [vehicles])

  const filteredVehicles = useMemo(
    () => sortVehicles(vehicles.filter((vehicle) => matchesCriteria(vehicle, criteria)), orden),
    [vehicles, criteria, orden],
  )

  const activeFilters = useMemo(() => {
    const filters = []

    effectiveFuels.forEach((fuel) => {
      filters.push({
        key: `fuel:${fuel}`,
        type: 'fuel',
        value: fuel,
        label: fuel,
      })
    })

    if (rangeARS.active) {
      filters.push({
        key: 'price:ARS',
        type: 'price',
        value: 'ARS',
        label: `ARS · ${formatPriceRange('ARS', rangeARS)}`,
      })
    }

    if (rangeUSD.active) {
      filters.push({
        key: 'price:USD',
        type: 'price',
        value: 'USD',
        label: formatPriceRange('USD', rangeUSD),
      })
    }

    return filters
  }, [effectiveFuels, rangeARS, rangeUSD])

  const secondaryFilterCount =
    effectiveFuels.length +
    (rangeARS.active ? 1 : 0) +
    (rangeUSD.active ? 1 : 0)
  const hasActiveFilters =
    search.trim().length > 0 ||
    effectiveCategoria !== 'Todos' ||
    secondaryFilterCount > 0

  const toggleFuel = useCallback(
    (fuel) => {
      setFuels((current) => {
        const next = current.filter((item) => availableFuels.has(item))
        return next.includes(fuel)
          ? next.filter((item) => item !== fuel)
          : [...next, fuel]
      })
    },
    [availableFuels],
  )

  const clearSearch = useCallback(() => setSearch(''), [])
  const clearCategory = useCallback(() => setCategoria('Todos'), [])
  const clearFuels = useCallback(() => setFuels([]), [])

  const setPrice = useCallback((currency, field, value) => {
    const setter = currency === 'USD' ? setPrecioUSD : setPrecioARS
    setter((current) => ({ ...current, [field]: value }))
  }, [])

  const clearPrice = useCallback((currency) => {
    const setter = currency === 'USD' ? setPrecioUSD : setPrecioARS
    setter(EMPTY_RANGE)
  }, [])

  const clearSecondary = useCallback(() => {
    setFuels([])
    setPrecioARS(EMPTY_RANGE)
    setPrecioUSD(EMPTY_RANGE)
  }, [])

  const clearAll = useCallback(() => {
    setSearch('')
    setCategoria('Todos')
    setFuels([])
    setPrecioARS(EMPTY_RANGE)
    setPrecioUSD(EMPTY_RANGE)
  }, [])

  const removeActiveFilter = useCallback(
    (filter) => {
      if (filter.type === 'fuel') {
        setFuels((current) =>
          current.filter((fuel) => fuel !== filter.value),
        )
        return
      }
      clearPrice(filter.value)
    },
    [clearPrice],
  )

  const suggestions = useMemo(() => {
    if (
      filteredVehicles.length > 0 ||
      vehicles.length === 0 ||
      !hasActiveFilters
    ) {
      return []
    }

    const options = []

    if (searchTokens.length) {
      const count = vehicles.filter((vehicle) =>
        matchesCriteria(vehicle, { ...criteria, searchTokens: [] }),
      ).length
      if (count > 0) {
        options.push({
          key: 'search',
          label: 'Quitar búsqueda',
          chipLabel: `“${search.trim()}”`,
          count,
          action: clearSearch,
        })
      }
    }

    if (effectiveCategoria !== 'Todos') {
      const count = vehicles.filter((vehicle) =>
        matchesCriteria(vehicle, { ...criteria, categoria: 'Todos' }),
      ).length
      if (count > 0) {
        options.push({
          key: 'category',
          label: 'Ver todas las categorías',
          chipLabel: effectiveCategoria,
          count,
          action: clearCategory,
        })
      }
    }

    if (effectiveFuels.length) {
      const count = vehicles.filter((vehicle) =>
        matchesCriteria(vehicle, { ...criteria, fuels: [] }),
      ).length
      if (count > 0) {
        options.push({
          key: 'fuels',
          label: 'Quitar combustible',
          chipLabel: 'Combustible',
          count,
          action: clearFuels,
        })
      }
    }

    if (rangeARS.active) {
      const count = vehicles.filter((vehicle) =>
        matchesCriteria(vehicle, {
          ...criteria,
          ranges: { ...criteria.ranges, ARS: INACTIVE_RANGE },
        }),
      ).length
      if (count > 0) {
        options.push({
          key: 'price-ARS',
          label: 'Quitar filtro ARS',
          chipLabel: 'ARS',
          count,
          action: () => clearPrice('ARS'),
        })
      }
    }

    if (rangeUSD.active) {
      const count = vehicles.filter((vehicle) =>
        matchesCriteria(vehicle, {
          ...criteria,
          ranges: { ...criteria.ranges, USD: INACTIVE_RANGE },
        }),
      ).length
      if (count > 0) {
        options.push({
          key: 'price-USD',
          label: 'Quitar filtro USD',
          chipLabel: 'USD',
          count,
          action: () => clearPrice('USD'),
        })
      }
    }

    return options.sort((a, b) => b.count - a.count).slice(0, 3)
  }, [
    filteredVehicles.length,
    vehicles,
    hasActiveFilters,
    searchTokens,
    criteria,
    search,
    effectiveCategoria,
    effectiveFuels.length,
    rangeARS.active,
    rangeUSD.active,
    clearSearch,
    clearCategory,
    clearFuels,
    clearPrice,
  ])

  return {
    search,
    setSearch,
    categoria: effectiveCategoria,
    setCategoria,
    fuels: effectiveFuels,
    toggleFuel,
    clearFuels,
    precioARS,
    precioUSD,
    setPrice,
    clearPrice,
    rangeARS,
    rangeUSD,
    priceBounds,
    orden,
    setOrden,
    categoryCounts,
    fuelOptions,
    filteredVehicles,
    total: vehicles.length,
    filteredCount: filteredVehicles.length,
    activeFilters,
    secondaryFilterCount,
    hasActiveFilters,
    clearSecondary,
    clearAll,
    removeActiveFilter,
    suggestions,
    searchTokens,
    clearSearch,
    clearCategory,
  }
}
