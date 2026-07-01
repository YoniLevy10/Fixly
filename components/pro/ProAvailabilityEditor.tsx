'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth/auth-provider'
import { useLocale } from '@/lib/i18n/locale-provider'

const DAYS = [
  { value: 0, key: 'sun' },
  { value: 1, key: 'mon' },
  { value: 2, key: 'tue' },
  { value: 3, key: 'wed' },
  { value: 4, key: 'thu' },
  { value: 5, key: 'fri' },
  { value: 6, key: 'sat' },
] as const

type Rule = { dayOfWeek: number; startTime: string; endTime: string }

export default function ProAvailabilityEditor() {
  const { user } = useAuth()
  const { t } = useLocale()
  const [rules, setRules] = useState<Rule[]>([])
  const [summary, setSummary] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (user.role !== 'professional') return
    fetch('/api/pro/availability')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.rules) setRules(data.rules)
        if (data?.summary) setSummary(data.summary)
      })
      .catch(() => {})
  }, [user.role])

  const toggleDay = (day: number) => {
    const exists = rules.find((r) => r.dayOfWeek === day)
    if (exists) {
      setRules(rules.filter((r) => r.dayOfWeek !== day))
    } else {
      setRules([...rules, { dayOfWeek: day, startTime: '08:00', endTime: '18:00' }])
    }
  }

  const save = async () => {
    setSaving(true)
    setSaved(false)
    try {
      const res = await fetch('/api/pro/availability', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rules, summary }),
      })
      setSaved(res.ok)
    } finally {
      setSaving(false)
    }
  }

  if (user.role !== 'professional') return null

  return (
    <div className="bg-card rounded-2xl border-2 border-border p-4 mb-4">
      <h2 className="font-bold mb-2">{t('availability.title')}</h2>
      <p className="text-sm text-muted-foreground mb-4">{t('availability.hint')}</p>
      <div className="flex flex-wrap gap-2 mb-4">
        {DAYS.map((d) => {
          const active = rules.some((r) => r.dayOfWeek === d.value)
          return (
            <button
              key={d.value}
              type="button"
              onClick={() => toggleDay(d.value)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                active ? 'bg-primary text-white' : 'bg-muted text-foreground/70'
              }`}
            >
              {t(`availability.days.${d.key}`)}
            </button>
          )
        })}
      </div>
      <input
        value={summary}
        onChange={(e) => setSummary(e.target.value)}
        placeholder={t('availability.summaryPlaceholder')}
        className="w-full border border-border rounded-xl px-3 py-2 text-sm mb-3"
      />
      <button
        type="button"
        onClick={save}
        disabled={saving}
        className="bg-primary text-white px-4 py-2 rounded-xl font-bold text-sm disabled:opacity-60"
      >
        {saving ? '...' : t('availability.save')}
      </button>
      {saved && (
        <p className="text-sm text-emerald-600 mt-2">{t('availability.saved')}</p>
      )}
    </div>
  )
}
