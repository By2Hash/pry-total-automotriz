import { FiCheck } from 'react-icons/fi'

export function FuelFilter({ options, selected, onToggle }) {
  if (!options.length) {
    return <p className="filter-empty">Todavía no hay datos de combustible.</p>
  }

  return (
    <div className="fuel-chips" role="group" aria-label="Filtrar por combustible">
      {options.map((option) => {
        const pressed = selected.includes(option.value)

        return (
          <button
            key={option.value}
            className="fuel-chip"
            type="button"
            aria-pressed={pressed}
            onClick={() => onToggle(option.value)}
          >
            <span className="fuel-chip__check" aria-hidden="true">
              <FiCheck />
            </span>
            <span>{option.value}</span>
            <span className="fuel-chip__count" aria-hidden="true">
              {option.count}
            </span>
          </button>
        )
      })}
    </div>
  )
}
