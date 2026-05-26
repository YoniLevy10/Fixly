import Link from 'next/link'
import BottomNav from '@/components/BottomNav'
import ProfessionalListCard from '@/components/marketplace/ProfessionalListCard'
import { professionalsDetailed, filters } from '@/lib/mock-data'

export default function ProfessionalsPage() {
  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="mx-auto max-w-[430px]">
        {/* Header */}
        <header className="sticky top-0 z-40 bg-background">
          <div className="flex items-center justify-between px-4 pt-4 pb-2">
            <button className="w-10 h-10 flex items-center justify-center tap-highlight-none" aria-label="Menu">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
            
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="rgb(var(--primary))" stroke="none">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
              </svg>
              <span className="font-medium">תל אביב-יפו</span>
            </div>
            
            <button className="relative w-10 h-10 flex items-center justify-center tap-highlight-none" aria-label="Notifications">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgb(var(--primary))" strokeWidth="2">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-destructive rounded-full" />
            </button>
          </div>
        </header>

        {/* Issue Title */}
        <section className="px-4 pt-2 pb-4">
          <h1 className="text-xl font-bold text-foreground text-right mb-2">
            תיקון נזילה בכיור
          </h1>
          
          <Link 
            href="/request/edit"
            className="flex items-center gap-1 text-sm text-primary font-medium justify-end tap-highlight-none"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
            ערוך תקלה
          </Link>
        </section>

        {/* Filters */}
        <section className="px-4 pb-4">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-4 px-4 pb-1">
            {filters.map((filter) => (
              <button
                key={filter.id}
                className={`flex items-center gap-1.5 px-4 py-2.5 rounded-full text-sm font-semibold whitespace-nowrap tap-highlight-none transition-colors ${
                  filter.active
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-card text-card-foreground border border-border'
                }`}
              >
                {filter.id === 'availability' && (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                )}
                {filter.id === 'rating' && (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill={filter.active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                )}
                {filter.id === 'price' && (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="12" y1="1" x2="12" y2="23" />
                    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                  </svg>
                )}
                {filter.id === 'filter' && (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="4" y1="21" x2="4" y2="14" />
                    <line x1="4" y1="10" x2="4" y2="3" />
                    <line x1="12" y1="21" x2="12" y2="12" />
                    <line x1="12" y1="8" x2="12" y2="3" />
                    <line x1="20" y1="21" x2="20" y2="16" />
                    <line x1="20" y1="12" x2="20" y2="3" />
                    <line x1="1" y1="14" x2="7" y2="14" />
                    <line x1="9" y1="8" x2="15" y2="8" />
                    <line x1="17" y1="16" x2="23" y2="16" />
                  </svg>
                )}
                {filter.label}
              </button>
            ))}
          </div>
        </section>

        {/* Professionals List */}
        <section className="px-4 pb-6">
          <div className="flex flex-col gap-4">
            {professionalsDetailed.map((professional) => (
              <ProfessionalListCard
                key={professional.id}
                id={professional.id}
                name={professional.name}
                category={professional.category}
                rating={professional.rating}
                reviewCount={professional.reviewCount}
                available={professional.available}
                verified={professional.verified}
                estimatedPrice={professional.estimatedPrice}
                availabilityTime={professional.availabilityTime}
                arrivalTime={professional.arrivalTime}
                avatar={professional.avatar}
              />
            ))}
          </div>
        </section>
      </div>
      
      <BottomNav />
    </div>
  )
}
