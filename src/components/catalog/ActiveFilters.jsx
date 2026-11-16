import { FiX } from 'react-icons/fi'

export function ActiveFilters({ filters, onRemove, onClear }) {
  if (!filters.length) return null

  return (
    <div className="active-filters" role="group" aria-label="Filtros activos">
      <span className="active-filters__label">Filtros:</span>
      {filters.map((filter) => (
        <button
          key={filter.key}
          className="active-filter"
          type="button"
          onClick={() => onRemove(filter)}
          aria-label={`Quitar filtro ${filter.label}`}
        >
          <span>{filter.label}</span>
          <span className="active-filter__x" aria-hidden="true">
            <FiX />
          </span>
        </button>
      ))}
      <button className="active-filters__clear" type="button" onClick={onClear}>
        Limpiar
      </button>
    </div>
  )
}
