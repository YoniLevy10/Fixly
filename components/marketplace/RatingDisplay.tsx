type RatingDisplayProps = {
  rating: number
  reviews?: number
}

export default function RatingDisplay({
  rating,
  reviews,
}: RatingDisplayProps) {
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '10px',
        background: '#FFF7ED',
        padding: '12px 16px',
        borderRadius: '999px',
      }}
    >
      <div
        style={{
          color: '#F59E0B',
          fontSize: '16px',
        }}
      >
        ★★★★★
      </div>

      <div
        style={{
          fontWeight: 800,
          fontSize: '15px',
          letterSpacing: '-0.02em',
        }}
      >
        {rating}
      </div>

      {reviews && (
        <div
          style={{
            color: '#9CA3AF',
            fontSize: '14px',
          }}
        >
          ({reviews} reviews)
        </div>
      )}
    </div>
  )
}
