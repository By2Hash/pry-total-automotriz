import {
  FiCheck,
  FiClock,
  FiImage,
  FiRefreshCw,
  FiTrash2,
  FiUploadCloud,
} from 'react-icons/fi'

const dateFormatter = new Intl.DateTimeFormat('es-AR', {
  dateStyle: 'short',
  timeStyle: 'short',
})

function statusFor(item, activeId) {
  if (activeId === item.id) return { label: 'Subiendo', tone: 'working' }
  if (item.status === 'error') return { label: 'Error', tone: 'error' }
  return { label: 'En espera', tone: 'waiting' }
}

function retryText(item) {
  if (!item.nextRetryAt) return ''
  const remaining = item.nextRetryAt - Date.now()
  if (remaining <= 0) return ''
  const minutes = Math.max(1, Math.ceil(remaining / 60000))
  return `Reintento automático en ~${minutes} min.`
}

export function PendingList({
  items,
  progress,
  running,
  online,
  onRetry,
  onRemove,
  onUploadNow,
}) {
  const activeId = progress?.id || null

  return (
    <section className="admin-card admin-queue">
      <div className="admin-queue__head">
        <div>
          <h2 className="admin-card__title">Cargas pendientes</h2>
          <p className="admin-card__text">
            {items.length === 0
              ? 'No hay vehículos esperando para subirse.'
              : `${items.length} ${
                  items.length === 1 ? 'vehículo guardado' : 'vehículos guardados'
                } en este dispositivo.`}
          </p>
        </div>

        {items.length > 0 && (
          <button
            className="btn btn--ghost admin-queue__upload"
            type="button"
            onClick={onUploadNow}
            disabled={!online || running}
          >
            <FiUploadCloud aria-hidden="true" />
            Subir ahora
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <p className="admin-queue__empty">
          <FiCheck aria-hidden="true" />
          Todo al día.
        </p>
      ) : (
        <ul className="admin-queue__list">
          {items.map((item) => {
            const status = statusFor(item, activeId)
            const isActive = activeId === item.id
            const pendingRetry = retryText(item)

            return (
              <li className="admin-queue__item" key={item.id}>
                <div className="admin-queue__row">
                  <div className="admin-queue__info">
                    <p className="admin-queue__title">{item.payload.modelo}</p>
                    <p className="admin-queue__meta">
                      <FiImage aria-hidden="true" />
                      {item.photos.length}{' '}
                      {item.photos.length === 1 ? 'foto' : 'fotos'}
                      <span aria-hidden="true">·</span>
                      <FiClock aria-hidden="true" />
                      {dateFormatter.format(new Date(item.createdAt))}
                    </p>
                  </div>

                  <span className={`admin-status admin-status--${status.tone}`}>
                    {status.label}
                  </span>
                </div>

                {isActive && progress && (
                  <div className="admin-progress" role="status" aria-live="polite">
                    <div className="admin-progress__bar">
                      <span style={{ width: `${progress.percent}%` }} />
                    </div>
                    <p className="admin-progress__text">{progress.message}</p>
                  </div>
                )}

                {item.error && !isActive && (
                  <p className="admin-queue__error">{item.error}</p>
                )}

                {pendingRetry && (
                  <p className="admin-queue__retry">{pendingRetry}</p>
                )}

                <div className="admin-queue__actions">
                  <button
                    className="admin-mini"
                    type="button"
                    onClick={() => onRetry(item.id)}
                    disabled={!online || running}
                  >
                    <FiRefreshCw aria-hidden="true" />
                    Reintentar
                  </button>
                  <button
                    className="admin-mini admin-mini--danger"
                    type="button"
                    onClick={() => onRemove(item.id)}
                    disabled={running && isActive}
                  >
                    <FiTrash2 aria-hidden="true" />
                    Eliminar
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
