import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatRelativeDate(date: string) {
  const d = new Date(date)

  if (Number.isNaN(d.getTime())) {
    return '—'
  }

  const diff = Date.now() - d.getTime()
  const minutes = Math.floor(diff / 1000 / 60)

  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`

  const hours = Math.floor(minutes / 60)

  if (hours < 24) return `${hours}h ago`

  const days = Math.floor(hours / 24)

  return `${days}d ago`
}

export function debounce<T extends (...args: unknown[]) => void>(
  fn: T,
  ms = 300,
): T {
  let timeout: ReturnType<typeof setTimeout>

  return ((...args: Parameters<T>) => {
    clearTimeout(timeout)

    timeout = setTimeout(() => {
      fn(...args)
    }, ms)
  }) as T
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value)
}

export function formatCompactNumber(value: number) {
  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value)
}
