import Link from 'next/link'
import BottomNav from '@/components/BottomNav'
import { requests } from '@/lib/mock-data'

const statusLabels: Record<string, { label: string; color: string }> = {
  pending: { label: 'ממתין', color: 'bg-yellow-100 text-yellow-700' },
  accepted: { label: 'אושר', color: 'bg-blue-100 text-blue-700' },
  on_the_way: { label: 'בדרך', color: 'bg-primary/10 text-primary' },
  completed: { label: 'הושלם', color: 'bg-accent/20 text-accent' },
  cancelled: { label: 'בוטל', color: 'bg-destructive/10 text-destructive' },
}

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="mx-auto max-w-[430px]">
        {/* Header */}
        <header className="px-4 pt-6 pb-4">
          <h1 className="text-2xl font-bold text-foreground mb-1 text-right">
            הבקשות שלי
          </h1>
          <p className="text-sm text-muted-foreground text-right">
            ניהול ומעקב אחר בקשות השירות
          </p>
        </header>

        {/* Requests List */}
        <section className="px-4">
          {requests.length === 0 ? (
            <div className="bg-card rounded-3xl p-8 shadow-card text-center">
              <div className="w-16 h-16 bg-secondary rounded-full mx-auto mb-4 flex items-center justify-center">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="rgb(var(--muted-foreground))" strokeWidth="1.5">
                  <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">
                אין בקשות פעילות
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                פרסם תקלה חדשה כדי למצוא איש מקצוע
              </p>
              <Link
                href="/request"
                className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-xl text-sm font-semibold shadow-button tap-highlight-none"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                פרסם תקלה
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {requests.map((request) => (
                <Link
                  key={request.id}
                  href={`/tracking/${request.id}`}
                  className="bg-card rounded-2xl p-4 shadow-card tap-highlight-none active:scale-[0.99] transition-transform"
                >
                  <div className="flex items-start justify-between mb-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusLabels[request.status].color}`}>
                      {statusLabels[request.status].label}
                    </span>
                    <h3 className="text-base font-bold text-foreground">
                      {request.title}
                    </h3>
                  </div>
                  
                  <p className="text-sm text-muted-foreground text-right mb-3">
                    {request.description}
                  </p>
                  
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                    <div className="flex items-center gap-1">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="rgb(var(--primary))" stroke="none">
                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                      </svg>
                      <span>{request.address}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
      
      <BottomNav />
    </div>
  )
}
