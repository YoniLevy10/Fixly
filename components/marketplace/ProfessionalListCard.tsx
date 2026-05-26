import Link from 'next/link'

type ProfessionalListCardProps = {
  id: string
  name: string
  category: string
  rating: number
  reviewCount: number
  available: boolean
  verified: boolean
  estimatedPrice: number
  availabilityTime: string
  arrivalTime: string
  avatar?: string
}

export default function ProfessionalListCard({
  id,
  name,
  category,
  rating,
  reviewCount,
  available,
  verified,
  estimatedPrice,
  availabilityTime,
  arrivalTime,
  avatar,
}: ProfessionalListCardProps) {
  return (
    <div className="bg-card rounded-2xl p-4 shadow-card">
      {/* Top section - Avatar and info */}
      <div className="flex gap-3 mb-4">
        {/* Avatar */}
        <div className="w-16 h-16 rounded-full bg-secondary overflow-hidden flex-shrink-0 flex items-center justify-center">
          {avatar ? (
            <img src={avatar} alt={name} className="w-full h-full object-cover" />
          ) : (
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgb(var(--muted-foreground))" strokeWidth="1.5">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          )}
        </div>
        
        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-base font-bold text-card-foreground truncate">
              {name}
            </h3>
            {verified && (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="rgb(var(--primary))">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="white" strokeWidth="2" fill="rgb(var(--primary))" />
                <path d="M9 12l2 2 4-4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              </svg>
            )}
          </div>
          
          <p className="text-sm text-muted-foreground mb-1">
            {category}
          </p>
          
          <div className="flex items-center gap-1">
            <span className="text-sm font-semibold text-card-foreground">
              {rating}
            </span>
            <div className="flex">
              {[1, 2, 3, 4, 5].map((star) => (
                <svg
                  key={star}
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill={star <= Math.round(rating) ? '#F59E0B' : '#E5E7EB'}
                >
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              ))}
            </div>
            <span className="text-sm text-muted-foreground">
              ({reviewCount})
            </span>
          </div>
        </div>
      </div>
      
      {/* Stats row */}
      <div className="flex items-center justify-between bg-muted rounded-xl p-3 mb-4">
        <div className="text-center flex-1">
          <p className="text-xs text-muted-foreground mb-1">שעת הגעה משוערת</p>
          <div className="flex items-center justify-center gap-1 text-sm font-semibold text-card-foreground">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <span>{arrivalTime} {"דק'"}</span>
          </div>
        </div>
        
        <div className="w-px h-8 bg-border" />
        
        <div className="text-center flex-1">
          <p className="text-xs text-muted-foreground mb-1">
            {available ? 'זמין היום' : 'זמין מחר'}
          </p>
          <p className={`text-sm font-semibold ${available ? 'text-accent' : 'text-orange-500'}`}>
            {available && <span className="inline-block w-2 h-2 rounded-full bg-accent ml-1" />}
            בין {availabilityTime}
          </p>
        </div>
        
        <div className="w-px h-8 bg-border" />
        
        <div className="text-center flex-1">
          <p className="text-xs text-muted-foreground mb-1">הצעת מחיר</p>
          <p className="text-sm font-bold text-card-foreground">
            {estimatedPrice}{"₪"}
          </p>
        </div>
      </div>
      
      {/* Action buttons */}
      <div className="flex gap-3">
        <Link
          href={`/chat/${id}`}
          className="flex-1 flex items-center justify-center gap-2 py-3 bg-card border border-border rounded-xl text-sm font-semibold text-card-foreground tap-highlight-none active:bg-muted transition-colors"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          {"צ'אט"}
        </Link>
        
        <Link
          href={`/book/${id}`}
          className="flex-1 flex items-center justify-center gap-2 py-3 bg-primary rounded-xl text-sm font-semibold text-primary-foreground shadow-button tap-highlight-none active:opacity-90 transition-opacity"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          בחר
        </Link>
      </div>
    </div>
  )
}
