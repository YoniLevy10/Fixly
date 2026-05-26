import Link from 'next/link'
import BottomNav from '@/components/BottomNav'

export default function RequestPage() {
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
              פרסום תקלה
            </h1>
            
            <div className="w-10 h-10" />
          </div>
        </header>

        {/* Form */}
        <div className="px-4 pt-4">
          <div className="bg-card rounded-3xl p-5 shadow-card mb-4">
            {/* Category Selection */}
            <div className="mb-5">
              <label className="block text-sm font-bold text-foreground mb-2 text-right">
                סוג השירות
              </label>
              <select 
                className="w-full bg-muted rounded-xl py-4 px-4 text-sm text-foreground appearance-none focus:outline-none focus:ring-2 focus:ring-primary/20"
                defaultValue=""
              >
                <option value="" disabled>בחר קטגוריה</option>
                <option value="electrician">חשמלאי</option>
                <option value="plumber">אינסטלטור</option>
                <option value="ac">מיזוג אוויר</option>
                <option value="locksmith">מנעולן</option>
                <option value="painter">צבעי</option>
                <option value="appliance">תיקון מכשירי חשמל</option>
                <option value="tv">התקנת טלוויזיה</option>
                <option value="carpentry">נגרות והרכבות</option>
                <option value="cleaning">ניקיון</option>
              </select>
            </div>

            {/* Title */}
            <div className="mb-5">
              <label className="block text-sm font-bold text-foreground mb-2 text-right">
                כותרת הבקשה
              </label>
              <input
                type="text"
                placeholder="לדוגמה: נזילה בכיור המטבח"
                className="w-full bg-muted rounded-xl py-4 px-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            {/* Description */}
            <div className="mb-5">
              <label className="block text-sm font-bold text-foreground mb-2 text-right">
                תיאור הבעיה
              </label>
              <textarea
                placeholder="תאר את הבעיה בפירוט..."
                rows={4}
                className="w-full bg-muted rounded-xl py-4 px-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
              />
            </div>

            {/* Address */}
            <div className="mb-5">
              <label className="block text-sm font-bold text-foreground mb-2 text-right">
                כתובת
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="הזן כתובת מלאה"
                  className="w-full bg-muted rounded-xl py-4 px-4 pr-12 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="rgb(var(--primary))" stroke="none">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                  </svg>
                </div>
              </div>
            </div>

            {/* Preferred Time */}
            <div className="mb-5">
              <label className="block text-sm font-bold text-foreground mb-2 text-right">
                זמן מועדף
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button 
                  type="button"
                  className="bg-primary text-primary-foreground rounded-xl py-3 px-4 text-sm font-semibold tap-highlight-none"
                >
                  היום
                </button>
                <button 
                  type="button"
                  className="bg-muted text-foreground rounded-xl py-3 px-4 text-sm font-semibold tap-highlight-none"
                >
                  מחר
                </button>
                <button 
                  type="button"
                  className="bg-muted text-foreground rounded-xl py-3 px-4 text-sm font-semibold tap-highlight-none"
                >
                  השבוע
                </button>
                <button 
                  type="button"
                  className="bg-muted text-foreground rounded-xl py-3 px-4 text-sm font-semibold tap-highlight-none"
                >
                  גמיש
                </button>
              </div>
            </div>

            {/* Image Upload */}
            <div>
              <label className="block text-sm font-bold text-foreground mb-2 text-right">
                {"תמונות (אופציונלי)"}
              </label>
              <div className="border-2 border-dashed border-border rounded-2xl p-6 text-center">
                <div className="w-12 h-12 bg-secondary rounded-full mx-auto mb-3 flex items-center justify-center">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgb(var(--primary))" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                  </svg>
                </div>
                <p className="text-sm text-muted-foreground mb-1">
                  לחץ להעלאת תמונות
                </p>
                <p className="text-xs text-muted-foreground">
                  JPG, PNG עד 10MB
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Sticky Submit Button */}
        <div className="fixed bottom-20 left-0 right-0 z-40">
          <div className="mx-auto max-w-[430px] px-4">
            <button 
              type="submit"
              className="w-full bg-primary text-primary-foreground rounded-2xl py-4 text-base font-bold shadow-button tap-highlight-none active:opacity-90 transition-opacity"
            >
              פרסם תקלה
            </button>
          </div>
        </div>
      </div>
      
      <BottomNav />
    </div>
  )
}
