import Link from 'next/link'
import BottomNav from '@/components/BottomNav'

const reviews = [
  {
    name: 'שרה מ.',
    text: 'שירות מעולה ומקצועי מאוד. הגיע בזמן ותיקן הכל במהירות.',
    rating: 5,
    date: 'לפני 3 ימים',
  },
  {
    name: 'דוד ל.',
    text: 'הגיע מהר ותיקן הכל בצורה מושלמת. ממליץ בחום!',
    rating: 5,
    date: 'לפני שבוע',
  },
  {
    name: 'רונית כ.',
    text: 'מקצוען אמיתי, מחיר הוגן ועבודה נקייה.',
    rating: 4,
    date: 'לפני 2 שבועות',
  },
]

export default function ProfessionalPage() {
  return (
    <div className="min-h-screen bg-background pb-32">
      <div className="mx-auto max-w-[430px]">
        <header className="sticky top-0 z-40 bg-background">
          <div className="flex items-center justify-between px-4 pt-4 pb-2">
            <Link 
              href="/professionals"
              className="w-10 h-10 flex items-center justify-center tap-highlight-none"
              aria-label="Back"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </Link>
            
            <h1 className="text-lg font-bold text-foreground">
              פרופיל איש מקצוע
            </h1>
            
            <button className="w-10 h-10 flex items-center justify-center tap-highlight-none" aria-label="Share">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="18" cy="5" r="3" />
                <circle cx="6" cy="12" r="3" />
                <circle cx="18" cy="19" r="3" />
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
              </svg>
            </button>
          </div>
        </header>

        <div className="px-4 pt-4">
          <div className="bg-card rounded-3xl p-6 shadow-card mb-4">
            <div className="flex items-start gap-4 mb-4">
              <div className="flex-1 text-right">
                <div className="flex items-center gap-2 justify-end mb-2">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="rgb(var(--primary))">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="white" strokeWidth="2" fill="rgb(var(--primary))" />
                    <path d="M9 12l2 2 4-4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                  </svg>
                  <h2 className="text-xl font-bold text-foreground">
                    אבי לוי
                  </h2>
                </div>
                <p className="text-muted-foreground mb-3">
                  חשמלאי מוסמך
                </p>
                <div className="flex items-center gap-1 justify-end">
                  <span className="text-sm font-semibold text-foreground">4.9</span>
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <svg
                        key={star}
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill={star <= 5 ? '#F59E0B' : '#E5E7EB'}
                      >
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                      </svg>
                    ))}
                  </div>
                  <span className="text-sm text-muted-foreground">(96 ביקורות)</span>
                </div>
              </div>
              
              <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="rgb(var(--muted-foreground))" strokeWidth="1.5">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-muted rounded-xl p-3 text-center">
                <p className="text-lg font-bold text-foreground">120</p>
                <p className="text-xs text-muted-foreground">עבודות</p>
              </div>
              <div className="bg-muted rounded-xl p-3 text-center">
                <p className="text-lg font-bold text-foreground">8+</p>
                <p className="text-xs text-muted-foreground">שנות ניסיון</p>
              </div>
              <div className="bg-accent/10 rounded-xl p-3 text-center">
                <p className="text-lg font-bold text-accent">זמין</p>
                <p className="text-xs text-muted-foreground">עכשיו</p>
              </div>
            </div>
          </div>
        </div>

        <div className="px-4 pb-4">
          <div className="bg-card rounded-2xl p-5 shadow-card">
            <h3 className="text-base font-bold text-foreground mb-3 text-right">
              אודות
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed text-right">
              חשמלאי מוסמך עם ניסיון של למעלה מ-8 שנים בתחום החשמל הביתי והמסחרי. מתמחה בתיקון תקלות, התקנת מערכות חשמל, ושדרוג לוחות חשמל. עובד בהתאם לתקנים ובעל ביטוח מלא.
            </p>
          </div>
        </div>

        <div className="px-4 pb-4">
          <div className="bg-card rounded-2xl p-5 shadow-card">
            <h3 className="text-base font-bold text-foreground mb-3 text-right">
              שירותים
            </h3>
            <div className="flex flex-wrap gap-2 justify-end">
              {['תיקון תקלות חשמל', 'התקנת נקודות חשמל', 'שדרוג לוח חשמל', 'התקנת תאורה', 'בדיקות חשמל'].map((service) => (
                <span 
                  key={service}
                  className="bg-secondary text-secondary-foreground px-3 py-2 rounded-lg text-xs font-medium"
                >
                  {service}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="px-4 pb-4">
          <div className="bg-card rounded-2xl p-5 shadow-card">
            <div className="flex items-center justify-between mb-4">
              <button className="text-sm font-semibold text-primary tap-highlight-none">
                הצג הכל
              </button>
              <h3 className="text-base font-bold text-foreground">
                ביקורות
              </h3>
            </div>
            
            <div className="flex flex-col gap-4">
              {reviews.map((review, index) => (
                <div
                  key={index}
                  className="bg-muted rounded-xl p-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-muted-foreground">{review.date}</span>
                    <div className="flex items-center gap-2">
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <svg
                            key={star}
                            width="12"
                            height="12"
                            viewBox="0 0 24 24"
                            fill={star <= review.rating ? '#F59E0B' : '#E5E7EB'}
                          >
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                          </svg>
                        ))}
                      </div>
                      <span className="text-sm font-semibold text-foreground">{review.name}</span>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground text-right leading-relaxed">
                    {review.text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="fixed bottom-20 left-0 right-0 z-40">
          <div className="mx-auto max-w-[430px] px-4">
            <div className="bg-card rounded-2xl p-4 shadow-nav">
              <div className="flex gap-3">
                <Link
                  href="/chat/1"
                  className="flex-1 flex items-center justify-center gap-2 py-4 bg-muted rounded-xl text-sm font-semibold text-foreground tap-highlight-none"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                  {'צ\'אט'}
                </Link>
                <Link
                  href="/book/1"
                  className="flex-[2] flex items-center justify-center gap-2 py-4 bg-primary rounded-xl text-sm font-bold text-primary-foreground shadow-button tap-highlight-none"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  הזמן שירות
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <BottomNav />
    </div>
  )
}
