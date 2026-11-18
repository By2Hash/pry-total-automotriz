import { useState } from 'react'
import { FiLock, FiUploadCloud } from 'react-icons/fi'
import { siteConfig } from '../../config'
import { readAdminKey } from '../../lib/adminStorage'
import { SocialLinks } from './SocialLinks'
import { ThemeToggle } from './ThemeToggle'

export function Navbar() {
  const [logoFailed, setLogoFailed] = useState(false)
  const [hasSession] = useState(() => Boolean(readAdminKey()))

  return (
    <header className="navbar">
      <div className="navbar__inner container">
        <div className="navbar__left">
          <a
            className="navbar__access"
            href="/admin"
            title={hasSession ? 'Cargar vehículo' : 'Acceso al panel'}
            aria-label={hasSession ? 'Cargar vehículo' : 'Acceso al panel'}
          >
            {hasSession ? (
              <FiUploadCloud aria-hidden="true" />
            ) : (
              <FiLock aria-hidden="true" />
            )}
            <span className="navbar__access-label">
              {hasSession ? 'Cargar vehículo' : 'Acceso'}
            </span>
          </a>
          <ThemeToggle />
        </div>

        <a
          className="navbar__brand"
          href="/"
          aria-label={`${siteConfig.nombre} — Inicio`}
        >
          {logoFailed ? (
            <span className="navbar__wordmark">
              TOTAL <b>AUTOMOTRIZ</b>
            </span>
          ) : (
            <img
              className="navbar__logo"
              src="/logo.png"
              alt={siteConfig.nombre}
              height="46"
              onError={() => setLogoFailed(true)}
            />
          )}
        </a>

        <div className="navbar__right">
          <SocialLinks />
        </div>
      </div>
    </header>
  )
}
