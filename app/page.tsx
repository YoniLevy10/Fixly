import BottomNav from '@/components/BottomNav'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import { professionals } from '@/lib/mock-data'

const categories = [
  { name: 'Electrician', icon: '⚡' },
  { name: 'Plumber', icon: '🔧' },
  { name: 'Cleaning', icon: '✨' },
  { name: 'Locksmith', icon: '🔐' },
  { name: 'Painting', icon: '🎨' },
  { name: 'Appliance Repair', icon: '🛠️' },
]

export default function HomePage() {
  return (
    <main
      style={{
        padding: '24px',
        paddingBottom: '120px',
        minHeight: '100vh',
        background: '#f5f7fb',
      }}
    >
      <div style={{ marginBottom: '28px' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '12px',
          }}
        >
          <div>
            <h1
              style={{
                fontSize: '40px',
                fontWeight: 700,
                color: '#005BFF',
                marginBottom: '8px',
                marginTop: 0,
              }}
            >
              Fixly
            </h1>

            <p
              style={{
                color: '#6b7280',
                fontSize: '18px',
                margin: 0,
              }}
            >
              Book trusted professionals instantly
            </p>
          </div>

          <div
            style={{
              width: '54px',
              height: '54px',
              borderRadius: '999px',
              background: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '22px',
              boxShadow: '0 8px 20px rgba(0,0,0,0.06)',
            }}
          >
            👤
          </div>
        </div>
      </div>

      <input
        placeholder="Search services..."
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
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '16px',
          marginBottom: '36px',
        }}
      >
        {categories.map((category) => (
          <Card key={category.name}>
            <div
              style={{
                fontSize: '32px',
                marginBottom: '12px',
              }}
            >
              {category.icon}
            </div>

            <div
              style={{
                fontWeight: 600,
              }}
            >
              {category.name}
            </div>
          </Card>
        ))}
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '18px',
        }}
      >
        <h2
          style={{
            fontSize: '24px',
            margin: 0,
          }}
        >
          Top Professionals
        </h2>

        <button
          style={{
            border: 'none',
            background: 'transparent',
            color: '#005BFF',
            fontWeight: 700,
            fontSize: '15px',
          }}
        >
          See all
        </button>
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        {professionals.map((professional) => (
          <Card key={professional.id}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '16px',
              }}
            >
              <div>
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: '18px',
                    marginBottom: '6px',
                  }}
                >
                  {professional.name}
                </div>

                <div
                  style={{
                    color: '#6b7280',
                    marginBottom: '6px',
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

            <Button>Book Service</Button>
          </Card>
        ))}
      </div>

      <BottomNav />
    </main>
  )
}
