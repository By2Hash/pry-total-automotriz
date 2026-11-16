import { FaInstagram, FaWhatsapp } from 'react-icons/fa6'
import { siteConfig } from '../../config'
import { buildWhatsAppUrl } from '../../lib/whatsapp'

export function SocialLinks({ withLabels = false, className = '' }) {
  const whatsappUrl = buildWhatsAppUrl()
  const links = []

  if (whatsappUrl) {
    links.push({
      key: 'whatsapp',
      label: 'WhatsApp',
      href: whatsappUrl,
      Icon: FaWhatsapp,
    })
  }

  if (siteConfig.instagram) {
    links.push({
      key: 'instagram',
      label: 'Instagram',
      href: siteConfig.instagram,
      Icon: FaInstagram,
    })
  }

  return (
    <div
      className={`social-links${className ? ` ${className}` : ''}`}
      aria-label="Redes sociales"
    >
      {links.map(({ key, label, href, Icon }) => (
        <a
          key={key}
          className={`social-link${withLabels ? ' social-link--label' : ''}`}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Abrir ${label} en una pestaña nueva`}
          title={label}
        >
          <Icon aria-hidden="true" />
          {withLabels && <span>{label}</span>}
        </a>
      ))}
    </div>
  )
}
