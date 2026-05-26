import Link from 'next/link'
import BottomNav from '@/components/BottomNav'

const mockJobs = [
  {
    id: '1',
    title: 'תיקון נזילה בכיור',
    customerName: 'שרה כהן',
    address: 'רחוב דיזנגוף 45, תל אביב',
    status: 'pending',
    price: 250,
  },
  {
    id: '2',
    title: 'בעיית חשמל במטבח',
    customerName: 'דוד לוי',
    address: 'רחוב הרצל 12, רמת גן',
    status: 'accepted',
    price: 180,
  },
]

const statusLabels: Record<string, { label: string; color: string }> = {
  pending: { label: 'ממתין לאישור', color: 'bg-yellow-100 text-yellow-700' },
  accepted: { label: 'אושר', color: 'bg-accent/20 text-accent' },
  in_progress: { label: 'בביצוע', color: 'bg-primary/10 text-primary' },
  completed: { label: 'הושלם', color: 'bg-muted text-muted-foreground' },
}

export default function ProfessionalDashboard() {
  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="mx-auto max-w-[430px]">
        {/* Header */}
        <header className="px-4 pt-6 pb-4">
          <div className="flex items-center justify-between mb-4">
            <button className="relative w-10 h-10 flex items-center justify-center tap-highlight-none" aria-label="Notifications">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgb(var(--primary))" strokeWidth="2">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-destructive rounded-full" />
            </button>
            
            <div className="text-right">
              <p className="text-sm text-muted-foreground">שלום,</p>
              <h1 className="text-xl font-bold text-foreground">אבי אינסטלציה</h1>
            </div>
          </div>
          
          {/* Stats Cards */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-primary rounded-2xl p-4 text-center">
              <p className="text-2xl font-bold text-primary-foreground">12</p>
              <p className="text-xs text-primary-foreground/80">עבודות החודש</p>
            </div>
            <div className="bg-card rounded-2xl p-4 text-center shadow-card">
              <p className="text-2xl font-bold text-accent">4.8</p>
              <p className="text-xs text-muted-foreground">דירוג ממוצע</p>
            </div>
            <div className="bg-card rounded-2xl p-4 text-center shadow-card">
              <p className="text-2xl font-bold text-foreground">{"₪"}8,450</p>
              <p className="text-xs text-muted-foreground">הכנסות החודש</p>
            </div>
          </div>
        </header>

        {/* Active Jobs */}
        <section className="px-4 pb-6">
          <h2 className="text-lg font-bold text-foreground mb-4 text-right">
            עבודות פעילות
          </h2>
          
          <div className="flex flex-col gap-4">
            {mockJobs.map((job) => (
              <div
                key={job.id}
                className="bg-card rounded-2xl p-4 shadow-card"
              >
                <div className="flex items-start justify-between mb-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusLabels[job.status].color}`}>
                    {statusLabels[job.status].label}
                  </span>
                  <h3 className="text-base font-bold text-foreground">
                    {job.title}
                  </h3>
                </div>
                
                <div className="flex items-center gap-2 mb-2 justify-end">
                  <span className="text-sm text-muted-foreground">{job.customerName}</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgb(var(--muted-foreground))" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </div>
                
                <div className="flex items-center gap-2 mb-4 justify-end">
                  <span className="text-sm text-muted-foreground">{job.address}</span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="rgb(var(--primary))" stroke="none">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                  </svg>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    <button className="flex items-center gap-1 px-4 py-2 bg-muted rounded-xl text-sm font-semibold text-foreground tap-highlight-none">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                      </svg>
                      {"צ'אט"}
                    </button>
                    {job.status === 'pending' && (
                      <button className="flex items-center gap-1 px-4 py-2 bg-accent text-accent-foreground rounded-xl text-sm font-semibold tap-highlight-none">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        קבל
                      </button>
                    )}
                  </div>
                  <p className="text-lg font-bold text-foreground">
                    {"₪"}{job.price}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
      
      <BottomNav />
    </div>
  )
}
