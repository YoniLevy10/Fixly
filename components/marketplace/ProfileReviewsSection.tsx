import ReviewCard from '@/components/marketplace/ReviewCard'

const reviews = [
  {
    name: 'Sarah M.',
    review:
      'Very professional and arrived quickly. Highly recommended service.',
  },
  {
    name: 'David K.',
    review:
      'Solved the issue fast and explained everything clearly.',
  },
]

export default function ProfileReviewsSection() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '18px',
      }}
    >
      <div
        style={{
          fontSize: '24px',
          fontWeight: 800,
          letterSpacing: '-0.04em',
        }}
      >
        Customer Reviews
      </div>

      {reviews.map((review) => (
        <ReviewCard
          key={review.name}
          name={review.name}
          review={review.review}
        />
      ))}
    </div>
  )
}
