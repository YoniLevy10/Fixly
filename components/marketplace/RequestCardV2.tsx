import StatusBadge from '@/components/ui/StatusBadge'

type RequestCardV2Props = {
  title: string
  category: string
  status: 'pending' | 'active' | 'completed'
  address: string
}

export default function RequestCardV2({
  title,
  category,
  status,
  address,
}: RequestCardV2Props) {
  return (
    <div
      style={{
        background: 'white',
        borderRadius: '32px',
        padding: '24px',
        boxShadow: '0 12px 30px rgba(0,0,0,0.05)',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '20px',
        }}
      >
        <div>
          <div
            style={{
              fontSize: '20px',
              fontWeight: 800,
              marginBottom: '8px',
              letterSpacing: '-0.03em',
            }}
          >
            {title}
          </div>

          <div
            style={{
              color: '#6B7280',
              marginBottom: '6px',
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
            📍 {address}
          </div>
        </div>

        <StatusBadge status={status} />
      </div>

      <div
        style={{
          background: '#F9FAFB',
          borderRadius: '22px',
          padding: '16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div>
          <div
            style={{
              fontWeight: 700,
              marginBottom: '4px',
            }}
          >
            Professional Assigned
          </div>

          <div
            style={{
              color: '#6B7280',
              fontSize: '14px',
            }}
          >
            Daniel Electric
          </div>
        </div>

        <div
          style={{
            width: '52px',
            height: '52px',
            borderRadius: '18px',
            background: '#EEF4FF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '22px',
          }}
        >
          👨‍🔧
        </div>
      </div>
    </div>
  )
}
