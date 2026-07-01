'use client'

import { useEffect, useState } from 'react'
import Card from '@/components/ui/Card'

type AdminStats = {
  stats: {
    professionals: number
    requests: number
    pendingRequests: number
    completedRequests: number
    waitlist: number
    reviews: number
  }
  recentWaitlist: Array<{
    id: string
    full_name: string
    phone: string
    city: string | null
    category: string | null
    created_at: string
  }>
  recentBilling: Array<{
    id: string
    event_type: string
    amount_agorot: number
    created_at: string
  }>
}

export default function AdminPage() {
  const [data, setData] = useState<AdminStats | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/stats')
      .then(async (res) => {
        if (res.status === 403) {
          throw new Error(
            'Unauthorized — sign in with an admin email (ADMIN_EMAILS env var)',
          )
        }
        if (!res.ok) throw new Error(await res.text())
        return res.json() as Promise<AdminStats>
      })
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <main className="p-6 pb-28">
        <p className="text-muted-foreground">Loading operations center…</p>
      </main>
    )
  }

  if (error || !data) {
    return (
      <main className="p-6 pb-28">
        <h1 className="text-2xl font-bold mb-2">Operations Center</h1>
        <p className="text-red-600">{error ?? 'No data'}</p>
      </main>
    )
  }

  const { stats, recentWaitlist, recentBilling } = data

  return (
    <main className="p-6 pb-28 space-y-6">
      <div>
        <p className="text-sm text-muted-foreground mb-1">Fixly Admin</p>
        <h1 className="text-3xl font-bold">Operations Center</h1>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {[
          ['Professionals', stats.professionals],
          ['Requests', stats.requests],
          ['Pending', stats.pendingRequests],
          ['Completed', stats.completedRequests],
          ['Waitlist', stats.waitlist],
          ['Reviews', stats.reviews],
        ].map(([label, value]) => (
          <Card key={String(label)}>
            <p className="text-sm text-muted-foreground mb-1">{label}</p>
            <p className="text-3xl font-extrabold">{value}</p>
          </Card>
        ))}
      </div>

      <Card>
        <h2 className="font-bold text-lg mb-3">Recent Waitlist</h2>
        {recentWaitlist.length === 0 ? (
          <p className="text-sm text-muted-foreground">No entries yet</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {recentWaitlist.map((entry) => (
              <li key={entry.id} className="border-b border-border pb-2">
                <strong>{entry.full_name}</strong> — {entry.phone}
                {entry.city ? ` • ${entry.city}` : ''}
                {entry.category ? ` • ${entry.category}` : ''}
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card>
        <h2 className="font-bold text-lg mb-3">Recent Billing Events</h2>
        {recentBilling.length === 0 ? (
          <p className="text-sm text-muted-foreground">No billing events yet</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {recentBilling.map((event) => (
              <li key={event.id} className="border-b border-border pb-2">
                {event.event_type} — {(event.amount_agorot / 100).toFixed(0)} ₪
              </li>
            ))}
          </ul>
        )}
      </Card>
    </main>
  )
}
