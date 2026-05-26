import BottomNav from '@/components/BottomNav'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import { professionals } from '@/lib/mock-data'

export default function ProfessionalsPage() {
  return (
    <main
      style={{
        minHeight: '100vh',
        background: '#f5f7fb',
        padding: '24px',
        paddingBottom: '120px',
      }}
    >
      <div style={{ marginBottom: '28px' }}>
        <h1
          style={{
            fontSize: '36px',
            marginTop: 0,
            marginBottom: '8px',
          }}
        >
          Professionals
        </h1>

        <p
          style={{
            color: '#6B7280',
            fontSize: '17px',
            margin: 0,
          }}
        >
          Browse trusted professionals near you.
        </p>
      </div>

      <input
        placeholder="Search professionals..."
        style={{
          width: '100%',
          padding: '18px',
          borderRadius: '20px',
          border: 'none',
          fontSize: '16px',
          boxSizing: 'border-box',
          marginBottom: '28px',
          boxShadow: '0 6px 18px rgba(0,0,0,0.06)',
        }}
      />

      <div
        style={{
          display: 'flex',
          gap: '12px',
          overflowX: 'auto',
          marginBottom: '28px',
        }}
      >
        {['All', 'Electrician', 'Cleaning', 'Plumber'].map((filter) => (
          <div
            key={filter}
            style={{
              background: filter === 'All' ? '#005BFF' : 'white',
              color: filter === 'All' ? 'white' : '#111827',
              padding: '12px 18px',
              borderRadius: '999px',
              fontWeight: 700,
              whiteSpace: 'nowrap',
            }}
          >
            {filter}
          </div>
        ))}
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '18px',
        }}
      >
        {professionals.map((professional) => (
          <Card key={professional.id}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '18px',
              }}
            >
              <div>
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: '20px',
                    marginBottom: '8px',
                  }}
                >
                  {professional.name}
                </div>

                <div
                  style={{
                    color: '#6B7280',
                    marginBottom: '8px',
                  }}
                >
                  {professional.category}
                </div>

                <div
                  style={{
                    color: '#9CA3AF',
                    fontSize: '14px',
                  }}
                >
                  {professional.jobsCompleted} jobs completed
                </div>
              </div>

              <div
                style={{
                  background: '#EEF4FF',
                  color: '#005BFF',
                  padding: '10px 14px',
                  borderRadius: '999px',
                  fontWeight: 700,
                }}
              >
                ⭐ {professional.rating}
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
                  View Profile
                </Button>
              </div>

              <div style={{ flex: 1 }}>
                <Button>
                  Book Now
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <BottomNav />
    </main>
  )
}
