type TrackingSummaryCardProps = {
  professional: string
  eta: string
}

export default function TrackingSummaryCard({
  professional,
  eta,
}: TrackingSummaryCardProps) {
  return (
    <div
      style={{
        background: 'white',
        borderRadius: '32px',
        padding: '28px',
        boxShadow: '0 12px 32px rgba(0,0,0,0.05)',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '22px',
        }}
      >
        <div>
          <div
            style={{
              color: '#6B7280',
              marginBottom: '8px',
            }}
          >
            Assigned Professional
          </div>

          <div
            style={{
              fontSize: '22px',
              fontWeight: 800,
              letterSpacing: '-0.04em',
            }}
          >
            {professional}
          </div>
        </div>

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
      </div>

      <div
        style={{
          background: '#F9FAFB',
          borderRadius: '24px',
          padding: '18px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div>
          <div
            style={{
              color: '#6B7280',
              marginBottom: '6px',
            }}
          >
            Estimated Arrival
          </div>

          <div
            style={{
              fontWeight: 800,
              fontSize: '18px',
            }}
          >
            {eta}
          </div>
        </div>

        <div
          style={{
            color: '#16A34A',
            fontWeight: 800,
          }}
        >
          Live
        </div>
      </div>
    </div>
  )
}
