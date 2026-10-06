'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'

type Audience = { count: number; total: number; excluded: number; duplicates: number; snapshot: string; configured: boolean; sender?: string }
type Campaign = { id: string; status: 'submitting' | 'accepted' | 'rejected' | 'unknown'; recipient_count: number; shipment_id: string | null }
type Submission = { id: string; message: string; snapshot: string }
const storageKey = 'fixly-prospect-sms-submission-v1'

export default function ProspectSmsComposer() {
  const [audience, setAudience] = useState<Audience | null>(null)
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [submission, setSubmission] = useState<Submission | null>(null)
  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [canRetry, setCanRetry] = useState(false)
  const inFlight = useRef(false)

  const refresh = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/prospects/sms', { cache: 'no-store' })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error ?? 'טעינת נמענים נכשלה')
      setAudience(data)
      setError('')
    } catch (e) { setError(e instanceof Error ? e.message : 'טעינת נמענים נכשלה') }
  }, [])

  useEffect(() => {
    void refresh()
    try {
      const saved = localStorage.getItem(storageKey)
      if (saved) {
        const pending = JSON.parse(saved) as Submission
        if (typeof pending.id === 'string' && typeof pending.message === 'string' && typeof pending.snapshot === 'string') {
          setSubmission(pending)
          setMessage(pending.message)
        }
      }
    } catch { /* Storage is optional until submitting. */ }
  }, [refresh])

  async function checkStatus() {
    if (!submission || inFlight.current) return
    inFlight.current = true
    setBusy(true)
    setError('')
    try {
      const response = await fetch(`/api/admin/prospects/sms?id=${encodeURIComponent(submission.id)}`, { cache: 'no-store' })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error ?? 'בדיקת מצב נכשלה')
      if (!data.campaign) {
        // A previous POST may still be running; preserve its ID even if absent.
        setCanRetry(true)
        setError('לא נמצא תיעוד לשליחה. אפשר לנסות שוב עם אותו מזהה, ללא יצירת שליחה כפולה.')
      } else setCampaign(data.campaign)
    } catch (e) { setError(e instanceof Error ? e.message : 'בדיקת מצב נכשלה') }
    finally { inFlight.current = false; setBusy(false) }
  }

  async function send() {
    if (inFlight.current || (submission && !canRetry) || !audience?.configured || !audience.count || !message.trim()) return
    inFlight.current = true
    setBusy(true)
    setError('')
    try {
      const saved = !submission && localStorage.getItem(storageKey)
      if (saved) {
        const existing = JSON.parse(saved) as Submission
        setSubmission(existing)
        setMessage(existing.message)
        setError('קיימת שליחה שמורה. בדקו את מצבה לפני יצירת הודעה נוספת.')
        return
      }
      const payload = submission
        ? { ...submission, snapshot: audience.snapshot }
        : { id: crypto.randomUUID(), message: message.trim(), snapshot: audience.snapshot }
      // Save before the request; reload/network failure must never create a new ID.
      localStorage.setItem(storageKey, JSON.stringify(payload))
      setSubmission(payload)
      setCanRetry(false)
      const response = await fetch('/api/admin/prospects/sms', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error ?? 'שליחה נכשלה')
      setCampaign(data.campaign)
    } catch (e) { setError(e instanceof Error ? e.message : 'לא התקבל אישור. בדקו את מצב השליחה.') }
    finally { inFlight.current = false; setBusy(false) }
  }

  function newMessage() {
    localStorage.removeItem(storageKey)
    setSubmission(null)
    setCampaign(null)
    setCanRetry(false)
    setMessage('')
    setError('')
    void refresh()
  }

  const locked = Boolean(submission)
  return (
    <main dir="rtl" className="max-w-2xl mx-auto p-4 md:p-6 space-y-5 pb-28">
      <Link href="/superadmin" className="text-sm text-muted-foreground hover:underline">← חזרה למנוע הגיוס</Link>
      <h1 className="text-2xl font-bold">שליחת SMS לאנשי המקצוע שהתגלו</h1>
      <p className="text-sm text-muted-foreground">ההודעה תישלח לכל מספרי הנייד במנוע הגיוס. מספרים כפולים ומי שסומן ״לא ליצור קשר״ יוחרגו.</p>
      <section className="rounded-2xl border p-4 space-y-3" aria-live="polite">
        <p className="font-bold">{audience ? `${audience.count} נמענים לשליחה מתוך ${audience.total} רשומות` : 'טוען נמענים…'}</p>
        <p className="text-sm">מספר שולח: <bdi>{audience?.sender ?? '0552819086'}</bdi></p>
        {audience && <p className="text-sm text-muted-foreground">{audience.excluded} רשומות ללא נייד תקין או חסומות · {audience.duplicates} מספרים כפולים</p>}
        <button type="button" onClick={() => void refresh()} disabled={busy} className="text-sm underline disabled:opacity-50">רענון ספירת נמענים</button>
        {audience && !audience.configured && <p role="status" className="text-sm">חיבור 019 עדיין לא הוגדר. השליחה תהיה זמינה לאחר חיבור החשבון.</p>}
      </section>
      <div className="space-y-2">
        <label htmlFor="sms-message" className="block font-bold">ההודעה שלך</label>
        <textarea id="sms-message" value={message} onChange={e => setMessage(e.target.value)} maxLength={1005}
          disabled={busy || locked} rows={7} placeholder="כתבו כאן את ההודעה לאנשי המקצוע…"
          className="w-full rounded-xl border bg-background p-3 disabled:opacity-60" />
        <p className="text-sm text-muted-foreground">{message.length}/1005 תווים · 019 יוסיף קישור להסרה. הודעה ארוכה עשויה להיחשב כמספר הודעות SMS.</p>
      </div>
      {!locked && <button type="button" onClick={() => void send()}
        disabled={busy || !audience?.configured || !audience.count || !message.trim()}
        className="w-full rounded-xl bg-primary text-white p-3 font-bold disabled:opacity-50">
        {busy ? 'שולח…' : `שלח SMS${audience ? ` ל־${audience.count} נמענים` : ''}`}
      </button>}
      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
      {locked && <section className="rounded-xl border p-4 space-y-3" aria-live="polite">
        {campaign?.status === 'accepted' ? <>
          <p>019 קיבל את ההודעה לשליחה ל־{campaign.recipient_count} נמענים.</p>
          <p className="text-sm">מזהה משלוח: <bdi>{campaign.shipment_id}</bdi></p>
        </> : campaign?.status === 'rejected' ? <p>019 דחה את השליחה. בדקו את חשבון הספק לפני יצירת הודעה חדשה.</p>
          : <p>מצב השליחה עדיין לא אושר. בדקו מצב; אם נשאר לא ברור, בדקו את המשלוח בחשבון 019 לפני שליחה נוספת.</p>}
        <button type="button" onClick={() => void checkStatus()} disabled={busy} className="underline text-sm disabled:opacity-50">{busy ? 'בודק…' : 'בדיקת מצב השליחה'}</button>
        {canRetry && <button type="button" onClick={() => void send()} disabled={busy} className="block rounded-xl border p-3 font-bold">ניסיון חוזר עם אותו מזהה</button>}
        {(campaign?.status === 'accepted' || campaign?.status === 'rejected') && <button type="button" onClick={newMessage} disabled={busy}
          className="block rounded-xl border p-3 font-bold">כתיבת הודעה חדשה</button>}
      </section>}
    </main>
  )
}
