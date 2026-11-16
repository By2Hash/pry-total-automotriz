import { FiArrowRight } from 'react-icons/fi'

export function EmptyState({ search, suggestions, onClear }) {
  const query = search.trim()

  return (
    <div className="empty-state" role="status">
      <div className="empty-state__art" aria-hidden="true">
        <svg viewBox="0 0 150 92">
          <path
            className="empty-shelf"
            d="M8 30h134M8 56h134M8 82h134"
          />
          <g className="empty-lens">
            <circle cx="34" cy="38" r="20" />
            <path className="empty-lens__gl" d="M24 30a12 12 0 0 1 8-5" />
            <path className="empty-lens__handle" d="M48 52l14 14" />
          </g>
        </svg>
      </div>

      <h2 className="empty-state__title">
        No encontramos vehículos con esos filtros
      </h2>
      <p className="empty-state__text">
        {query
          ? `No hay coincidencias para “${query}”.`
          : 'Probá quitando un filtro o ampliando el rango de precio.'}
      </p>

      {suggestions.length > 0 && (
        <div className="empty-state__suggestions">
          <p className="empty-state__label">Un cambio puede alcanzar:</p>
          {suggestions.map((suggestion) => (
            <button
              key={suggestion.key}
              className="empty-suggestion"
              type="button"
              onClick={suggestion.action}
            >
              <span className="empty-suggestion__chip">
                {suggestion.chipLabel}
              </span>
              <span className="empty-suggestion__text">
                <b>{suggestion.count}</b>{' '}
                {suggestion.count === 1 ? 'resultado' : 'resultados'}
              </span>
              <FiArrowRight aria-hidden="true" />
            </button>
          ))}
        </div>
      )}

      <button
        className="btn btn--ghost empty-state__clear"
        type="button"
        onClick={onClear}
      >
        Limpiar todos los filtros
      </button>
    </div>
  )
}
