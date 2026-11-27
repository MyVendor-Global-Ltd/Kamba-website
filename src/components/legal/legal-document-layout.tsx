import type { ReactNode } from 'react'
import Link from 'next/link'
import { ArrowLeft, ArrowUpRight } from 'lucide-react'

export interface LegalSectionLink { id: string; label: string }
interface LegalDocumentLayoutProps {
  eyebrow: string
  title: ReactNode
  lead: string
  updated: string
  sections: LegalSectionLink[]
  children: ReactNode
}
export function LegalDocumentLayout({ eyebrow, title, lead, updated, sections, children }: LegalDocumentLayoutProps) {
  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto max-w-7xl px-4 pb-16 pt-8 lg:pb-24 lg:pt-14">
        <Link href="/" className="inline-flex items-center gap-2 text-xs font-semibold text-text-tertiary transition-colors hover:text-primary"><ArrowLeft className="h-3.5 w-3.5" /> Back to Kamba</Link>
        <header className="relative mt-9 overflow-hidden border-b border-border pb-10 sm:pb-14">
          <div className="pointer-events-none absolute -right-8 -top-12 hidden h-64 w-64 rounded-full border border-primary/10 sm:block" />
          <div className="pointer-events-none absolute right-8 top-0 hidden h-44 w-44 rounded-full border border-primary/10 sm:block" />
          <p className="relative text-[10px] font-bold uppercase tracking-[0.24em] text-primary">{eyebrow}</p>
          <h1 className="relative mt-5 max-w-4xl font-display text-4xl font-bold leading-[1.04] tracking-tight text-text-primary sm:text-5xl lg:text-6xl">{title}</h1>
          <p className="relative mt-5 max-w-2xl text-sm leading-7 text-text-secondary sm:text-base">{lead}</p>
          <div className="relative mt-7 flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px] font-medium uppercase tracking-[0.12em] text-text-tertiary"><span>Plain-language guide</span><span className="h-1 w-1 rounded-full bg-primary" /><span>Last updated: {updated}</span></div>
        </header>
        <div className="grid gap-9 pt-9 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-16">
          <aside className="hidden lg:block"><div className="sticky top-28">
            <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.2em] text-text-tertiary">On this page</p>
            <nav aria-label="On this page" className="flex flex-col border-l border-border">
              {sections.map((section, index) => <a key={section.id} href={`#${section.id}`} className="relative -ml-px border-l-2 border-transparent px-4 py-2 text-xs leading-5 text-text-secondary transition-colors hover:border-primary hover:text-primary"><span className="mr-2 font-mono text-[10px] text-text-tertiary">{String(index + 1).padStart(2, '0')}</span>{section.label}</a>)}
            </nav>
            <div className="mt-8 border-t border-border pt-5"><p className="text-xs leading-5 text-text-tertiary">Need a clearer answer? Visit the <Link href="/faq" className="font-semibold text-primary hover:underline">Kamba FAQ</Link>.</p></div>
          </div></aside>
          <div className="lg:hidden"><p className="mb-3 text-[10px] font-bold uppercase tracking-[0.2em] text-text-tertiary">Jump to a section</p><nav aria-label="On this page" className="flex gap-2 overflow-x-auto pb-2">{sections.map(section => <a key={section.id} href={`#${section.id}`} className="shrink-0 rounded-full border border-border bg-surface px-3 py-2 text-xs font-medium text-text-secondary">{section.label}</a>)}</nav></div>
          <article className="min-w-0 max-w-4xl space-y-11 text-sm leading-7 text-text-secondary [&_a]:font-semibold [&_a]:text-primary [&_a]:underline-offset-4 [&_a:hover]:underline [&_h2]:font-display [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:leading-tight [&_h2]:text-text-primary [&_h3]:mt-6 [&_h3]:font-semibold [&_h3]:text-text-primary [&_li]:pl-1 [&_ol]:list-decimal [&_ol]:space-y-2 [&_ol]:pl-5 [&_p]:mt-3 [&_strong]:font-semibold [&_strong]:text-text-primary [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5">
            {children}
            <div className="border-t border-border pt-7 text-xs leading-6 text-text-tertiary">This page explains Kamba’s current product and operating policies in plain language. The terms shown at checkout and the applicable order or service record govern that transaction if a detail differs. If a feature is not available in your account, do not assume it is active because it is described as a future capability.</div>
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-6 text-xs"><Link href="/faq">Read frequently asked questions <ArrowUpRight className="ml-1 inline h-3 w-3" /></Link><Link href="/privacy">Read the privacy policy <ArrowUpRight className="ml-1 inline h-3 w-3" /></Link></div>
          </article>
        </div>
      </div>
    </main>
  )
}
