'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { usePathname } from 'next/navigation'
import { X } from 'lucide-react'
import { prelaunchCopy as copy } from '@/lib/marketing/prelaunch-copy'

const ENTRY_NOTICE_KEY = 'fixly-entry-notice-v2'

/**
 * One notice per browser session, on the pages people actually open.
 * Portaled to document.body so the app shell and boot splash cannot cover it.
 */
export default function EntryNotice() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const actionRef = useRef<HTMLButtonElement>(null)
  const showOnThisPage =
    pathname === '/' || pathname === '/waitlist' || pathname === '/pro/join'

  useEffect(() => {
    if (!showOnThisPage) return
    try {
      if (sessionStorage.getItem(ENTRY_NOTICE_KEY) === '1') return
    } catch {
      // Private mode can block storage; still show the notice.
    }
    setOpen(true)
  }, [showOnThisPage])

  useEffect(() => {
    if (!open) return
    actionRef.current?.focus()
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeNotice()
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const closeNotice = () => {
    try {
      sessionStorage.setItem(ENTRY_NOTICE_KEY, '1')
    } catch {
      // Ignore storage failures; the dialog still closes.
    }
    setOpen(false)
    // Stay on the hero composition — do not auto-scroll past the brand.
  }

  if (!open || typeof document === 'undefined') return null

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-end justify-center px-4 pb-[max(1rem,env(safe-area-inset-bottom,0px))] sm:items-center sm:pb-4">
      <button
        type="button"
        className="absolute inset-0 bg-[color-mix(in_srgb,hsl(var(--primary))_55%,black)]/70 backdrop-blur-[2px]"
        aria-label="סגירה"
        onClick={closeNotice}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="entry-notice-title"
        className="prelaunch-product relative w-full max-w-sm p-7 text-center"
      >
        <button
          type="button"
          onClick={closeNotice}
          className="absolute left-3 top-3 flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:bg-background hover:text-foreground"
          aria-label="סגירה"
        >
          <X className="h-4 w-4" aria-hidden />
        </button>
        <p dir="ltr" className="prelaunch-brand text-xl font-extrabold text-primary">
          Fixly<span className="text-secondary">.</span>
        </p>
        <h2 id="entry-notice-title" className="mt-4 text-xl font-extrabold tracking-tight text-foreground">
          {copy.noticeTitle}
        </h2>
        <p className="mt-2 text-sm font-medium leading-6 text-muted-foreground">{copy.noticeBody}</p>
        <button
          ref={actionRef}
          type="button"
          onClick={closeNotice}
          className="prelaunch-cta prelaunch-cta-primary mt-6 w-full text-base"
        >
          {copy.noticeCta}
        </button>
      </div>
    </div>,
    document.body,
  )
}
