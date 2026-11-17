import { useMemo, useState } from 'react'
import { FaCarSide } from 'react-icons/fa6'
import { getPhotoCandidates } from '../../lib/media'

export function VehicleImage({ vehicle, photos = [] }) {
  const candidates = useMemo(
    () => getPhotoCandidates(vehicle, photos),
    [vehicle, photos],
  )
  const [index, setIndex] = useState(0)
  const [loaded, setLoaded] = useState(false)
  const [failed, setFailed] = useState(false)

  const src = candidates[index]
  const showPlaceholder = failed || !src

  const label = [vehicle?.modelo, vehicle?.anio].filter(Boolean).join(' ')

  return (
    <div className="vehicle-media">
      {!showPlaceholder && (
        <img
          key={src}
          className={`vehicle-media__img${loaded ? ' is-loaded' : ''}`}
          src={src}
          alt={label ? `${label}` : 'Vehículo sin foto'}
          loading="lazy"
          decoding="async"
          onLoad={() => setLoaded(true)}
          onError={() => {
            if (index + 1 < candidates.length) {
              setIndex((current) => current + 1)
              setLoaded(false)
              return
            }
            setFailed(true)
          }}
        />
      )}

      {!showPlaceholder && !loaded && (
        <span className="vehicle-media__shimmer" aria-hidden="true" />
      )}

      {showPlaceholder && (
        <div className="vehicle-media__placeholder" aria-hidden="true">
          <FaCarSide />
          <span>Sin foto</span>
        </div>
      )}
    </div>
  )
}
