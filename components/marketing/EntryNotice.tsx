'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { X } from 'lucide-react'
import { prelaunchCopy as copy } from '@/lib/marketing/prelaunch-copy'

const ENTRY_NOTICE_KEY = 'fixly-entry-notice-v2'

/**
 * One inline status notice per browser session, above the waitlist form.
 * Non-blocking — no modal, portal, or body scroll lock.
 */
export default function EntryNotice() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
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

  const dismiss = () => {
    try {
      sessionStorage.setItem(ENTRY_NOTICE_KEY, '1')
    } catch {
      // Ignore storage failures; the notice still closes.
    }
    setOpen(false)
  }

  const goToWaitlist = () => {
    dismiss()
    const target = document.getElementById('waitlist')
    target?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  if (!open) return null

  return (
    <aside
      role="status"
      aria-labelledby="entry-notice-title"
      className="mb-4 rounded-2xl border border-border bg-card p-5 text-center shadow-sm"
    >
      <div className="relative">
        <button
          type="button"
          onClick={dismiss}
          className="absolute left-0 top-0 flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
          aria-label="סגירה"
        >
          <X className="h-4 w-4" aria-hidden />
        </button>
        <p dir="ltr" className="text-xl font-extrabold text-primary">
          Fixly<span className="text-secondary">.</span>
        </p>
        <h2
          id="entry-notice-title"
          className="mt-3 text-lg font-extrabold tracking-tight text-foreground"
        >
          {copy.noticeTitle}
        </h2>
        <p className="mt-2 text-sm font-medium leading-6 text-muted-foreground">
          {copy.noticeBody}
        </p>
        <button
          type="button"
          onClick={goToWaitlist}
          className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-primary px-4 py-3 text-base font-bold text-primary-foreground"
        >
          {copy.noticeCta}
        </button>
      </div>
    </aside>
  )
}
