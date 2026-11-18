import { useRef, useState } from 'react'
import {
  FiAlertCircle,
  FiEye,
  FiEyeOff,
  FiLoader,
  FiLock,
  FiLogIn,
} from 'react-icons/fi'
import { isAdminConfigured, loginAdmin } from '../../lib/adminApi'

export function AdminLogin({ onLogin }) {
  const [clave, setClave] = useState('')
  const [visible, setVisible] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef(null)
  const configured = isAdminConfigured()

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!clave.trim()) {
      setError('Ingresá la clave para continuar.')
      inputRef.current?.focus()
      return
    }

    setLoading(true)
    setError('')

    const value = clave.trim()

    try {
      const session = await loginAdmin(value)
      onLogin(value, session.role, session.legacy)
    } catch (loginError) {
      setError(loginError.message || 'No pudimos validar la clave.')
      setLoading(false)
      inputRef.current?.focus()
      inputRef.current?.select()
    }
  }

  return (
    <section className="admin-card admin-login">
      <div className="admin-login__icon" aria-hidden="true">
        <FiLock />
      </div>

      <div>
        <h1 className="admin-login__title">Acceso al panel</h1>
        <p className="admin-login__text">
          Ingresá tu clave de administrador o empleado para gestionar el catálogo.
        </p>
      </div>

      <form className="admin-login__form" onSubmit={handleSubmit}>
        <label className="admin-field" data-field="clave">
          <span>Clave</span>
          <div className="admin-password">
            <input
              ref={inputRef}
              type={visible ? 'text' : 'password'}
              value={clave}
              onChange={(event) => setClave(event.target.value)}
              autoComplete="current-password"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              enterKeyHint="go"
              placeholder="Tu clave de acceso"
              aria-invalid={Boolean(error)}
            />
            <button
              type="button"
              className="admin-password__toggle"
              onClick={() => setVisible((current) => !current)}
              aria-label={visible ? 'Ocultar clave' : 'Mostrar clave'}
            >
              {visible ? <FiEyeOff aria-hidden="true" /> : <FiEye aria-hidden="true" />}
            </button>
          </div>
        </label>

        {error && (
          <p className="admin-field__error" role="alert">
            <FiAlertCircle aria-hidden="true" />
            {error}
          </p>
        )}

        {!configured && (
          <p className="admin-hint admin-hint--warning">
            Falta configurar <code>VITE_APPS_SCRIPT_URL</code> en el archivo{' '}
            <code>.env</code>.
          </p>
        )}

        <button
          className="btn btn--primary admin-login__submit"
          type="submit"
          disabled={loading || !configured}
        >
          {loading ? (
            <>
              <FiLoader className="spin" aria-hidden="true" />
              Validando…
            </>
          ) : (
            <>
              <FiLogIn aria-hidden="true" />
              Entrar
            </>
          )}
        </button>

        <p className="admin-hint">
          La sesión se guarda solo en esta pestaña. La clave no se almacena en
          el proyecto.
        </p>
      </form>
    </section>
  )
}
