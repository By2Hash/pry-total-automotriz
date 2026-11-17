import { useState } from 'react'
import { FaWhatsapp } from 'react-icons/fa6'
import { pluralize } from '../../lib/format'
import { generalWhatsAppUrl } from '../../lib/whatsapp'
import { useCatalogFilters } from '../../hooks/useCatalogFilters'
import { useFotos } from '../../hooks/useFotos'
import { useVehiculos } from '../../hooks/useVehiculos'
import { getVehiclePhotos } from '../../lib/media'
import { CatalogSkeleton } from '../feedback/CatalogSkeleton'
import { DataNotice } from '../feedback/DataNotice'
import { EmptyState } from '../feedback/EmptyState'
import { ErrorState } from '../feedback/ErrorState'
import { ActiveFilters } from './ActiveFilters'
import { CategoryTabs } from './CategoryTabs'
import { FilterToggle } from './FilterToggle'
import { FiltersPanel } from './FiltersPanel'
import { SearchBar } from './SearchBar'
import { SortSelect } from './SortSelect'
import { VehicleDetail } from './VehicleDetail'
import { VehicleGrid } from './VehicleGrid'

export function CatalogPage() {
  const {
    vehicles,
    status,
    error,
    source,
    savedAt,
    isRefreshing,
    isOnline,
    reload,
  } = useVehiculos()

  const {
    search,
    setSearch,
    categoria,
    setCategoria,
    fuels,
    toggleFuel,
    precioARS,
    precioUSD,
    setPrice,
    clearPrice,
    priceBounds,
    orden,
    setOrden,
    categoryCounts,
    fuelOptions,
    filteredVehicles,
    total,
    filteredCount,
    activeFilters,
    secondaryFilterCount,
    hasActiveFilters,
    clearSecondary,
    clearAll,
    removeActiveFilter,
    suggestions,
  } = useCatalogFilters(vehicles)

  const fotos = useFotos()
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [selectedVehicle, setSelectedVehicle] = useState(null)

  const countText =
    status === 'loading'
      ? 'Cargando vehículos…'
      : status === 'error'
        ? 'Catálogo no disponible'
        : filteredCount === total
          ? `${total} ${pluralize(total, 'vehículo disponible', 'vehículos disponibles')}`
          : `${filteredCount} de ${total} ${pluralize(total, 'vehículo', 'vehículos')}`

  return (
    <main className="catalog-page">
      <section className="catalog-hero container">
        <p className="catalog-hero__eyebrow">
          Total Automotriz · Córdoba
        </p>
        <h1 className="catalog-hero__title">Encontrá tu próximo vehículo</h1>
        <p className="catalog-hero__text">
          Autos, utilitarios, motos y maquinaria con disponibilidad
          actualizada. Filtrá a tu manera y consultanos por WhatsApp.
        </p>
      </section>

      <div className="container catalog-body">
        <DataNotice
          isOnline={isOnline}
          source={source}
          savedAt={savedAt}
          isRefreshing={isRefreshing}
          onRefresh={reload}
        />

        <SearchBar value={search} onChange={setSearch} />

        <CategoryTabs
          categories={categoryCounts}
          value={categoria}
          onChange={setCategoria}
        />

        <div className="catalog-toolbar">
          <p
            className="catalog-toolbar__count"
            role="status"
            aria-live="polite"
          >
            {countText}
            {isRefreshing && status === 'success' && (
              <span className="catalog-toolbar__refreshing">
                Actualizando…
              </span>
            )}
          </p>

          <div className="catalog-toolbar__actions">
            <FilterToggle
              open={filtersOpen}
              activeCount={secondaryFilterCount}
              onClick={() => setFiltersOpen((current) => !current)}
            />
            <SortSelect value={orden} onChange={setOrden} />
          </div>
        </div>

        <FiltersPanel
          open={filtersOpen}
          fuels={fuels}
          fuelOptions={fuelOptions}
          onToggleFuel={toggleFuel}
          precioARS={precioARS}
          precioUSD={precioUSD}
          setPrice={setPrice}
          clearPrice={clearPrice}
          clearSecondary={clearSecondary}
          hasSecondary={secondaryFilterCount > 0}
          priceBounds={priceBounds}
        />

        <ActiveFilters
          filters={activeFilters}
          onRemove={removeActiveFilter}
          onClear={clearSecondary}
        />

        <section
          className="catalog-results"
          id="catalog-results"
          aria-label="Resultados del catálogo"
        >
          {status === 'loading' && <CatalogSkeleton />}

          {status === 'error' && (
            <ErrorState
              error={error}
              isOnline={isOnline}
              isRetrying={isRefreshing}
              onRetry={reload}
            />
          )}

          {status === 'success' &&
            (total === 0 ? (
              <div className="empty-state">
                <h2 className="empty-state__title">
                  No hay vehículos disponibles por el momento
                </h2>
                <p className="empty-state__text">
                  Volvé a visitarnos pronto o escribinos para conocer las
                  próximas unidades.
                </p>
              </div>
            ) : filteredCount === 0 && hasActiveFilters ? (
              <EmptyState
                search={search}
                suggestions={suggestions}
                onClear={clearAll}
              />
            ) : (
              <VehicleGrid
                vehicles={filteredVehicles}
                photosById={fotos}
                onOpen={setSelectedVehicle}
              />
            ))}
        </section>
      </div>

      <section className="container catalog-cta-wrap">
        <div className="catalog-cta">
          <div>
            <p className="catalog-cta__eyebrow">¿No está lo que buscás?</p>
            <h2 className="catalog-cta__title">
              Consultanos por disponibilidad
            </h2>
            <p className="catalog-cta__text">
              Te contamos qué está por entrar y resolvemos tus dudas.
            </p>
          </div>

          {generalWhatsAppUrl && (
            <a
              className="btn btn--whatsapp"
              href={generalWhatsAppUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              <FaWhatsapp aria-hidden="true" />
              Escribinos
            </a>
          )}
        </div>
      </section>

      {selectedVehicle && (
        <VehicleDetail
          key={selectedVehicle.id}
          vehicle={selectedVehicle}
          photos={getVehiclePhotos(selectedVehicle, fotos)}
          onClose={() => setSelectedVehicle(null)}
        />
      )}
    </main>
  )
}
