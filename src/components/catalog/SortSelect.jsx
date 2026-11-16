import { FiChevronDown } from 'react-icons/fi'
import { sortOptions } from '../../hooks/useCatalogFilters'

export function SortSelect({ value, onChange }) {
  return (
    <label className="sort-select">
      <span className="sr-only">Ordenar vehículos</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {sortOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <FiChevronDown className="sort-select__icon" aria-hidden="true" />
    </label>
  )
}
