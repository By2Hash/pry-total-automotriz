import { FiRefreshCw } from 'react-icons/fi'

const MESSAGES = {
  'network-error':
    'No pudimos conectarnos con el catálogo. Revisá tu conexión e intentá de nuevo.',
  'http-error':
    'El catálogo no está respondiendo en este momento. Probá de nuevo en unos minutos.',
  'invalid-csv':
    'El catálogo llegó con un formato inesperado. Avisanos por WhatsApp y lo revisamos.',
  'missing-columns':
    'Faltan datos en el catálogo. Avisanos por WhatsApp y lo revisamos.',
  'missing-url': 'Falta configurar la dirección del catálogo.',
}

export function ErrorState({ error, isOnline, isRetrying, onRetry }) {
  const message =
    MESSAGES[error?.code] ||
    'Ocurrió un problema al cargar el catálogo. Intentá de nuevo.'

  const details = [error?.name, error?.code, error?.message]
    .filter(Boolean)
    .join(' · ')

  return (
    <div className="error-state" role="alert">
      <svg
        className="error-plug"
        viewBox="0 0 220 70"
        aria-hidden="true"
      >
        <g className="error-plug__left">
          <path
            className="error-plug__cord"
            d="M-14 54C24 54 40 35 72 35"
          />
          <path className="error-plug__pin" d="M100 28h14M100 42h14" />
          <rect
            className="error-plug__body"
            x="68"
            y="19"
            width="34"
            height="32"
            rx="8"
          />
        </g>
        <g className="error-plug__right">
          <rect
            className="error-plug__body"
            x="124"
            y="17"
            width="38"
            height="36"
            rx="9"
          />
          <path className="error-plug__hole" d="M124 28h6M124 42h6" />
          <circle className="error-plug__led" cx="153" cy="25" r="3" />
          <path
            className="error-plug__cord"
            d="M162 35C188 35 194 16 236 16"
          />
        </g>
      </svg>

      <h2 className="error-state__title">No pudimos cargar el catálogo</h2>
      <p className="error-state__text">{message}</p>

      {!isOnline && (
        <p className="error-state__offline">
          Ahora mismo estás sin conexión a internet.
        </p>
      )}

      <button
        className="btn btn--primary error-state__retry"
        type="button"
        onClick={onRetry}
        disabled={isRetrying}
      >
        <FiRefreshCw
          className={isRetrying ? 'spin' : ''}
          aria-hidden="true"
        />
        {isRetrying ? 'Reintentando…' : 'Reintentar'}
      </button>

      {details && (
        <details className="error-state__details">
          <summary>Detalles técnicos</summary>
          <code>{details}</code>
        </details>
      )}
    </div>
  )
}
