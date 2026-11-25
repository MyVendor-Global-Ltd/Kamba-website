import Link from 'next/link'

export function KambaLogo({ className = '', iconSize = 34, href = '/' }: { className?: string; iconSize?: number; href?: string }) {
  return (
    <Link href={href} className={`inline-flex shrink-0 items-center gap-2 ${className}`} aria-label="Kamba home">
      <svg className="text-primary" width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4" />
        <path d="M3 6h18" />
        <path d="M16 10a4 4 0 0 1-8 0" />
        <circle cx="18.5" cy="5.5" r="2" fill="#B68B3B" stroke="#B68B3B" />
      </svg>
      <span className="font-display text-[23px] font-bold lowercase leading-none tracking-tight text-primary">kamba</span>
    </Link>
  )
}
