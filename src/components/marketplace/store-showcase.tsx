'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

const rows = [
  { id: 'top', speed: 'store-showcase-track--fast', size: 'store-showcase-row--wide' },
  { id: 'middle', speed: 'store-showcase-track--medium', size: 'store-showcase-row--mid' },
  { id: 'bottom', speed: 'store-showcase-track--slow', size: 'store-showcase-row--deep' },
]

const placeholders = Array.from({ length: 8 }, (_, index) => index)

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
    <section className="store-showcase" aria-labelledby="store-showcase-title">
      <div className="store-showcase-heading container">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">A little closer to home</p>
        <h2 id="store-showcase-title" className="mt-3 max-w-2xl text-3xl font-semibold leading-tight tracking-tight text-text-primary sm:text-4xl lg:text-5xl">
          Good finds are closer than you think.
        </h2>
        <p className="mt-3 max-w-xl text-sm leading-6 text-text-secondary sm:text-base">
          Discover local stores, find new favourites and shop what you need around your area.
        </p>
      </div>

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
      <div className="store-showcase-cta container">
        <div className="max-w-xl">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">Your area. Your people.</p>
          <h3 className="mt-2 text-2xl font-semibold leading-tight text-text-primary sm:text-3xl">
            Find your people. Shop your area.
          </h3>
          <p className="mt-2 max-w-lg text-sm leading-6 text-text-secondary">
            From everyday essentials to the spots you have not discovered yet, there is plenty waiting nearby.
          </p>
        </div>
        <Link href="/marketplace/stores" className="mt-5 inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-gold px-5 text-sm font-bold text-primary-strong shadow-md transition-all hover:-translate-y-0.5 hover:brightness-95 sm:mt-0">
          Explore stores <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  )
}
