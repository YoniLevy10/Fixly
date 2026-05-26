import Link from 'next/link'
import BottomNav from '@/components/BottomNav'
import CategoryCard from '@/components/marketplace/CategoryCard'
import ProfessionalCard from '@/components/marketplace/ProfessionalCard'
import { categories, professionals } from '@/lib/mock-data'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="mx-auto max-w-[430px]">
        {/* Header */}
        <header className="flex items-center justify-between px-5 pt-4 pb-2">
          <button className="w-10 h-10 flex items-center justify-center tap-highlight-none" aria-label="Menu">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
          
          <div className="flex flex-col items-center">
            <span className="text-lg font-bold text-foreground">
              {"שלום, דניאל \uD83D\uDC4B"}
            </span>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="rgb(var(--primary))" stroke="none">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
              </svg>
              <span>תל אביב-יפו</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </div>
          </div>
          
          <button className="relative w-10 h-10 flex items-center justify-center tap-highlight-none" aria-label="Notifications">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgb(var(--primary))" strokeWidth="2">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-destructive rounded-full" />
          </button>
        </header>

        {/* Hero Card */}
        <section className="px-4 pt-2 pb-4">
          <div className="relative bg-primary rounded-3xl p-6 overflow-hidden">
            {/* Background decoration */}
            <div className="absolute top-0 left-0 w-32 h-32 bg-white/5 rounded-full -translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 right-0 w-24 h-24 bg-white/5 rounded-full translate-x-1/3 translate-y-1/3" />
            
            <div className="relative flex">
              <div className="flex-1 pt-2">
                <h1 className="text-2xl font-bold text-primary-foreground mb-2">
                  זקוקים לתיקון?
                </h1>
                <p className="text-sm text-primary-foreground/80 leading-relaxed mb-4">
                  מצא את איש המקצוע המתאים במהירות ובקלות
                </p>
              </div>
              
              {/* Hero illustration placeholder */}
              <div className="w-28 h-28 flex-shrink-0">
                <svg viewBox="0 0 120 120" fill="none" className="w-full h-full">
                  {/* Simple professional illustration */}
                  <circle cx="60" cy="40" r="20" fill="#FCD34D" />
                  <path d="M40 100 Q60 70 80 100" fill="#3B82F6" />
                  <circle cx="60" cy="35" r="12" fill="#FBBF24" />
                  <ellipse cx="60" cy="38" rx="8" ry="6" fill="#FEF3C7" />
                  <circle cx="55" cy="36" r="2" fill="#1F2937" />
                  <circle cx="65" cy="36" r="2" fill="#1F2937" />
                  <path d="M57 42 Q60 45 63 42" stroke="#1F2937" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                  <rect x="45" y="55" width="30" height="40" rx="4" fill="#1E40AF" />
                  <rect x="52" y="60" width="16" height="8" rx="2" fill="#60A5FA" />
                  <rect x="75" y="65" width="20" height="6" rx="2" fill="#9CA3AF" />
                  <circle cx="85" cy="68" r="4" fill="#6B7280" />
                </svg>
              </div>
            </div>
            
            {/* Search Input */}
            <div className="relative mt-2">
              <input
                type="text"
                placeholder="מה צריך לתקן?"
                className="w-full bg-white rounded-2xl py-4 px-5 pr-12 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-white/50"
              />
              <div className="absolute left-4 top-1/2 -translate-y-1/2">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgb(var(--muted-foreground))" strokeWidth="2">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </div>
            </div>
          </div>
        </section>

        {/* Categories Section */}
        <section className="px-4 pb-4">
          <h2 className="text-lg font-bold text-foreground mb-4 text-right">
            בחרו קטגוריה
          </h2>
          
          <div className="grid grid-cols-3 gap-3">
            {categories.map((category) => (
              <CategoryCard
                key={category.id}
                name={category.name}
                icon={category.icon}
                slug={category.slug}
              />
            ))}
          </div>
          
          <button className="w-full mt-4 py-3 bg-secondary rounded-2xl text-sm font-semibold text-secondary-foreground flex items-center justify-center gap-2 tap-highlight-none active:bg-secondary/80 transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="6 9 12 15 18 9" />
            </svg>
            עוד קטגוריות
          </button>
        </section>

        {/* Recommended Professionals Section */}
        <section className="px-4 pb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-foreground">
              אנשי מקצוע מומלצים
            </h2>
            <Link 
              href="/professionals"
              className="text-sm font-semibold text-primary flex items-center gap-1 tap-highlight-none"
            >
              הצג הכל
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </Link>
          </div>
          
          <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4">
            {professionals.map((professional) => (
              <ProfessionalCard
                key={professional.id}
                id={professional.id}
                name={professional.name}
                category={professional.category}
                rating={professional.rating}
                reviewCount={professional.jobsCompleted}
                available={professional.available}
              />
            ))}
          </div>
        </section>
      </div>
      
      <BottomNav />
    </div>
  )
}
