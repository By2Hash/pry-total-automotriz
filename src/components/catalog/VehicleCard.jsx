import { FaWhatsapp } from 'react-icons/fa6'
import { FiImage, FiMaximize2 } from 'react-icons/fi'
import { formatPrice } from '../../lib/format'
import { buildVehicleWhatsAppUrl } from '../../lib/whatsapp'
import { VehicleImage } from './VehicleImage'

export function VehicleCard({ vehicle, index = 0, photos = [], onOpen }) {
  const meta = [vehicle.anio, vehicle.combustible].filter(Boolean)
  const url = buildVehicleWhatsAppUrl(vehicle)
  const count = photos.length
  const open = () => onOpen?.(vehicle)
  const detailLabel = count
    ? `Ver ${count} ${count === 1 ? 'foto' : 'fotos'} y detalles de ${vehicle.modelo}`
    : `Ver detalles de ${vehicle.modelo}`

  return (
    <article
      className="vehicle-card"
      style={{ '--i': Math.min(index, 10) }}
    >
      <button
        className="vehicle-card__media-button"
        type="button"
        onClick={open}
        aria-label={detailLabel}
      >
        <div className="vehicle-card__media">
          <VehicleImage
            key={`${vehicle.id}-${photos[0]?.src ?? ''}`}
            vehicle={vehicle}
            photos={photos}
          />

          {vehicle.detalle && (
            <span className="vehicle-card__badge" title={vehicle.detalle}>
              {vehicle.detalle}
            </span>
          )}

          {count > 1 && (
            <span className="vehicle-card__photo-count" aria-hidden="true">
              <FiImage />
              {count}
            </span>
          )}

          <span className="vehicle-card__photo-hint" aria-hidden="true">
            <FiMaximize2 />
            {count > 1 ? 'Ver fotos' : 'Ver detalle'}
          </span>
        </div>
      </button>

      <div className="vehicle-card__body">
        <p className="vehicle-card__category">{vehicle.categoria}</p>
        <h3 className="vehicle-card__title">
          <button
            className="vehicle-card__title-button"
            type="button"
            onClick={open}
            aria-label={detailLabel}
          >
            {vehicle.modelo}
          </button>
        </h3>

        {meta.length > 0 && (
          <p className="vehicle-card__meta">{meta.join(' · ')}</p>
        )}

        {vehicle.descripcion && (
          <p className="vehicle-card__desc">{vehicle.descripcion}</p>
        )}

        <div className="vehicle-card__footer">
          <p className="vehicle-card__price">
            {formatPrice(vehicle.precio, vehicle.moneda)}
          </p>

          {url && (
            <a
              className="vehicle-card__cta"
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Consultar por ${vehicle.modelo} en WhatsApp`}
            >
              <FaWhatsapp aria-hidden="true" />
              <span>Consultar</span>
            </a>
          )}
        </div>
      </div>
    </article>
  )
}
