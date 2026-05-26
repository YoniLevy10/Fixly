import BottomNav from '@/components/BottomNav'
import Card from '@/components/ui/Card'
import { professionals, requests } from '@/lib/mock-data'

export default function AdminPage() {
  return (
    <main
      style={{
        padding: '24px',
        paddingBottom: '120px',
      }}
    >
      <div style={{ marginBottom: '28px' }}>
        <div style={{ color: '#6B7280', marginBottom: '10px' }}>
          Marketplace Admin
        </div>

        <h1
          style={{
            fontSize: '34px',
            margin: 0,
          }}
        >
          Operations Center
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
          <div style={{ color: '#6B7280', marginBottom: '8px' }}>
            Professionals
          </div>

          <div style={{ fontSize: '34px', fontWeight: 800 }}>
            {professionals.length}
          </div>
        </Card>

        <Card>
          <div style={{ color: '#6B7280', marginBottom: '8px' }}>
            Active Requests
          </div>

          <div style={{ fontSize: '34px', fontWeight: 800 }}>
            {requests.length}
          </div>
        </Card>
      </div>

      <Card>
        <div
          style={{
            fontWeight: 700,
            fontSize: '20px',
            marginBottom: '18px',
          }}
        >
          Marketplace Health
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          <div>✅ Operations Running</div>
          <div>✅ Requests Flow Active</div>
          <div>✅ Professionals Available</div>
        </div>
      </Card>

      <BottomNav />
    </main>
  )
}
