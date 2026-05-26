import BottomNav from '@/components/BottomNav'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import { requests } from '@/lib/mock-data'

export default function ProRequestsPage() {
  return (
    <main
      style={{
        padding: '24px',
        paddingBottom: '120px',
      }}
    >
      <div style={{ marginBottom: '28px' }}>
        <div style={{ color: '#6B7280', marginBottom: '10px' }}>
          Operations
        </div>

        <h1
          style={{
            fontSize: '34px',
            margin: 0,
          }}
        >
          Incoming Requests
        </h1>
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        {requests.map((request) => (
          <Card key={request.id}>
            <div style={{ marginBottom: '18px' }}>
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
                {request.description}
              </div>

              <div style={{ color: '#9CA3AF' }}>
                Customer: {request.customerName}
              </div>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '12px',
              }}
            >
              <Button variant="secondary">Decline</Button>
              <Button>Accept</Button>
            </div>
          </Card>
        ))}
      </div>

      <BottomNav />
    </main>
  )
}
