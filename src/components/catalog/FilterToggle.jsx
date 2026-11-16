import { FiSliders } from 'react-icons/fi'

export function FilterToggle({ open, activeCount, onClick }) {
  return (
    <button
      className={`filter-toggle${open ? ' is-open' : ''}`}
      type="button"
      aria-expanded={open}
      aria-controls="filters-panel"
      onClick={onClick}
    >
      <FiSliders aria-hidden="true" />
      <span>Filtros</span>
      {activeCount > 0 && (
        <span
          className="filter-toggle__count"
          aria-label={`${activeCount} filtros activos`}
        >
          {activeCount}
        </span>
      )}
      <span className="filter-plus" aria-hidden="true" />
    </button>
  )
}
