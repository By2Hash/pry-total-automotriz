import { FiRefreshCw } from 'react-icons/fi'
import { formatSavedAt } from '../../lib/format'

function WifiIcon() {
  return (
    <svg viewBox="0 0 24 24" className="data-notice__wifi">
      <path
        className="data-notice__arc data-notice__arc--3"
        d="M2.8 9.2a13.2 13.2 0 0 1 18.4 0"
      />
      <path
        className="data-notice__arc data-notice__arc--2"
        d="M5.7 12.4a9 9 0 0 1 12.6 0"
      />
      <path
        className="data-notice__arc data-notice__arc--1"
        d="M8.6 15.6a4.8 4.8 0 0 1 6.8 0"
      />
      <circle cx="12" cy="19" r="1.3" className="data-notice__dot" />
      <path className="data-notice__slash" d="M4.5 3.5l15 17" />
    </svg>
  )
}

export function DataNotice({
  isOnline,
  source,
  savedAt,
  isRefreshing,
  onRefresh,
}) {
  const offline = !isOnline
  const cached = source === 'cache'

  if (!offline && !cached) return null

  const savedLabel = formatSavedAt(savedAt)

  let text
  if (offline && (cached || savedAt)) {
    text = savedLabel
      ? `Mostrando la última información guardada. Última actualización: ${savedLabel}`
      : 'Mostrando la última información guardada del catálogo.'
  } else if (offline) {
    text =
      'No hay una copia guardada todavía. Cargaremos el catálogo cuando vuelvas a estar en línea.'
  } else {
    text = savedLabel
      ? `No pudimos actualizar el catálogo. Última actualización: ${savedLabel}`
      : 'No pudimos actualizar el catálogo. Estás viendo la información guardada.'
  }

  return (
    <div
      className={`data-notice${offline ? ' data-notice--offline' : ''}`}
      role="status"
    >
      <span className="data-notice__icon" aria-hidden="true">
        {offline ? <WifiIcon /> : <FiRefreshCw />}
      </span>

      <div className="data-notice__text">
        <b>{offline ? 'Sin conexión' : 'Mostrando una copia guardada'}</b>
        <small>{text}</small>
      </div>

      {!offline && onRefresh && (
        <button
          className="data-notice__action"
          type="button"
          onClick={onRefresh}
          disabled={isRefreshing}
        >
          <FiRefreshCw
            className={isRefreshing ? 'spin' : ''}
            aria-hidden="true"
          />
          {isRefreshing ? 'Actualizando…' : 'Actualizar'}
        </button>
      )}
    </div>
  )
}
