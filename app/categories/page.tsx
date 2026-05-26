import Link from 'next/link'
import BottomNav from '@/components/BottomNav'
import CategoryCard from '@/components/marketplace/CategoryCard'
import { categories } from '@/lib/mock-data'

export default function CategoriesPage() {
  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="mx-auto max-w-[430px]">
        {/* Header */}
        <header className="sticky top-0 z-40 bg-background">
          <div className="flex items-center justify-between px-4 pt-4 pb-2">
            <Link 
              href="/"
              className="w-10 h-10 flex items-center justify-center tap-highlight-none"
              aria-label="Back"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </Link>
            
            <h1 className="text-lg font-bold text-foreground">
              כל הקטגוריות
            </h1>
            
            <div className="w-10 h-10" />
          </div>
        </header>

        {/* Search */}
        <div className="px-4 pt-2 pb-4">
          <div className="relative">
            <input
              type="text"
              placeholder="חפש שירות..."
              className="w-full bg-card rounded-xl py-4 px-5 pr-12 text-sm text-foreground placeholder:text-muted-foreground shadow-card focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgb(var(--muted-foreground))" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </div>
          </div>
        </div>

        {/* Categories Grid */}
        <section className="px-4 pb-6">
          <h2 className="text-lg font-bold text-foreground mb-4 text-right">
            בחר קטגוריה
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
        </section>

        {/* Popular Services */}
        <section className="px-4 pb-6">
          <h2 className="text-lg font-bold text-foreground mb-4 text-right">
            שירותים פופולריים
          </h2>
          
          <div className="flex flex-col gap-3">
            {[
              { title: 'תיקון נזילות', icon: 'plumber' },
              { title: 'תקלות חשמל', icon: 'electrician' },
              { title: 'התקנת מזגן', icon: 'ac' },
            ].map((service) => (
              <Link
                key={service.title}
                href={`/professionals?service=${service.icon}`}
                className="flex items-center justify-between bg-card rounded-xl p-4 shadow-card tap-highlight-none active:bg-muted/50 transition-colors"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgb(var(--muted-foreground))" strokeWidth="2">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
                <span className="text-sm font-semibold text-foreground">
                  {service.title}
                </span>
              </Link>
            ))}
          </div>
        </section>
      </div>
      
      <BottomNav />
    </div>
  )
}
