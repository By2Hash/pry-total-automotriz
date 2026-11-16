import { useState } from 'react'
import { siteConfig } from '../../config'
import { SocialLinks } from './SocialLinks'
import { ThemeToggle } from './ThemeToggle'

export function Navbar() {
  const [logoFailed, setLogoFailed] = useState(false)

  return (
    <header className="navbar">
      <div className="navbar__inner container">
        <div className="navbar__left">
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
