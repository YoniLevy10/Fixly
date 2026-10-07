'use client'

import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import SuperadminChrome from '@/components/admin/SuperadminChrome'

type Phase = 'checking' | 'locked' | 'open'

export default function SuperadminGate({ children }: { children: ReactNode }) {
  const [phase, setPhase] = useState<Phase>('checking')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetch('/api/admin/unlock', { cache: 'no-store' })
      .then((response) => response.json())
      .then((body) => {
        if (cancelled) return
        setPhase(body.unlocked || !body.passwordConfigured ? 'open' : 'locked')
      })
      .catch(() => {
        if (!cancelled) setPhase('open')
      })
    return () => {
      cancelled = true
    }
  }, [])

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      const response = await fetch('/api/admin/unlock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      const body = await response.json().catch(() => ({}))
      if (!response.ok) {
        setError(typeof body.error === 'string' ? body.error : 'סיסמה שגויה')
        return
      }
      setPassword('')
      setPhase('open')
    } finally {
      setBusy(false)
    }
  }

  if (phase === 'open') return children

  return (
    <SuperadminChrome>
      <div className="mx-auto flex min-h-[60vh] max-w-md items-center">
        <form
          onSubmit={onSubmit}
          className="apple-glass-strong w-full space-y-4 rounded-[var(--radius-xl)] p-6 sm:p-8"
        >
          <div>
            <p className="text-xs font-black text-[#F59E0B]">סופר־אדמין</p>
            <h1 className="mt-2 text-2xl font-black text-[#123563]">כניסה</h1>
            <p className="mt-2 text-sm font-medium leading-6 text-slate-600">
              {phase === 'checking' ? 'בודק גישה…' : 'הזינו סיסמה כדי להיכנס.'}
            </p>
          </div>
          {phase === 'locked' && (
            <>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="סיסמה"
                autoComplete="current-password"
                required
                className="h-12 w-full rounded-2xl border border-[#123563]/12 bg-white px-4 text-sm font-medium text-[#10233f]"
              />
              {error && (
                <p role="alert" className="text-sm font-semibold text-red-700">
                  {error}
                </p>
              )}
              <button
                type="submit"
                disabled={busy}
                className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-[#123563] text-base font-black text-white disabled:opacity-50"
              >
                {busy ? 'נכנס…' : 'כניסה'}
              </button>
            </>
          )}
        </form>
      </div>
    </SuperadminChrome>
  )
}
