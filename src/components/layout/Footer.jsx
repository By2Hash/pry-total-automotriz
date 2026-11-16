import { FiClock, FiMapPin } from 'react-icons/fi'
import { siteConfig } from '../../config'
import { generalWhatsAppUrl } from '../../lib/whatsapp'
import { SocialLinks } from './SocialLinks'

export function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="footer">
      <div className="container footer__inner">
        <div className="footer__brand">
          <span className="footer__wordmark">
            TOTAL <b>AUTOMOTRIZ</b>
          </span>
          <p className="footer__description">{siteConfig.descripcion}</p>
          <p className="footer__location">
            {[siteConfig.ciudad, siteConfig.provincia, siteConfig.pais]
              .filter(Boolean)
              .join(', ')}
          </p>
        </div>

        <div className="footer__col">
          <h2 className="footer__title">Sucursales</h2>
          <ul className="footer__addresses">
            {siteConfig.sucursales.map((sucursal) => (
              <li key={sucursal.nombre}>
                <span className="footer__branch">{sucursal.nombre}</span>
                <span className="footer__address">
                  <FiMapPin aria-hidden="true" />
                  {sucursal.direccion}
                </span>
              </li>
            ))}
          </ul>

          {siteConfig.horarios && (
            <p className="footer__hours">
              <FiClock aria-hidden="true" />
              {siteConfig.horarios}
            </p>
          )}
        </div>

        <div className="footer__col">
          <h2 className="footer__title">Contacto</h2>
          <p className="footer__phone">WhatsApp: {siteConfig.whatsapp}</p>
          {generalWhatsAppUrl && (
            <a
              className="footer__cta"
              href={generalWhatsAppUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              Escribinos
            </a>
          )}
          <SocialLinks withLabels />
        </div>
      </div>

      <div className="container footer__bottom">
        <span>
          © {year} {siteConfig.nombre}
        </span>
        <span>Precios y disponibilidad sujetos a cambios.</span>
      </div>
    </footer>
  )
}
