import Link from 'next/link'

export default function WelcomePage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="mx-auto max-w-[430px] w-full flex-1 flex flex-col px-6 py-8">
        {/* Logo */}
        <div className="flex flex-col items-center pt-8 pb-6">
          <div className="w-20 h-20 bg-primary rounded-2xl flex items-center justify-center mb-4">
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
              <path d="M24 8L16 20h8l-4 20 16-24H26l6-8z" fill="white" />
              <circle cx="24" cy="36" r="4" fill="white" opacity="0.5" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-primary mb-1">
            פיקסלי
          </h1>
          <p className="text-muted-foreground text-sm">
            מקצוענים מגיעים אליך
          </p>
        </div>
        
        {/* Welcome Text */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-foreground mb-2">
            ברוכים הבאים!
          </h2>
          <p className="text-muted-foreground">
            בחר כיצד ברצונך להמשיך
          </p>
        </div>
        
        {/* Role Selection Cards */}
        <div className="flex flex-col gap-4 flex-1">
          {/* Customer Card */}
          <Link 
            href="/"
            className="bg-secondary rounded-3xl p-5 tap-highlight-none active:scale-[0.98] transition-transform"
          >
            <div className="flex gap-4">
              <div className="flex-1">
                <h3 className="text-xl font-bold text-foreground mb-2">
                  אני לקוח
                </h3>
                <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                  צריך תיקון בבית?
                  <br />
                  מצא איש מקצוע במהירות
                </p>
                <div className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-xl text-sm font-semibold">
                  המשך
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                </div>
              </div>
              
              {/* Customer illustration */}
              <div className="w-24 h-24 flex-shrink-0">
                <svg viewBox="0 0 96 96" fill="none" className="w-full h-full">
                  {/* Person on couch with phone */}
                  <rect x="8" y="56" width="80" height="32" rx="8" fill="#93C5FD" />
                  <rect x="16" y="48" width="24" height="24" rx="4" fill="#60A5FA" />
                  <circle cx="56" cy="44" r="12" fill="#FCD34D" />
                  <ellipse cx="56" cy="48" rx="8" ry="6" fill="#FEF3C7" />
                  <circle cx="52" cy="46" r="2" fill="#1F2937" />
                  <circle cx="60" cy="46" r="2" fill="#1F2937" />
                  <rect x="44" y="56" width="24" height="20" rx="4" fill="#3B82F6" />
                  <rect x="68" y="60" width="12" height="16" rx="2" fill="#1F2937" />
                  <rect x="70" y="62" width="8" height="12" rx="1" fill="#60A5FA" />
                </svg>
              </div>
            </div>
          </Link>
          
          {/* Professional Card */}
          <Link 
            href="/pro-dashboard"
            className="bg-accent/10 rounded-3xl p-5 tap-highlight-none active:scale-[0.98] transition-transform border-2 border-accent/20"
          >
            <div className="flex gap-4">
              <div className="flex-1">
                <h3 className="text-xl font-bold text-foreground mb-2">
                  אני איש מקצוע
                </h3>
                <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                  אתה איש מקצוע?
                  <br />
                  הצטרף וקבל עבודות
                </p>
                <div className="inline-flex items-center gap-2 bg-accent text-accent-foreground px-4 py-2.5 rounded-xl text-sm font-semibold">
                  המשך
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                </div>
              </div>
              
              {/* Professional illustration */}
              <div className="w-24 h-24 flex-shrink-0">
                <svg viewBox="0 0 96 96" fill="none" className="w-full h-full">
                  {/* Professional with tools */}
                  <circle cx="48" cy="32" r="14" fill="#FCD34D" />
                  <ellipse cx="48" cy="36" rx="10" ry="8" fill="#FEF3C7" />
                  <circle cx="44" cy="34" r="2" fill="#1F2937" />
                  <circle cx="52" cy="34" r="2" fill="#1F2937" />
                  <path d="M45 40 Q48 43 51 40" stroke="#1F2937" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                  <rect x="36" y="48" width="24" height="32" rx="4" fill="#1E40AF" />
                  <rect x="42" y="52" width="12" height="6" rx="1" fill="#60A5FA" />
                  <rect x="60" y="44" width="20" height="8" rx="2" fill="#9CA3AF" />
                  <circle cx="70" cy="48" r="3" fill="#6B7280" />
                  <rect x="16" y="64" width="16" height="4" rx="1" fill="#F59E0B" />
                  <rect x="20" y="56" width="8" height="8" rx="1" fill="#FBBF24" />
                </svg>
              </div>
            </div>
          </Link>
        </div>
        
        {/* Login Link */}
        <div className="pt-6 pb-4 text-center">
          <p className="text-muted-foreground text-sm">
            {"יש לך כבר חשבון? "}
            <Link href="/login" className="text-primary font-semibold tap-highlight-none">
              התחבר
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
