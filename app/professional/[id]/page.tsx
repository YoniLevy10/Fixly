import Link from 'next/link'
import BottomNav from '@/components/BottomNav'
import { professionalsDetailed } from '@/lib/mock-data'

type ProfessionalDetailPageProps = {
  params: {
    id: string
  }
}

export default function ProfessionalDetailPage({ params }: ProfessionalDetailPageProps) {
  const professional =
    professionalsDetailed.find((item) => item.id === params.id) ?? professionalsDetailed[0]

  return (
    <div className="min-h-screen bg-background pb-24" dir="rtl">
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
              פרטי איש מקצוע
            </h1>

            <button className="w-10 h-10 flex items-center justify-center tap-highlight-none" aria-label="Share">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgb(var(--primary))" strokeWidth="2">
                <circle cx="18" cy="5" r="3" />
                <circle cx="6" cy="12" r="3" />
                <circle cx="18" cy="19" r="3" />
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
              </svg>
            </button>
          </div>
        </header>

        <section className="px-4 pt-3 pb-4">
          <div className="bg-card rounded-3xl p-5 shadow-card text-center">
            <div className="relative w-24 h-24 mx-auto mb-4">
              <div className="w-24 h-24 rounded-full bg-secondary overflow-hidden flex items-center justify-center">
                {professional.avatar ? (
                  <img src={professional.avatar} alt={professional.name} className="w-full h-full object-cover" />
                ) : (
                  <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="rgb(var(--muted-foreground))" strokeWidth="1.5">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                )}
              </div>

              {professional.available && (
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-accent text-accent-foreground text-[10px] font-bold px-3 py-1 rounded-full whitespace-nowrap">
                  זמין עכשיו
                </div>
              )}
            </div>

            <div className="flex items-center justify-center gap-2 mb-1">
              <h2 className="text-2xl font-bold text-card-foreground">
                {professional.name}
              </h2>
              {professional.verified && (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="rgb(var(--primary))">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="white" strokeWidth="2" fill="rgb(var(--primary))" />
                  <path d="M9 12l2 2 4-4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                </svg>
              )}
            </div>

            <p className="text-sm text-muted-foreground mb-4">
              {professional.category}
            </p>

            <div className="flex items-center justify-center gap-1 mb-5">
              <span className="text-sm font-semibold text-card-foreground">
                {professional.rating}
              </span>
              <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                  <svg
                    key={star}
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill={star <= Math.round(professional.rating) ? '#F59E0B' : '#E5E7EB'}
                  >
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                ))}
              </div>
              <span className="text-sm text-muted-foreground">
                ({professional.reviewCount})
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 bg-muted rounded-2xl p-3">
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-1">הגעה</p>
                <p className="text-sm font-bold text-card-foreground">{professional.arrivalTime} דק׳</p>
              </div>
              <div className="text-center border-x border-border">
                <p className="text-xs text-muted-foreground mb-1">זמינות</p>
                <p className="text-sm font-bold text-accent">היום</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-1">החל מ־</p>
                <p className="text-sm font-bold text-card-foreground">{professional.estimatedPrice}₪</p>
              </div>
            </div>
          </div>
        </section>

        <section className="px-4 pb-4">
          <div className="bg-card rounded-3xl p-5 shadow-card">
            <h3 className="text-lg font-bold text-card-foreground mb-3 text-right">
              על איש המקצוע
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed text-right">
              איש מקצוע מוסמך, זמין ומהיר עם ניסיון מוכח בשירותי תיקון לבית ולעסק. מתאים במיוחד לטיפול מהיר בתקלה שפרסמת.
            </p>
          </div>
        </section>

        <section className="px-4 pb-6">
          <h3 className="text-lg font-bold text-foreground mb-4 text-right">
            ביקורות אחרונות
          </h3>
          <div className="flex flex-col gap-3">
            {['שירות מעולה ומהיר', 'הגיע בזמן ופתר את התקלה'].map((review) => (
              <div key={review} className="bg-card rounded-2xl p-4 shadow-card">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <svg key={star} width="13" height="13" viewBox="0 0 24 24" fill="#F59E0B">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                      </svg>
                    ))}
                  </div>
                  <span className="text-sm font-bold text-card-foreground">לקוח מאומת</span>
                </div>
                <p className="text-sm text-muted-foreground text-right leading-relaxed">
                  {review}
                </p>
              </div>
            ))}
          </div>
        </section>

        <div className="fixed bottom-20 left-0 right-0 z-40">
          <div className="mx-auto max-w-[430px] px-4">
            <Link
              href={`/book/${professional.id}`}
              className="w-full flex items-center justify-center bg-primary text-primary-foreground rounded-2xl py-4 text-base font-bold shadow-button tap-highlight-none active:opacity-90 transition-opacity"
            >
              בחר איש מקצוע
            </Link>
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  )
}
