import { useRef } from 'react'
import { FiCamera, FiImage, FiX } from 'react-icons/fi'

export function PhotoPicker({ photos, max, onAdd, onRemove, error }) {
  const galleryRef = useRef(null)
  const cameraRef = useRef(null)

  const handleChange = (event) => {
    onAdd(event.target.files)
    event.target.value = ''
  }

  return (
    <div className="admin-photos" data-field="fotos">
      <div className="admin-photos__head">
        <span className="admin-field__label">Fotos *</span>
        <span className="admin-photos__count">
          {photos.length} / {max}
        </span>
      </div>

      {photos.length > 0 ? (
        <ul className="admin-photo-grid">
          {photos.map((photo, index) => (
            <li className="admin-photo" key={photo.id}>
              <img
                src={photo.preview}
                alt={`Foto ${index + 1}${index === 0 ? ', portada' : ''}`}
                loading="lazy"
                decoding="async"
              />
              {index === 0 && (
                <span className="admin-photo__cover">Portada</span>
              )}
              <button
                className="admin-photo__remove"
                type="button"
                onClick={() => onRemove(photo.id)}
                aria-label={`Quitar foto ${index + 1}`}
              >
                <FiX aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="admin-hint">
          Agregá al menos una foto. La primera que elijas será la portada del
          vehículo.
        </p>
      )}

      <div className="admin-photo-actions">
        <button
          className="btn btn--ghost"
          type="button"
          onClick={() => galleryRef.current?.click()}
        >
          <FiImage aria-hidden="true" />
          Elegir de galería
        </button>
        <button
          className="btn btn--ghost"
          type="button"
          onClick={() => cameraRef.current?.click()}
        >
          <FiCamera aria-hidden="true" />
          Tomar foto
        </button>
      </div>

      <input
        ref={galleryRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={handleChange}
      />
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        hidden
        onChange={handleChange}
      />

      {photos.length > 1 && (
        <p className="admin-hint">
          Para cambiar la portada, quitá la primera foto y volvé a agregarla en
          el orden que quieras.
        </p>
      )}

      {error && <p className="admin-field__error">{error}</p>}
    </div>
  )
}
