'use client'

const rows = [
  { id: 'top', speed: 'store-showcase-track--fast', size: 'store-showcase-row--wide' },
  { id: 'middle', speed: 'store-showcase-track--medium', size: 'store-showcase-row--mid' },
  { id: 'bottom', speed: 'store-showcase-track--slow', size: 'store-showcase-row--deep' },
]

const placeholders = Array.from({ length: 10 }, (_, index) => index)

function SkeletonSequence({ rowId, copy }: { rowId: string; copy: string }) {
  return (
    <div className="store-showcase-sequence" aria-hidden="true">
      {placeholders.map((item) => (
        <div className={'store-showcase-card store-showcase-card--' + rowId} key={copy + '-' + item}>
          <div className="store-showcase-image skeleton">
            <span className="store-showcase-image-shape" />
          </div>
          <div className="store-showcase-meta">
            <span className="store-showcase-name skeleton" />
            <span className="store-showcase-rating">
              <span className="store-showcase-star" />
              <span className="store-showcase-rating-line skeleton" />
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}

export function StoreShowcase() {
  return (
    <section className="store-showcase" aria-label="A preview of stores on Kamba">
      <div className="store-showcase-perspective" aria-hidden="true">
        {rows.map((row) => (
          <div className={'store-showcase-row ' + row.size} key={row.id}>
            <div className={'store-showcase-track ' + row.speed}>
              <SkeletonSequence rowId={row.id} copy="first" />
              <SkeletonSequence rowId={row.id} copy="second" />
            </div>
          </div>
        ))}
      </div>
      <div className="store-showcase-smoke" aria-hidden="true" />
    </section>
  )
}
