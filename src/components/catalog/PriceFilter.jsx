import { FiX } from 'react-icons/fi'
import { formatNumber } from '../../lib/format'

function PriceRow({ label, prefix, range, bounds, onChange, onClear }) {
  const active = range.min !== '' || range.max !== ''

  return (
    <div className="price-row">
      <div className="price-row__head">
        <span className="price-row__label">{label}</span>
        {active && (
          <button
            className="price-row__clear"
            type="button"
            onClick={onClear}
            aria-label={`Limpiar precio en ${label}`}
          >
            <FiX aria-hidden="true" />
            Limpiar
          </button>
        )}
      </div>

      <div className="price-row__fields">
        <label className="price-input">
          <span className="sr-only">{`Precio mínimo en ${label}`}</span>
          <input
            type="text"
            inputMode="numeric"
            autoComplete="off"
            placeholder="Mín."
            value={range.min}
            onChange={(event) => onChange('min', event.target.value)}
          />
        </label>
        <span className="price-row__dash" aria-hidden="true">
          –
        </span>
        <label className="price-input">
          <span className="sr-only">{`Precio máximo en ${label}`}</span>
          <input
            type="text"
            inputMode="numeric"
            autoComplete="off"
            placeholder="Máx."
            value={range.max}
            onChange={(event) => onChange('max', event.target.value)}
          />
        </label>
      </div>

      {bounds && (
        <p className="price-row__hint">
          Disponible: {prefix} {formatNumber(bounds.min)} – {prefix}{' '}
          {formatNumber(bounds.max)}
        </p>
      )}
    </div>
  )
}

export function PriceFilter({
  precioARS,
  precioUSD,
  setPrice,
  clearPrice,
  priceBounds,
}) {
  return (
    <div className="price-filter">
      <PriceRow
        label="Pesos argentinos (ARS)"
        prefix="$"
        range={precioARS}
        bounds={priceBounds.ARS}
        onChange={(field, value) => setPrice('ARS', field, value)}
        onClear={() => clearPrice('ARS')}
      />
      <PriceRow
        label="Dólares (USD)"
        prefix="USD"
        range={precioUSD}
        bounds={priceBounds.USD}
        onChange={(field, value) => setPrice('USD', field, value)}
        onClear={() => clearPrice('USD')}
      />
      <p className="price-filter__note">
        Escribí un monto en cada moneda por separado. Podés completar solo el
        mínimo o solo el máximo.
      </p>
    </div>
  )
}
