'use client'

import { Moon, Sun } from 'lucide-react'
import { useTheme } from '@/context/ThemeContext'

export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const { theme, toggleTheme } = useTheme()
  const label = theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={label}
      aria-pressed={theme === 'dark'}
      title={label}
      className={`inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-border bg-surface px-3 text-text-secondary transition-colors hover:bg-ink-raised/70 hover:text-text-primary ${compact ? 'w-10 px-0' : ''}`}
    >
      {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
      {!compact && <span className="text-sm font-medium">{theme === 'light' ? 'Dark mode' : 'Light mode'}</span>}
    </button>
  )
}
