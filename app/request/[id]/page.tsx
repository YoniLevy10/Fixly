import Card from '@/components/ui/Card'
import StatusBadge from '@/components/StatusBadge'
import { requests } from '@/lib/mock-data'

export default async function RequestPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const request = requests.find((item) => item.id === id) || requests[0]

  const timeline = [
    'Request submitted',
    'Professional accepted the request',
    'Professional is on the way',
    'Service in progress',
    'Request completed',
  ]

  return (
    <main
      style={{
        padding: '24px',
        paddingBottom: '120px',
      }}
    >
      <div style={{ marginBottom: '24px' }}>
        <div style={{ color: '#6B7280', marginBottom: '10px' }}>
          Request Tracking
        </div>

        <h1
          style={{
            fontSize: '32px',
            margin: 0,
            marginBottom: '16px',
          }}
        >
          {request.title}
        </h1>

        <StatusBadge status={request.status} />
      </div>

      <Card>
        <div
          style={{
            fontWeight: 700,
            fontSize: '20px',
            marginBottom: '18px',
          }}
        >
          Timeline
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '18px',
          }}
        >
          {timeline.map((step, index) => (
            <div
              key={step}
              style={{
                display: 'flex',
                gap: '14px',
                alignItems: 'center',
              }}
            >
              <div
                style={{
                  width: '14px',
                  height: '14px',
                  borderRadius: '999px',
                  background: index <= 2 ? '#005BFF' : '#D1D5DB',
                }}
              />

              <div>{step}</div>
            </div>
          ))}
        </div>
      </Card>

      <div style={{ height: '18px' }} />

      <Card>
        <div
          style={{
            fontWeight: 700,
            fontSize: '20px',
            marginBottom: '12px',
          }}
        >
          Professional Details
        </div>

        <div style={{ color: '#6B7280' }}>
          Assigned professional is currently handling your request.
        </div>
      </Card>
    </main>
  )
}
