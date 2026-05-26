import Link from 'next/link'

type ProfessionalCardProps = {
  id: string
  name: string
  category: string
  rating: number
  reviewCount: number
  available?: boolean
  avatar?: string
}

export default function ProfessionalCard({
  id,
  name,
  category,
  rating,
  reviewCount,
  available = true,
  avatar,
}: ProfessionalCardProps) {
  return (
    <Link
      href={`/professional/${id}`}
      className="flex flex-col items-center bg-card rounded-2xl p-4 shadow-card min-w-[140px] tap-highlight-none active:scale-[0.98] transition-transform"
    >
      <div className="relative mb-3">
        <div className="w-16 h-16 rounded-full bg-secondary overflow-hidden flex items-center justify-center">
          {avatar ? (
            <img src={avatar} alt={name} className="w-full h-full object-cover" />
          ) : (
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="rgb(var(--muted-foreground))" strokeWidth="1.5">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          )}
        </div>
        {available && (
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-accent text-accent-foreground text-[9px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap">
            זמין עכשיו
          </div>
        )}
      </div>
      
      <h3 className="text-sm font-bold text-card-foreground text-center mb-0.5">
        {name}
      </h3>
      
      <p className="text-xs text-muted-foreground text-center mb-2">
        {category}
      </p>
      
      <div className="flex items-center gap-1">
        <div className="flex">
          {[1, 2, 3, 4, 5].map((star) => (
            <svg
              key={star}
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill={star <= Math.round(rating) ? '#F59E0B' : '#E5E7EB'}
            >
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          ))}
        </div>
        <span className="text-xs font-semibold text-card-foreground">
          {rating}
        </span>
        <span className="text-xs text-muted-foreground">
          ({reviewCount})
        </span>
      </div>
    </Link>
  )
}
