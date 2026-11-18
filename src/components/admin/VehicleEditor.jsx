import { useEffect, useMemo, useRef, useState } from 'react'
import {
  FiAlertCircle,
  FiCamera,
  FiCheckCircle,
  FiImage,
  FiInfo,
  FiLoader,
  FiRefreshCw,
  FiSave,
  FiTrash2,
  FiX,
} from 'react-icons/fi'
import { useFotos } from '../../hooks/useFotos'
import { useVehiculos } from '../../hooks/useVehiculos'
import { deleteVehicle, updateVehicle } from '../../lib/adminApi'
import {
  CATEGORIES,
  FUELS,
  MAX_PHOTOS,
  YEARS,
} from '../../lib/adminConfig'
import { createQueueId } from '../../lib/adminQueue'
import { uploadToCloudinary } from '../../lib/cloudinary'
import { formatPrice, normalizeText } from '../../lib/format'
import { compressImage } from '../../lib/imageCompression'
import { getVehiclePhotos, getVehiclePhotoUrls } from '../../lib/media'

const EMPTY_VALUES = {
  categoria: '',
  modelo: '',
  anio: '',
  combustible: '',
  detalle: '',
  moneda: 'ARS',
  precio: '',
  descripcion: '',
  disponible: 'SI',
}

function valuesFromVehicle(vehicle) {
  if (!vehicle) return { ...EMPTY_VALUES }

  return {
    categoria: vehicle.categoria || '',
    modelo: vehicle.modelo || '',
    anio: vehicle.anio || '',
    combustible: vehicle.combustible || '',
    detalle: vehicle.detalle || '',
    moneda: vehicle.moneda === 'USD' ? 'USD' : 'ARS',
    precio: vehicle.precio ? String(vehicle.precio) : '',
    descripcion: vehicle.descripcion || '',
    disponible: vehicle.disponible === 'NO' ? 'NO' : 'SI',
  }
}

