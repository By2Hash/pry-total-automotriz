import { useEffect, useRef, useState } from 'react'
import {
  FiAlertCircle,
  FiLoader,
  FiUploadCloud,
} from 'react-icons/fi'
import { CATEGORIES, FUELS, MAX_PHOTOS, YEARS } from '../../lib/adminConfig'
import { formatPrice } from '../../lib/format'
import { ADMIN_DRAFT_KEY } from '../../lib/adminStorage'
import {
  buildQueuedVehicle,
  createQueueId,
} from '../../lib/adminQueue'
import { compressImage } from '../../lib/imageCompression'
import { PhotoPicker } from './PhotoPicker'

const EMPTY_VALUES = {
  categoria: '',
  modelo: '',
  anio: '',
  combustible: '',
  detalle: '',
  moneda: 'ARS',
  precio: '',
  descripcion: '',
}

function readDraft() {
  try {
    const parsed = JSON.parse(sessionStorage.getItem(ADMIN_DRAFT_KEY) || 'null')
    if (!parsed || typeof parsed !== 'object') return { ...EMPTY_VALUES }

    return Object.fromEntries(
      Object.entries(EMPTY_VALUES).map(([key, fallback]) => [
        key,
        typeof parsed[key] === 'string' ? parsed[key] : fallback,
      ]),
    )
  } catch {
    return { ...EMPTY_VALUES }
  }
}

function saveDraft(values) {
  try {
    const isEmpty = Object.entries(EMPTY_VALUES).every(
      ([key, fallback]) => values[key] === fallback,
    )

    if (isEmpty) {
      sessionStorage.removeItem(ADMIN_DRAFT_KEY)
      return
    }

    sessionStorage.setItem(ADMIN_DRAFT_KEY, JSON.stringify(values))
  } catch {
    // Si el navegador no permite guardar el borrador, el formulario sigue igual.
  }
}

function clearDraft() {
  try {
    sessionStorage.removeItem(ADMIN_DRAFT_KEY)
  } catch {
    // Nada que limpiar.
  }
}

