import { useCallback, useEffect, useState } from 'react'
import {
  FiAlertCircle,
  FiAlertTriangle,
  FiArrowLeft,
  FiCheckCircle,
  FiDatabase,
  FiExternalLink,
  FiInfo,
  FiLogOut,
  FiWifiOff,
  FiX,
} from 'react-icons/fi'
import { useAdminQueue } from '../../hooks/useAdminQueue'
import { useOnlineStatus } from '../../hooks/useOnlineStatus'
import { catalogConfig } from '../../config'
import { isAdminConfigured, loginAdmin } from '../../lib/adminApi'
import { roleLabel } from '../../lib/adminConfig'
import { ensurePersistentStorage } from '../../lib/adminQueue'
import {
  clearAdminKey,
  clearAdminSession,
  readAdminBackendLegacy,
  readAdminKey,
  readAdminRole,
  writeAdminBackendLegacy,
  writeAdminKey,
  writeAdminRole,
} from '../../lib/adminStorage'
import {
  getCloudinaryMissingVars,
  isCloudinaryConfigured,
} from '../../lib/cloudinary'
import { AdminLogin } from './AdminLogin'
import { PendingList } from './PendingList'
import { VehicleEditor } from './VehicleEditor'
import { VehicleForm } from './VehicleForm'

const PAGE_TITLE = 'Cargar vehículo | Total Automotriz'

const NOTICE_ICONS = {
  success: FiCheckCircle,
  warning: FiAlertTriangle,
  error: FiAlertCircle,
  info: FiInfo,
  queued: FiDatabase,
}

function AdminNotice({ notice, onDismiss }) {
  const Icon = NOTICE_ICONS[notice.type] || FiInfo

  return (
    <div
      className={`admin-banner admin-banner--${notice.type}`}
      role={notice.type === 'error' ? 'alert' : 'status'}
    >
      <Icon className="admin-banner__icon" aria-hidden="true" />

      <div className="admin-banner__body">
        {notice.title && <strong>{notice.title}</strong>}
        {notice.text && <p>{notice.text}</p>}
      </div>

      {notice.type === 'success' && (
        <a className="admin-banner__action" href="/">
          Ver catálogo
        </a>
      )}

      {onDismiss && (
        <button
          className="admin-banner__close"
          type="button"
          onClick={onDismiss}
          aria-label="Cerrar aviso"
        >
          <FiX aria-hidden="true" />
        </button>
      )}
    </div>
  )
}

