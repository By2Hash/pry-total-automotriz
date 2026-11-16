export function CatalogSkeleton({ count = 8 }) {
  return (
    <div
      className="catalog-skeleton"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <span className="sr-only">Cargando catálogo…</span>
      <div className="vehicle-grid" aria-hidden="true">
        {Array.from({ length: count }, (_, index) => (
          <div className="skeleton-card" key={index}>
            <div className="skeleton-card__media skeleton-block" />
            <div className="skeleton-card__body">
              <span className="skeleton-line skeleton-line--eyebrow skeleton-block" />
              <span className="skeleton-line skeleton-line--title skeleton-block" />
              <span className="skeleton-line skeleton-line--meta skeleton-block" />
              <div className="skeleton-card__footer">
                <span className="skeleton-line skeleton-line--price skeleton-block" />
                <span className="skeleton-line skeleton-line--cta skeleton-block" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
