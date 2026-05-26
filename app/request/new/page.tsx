import BottomNav from '@/components/BottomNav'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'

export default function NewRequestPage() {
  return (
    <main
      style={{
        padding: '24px',
        paddingBottom: '120px',
      }}
    >
      <div style={{ marginBottom: '28px' }}>
        <div style={{ color: '#6B7280', marginBottom: '10px' }}>
          New Request
        </div>

        <h1
          style={{
            fontSize: '34px',
            margin: 0,
          }}
        >
          Request a Service
        </h1>
      </div>

      <Card>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
        >
          <textarea
            placeholder="Describe your issue"
            style={{
              minHeight: '120px',
              border: 'none',
              background: '#F9FAFB',
              borderRadius: '20px',
              padding: '18px',
              resize: 'none',
              fontSize: '16px',
            }}
          />

          <input
            placeholder="Address"
            style={{
              border: 'none',
              background: '#F9FAFB',
              borderRadius: '20px',
              padding: '18px',
              fontSize: '16px',
            }}
          />

          <select
            style={{
              border: 'none',
              background: '#F9FAFB',
              borderRadius: '20px',
              padding: '18px',
              fontSize: '16px',
            }}
          >
            <option>Normal Priority</option>
            <option>Urgent</option>
          </select>

          <Button>Submit Request</Button>
        </div>
      </Card>

      <BottomNav />
    </main>
  )
}
