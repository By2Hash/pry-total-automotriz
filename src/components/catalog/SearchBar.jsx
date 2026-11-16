import { FiSearch, FiX } from 'react-icons/fi'

export function SearchBar({ value, onChange }) {
  return (
    <div className="search">
      <FiSearch className="search__icon" aria-hidden="true" />
      <label className="sr-only" htmlFor="catalog-search">
        Buscar vehículo por modelo
      </label>
      <input
        id="catalog-search"
        className="search__input"
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Escape' && value) onChange('')
        }}
        placeholder="Buscar por modelo…"
        autoComplete="off"
        enterKeyHint="search"
      />
      {value && (
        <button
          className="search__clear"
          type="button"
          onClick={() => onChange('')}
          aria-label="Limpiar búsqueda"
        >
          <FiX aria-hidden="true" />
        </button>
      )}
    </div>
  )
}
