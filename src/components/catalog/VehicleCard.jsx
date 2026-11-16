import { FaWhatsapp } from 'react-icons/fa6'
import { formatPrice } from '../../lib/format'
import { buildVehicleWhatsAppUrl } from '../../lib/whatsapp'
import { VehicleImage } from './VehicleImage'

export function VehicleCard({ vehicle, index = 0 }) {
  const meta = [vehicle.anio, vehicle.combustible].filter(Boolean)
  const url = buildVehicleWhatsAppUrl(vehicle)

  return (
    <article
      className="vehicle-card"
      style={{ '--i': Math.min(index, 10) }}
    >
      <div className="vehicle-card__media">
        <VehicleImage key={vehicle.id} vehicle={vehicle} />
        {vehicle.detalle && (
          <span className="vehicle-card__badge" title={vehicle.detalle}>
            {vehicle.detalle}
          </span>
        )}
      </div>

      <div className="vehicle-card__body">
        <p className="vehicle-card__category">{vehicle.categoria}</p>
        <h3 className="vehicle-card__title">{vehicle.modelo}</h3>

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
