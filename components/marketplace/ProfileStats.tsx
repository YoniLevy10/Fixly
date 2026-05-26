type ProfileStatsProps = {
  completedJobs: number
  rating: number
  years: number
}

export default function ProfileStats({
  completedJobs,
  rating,
  years,
}: ProfileStatsProps) {
  const items = [
    {
      label: 'Jobs',
      value: completedJobs,
    },
    {
      label: 'Rating',
      value: rating,
    },
    {
      label: 'Years',
      value: years,
    },
  ]

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr 1fr',
        gap: '14px',
      }}
    >
      {items.map((item) => (
        <div
          key={item.label}
          style={{
            background: 'white',
            borderRadius: '26px',
            padding: '24px 16px',
            textAlign: 'center',
            boxShadow: '0 10px 28px rgba(0,0,0,0.05)',
          }}
        >
          <div
            style={{
              fontSize: '28px',
              fontWeight: 900,
              letterSpacing: '-0.05em',
              marginBottom: '8px',
            }}
          >
            {item.value}
          </div>

          <div
            style={{
              color: '#6B7280',
              fontWeight: 600,
              fontSize: '14px',
            }}
          >
            {item.label}
          </div>
        </div>
      ))}
    </div>
  )
}