export function VehicleEditor({ clave, online, cloudinaryReady, onSaved }) {
  const {
    vehicles,
    status,
    error: loadError,
    isRefreshing,
    reload,
  } = useVehiculos()
  const fotosById = useFotos()

  const [query, setQuery] = useState('')
  const [selectedId, setSelectedId] = useState('')
  const [values, setValues] = useState({ ...EMPTY_VALUES })
  const [errors, setErrors] = useState({})
  const [removedUrls, setRemovedUrls] = useState([])
  const [newPhotos, setNewPhotos] = useState([])
  const [savedPhotos, setSavedPhotos] = useState({})
  const [busy, setBusy] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [phase, setPhase] = useState('')
  const [progress, setProgress] = useState(0)
  const [formError, setFormError] = useState('')
  const [success, setSuccess] = useState('')

  const galleryRef = useRef(null)
  const cameraRef = useRef(null)
  const newPhotosRef = useRef(newPhotos)

  useEffect(() => {
    newPhotosRef.current = newPhotos
  }, [newPhotos])

  useEffect(
    () => () => {
      newPhotosRef.current.forEach((photo) => {
        if (photo.preview) URL.revokeObjectURL(photo.preview)
      })
    },
    [],
  )

  const sortedVehicles = useMemo(
    () =>
      [...vehicles].sort((a, b) =>
        String(a.modelo || '').localeCompare(String(b.modelo || ''), 'es'),
      ),
    [vehicles],
  )

  const filteredVehicles = useMemo(() => {
    const needle = normalizeText(query)
    if (!needle) return sortedVehicles

    return sortedVehicles.filter((vehicle) => {
      const haystack = normalizeText(
        [vehicle.modelo, vehicle.anio, vehicle.id, vehicle.categoria]
          .filter(Boolean)
          .join(' '),
      )
      return haystack.includes(needle)
    })
  }, [query, sortedVehicles])

  const selectedVehicle =
    vehicles.find((vehicle) => vehicle.id === selectedId) || null

  const options = useMemo(() => {
    if (
      !selectedVehicle ||
      filteredVehicles.some((vehicle) => vehicle.id === selectedVehicle.id)
    ) {
      return filteredVehicles
    }

    return [selectedVehicle, ...filteredVehicles]
  }, [filteredVehicles, selectedVehicle])

  const basePhotos = useMemo(() => {
    if (!selectedVehicle) return []

    const saved = savedPhotos[selectedVehicle.id]
    if (Array.isArray(saved)) return saved

    const own = getVehiclePhotoUrls(selectedVehicle)
    if (own.length) return own

    return getVehiclePhotos(selectedVehicle, fotosById).map((photo) => photo.src)
  }, [selectedVehicle, savedPhotos, fotosById])

  const visiblePhotos = [
    ...new Set(basePhotos.filter((url) => !removedUrls.includes(url))),
  ]
  const total = visiblePhotos.length + newPhotos.length
  const blocked = busy || deleting
  const pricePreview =
    values.precio && Number(values.precio) > 0
      ? formatPrice(Number(values.precio), values.moneda)
      : ''

  const updateField = (field, value) => {
    setValues((current) => ({ ...current, [field]: value }))
    setErrors((current) => {
      if (!current[field]) return current
      const next = { ...current }
      delete next[field]
      return next
    })
  }

  const handleSelectVehicle = (value) => {
    newPhotos.forEach((photo) => {
      if (photo.preview) URL.revokeObjectURL(photo.preview)
    })

    const vehicle = vehicles.find((entry) => entry.id === value) || null

    setSelectedId(value)
    setValues(valuesFromVehicle(vehicle))
    setErrors({})
    setRemovedUrls([])
    setNewPhotos([])
    setFormError('')
    setSuccess('')
  }

  const addPhotos = (fileList) => {
    const incoming = Array.from(fileList || []).filter((file) =>
      file.type.startsWith('image/'),
    )

    if (incoming.length === 0) {
      setFormError('Elegí archivos de imagen (JPG, PNG o WebP).')
      return
    }

    const remaining = MAX_PHOTOS - total
    if (remaining <= 0) {
      setFormError(`Máximo ${MAX_PHOTOS} fotos por vehículo.`)
      return
    }

    const accepted = incoming.slice(0, remaining)

    setNewPhotos((current) => [
      ...current,
      ...accepted.map((file) => ({
        id: createQueueId(),
        file,
        preview: URL.createObjectURL(file),
        url: '',
      })),
    ])

    setFormError('')
    setSuccess('')

    if (incoming.length > remaining) {
      setFormError(`Se agregaron ${accepted.length}. El máximo es ${MAX_PHOTOS} fotos.`)
    }
  }

  const removeNewPhoto = (id) => {
    setNewPhotos((current) => {
      const target = current.find((photo) => photo.id === id)
      if (target?.preview) URL.revokeObjectURL(target.preview)
      return current.filter((photo) => photo.id !== id)
    })
  }

  const validate = () => {
    const next = {}

    if (!values.categoria) next.categoria = 'Elegí una categoría.'
    if (!values.modelo.trim()) next.modelo = 'Ingresá el modelo del vehículo.'

    const price = Number(values.precio)
    if (!values.precio || !Number.isFinite(price) || price <= 0) {
      next.precio = 'Ingresá un precio mayor a 0.'
    }

    if (total === 0) {
      next.fotos = 'El vehículo necesita al menos una foto.'
    }

    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSave = async () => {
    if (!selectedVehicle || blocked) return

    if (!online) {
      setFormError('Necesitás conexión a internet para guardar los cambios.')
      return
    }

    if (!validate()) return

    const pending = newPhotos.filter((photo) => !photo.url)

    if (pending.length > 0 && !cloudinaryReady) {
      setFormError(
        'Falta configurar Cloudinary. No se pueden subir fotos nuevas.',
      )
      return
    }

    setBusy(true)
    setFormError('')
    setSuccess('')
    setPhase(pending.length ? 'Optimizando fotos…' : 'Guardando cambios…')
    setProgress(0)

    const uploadedUrls = new Map()

    try {
      for (let index = 0; index < pending.length; index += 1) {
        const photo = pending[index]

        setPhase(`Optimizando foto ${index + 1} de ${pending.length}…`)
        const file = await compressImage(photo.file)

        setPhase(`Subiendo foto ${index + 1} de ${pending.length}…`)
        const url = await uploadToCloudinary(file, {
          onProgress: (fraction) => {
            setProgress(
              Math.min(
                99,
                Math.round(((index + fraction) / pending.length) * 100),
              ),
            )
          },
        })

        uploadedUrls.set(photo.id, url)
        setNewPhotos((current) =>
          current.map((entry) =>
            entry.id === photo.id ? { ...entry, url } : entry,
          ),
        )
      }

      const finalUrls = [
        ...visiblePhotos,
        ...newPhotos
          .map((photo) => uploadedUrls.get(photo.id) || photo.url)
          .filter(Boolean),
      ]

      setPhase('Guardando en la planilla…')
      setProgress(100)

      await updateVehicle(clave, selectedVehicle.id, {
        ...values,
        precio: Number(values.precio) || 0,
        fotos: finalUrls,
      })

      setSavedPhotos((current) => ({
        ...current,
        [selectedVehicle.id]: finalUrls,
      }))

      newPhotos.forEach((photo) => {
        if (photo.preview) URL.revokeObjectURL(photo.preview)
      })

      setNewPhotos([])
      setRemovedUrls([])
      setSuccess(`Cambios guardados en ${selectedVehicle.modelo}.`)

      onSaved?.(selectedVehicle)
      reload()
    } catch (error) {
      setFormError(error?.message || 'No pudimos guardar los cambios.')
    } finally {
      setBusy(false)
      setPhase('')
      setProgress(0)
    }
  }

  const handleDelete = async () => {
    if (!selectedVehicle || blocked) return

    if (!online) {
      setFormError('Necesitás conexión a internet para eliminar el vehículo.')
      return
    }

    const confirmed = window.confirm(
      `¿Eliminar "${selectedVehicle.modelo}" del catálogo?\n\nEsta acción no se puede deshacer.`,
    )

    if (!confirmed) return

    setDeleting(true)
    setFormError('')
    setSuccess('')

    try {
      await deleteVehicle(clave, selectedVehicle.id)

      const removedName = selectedVehicle.modelo
      newPhotos.forEach((photo) => {
        if (photo.preview) URL.revokeObjectURL(photo.preview)
      })

      setSavedPhotos((current) => {
        const next = { ...current }
        delete next[selectedVehicle.id]
        return next
      })
      setSelectedId('')
      setValues({ ...EMPTY_VALUES })
      setErrors({})
      setRemovedUrls([])
      setNewPhotos([])
      setSuccess(`Vehículo ${removedName} eliminado del catálogo.`)

      onSaved?.(selectedVehicle)
      reload()
    } catch (error) {
      setFormError(error?.message || 'No pudimos eliminar el vehículo.')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <section className="admin-card admin-photo-manager">
      <div className="admin-card__head">
        <div>
          <h2 className="admin-card__title">Editar vehículo</h2>
          <p className="admin-card__text">
            Elegí un vehículo para cambiar sus datos, agregar o quitar fotos, o
            eliminarlo del catálogo.
          </p>
        </div>

        <button
          className="admin-mini"
          type="button"
          onClick={reload}
          disabled={isRefreshing}
        >
          <FiRefreshCw aria-hidden="true" />
          Actualizar lista
        </button>
      </div>

      {status === 'loading' && (
        <p className="admin-hint admin-hint--inline">
          <FiLoader className="spin" aria-hidden="true" />
          Cargando vehículos…
        </p>
      )}

      {loadError && (
        <div className="admin-banner admin-banner--error" role="alert">
          <FiAlertCircle className="admin-banner__icon" aria-hidden="true" />
          <div className="admin-banner__body">
            <strong>No pudimos leer el catálogo</strong>
            <p>{loadError.message}</p>
          </div>
        </div>
      )}

      <div className="admin-grid">
        <label className="admin-field admin-field--full">
          <span>Buscar vehículo</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Modelo, año o ID"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
          />
        </label>

        <label className="admin-field admin-field--full">
          <span>Vehículo</span>
          <select
            value={selectedId}
            onChange={(event) => handleSelectVehicle(event.target.value)}
            disabled={sortedVehicles.length === 0 || blocked}
          >
            <option value="">Elegí un vehículo</option>
            {options.map((vehicle) => (
              <option key={vehicle.id} value={vehicle.id}>
                {[
                  vehicle.modelo || 'Sin modelo',
                  vehicle.anio,
                  `#${vehicle.id}`,
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </option>
            ))}
          </select>
        </label>
      </div>

      {formError && (
        <p className="admin-field__error" role="alert">
          <FiAlertCircle aria-hidden="true" />
          {formError}
        </p>
      )}

      {success && (
        <p className="admin-success" role="status">
          <FiCheckCircle aria-hidden="true" />
          {success}
        </p>
      )}

      {!selectedVehicle ? (
        <p className="admin-hint">
          Elegí un vehículo para editar sus datos y fotos.
        </p>
      ) : (
        <>
          <div className="admin-grid">
            <label className="admin-field" data-field="categoria">
              <span>Categoría *</span>
              <select
                value={values.categoria}
                onChange={(event) =>
                  updateField('categoria', event.target.value)
                }
                aria-invalid={Boolean(errors.categoria)}
                disabled={blocked}
              >
                <option value="">Elegí una categoría</option>
                {CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
              {errors.categoria && (
                <small className="admin-field__error">
                  {errors.categoria}
                </small>
              )}
            </label>

            <label
              className="admin-field admin-field--full"
              data-field="modelo"
            >
              <span>Modelo *</span>
              <input
                type="text"
                value={values.modelo}
                onChange={(event) => updateField('modelo', event.target.value)}
                maxLength={80}
                aria-invalid={Boolean(errors.modelo)}
                disabled={blocked}
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
                disabled={blocked}
              >
                <option value="">Sin especificar</option>
                {YEARS.map((year) => (
                  <option key={year} value={String(year)}>
                    {year}
                  </option>
                ))}
                {values.anio &&
                  !YEARS.some((year) => String(year) === values.anio) && (
                    <option value={values.anio}>{values.anio}</option>
                  )}
              </select>
            </label>

            <label className="admin-field" data-field="combustible">
              <span>Combustible</span>
              <select
                value={values.combustible}
                onChange={(event) =>
                  updateField('combustible', event.target.value)
                }
                disabled={blocked}
              >
                <option value="">Sin especificar</option>
                {FUELS.map((fuel) => (
                  <option key={fuel} value={fuel}>
                    {fuel}
                  </option>
                ))}
                {values.combustible &&
                  !FUELS.includes(values.combustible) && (
                    <option value={values.combustible}>
                      {values.combustible}
                    </option>
                  )}
              </select>
            </label>

            <label className="admin-field" data-field="detalle">
              <span>Detalle</span>
              <input
                type="text"
                value={values.detalle}
                onChange={(event) => updateField('detalle', event.target.value)}
                maxLength={80}
                disabled={blocked}
              />
            </label>

            <label className="admin-field" data-field="moneda">
              <span>Moneda *</span>
              <select
                value={values.moneda}
                onChange={(event) => updateField('moneda', event.target.value)}
                disabled={blocked}
              >
                <option value="ARS">ARS</option>
                <option value="USD">USD</option>
              </select>
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
                aria-invalid={Boolean(errors.precio)}
                disabled={blocked}
              />
              {errors.precio ? (
                <small className="admin-field__error">{errors.precio}</small>
              ) : (
                pricePreview && (
                  <small className="admin-field__hint">{pricePreview}</small>
                )
              )}
            </label>

            <label className="admin-field" data-field="disponible">
              <span>Disponible</span>
              <select
                value={values.disponible}
                onChange={(event) =>
                  updateField('disponible', event.target.value)
                }
                disabled={blocked}
              >
                <option value="SI">Sí, mostrar en el catálogo</option>
                <option value="NO">No, ocultar</option>
              </select>
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
                disabled={blocked}
              />
            </label>
          </div>

          <div className="admin-photos" data-field="fotos">
            <div className="admin-photos__head">
              <span className="admin-field__label">Fotos del vehículo</span>
              <span className="admin-photos__count">
                {total} / {MAX_PHOTOS}
              </span>
            </div>

            {total > 0 ? (
              <ul className="admin-photo-grid">
                {visiblePhotos.map((url, index) => (
                  <li className="admin-photo" key={url}>
                    <img
                      src={url}
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
                      onClick={() =>
                        setRemovedUrls((current) => [...current, url])
                      }
                      disabled={blocked}
                      aria-label={`Quitar foto ${index + 1}`}
                    >
                      <FiX aria-hidden="true" />
                    </button>
                  </li>
                ))}

                {newPhotos.map((photo, index) => (
                  <li className="admin-photo" key={photo.id}>
                    <img
                      src={photo.preview}
                      alt={`Foto nueva ${index + 1}`}
                      loading="lazy"
                      decoding="async"
                    />
                    {visiblePhotos.length === 0 && index === 0 && (
                      <span className="admin-photo__cover">Portada</span>
                    )}
                    <span className="admin-photo__badge">Nueva</span>
                    <button
                      className="admin-photo__remove"
                      type="button"
                      onClick={() => removeNewPhoto(photo.id)}
                      disabled={blocked}
                      aria-label={`Quitar foto nueva ${index + 1}`}
                    >
                      <FiX aria-hidden="true" />
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="admin-hint">
                Este vehículo no tiene fotos. Agregá al menos una para que se
                vea en el catálogo.
              </p>
            )}

            <div className="admin-photo-actions">
              <button
                className="btn btn--ghost"
                type="button"
                onClick={() => galleryRef.current?.click()}
                disabled={blocked || total >= MAX_PHOTOS}
              >
                <FiImage aria-hidden="true" />
                Agregar de galería
              </button>
              <button
                className="btn btn--ghost"
                type="button"
                onClick={() => cameraRef.current?.click()}
                disabled={blocked || total >= MAX_PHOTOS}
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
              onChange={(event) => {
                addPhotos(event.target.files)
                event.target.value = ''
              }}
            />
            <input
              ref={cameraRef}
              type="file"
              accept="image/*"
              capture="environment"
              hidden
              onChange={(event) => {
                addPhotos(event.target.files)
                event.target.value = ''
              }}
            />

            {removedUrls.length > 0 && (
              <button
                className="admin-mini"
                type="button"
                onClick={() => setRemovedUrls([])}
                disabled={blocked}
              >
                <FiRefreshCw aria-hidden="true" />
                Restaurar {removedUrls.length}{' '}
                {removedUrls.length === 1 ? 'foto quitada' : 'fotos quitadas'}
              </button>
            )}

            <p className="admin-hint">
              La primera foto es la portada del vehículo. Las fotos que quites
              dejan de mostrarse en el catálogo.
            </p>

            {errors.fotos && (
              <p className="admin-field__error">{errors.fotos}</p>
            )}
          </div>

          {!online && (
            <p className="admin-hint admin-hint--warning">
              Sin conexión: podés preparar los cambios, pero para guardarlos
              necesitás internet.
            </p>
          )}

          <div className="admin-submit">
            {busy && (
              <div className="admin-progress">
                <div className="admin-progress__bar">
                  <span style={{ width: `${progress}%` }} />
                </div>
                <p className="admin-progress__text">{phase}</p>
              </div>
            )}

            <button
              className="btn btn--primary admin-submit__button"
              type="button"
              onClick={handleSave}
              disabled={blocked || !online}
            >
              {busy ? (
                <>
                  <FiLoader className="spin" aria-hidden="true" />
                  Guardando…
                </>
              ) : (
                <>
                  <FiSave aria-hidden="true" />
                  Guardar cambios
                </>
              )}
            </button>

            <p className="admin-hint admin-hint--center">
              <FiInfo aria-hidden="true" /> Podés tardar unos minutos en ver el
              cambio en el catálogo.
            </p>
          </div>

          <div className="admin-danger">
            <div>
              <strong>Eliminar vehículo</strong>
              <p>
                Se borra la fila de la planilla. Las fotos quedan en Cloudinary.
              </p>
            </div>
            <button
              className="btn btn--ghost admin-danger__button"
              type="button"
              onClick={handleDelete}
              disabled={blocked || !online}
            >
              {deleting ? (
                <>
                  <FiLoader className="spin" aria-hidden="true" />
                  Eliminando…
                </>
              ) : (
                <>
                  <FiTrash2 aria-hidden="true" />
                  Eliminar
                </>
              )}
            </button>
          </div>
        </>
      )}
    </section>
  )
}
