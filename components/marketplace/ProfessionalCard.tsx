import Button from '../ui/Button'

type ProfessionalCardProps = {
  name: string
  category: string
  rating: number
  jobsCompleted: number
  available?: boolean
}

export default function ProfessionalCard({
  name,
  category,
  rating,
  jobsCompleted,
  available = true,
}: ProfessionalCardProps) {
  return (
    <div
      style={{
        background: 'white',
        borderRadius: '32px',
        padding: '22px',
        boxShadow: '0 12px 32px rgba(0,0,0,0.05)',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '18px',
        }}
      >
        <div
          style={{
            display: 'flex',
            gap: '14px',
          }}
        >
          <div
            style={{
              width: '68px',
              height: '68px',
              borderRadius: '24px',
              background: '#EEF4FF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '28px',
            }}
          >
            👨‍🔧
          </div>

          <div>
            <div
              style={{
                fontSize: '20px',
                fontWeight: 800,
                marginBottom: '6px',
                letterSpacing: '-0.03em',
              }}
            >
              {name}
            </div>

            <div
              style={{
                color: '#6B7280',
                marginBottom: '8px',
              }}
            >
              {category}
            </div>

            <div
              style={{
                color: '#9CA3AF',
                fontSize: '14px',
              }}
            >
              {jobsCompleted} jobs completed
            </div>
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            gap: '10px',
          }}
        >
          <div
            style={{
              background: '#EEF4FF',
              color: '#005BFF',
              padding: '10px 14px',
              borderRadius: '999px',
              fontWeight: 800,
              fontSize: '14px',
            }}
          >
            ⭐ {rating}
          </div>

          <div
            style={{
              background: available ? '#DCFCE7' : '#F3F4F6',
              color: available ? '#166534' : '#6B7280',
              padding: '8px 12px',
              borderRadius: '999px',
              fontWeight: 700,
              fontSize: '12px',
            }}
          >
            {available ? 'Available' : 'Busy'}
          </div>
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          gap: '12px',
        }}
      >
        <div style={{ flex: 1 }}>
          <Button variant="secondary">
            Profile
          </Button>
        </div>

        <div style={{ flex: 1 }}>
          <Button>
            Book Now
          </Button>
        </div>
      </div>
    </div>
  )
}
