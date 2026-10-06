'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Sparkles } from 'lucide-react'
import SuperadminChrome from '@/components/admin/SuperadminChrome'

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
    <SuperadminChrome
      cta={
        <Link
          href="/superadmin"
          className="inline-flex min-h-10 items-center rounded-2xl border border-[#123563]/12 bg-white/80 px-3.5 text-sm font-bold text-[#123563]"
        >
          חזרה לגיוס
        </Link>
      }
    >
      <div className="mx-auto max-w-2xl space-y-5">
        <div>
          <p className="mb-2 inline-flex items-center gap-2 text-xs font-extrabold text-[#123563]">
            <Sparkles className="h-4 w-4 text-[#F59E0B]" aria-hidden />
            הודעה אחת לכל מי שהתגלה
          </p>
          <h1 className="text-[clamp(1.6rem,4vw,2.3rem)] font-extrabold leading-tight text-[#1a2f4d]">
            שליחת SMS לאנשי המקצוע
          </h1>
          <p className="mt-2 text-sm font-medium leading-6 text-slate-600">
            ההודעה תישלח לכל מספרי הנייד במנוע הגיוס, כולל גיליון הפנייה. מספרים כפולים, מי שכבר נרשם, ומי שסומן ״לא ליצור קשר״ או ״לא רלוונטי״ יוחרגו.
          </p>
        </div>

        <section className="apple-glass-strong space-y-3 rounded-[var(--radius-xl)] p-5 sm:p-6" aria-live="polite">
          <p className="text-xs font-black text-[#F59E0B]">קהל לשליחה</p>
          <p className="text-3xl font-black tabular-nums text-[#123563]">
            {audience ? audience.count : '…'}
            <span className="ms-2 text-base font-bold text-slate-400">
              {audience ? `מתוך ${audience.total}` : 'טוען נמענים'}
            </span>
          </p>
          <p className="text-sm font-medium text-slate-600">
            מספר שולח: <bdi className="font-black text-[#123563]">{audience?.sender ?? '0552819086'}</bdi>
          </p>
          {audience && (
            <p className="text-sm font-medium text-slate-500">
              {audience.excluded} רשומות ללא נייד תקין או חסומות · {audience.duplicates} מספרים כפולים
            </p>
          )}
          <button type="button" onClick={() => void refresh()} disabled={busy} className="text-sm font-bold text-[#123563] underline underline-offset-4 disabled:opacity-50">
            רענון ספירת נמענים
          </button>
          {audience && !audience.configured && (
            <p role="status" className="rounded-xl bg-[#F59E0B]/15 px-3 py-2 text-sm font-bold text-[#9a3412]">
              חיבור 019 עדיין לא הוגדר. השליחה תהיה זמינה לאחר חיבור החשבון.
            </p>
          )}
        </section>

        <div className="apple-glass-strong space-y-3 rounded-[var(--radius-xl)] p-5 sm:p-6">
          <label htmlFor="sms-message" className="block text-sm font-black text-[#123563]">ההודעה שלך</label>
          <textarea id="sms-message" value={message} onChange={e => setMessage(e.target.value)} maxLength={1005}
            disabled={busy || locked} rows={7} placeholder="כתבו כאן את ההודעה לאנשי המקצוע…"
            className="w-full rounded-2xl border border-[#123563]/12 bg-white p-3 text-sm font-medium text-[#10233f] disabled:opacity-60" />
          <p className="text-xs font-medium text-slate-500">{message.length}/1005 תווים · 019 יוסיף קישור להסרה. הודעה ארוכה עשויה להיחשב כמספר הודעות SMS.</p>
          {!locked && (
            <button type="button" onClick={() => void send()}
              disabled={busy || !audience?.configured || !audience.count || !message.trim()}
              className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-[#F59E0B] px-6 text-base font-black text-[#123563] transition hover:brightness-105 disabled:opacity-50">
              {busy ? 'שולח…' : `שלח SMS${audience ? ` ל־${audience.count} נמענים` : ''}`}
            </button>
          )}
        </div>

        {error && <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">{error}</p>}
        {locked && (
          <section className="space-y-3 rounded-[var(--radius-xl)] bg-[#10233f] p-5 text-white sm:p-6" aria-live="polite">
            {campaign?.status === 'accepted' ? <>
              <p className="font-black">019 קיבל את ההודעה לשליחה ל־{campaign.recipient_count} נמענים.</p>
              <p className="text-sm text-white/80">מזהה משלוח: <bdi>{campaign.shipment_id}</bdi></p>
            </> : campaign?.status === 'rejected' ? <p className="font-bold">019 דחה את השליחה. בדקו את חשבון הספק לפני יצירת הודעה חדשה.</p>
              : <p className="font-medium text-white/90">מצב השליחה עדיין לא אושר. בדקו מצב; אם נשאר לא ברור, בדקו את המשלוח בחשבון 019 לפני שליחה נוספת.</p>}
            <button type="button" onClick={() => void checkStatus()} disabled={busy} className="text-sm font-bold text-[#F59E0B] underline underline-offset-4 disabled:opacity-50">{busy ? 'בודק…' : 'בדיקת מצב השליחה'}</button>
            {canRetry && <button type="button" onClick={() => void send()} disabled={busy} className="block w-full rounded-xl bg-white px-4 py-3 font-black text-[#123563]">ניסיון חוזר עם אותו מזהה</button>}
            {(campaign?.status === 'accepted' || campaign?.status === 'rejected') && (
              <button type="button" onClick={newMessage} disabled={busy} className="block w-full rounded-xl border border-white/20 px-4 py-3 font-black">
                כתיבת הודעה חדשה
              </button>
            )}
          </section>
        )}
      </div>
    </SuperadminChrome>
  )
}
