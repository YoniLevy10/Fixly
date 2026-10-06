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
    if (pathname === '/waitlist' || pathname === '/') {
      document.getElementById('waitlist')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }

  if (!open || typeof document === 'undefined') return null

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-end justify-center px-4 pb-[max(1rem,env(safe-area-inset-bottom,0px))] sm:items-center sm:pb-4">
      <button
        type="button"
        className="absolute inset-0 bg-[#10233f]/55"
        aria-label="סגירה"
        onClick={closeNotice}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="entry-notice-title"
        className="relative w-full max-w-sm rounded-[1.5rem] bg-white p-6 text-center shadow-[0_24px_60px_rgba(16,35,63,0.28)]"
      >
        <button
          type="button"
          onClick={closeNotice}
          className="absolute left-3 top-3 flex h-8 w-8 items-center justify-center rounded-full text-[#123563]/70 hover:bg-[#123563]/5"
          aria-label="סגירה"
        >
          <X className="h-4 w-4" aria-hidden />
        </button>
        <p dir="ltr" className="text-lg font-black text-[#123563]">
          Fixly<span className="text-[#F59E0B]">.</span>
        </p>
        <h2 id="entry-notice-title" className="mt-3 text-xl font-black !text-[#10233f]">
          {copy.noticeTitle}
        </h2>
        <p className="mt-2 text-sm font-medium leading-6 text-slate-600">{copy.noticeBody}</p>
        <button
          ref={actionRef}
          type="button"
          onClick={closeNotice}
          className="mt-5 inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-[#F59E0B] px-5 text-base font-black text-[#10233f]"
        >
          {copy.noticeCta}
        </button>
      </div>
    </div>,
    document.body,
  )
}
