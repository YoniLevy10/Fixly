type ReviewCardProps = {
  name: string
  review: string
}

export default function ReviewCard({
  name,
  review,
}: ReviewCardProps) {
  return (
    <div
      style={{
        background: '#F9FAFB',
        borderRadius: '26px',
        padding: '22px',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '14px',
        }}
      >
        <div
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '18px',
            background: '#EEF4FF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          👤
        </div>

        <div>
          <div
            style={{
              fontWeight: 800,
              marginBottom: '4px',
            }}
          >
            {name}
          </div>

          <div
            style={{
              color: '#F59E0B',
              fontSize: '14px',
            }}
          >
            ★★★★★
          </div>
        </div>
      </div>

      <div
        style={{
          color: '#6B7280',
          lineHeight: 1.7,
          fontSize: '15px',
        }}
      >
        {review}
      </div>
    </div>
  )
}