export function AdminPage() {
  const [clave, setClave] = useState(readAdminKey)
  const [role, setRole] = useState(readAdminRole)
  const [backendLegacy, setBackendLegacy] = useState(
    () =>
      readAdminBackendLegacy() ||
      (Boolean(readAdminKey()) && !readAdminRole()),
  )
  const [tab, setTab] = useState('cargar')
  const [notice, setNotice] = useState(null)
  const online = useOnlineStatus()

  const appsScriptReady = isAdminConfigured()
  const cloudinaryReady = isCloudinaryConfigured()
  const missingCloudinary = getCloudinaryMissingVars()

  const handleCompleted = useCallback((item) => {
    setNotice({
      type: 'success',
      title: 'Auto cargado',
      text: `${item.payload.modelo} aparece en el catálogo en unos minutos.`,
    })
  }, [])

  const queue = useAdminQueue({
    clave,
    online,
    onCompleted: handleCompleted,
  })

  useEffect(() => {
    const previousTitle = document.title
    const existing = document.querySelector('meta[name="robots"]')
    const previousRobots = existing?.getAttribute('content')
    const created = !existing

    document.title = PAGE_TITLE

    const meta = existing || document.createElement('meta')
    if (created) {
      meta.setAttribute('name', 'robots')
      document.head.appendChild(meta)
    }
    meta.setAttribute('content', 'noindex, nofollow')

    return () => {
      document.title = previousTitle
      if (created) {
        meta.remove()
      } else if (previousRobots == null) {
        meta.removeAttribute('content')
      } else {
        meta.setAttribute('content', previousRobots)
      }
    }
  }, [])

  useEffect(() => {
    if (clave) ensurePersistentStorage()
  }, [clave])

  // Revalidamos la sesión al abrir el panel: así sabemos el rol y si el
  // Apps Script desplegado ya soporta roles.
  useEffect(() => {
    if (!clave) return undefined

    let cancelled = false

    loginAdmin(clave)
      .then((session) => {
        if (cancelled) return
        setRole(session.role)
        writeAdminRole(session.role)
        setBackendLegacy(Boolean(session.legacy))
        writeAdminBackendLegacy(Boolean(session.legacy))
        if (session.legacy) setTab('cargar')
      })
      .catch(() => {
        // Si la clave ya no sirve, la cola lo va a detectar al subir.
      })

    return () => {
      cancelled = true
    }
  }, [clave])

  const handleLogin = (value, nextRole, legacy) => {
    writeAdminKey(value)
    writeAdminRole(nextRole || 'admin')
    writeAdminBackendLegacy(Boolean(legacy))
    setRole(nextRole || 'admin')
    setBackendLegacy(Boolean(legacy))
    setClave(value)
    setTab('cargar')
    setNotice(null)
  }

  const handleLogout = () => {
    const pending = queue.items.length
    const message = queue.running
      ? 'Hay una carga en curso. ¿Cerrar sesión igual?'
      : pending > 0
        ? `Hay ${pending} ${pending === 1 ? 'vehículo pendiente' : 'vehículos pendientes'}. Van a quedar guardados hasta que vuelvas a ingresar. ¿Cerrar sesión?`
        : ''

    if (message && !window.confirm(message)) return

    clearAdminSession()
    setClave('')
    setRole('')
    writeAdminBackendLegacy(false)
    setBackendLegacy(false)
    setNotice(null)
  }

  const handleRelogin = () => {
    clearAdminKey()
    setClave('')
    setRole('')
    writeAdminBackendLegacy(false)
    setBackendLegacy(false)
    setNotice({
      type: 'warning',
      title: 'Volvé a ingresar',
      text: 'La cola quedó guardada en el dispositivo y se reanuda al iniciar sesión.',
    })
  }

  const handleQueued = useCallback(({ modelo, offline }) => {
    setNotice(
      offline
        ? {
            type: 'queued',
            title: 'Guardado en el dispositivo',
            text: `${modelo} se va a subir automáticamente cuando vuelva la conexión.`,
          }
        : {
            type: 'info',
            title: 'Vehículo guardado',
            text: `${modelo} se está subiendo. Podés seguir cargando otro.`,
          },
    )
  }, [])

  const handleRemove = (id) => {
    if (
      window.confirm(
        '¿Eliminar esta carga pendiente? Las fotos guardadas en el dispositivo se van a borrar.',
      )
    ) {
      queue.remove(id)
    }
  }

  return (
    <div className="admin-page">
      <header className="admin-header">
        <a
          className="admin-header__brand"
          href="/"
          aria-label="Total Automotriz — Ir al catálogo"
        >
          <img src="/logo.png" alt="Total Automotriz" height="34" />
        </a>

        <div className="admin-header__actions">
          {clave && <span className="admin-header__user">{roleLabel(role)}</span>}
          {clave && (
            <button
              className="admin-header__logout"
              type="button"
              onClick={handleLogout}
            >
              <FiLogOut aria-hidden="true" />
              <span>Cerrar sesión</span>
            </button>
          )}
        </div>
      </header>

      <main className="admin-main">
        {!online && (
          <div className="admin-banner admin-banner--offline" role="status">
            <FiWifiOff className="admin-banner__icon" aria-hidden="true" />
            <div className="admin-banner__body">
              <strong>Sin conexión</strong>
              <p>
                Podés completar el formulario. Los vehículos quedan guardados en
                este dispositivo hasta que vuelva internet.
              </p>
            </div>
          </div>
        )}

        {!appsScriptReady && clave && (
          <div className="admin-banner admin-banner--warning" role="alert">
            <FiAlertTriangle className="admin-banner__icon" aria-hidden="true" />
            <div className="admin-banner__body">
              <strong>Falta la URL de Apps Script</strong>
              <p>
                Configurá <code>VITE_APPS_SCRIPT_URL</code> en el archivo{' '}
                <code>.env</code> y reiniciá el servidor.
              </p>
            </div>
          </div>
        )}

        {notice && (
          <AdminNotice notice={notice} onDismiss={() => setNotice(null)} />
        )}

        {clave && queue.authRequired && (
          <div className="admin-banner admin-banner--warning" role="alert">
            <FiAlertTriangle className="admin-banner__icon" aria-hidden="true" />
            <div className="admin-banner__body">
              <strong>La clave no fue aceptada</strong>
              <p>
                La cola quedó guardada. Volvé a ingresar para reanudar la subida.
              </p>
            </div>
            <button
              className="admin-banner__action"
              type="button"
              onClick={handleRelogin}
            >
              Ingresar
            </button>
          </div>
        )}

        {clave && queue.error && !queue.authRequired && (
          <div className="admin-banner admin-banner--error" role="alert">
            <FiAlertCircle className="admin-banner__icon" aria-hidden="true" />
            <div className="admin-banner__body">
              <strong>No se pudo completar la subida</strong>
              <p>{queue.error}</p>
            </div>
            <button
              className="admin-banner__action"
              type="button"
              onClick={() => queue.run({ manual: true })}
              disabled={!online || queue.running}
            >
              Reintentar
            </button>
          </div>
        )}

        {!clave ? (
          <AdminLogin onLogin={handleLogin} />
        ) : (
          <>
            <div
              className="admin-tabs"
              role="tablist"
              aria-label="Secciones del panel"
            >
              <button
                className={`admin-tab${tab === 'cargar' ? ' is-active' : ''}`}
                type="button"
                role="tab"
                aria-selected={tab === 'cargar'}
                onClick={() => setTab('cargar')}
              >
                Cargar vehículo
              </button>
              <button
                className={`admin-tab${tab === 'fotos' ? ' is-active' : ''}`}
                type="button"
                role="tab"
                aria-selected={tab === 'fotos'}
                onClick={() => setTab('fotos')}
                disabled={backendLegacy}
                title={
                  backendLegacy
                    ? 'Actualizá Apps Script para editar fotos'
                    : undefined
                }
              >
                Vehículos
              </button>
            </div>

            {catalogConfig.sheetEditUrl && (
              <div className="admin-sheet">
                <div className="admin-sheet__body">
                  <strong>¿Preferís editar directo en la planilla?</strong>
                  <p>
                    Los cambios hechos ahí aparecen en el catálogo cuando Google
                    actualice el CSV (30 s a 2 min).
                  </p>
                </div>
                <a
                  className="admin-mini"
                  href={catalogConfig.sheetEditUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <FiExternalLink aria-hidden="true" />
                  Abrir Google Sheets
                </a>
              </div>
            )}

            {backendLegacy && (
              <div className="admin-banner admin-banner--warning" role="alert">
                <FiAlertTriangle
                  className="admin-banner__icon"
                  aria-hidden="true"
                />
                <div className="admin-banner__body">
                  <strong>Falta actualizar Apps Script</strong>
                  <p>
                    El panel todavía usa la versión anterior del backend. Para
                    editar o eliminar vehículos y usar el rol empleado, pegá el{' '}
                    <code>apps-script/Code.gs</code> actualizado y creá una
                    nueva versión de la implementación.
                  </p>
                </div>
              </div>
            )}

            {!cloudinaryReady && (
              <div className="admin-banner admin-banner--warning" role="alert">
                <FiAlertTriangle
                  className="admin-banner__icon"
                  aria-hidden="true"
                />
                <div className="admin-banner__body">
                  <strong>Cloudinary incompleto</strong>
                  <p>
                    Faltan {missingCloudinary.join(' y ')} en el archivo{' '}
                    <code>.env</code>. No se van a poder subir las fotos.
                  </p>
                </div>
              </div>
            )}

            {tab === 'cargar' ? (
              <>
                <VehicleForm
                  online={online}
                  cloudinaryReady={cloudinaryReady}
                  onSubmitItem={queue.enqueue}
                  onQueued={handleQueued}
                />

                <PendingList
                  items={queue.items}
                  progress={queue.progress}
                  running={queue.running}
                  online={online}
                  onRetry={queue.retry}
                  onRemove={handleRemove}
                  onUploadNow={() => queue.run({ manual: true })}
                />
              </>
            ) : (
              <VehicleEditor
                clave={clave}
                online={online}
                cloudinaryReady={cloudinaryReady}
              />
            )}
          </>
        )}
      </main>

      <footer className="admin-footer">
        <a href="/">
          <FiArrowLeft aria-hidden="true" />
          Volver al catálogo
        </a>
      </footer>
    </div>
  )
}
