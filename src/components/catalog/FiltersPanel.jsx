import { useRef, useState } from 'react'
import { FuelFilter } from './FuelFilter'
import { PriceFilter } from './PriceFilter'

function FilterSection({
  id,
  title,
  summary,
  open,
  onToggle,
  onKeyDown,
  children,
}) {
  const triggerId = `${id}-trigger`
  const bodyId = `${id}-body`

  return (
    <div className={`filter-section${open ? ' is-open' : ''}`}>
      <button
        className="filter-section__trigger"
        id={triggerId}
        type="button"
        aria-expanded={open}
        aria-controls={bodyId}
        onClick={onToggle}
        onKeyDown={onKeyDown}
      >
        <span className="filter-section__title">{title}</span>
        {summary && <span className="filter-section__summary">{summary}</span>}
        <span className="filter-plus" aria-hidden="true" />
      </button>
      <div
        className="filter-section__body"
        id={bodyId}
        role="region"
        aria-labelledby={triggerId}
      >
        <div>
          <div className="filter-section__content">{children}</div>
        </div>
      </div>
    </div>
  )
}

export function FiltersPanel({
  open,
  fuels,
  fuelOptions,
  onToggleFuel,
  precioARS,
  precioUSD,
  setPrice,
  clearPrice,
  clearSecondary,
  hasSecondary,
  priceBounds,
}) {
  const [section, setSection] = useState('fuel')
  const panelRef = useRef(null)

  const priceActive =
    precioARS.min !== '' ||
    precioARS.max !== '' ||
    precioUSD.min !== '' ||
    precioUSD.max !== ''

  const toggleSection = (name) => {
    setSection((current) => (current === name ? null : name))
  }

  const handleTriggerKeyDown = (event) => {
    const keys = ['ArrowDown', 'ArrowUp', 'Home', 'End']
    if (!keys.includes(event.key)) return

    const triggers = [
      ...panelRef.current.querySelectorAll('.filter-section__trigger'),
    ]
    const index = triggers.indexOf(event.currentTarget)
    if (index < 0) return

    event.preventDefault()

    let next = 0
    if (event.key === 'End') next = triggers.length - 1
    else if (event.key === 'ArrowDown') next = (index + 1) % triggers.length
    else if (event.key === 'ArrowUp')
      next = (index - 1 + triggers.length) % triggers.length

    triggers[next]?.focus()
  }

  const fuelSummary = fuels.length
    ? `${fuels.length} seleccionado${fuels.length === 1 ? '' : 's'}`
    : ''
  const priceSummary = priceActive ? 'Con rango' : ''

  return (
    <div
      id="filters-panel"
      ref={panelRef}
      className={`filters-panel${open ? ' is-open' : ''}`}
      aria-hidden={!open}
      inert={open ? undefined : true}
    >
      <div className="filters-panel__inner">
        <div className="filters-panel__card">
          <div className="filters-panel__head">
            <p className="filters-panel__title">Filtros del catálogo</p>
            {hasSecondary && (
              <button
                className="filters-panel__clear"
                type="button"
                onClick={clearSecondary}
              >
                Limpiar todo
              </button>
            )}
          </div>

          <div className="filter-sections">
            <FilterSection
              id="filter-fuel"
              title="Combustible"
              summary={fuelSummary}
              open={section === 'fuel'}
              onToggle={() => toggleSection('fuel')}
              onKeyDown={handleTriggerKeyDown}
            >
              <FuelFilter
                options={fuelOptions}
                selected={fuels}
                onToggle={onToggleFuel}
              />
            </FilterSection>

            <FilterSection
              id="filter-price"
              title="Precio"
              summary={priceSummary}
              open={section === 'price'}
              onToggle={() => toggleSection('price')}
              onKeyDown={handleTriggerKeyDown}
            >
              <PriceFilter
                precioARS={precioARS}
                precioUSD={precioUSD}
                setPrice={setPrice}
                clearPrice={clearPrice}
                priceBounds={priceBounds}
              />
            </FilterSection>
          </div>
        </div>
      </div>
    </div>
  )
}