export function VehicleForm({
  online,
  cloudinaryReady,
  onSubmitItem,
  onQueued,
}) {
  const [values, setValues] = useState(readDraft)
  const [photos, setPhotos] = useState([])
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [busy, setBusy] = useState(false)
  const [phase, setPhase] = useState('')
  const [progress, setProgress] = useState(0)

  const formRef = useRef(null)
  const photosRef = useRef(photos)

  useEffect(() => {
    photosRef.current = photos
  }, [photos])

  useEffect(() => {
    saveDraft(values)
  }, [values])

  useEffect(
    () => () => {
      photosRef.current.forEach((photo) => URL.revokeObjectURL(photo.preview))
    },
    [],
  )

  const updateField = (field, value) => {
    setValues((current) => ({ ...current, [field]: value }))
    setErrors((current) => {
      if (!current[field]) return current
      const next = { ...current }
      delete next[field]
      return next
    })
  }

  const addPhotos = (fileList) => {
    const incoming = Array.from(fileList || []).filter((file) =>
      file.type.startsWith('image/'),
    )

    if (incoming.length === 0) {
      setErrors((current) => ({
        ...current,
        fotos: 'Elegí archivos de imagen (JPG, PNG o WebP).',
      }))
      return
    }

    const remaining = MAX_PHOTOS - photos.length
    if (remaining <= 0) {
      setErrors((current) => ({
        ...current,
        fotos: `Máximo ${MAX_PHOTOS} fotos por vehículo.`,
      }))
      return
    }

    const accepted = incoming.slice(0, remaining)

    setPhotos((current) => [
      ...current,
      ...accepted.map((file) => ({
        id: createQueueId(),
        file,
        preview: URL.createObjectURL(file),
      })),
    ])

    setErrors((current) => {
      const next = { ...current }
      delete next.fotos
      if (incoming.length > remaining) {
        next.fotos = `Se agregaron ${accepted.length}. El máximo es ${MAX_PHOTOS} fotos.`
      }
      return next
    })
  }

  const removePhoto = (id) => {
    const target = photos.find((photo) => photo.id === id)
    if (target) URL.revokeObjectURL(target.preview)
    setPhotos((current) => current.filter((photo) => photo.id !== id))
  }

  const validate = () => {
    const next = {}

    if (!values.categoria) next.categoria = 'Elegí una categoría.'
    if (!values.modelo.trim()) next.modelo = 'Ingresá el modelo del vehículo.'
    if (!values.moneda) next.moneda = 'Elegí la moneda.'

    const price = Number(values.precio)
    if (!values.precio || !Number.isFinite(price) || price <= 0) {
      next.precio = 'Ingresá un precio mayor a 0.'
    }

    if (photos.length === 0) {
      next.fotos = 'Agregá al menos una foto para publicar.'
    }

    setErrors(next)

    const firstError = Object.keys(next)[0]
    if (firstError) {
      window.requestAnimationFrame(() => {
        const field = formRef.current?.querySelector(
          `[data-field="${firstError}"]`,
        )
        field?.scrollIntoView({ behavior: 'smooth', block: 'center' })
        field?.querySelector('input, select, textarea')?.focus()
      })
    }

    return Object.keys(next).length === 0
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (busy) return

    setFormError('')
    if (!validate()) return

    setBusy(true)
    setPhase('Optimizando fotos…')
    setProgress(0)

    try {
      const compressed = []

      for (let index = 0; index < photos.length; index += 1) {
        setPhase(`Optimizando foto ${index + 1} de ${photos.length}…`)
        const file = await compressImage(photos[index].file)
        compressed.push(file)
        setProgress(Math.round(((index + 1) / photos.length) * 100))
      }

      setPhase('Guardando en el dispositivo…')
      const item = buildQueuedVehicle(values, compressed)
      await onSubmitItem(item)

      photos.forEach((photo) => URL.revokeObjectURL(photo.preview))
      setPhotos([])
      setValues({ ...EMPTY_VALUES })
      clearDraft()

      onQueued?.({ modelo: item.payload.modelo, offline: !online })
    } catch (error) {
      setFormError(
        error?.name === 'QuotaExceededError'
          ? 'No hay espacio suficiente en el dispositivo. Eliminá alguna carga pendiente e intentá de nuevo.'
          : error?.message || 'No se pudo guardar el vehículo.',
      )
    } finally {
      setBusy(false)
      setPhase('')
      setProgress(0)
    }
  }

  const pricePreview =
    values.precio && Number(values.precio) > 0
      ? formatPrice(Number(values.precio), values.moneda)
      : ''

  return (
    <section className="admin-card">
      <div className="admin-card__head">
        <div>
          <h2 className="admin-card__title">Cargar vehículo</h2>
          <p className="admin-card__text">
            Completá los datos y sumá hasta {MAX_PHOTOS} fotos. La primera será
            la portada.
          </p>
        </div>
      </div>

      <form
        className="admin-form"
        ref={formRef}
        onSubmit={handleSubmit}
        autoComplete="off"
        noValidate
      >
        <div className="admin-grid">
          <label className="admin-field" data-field="categoria">
            <span>Categoría *</span>
            <select
              value={values.categoria}
              onChange={(event) => updateField('categoria', event.target.value)}
              aria-invalid={Boolean(errors.categoria)}
            >
              <option value="">Elegí una categoría</option>
              {CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
            {errors.categoria && (
              <small className="admin-field__error">{errors.categoria}</small>
            )}
          </label>

          <label className="admin-field admin-field--full" data-field="modelo">
            <span>Modelo *</span>
            <input
              type="text"
              value={values.modelo}
              onChange={(event) => updateField('modelo', event.target.value)}
              maxLength={80}
              placeholder="Ej. Amarok V6 Extreme"
              aria-invalid={Boolean(errors.modelo)}
            />
            {errors.modelo && (
              <small className="admin-field__error">{errors.modelo}</small>
            )}
          </label>

          <label className="admin-field" data-field="anio">
            <span>Año</span>
            <select
              value={values.anio}
              onChange={(event) => updateField('anio', event.target.value)}
            >
              <option value="">Sin especificar</option>
              {YEARS.map((year) => (
                <option key={year} value={String(year)}>
                  {year}
                </option>
              ))}
            </select>
          </label>

          <label className="admin-field" data-field="combustible">
            <span>Combustible</span>
            <select
              value={values.combustible}
              onChange={(event) =>
                updateField('combustible', event.target.value)
              }
            >
              <option value="">Sin especificar</option>
              {FUELS.map((fuel) => (
                <option key={fuel} value={fuel}>
                  {fuel}
                </option>
              ))}
            </select>
          </label>

          <label className="admin-field" data-field="detalle">
            <span>Detalle</span>
            <input
              type="text"
              value={values.detalle}
              onChange={(event) => updateField('detalle', event.target.value)}
              maxLength={80}
              placeholder="Ej. No funciona"
            />
          </label>

          <label className="admin-field" data-field="moneda">
            <span>Moneda *</span>
            <select
              value={values.moneda}
              onChange={(event) => updateField('moneda', event.target.value)}
            >
              <option value="ARS">ARS</option>
              <option value="USD">USD</option>
            </select>
            {errors.moneda && (
              <small className="admin-field__error">{errors.moneda}</small>
            )}
          </label>

          <label className="admin-field" data-field="precio">
            <span>Precio *</span>
            <input
              type="text"
              inputMode="numeric"
              value={values.precio}
              onChange={(event) =>
                updateField('precio', event.target.value.replace(/\D/g, ''))
              }
              placeholder="Ej. 1200000"
              aria-invalid={Boolean(errors.precio)}
            />
            {errors.precio ? (
              <small className="admin-field__error">{errors.precio}</small>
            ) : (
              pricePreview && (
                <small className="admin-field__hint">{pricePreview}</small>
              )
            )}
          </label>

          <label
            className="admin-field admin-field--full"
            data-field="descripcion"
          >
            <span>Descripción</span>
            <textarea
              value={values.descripcion}
              onChange={(event) =>
                updateField('descripcion', event.target.value)
              }
              maxLength={600}
              rows={3}
              placeholder="Estado general, equipamiento, observaciones…"
            />
          </label>
        </div>

        <PhotoPicker
          photos={photos}
          max={MAX_PHOTOS}
          onAdd={addPhotos}
          onRemove={removePhoto}
          error={errors.fotos}
        />

        {formError && (
          <p className="admin-banner admin-banner--error" role="alert">
            <FiAlertCircle aria-hidden="true" />
            {formError}
          </p>
        )}

        <div className="admin-submit">
          {busy && (
            <div className="admin-progress" role="status" aria-live="polite">
              <div className="admin-progress__bar">
                <span style={{ width: `${progress}%` }} />
              </div>
              <p className="admin-progress__text">{phase || 'Procesando…'}</p>
            </div>
          )}

          {!online && !busy && (
            <p className="admin-hint">
              Sin conexión: se guardará en este dispositivo y se subirá solo
              cuando vuelva internet.
            </p>
          )}

          {!cloudinaryReady && (
            <p className="admin-field__error">
              Faltan las credenciales de Cloudinary en el archivo <code>.env</code>.
            </p>
          )}

          <button
            className="btn btn--primary admin-submit__button"
            type="submit"
            disabled={busy || !cloudinaryReady}
          >
            {busy ? (
              <FiLoader className="spin" aria-hidden="true" />
            ) : (
              <FiUploadCloud aria-hidden="true" />
            )}
            {busy
              ? 'Procesando…'
              : online
                ? 'Publicar vehículo'
                : 'Guardar para subir luego'}
          </button>
        </div>
      </form>
    </section>
  )
}
