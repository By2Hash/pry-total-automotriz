import { useEffect, useRef, useState } from 'react'
import { FaCarSide, FaWhatsapp } from 'react-icons/fa6'
import {
  FiChevronLeft,
  FiChevronRight,
  FiImage,
  FiX,
} from 'react-icons/fi'
import { formatPrice } from '../../lib/format'
import { optimizedPhotoUrl } from '../../lib/media'
import { buildVehicleWhatsAppUrl } from '../../lib/whatsapp'

export function VehicleDetail({ vehicle, photos = [], onClose }) {
  const dialogRef = useRef(null)
  const thumbsRef = useRef(null)
  const touchStartRef = useRef(null)
  const [index, setIndex] = useState(0)
  const [failedSrc, setFailedSrc] = useState('')

  const total = photos.length
  const current = photos[index]
  const rawSrc = current?.src
  const src = optimizedPhotoUrl(rawSrc, 1200)
  const showImage = Boolean(rawSrc) && failedSrc !== rawSrc
  const url = buildVehicleWhatsAppUrl(vehicle)
  const meta = [vehicle.anio, vehicle.combustible].filter(Boolean)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return undefined

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    dialog.showModal()

    return () => {
      document.body.style.overflow = previousOverflow
      if (dialog.open) dialog.close()
    }
  }, [])

  useEffect(() => {
    const active = thumbsRef.current?.querySelector('[aria-current="true"]')
    active?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
  }, [index])

  useEffect(() => {
    if (total < 2) return

    const neighbors = [photos[index + 1]?.src, photos[index - 1]?.src]
    neighbors.filter(Boolean).forEach((neighbor) => {
      const image = new Image()
      image.src = optimizedPhotoUrl(neighbor, 1200)
    })
  }, [index, photos, total])

  const close = () => {
    if (dialogRef.current?.open) dialogRef.current.close()
    onClose()
  }

  const goTo = (nextIndex) => {
    if (nextIndex < 0 || nextIndex >= total) return
    setIndex(nextIndex)
  }

  const handleKeyDown = (event) => {
    if (event.key === 'ArrowLeft') {
      event.preventDefault()
      goTo(index - 1)
    } else if (event.key === 'ArrowRight') {
      event.preventDefault()
      goTo(index + 1)
    }
  }

  const handleBackdropClick = (event) => {
    if (event.target === dialogRef.current) close()
  }

  const handleTouchStart = (event) => {
    touchStartRef.current = event.touches[0]?.clientX ?? null
  }

  const handleTouchEnd = (event) => {
    if (touchStartRef.current == null) return

    const distance = (event.changedTouches[0]?.clientX ?? 0) - touchStartRef.current
    touchStartRef.current = null

    if (Math.abs(distance) < 45) return
    goTo(distance < 0 ? index + 1 : index - 1)
  }

  return (
    <dialog
      className="vehicle-detail"
      ref={dialogRef}
      aria-labelledby="vehicle-detail-title"
      onCancel={(event) => {
        event.preventDefault()
        close()
      }}
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
    >
      <div className="vehicle-detail__panel">
        <div className="vehicle-detail__gallery">
          <div
            className="vehicle-detail__stage"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            {showImage ? (
              <img
                className="vehicle-detail__image"
                key={src}
                src={src}
                alt={`${vehicle.modelo}${vehicle.anio ? ` ${vehicle.anio}` : ''}, foto ${index + 1}`}
                decoding="async"
                onError={() => setFailedSrc(rawSrc)}
              />
            ) : (
              <div className="vehicle-detail__photo-empty">
                <FaCarSide aria-hidden="true" />
                <p>
                  {total
                    ? 'No pudimos mostrar esta foto.'
                    : 'Todavía no hay fotos cargadas para este vehículo.'}
                </p>
              </div>
            )}

            {total > 0 && (
              <span className="vehicle-detail__counter" aria-live="polite">
                <FiImage aria-hidden="true" />
                {index + 1} / {total}
              </span>
            )}

            {total > 1 && (
              <>
                <button
                  className="vehicle-detail__arrow vehicle-detail__arrow--prev"
                  type="button"
                  onClick={() => goTo(index - 1)}
                  disabled={index === 0}
                  aria-label="Foto anterior"
                >
                  <FiChevronLeft aria-hidden="true" />
                </button>
                <button
                  className="vehicle-detail__arrow vehicle-detail__arrow--next"
                  type="button"
                  onClick={() => goTo(index + 1)}
                  disabled={index === total - 1}
                  aria-label="Foto siguiente"
                >
                  <FiChevronRight aria-hidden="true" />
                </button>
              </>
            )}
          </div>

          {total > 1 && (
            <div
              className="vehicle-detail__thumbs"
              ref={thumbsRef}
              role="group"
              aria-label="Miniaturas de fotos"
            >
              {photos.map((photo, photoIndex) => (
                <button
                  className="vehicle-detail__thumb"
                  type="button"
                  key={photo.src}
                  aria-current={photoIndex === index ? 'true' : undefined}
                  aria-label={`Ver foto ${photoIndex + 1} de ${total}`}
                  onClick={() => goTo(photoIndex)}
                >
                  <img
                    src={optimizedPhotoUrl(photo.thumb || photo.src, 300)}
                    alt=""
                    loading="lazy"
                    decoding="async"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="vehicle-detail__info">
          <header className="vehicle-detail__header">
            <p className="vehicle-detail__eyebrow">{vehicle.categoria}</p>
            <h2 className="vehicle-detail__title" id="vehicle-detail-title">
              {vehicle.modelo}
            </h2>

            {meta.length > 0 && (
              <p className="vehicle-detail__meta">{meta.join(' · ')}</p>
            )}
          </header>

          <dl className="vehicle-detail__facts">
            <div className="vehicle-detail__fact">
              <dt>Condición</dt>
              <dd className={vehicle.detalle ? 'is-alert' : ''}>
                {vehicle.detalle || 'Consultar'}
              </dd>
            </div>
            <div className="vehicle-detail__fact vehicle-detail__fact--price">
              <dt>Precio</dt>
              <dd className="vehicle-detail__price">
                {formatPrice(vehicle.precio, vehicle.moneda)}
              </dd>
            </div>
          </dl>

          {vehicle.descripcion && (
            <p className="vehicle-detail__description">
              {vehicle.descripcion}
            </p>
          )}

          {url && (
            <div className="vehicle-detail__actions">
              <a
                className="btn btn--whatsapp vehicle-detail__cta"
                href={url}
                target="_blank"
                rel="noopener noreferrer"
              >
                <FaWhatsapp aria-hidden="true" />
                Consultar por WhatsApp
              </a>
            </div>
          )}
        </div>
      </div>

      <button
        className="vehicle-detail__close"
        type="button"
        onClick={close}
        aria-label="Cerrar detalle"
      >
        <FiX aria-hidden="true" />
      </button>
    </dialog>
  )
}
