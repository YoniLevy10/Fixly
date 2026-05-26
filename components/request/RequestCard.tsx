import StatusBadge from '@/components/StatusBadge'
import Card from '@/components/ui/Card'
import { ServiceRequest } from '@/types'

export default function RequestCard({
  request,
}: {
  request: ServiceRequest
}) {
  return (
    <Card>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: '16px',
          marginBottom: '14px',
        }}
      >
        <div>
          <div
            style={{
              fontWeight: 800,
              fontSize: '20px',
              marginBottom: '6px',
            }}
          >
            {request.title}
          </div>

          <div
            style={{
              color: '#6B7280',
              marginBottom: '6px',
            }}
          >
            {request.address}
          </div>
        </div>

        <StatusBadge status={request.status} />
      </div>

      <div
        style={{
          color: '#9CA3AF',
          fontSize: '14px',
        }}
      >
        {request.description}
      </div>
    </Card>
  )
}
