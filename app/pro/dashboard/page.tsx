import BottomNav from '@/components/BottomNav'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { requests } from '@/lib/mock-data'

export default function ProfessionalDashboardPage() {
  const activeRequests = requests.filter(
    (request) => request.status !== 'completed'
  )

  return (
    <main
      style={{
        padding: '24px',
        paddingBottom: '120px',
      }}
    >
      <div style={{ marginBottom: '28px' }}>
        <div
          style={{
            color: '#6B7280',
            marginBottom: '10px',
          }}
        >
          Professional Dashboard
        </div>

        <h1
          style={{
            fontSize: '34px',
            margin: 0,
          }}
        >
          Welcome back 👋
        </h1>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '16px',
          marginBottom: '24px',
        }}
      >
        <Card>
          <div style={{ fontSize: '14px', color: '#6B7280' }}>
            Active Jobs
          </div>
          <div style={{ fontSize: '34px', fontWeight: 800 }}>
            {activeRequests.length}
          </div>
        </Card>

        <Card>
          <div style={{ fontSize: '14px', color: '#6B7280' }}>
            Rating
          </div>
          <div style={{ fontSize: '34px', fontWeight: 800 }}>
            4.9
          </div>
        </Card>
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        {activeRequests.map((request) => (
          <Card key={request.id}>
            <div style={{ marginBottom: '16px' }}>
              <div
                style={{
                  fontWeight: 700,
                  fontSize: '20px',
                  marginBottom: '6px',
                }}
              >
                {request.title}
              </div>

              <div style={{ color: '#6B7280', marginBottom: '10px' }}>
                {request.address}
              </div>

              <div
                style={{
                  display: 'inline-flex',
                  padding: '10px 14px',
                  borderRadius: '999px',
                  background: '#EEF4FF',
                  color: '#005BFF',
                  fontWeight: 700,
                }}
              >
                {request.status}
              </div>
            </div>

            <Button>Manage Request</Button>
          </Card>
        ))}
      </div>

      <BottomNav />
    </main>
  )
}
