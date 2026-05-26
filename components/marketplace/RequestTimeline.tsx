const timeline = [
  {
    title: 'Request Submitted',
    active: true,
  },
  {
    title: 'Professional Accepted',
    active: true,
  },
  {
    title: 'On The Way',
    active: false,
  },
  {
    title: 'Service Completed',
    active: false,
  },
]

export default function RequestTimeline() {
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
          fontSize: '24px',
          fontWeight: 800,
          marginBottom: '28px',
          letterSpacing: '-0.04em',
        }}
      >
        Request Timeline
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
        }}
      >
        {timeline.map((item, index) => (
          <div
            key={item.title}
            style={{
              display: 'flex',
              gap: '16px',
            }}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              }}
            >
              <div
                style={{
                  width: '18px',
                  height: '18px',
                  borderRadius: '999px',
                  background: item.active
                    ? '#005BFF'
                    : '#E5E7EB',
                }}
              />

              {index !== timeline.length - 1 && (
                <div
                  style={{
                    width: '2px',
                    flex: 1,
                    background: item.active
                      ? '#BFDBFE'
                      : '#E5E7EB',
                    marginTop: '8px',
                  }}
                />
              )}
            </div>

            <div>
              <div
                style={{
                  fontWeight: 700,
                  marginBottom: '4px',
                }}
              >
                {item.title}
              </div>

              <div
                style={{
                  color: '#9CA3AF',
                  fontSize: '14px',
                }}
              >
                Updated recently
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
