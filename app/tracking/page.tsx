import Link from 'next/link'
import BottomNav from '@/components/BottomNav'

export default function TrackingPage() {
  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="mx-auto max-w-[430px]">
        {/* Header */}
        <header className="sticky top-0 z-40 bg-background">
          <div className="flex items-center justify-between px-4 pt-4 pb-2">
            <Link 
              href="/dashboard"
              className="w-10 h-10 flex items-center justify-center tap-highlight-none"
              aria-label="Back"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </Link>
            
            <h1 className="text-lg font-bold text-foreground">
              מעקב בקשה
            </h1>
            
            <div className="w-10 h-10" />
          </div>
        </header>

        {/* Status Card */}
        <div className="px-4 pt-4">
          <div className="bg-primary rounded-3xl p-5 mb-4">
            <div className="flex items-center justify-between mb-4">
              <span className="bg-white/20 text-primary-foreground px-3 py-1 rounded-full text-xs font-semibold">
                בדרך אליך
              </span>
              <h2 className="text-lg font-bold text-primary-foreground">
                תיקון חשמל במטבח
              </h2>
            </div>
            
            <div className="flex items-center gap-4 bg-white/10 rounded-xl p-4">
              <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>
              <div className="flex-1 text-right">
                <h3 className="text-base font-bold text-primary-foreground mb-1">
                  אבי לוי
                </h3>
                <p className="text-sm text-primary-foreground/80">
                  חשמלאי מוסמך
                </p>
                <div className="flex items-center gap-1 justify-end mt-1">
                  <span className="text-sm text-primary-foreground">4.9</span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="#FCD34D">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ETA Card */}
        <div className="px-4 pb-4">
          <div className="bg-card rounded-2xl p-5 shadow-card">
            <div className="flex items-center justify-between mb-4">
              <div className="text-center">
                <p className="text-3xl font-bold text-primary">15</p>
                <p className="text-xs text-muted-foreground">דקות</p>
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground mb-1 text-right">
                  זמן הגעה משוער
                </h3>
                <p className="text-sm text-muted-foreground text-right">
                  איש המקצוע בדרך אליך
                </p>
              </div>
            </div>
            
            {/* Progress Steps */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className="flex-1 h-1 bg-accent rounded-full" />
                <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <span className="text-sm font-semibold text-foreground min-w-[80px] text-right">אושר</span>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="flex-1 h-1 bg-accent rounded-full" />
                <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <span className="text-sm font-semibold text-foreground min-w-[80px] text-right">בדרך</span>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="flex-1 h-1 bg-border rounded-full" />
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                  <span className="text-xs font-bold text-muted-foreground">3</span>
                </div>
                <span className="text-sm text-muted-foreground min-w-[80px] text-right">הגיע</span>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="flex-1 h-1 bg-border rounded-full" />
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                  <span className="text-xs font-bold text-muted-foreground">4</span>
                </div>
                <span className="text-sm text-muted-foreground min-w-[80px] text-right">הושלם</span>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Actions */}
        <div className="px-4 pb-4">
          <div className="flex gap-3">
            <button className="flex-1 flex items-center justify-center gap-2 py-4 bg-card border border-border rounded-xl text-sm font-semibold text-foreground shadow-card tap-highlight-none">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
              התקשר
            </button>
            <button className="flex-1 flex items-center justify-center gap-2 py-4 bg-primary rounded-xl text-sm font-semibold text-primary-foreground shadow-button tap-highlight-none">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              {"צ'אט"}
            </button>
          </div>
        </div>
      </div>
      
      <BottomNav />
    </div>
  )
}
