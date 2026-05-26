const timeline = [
  {
    title: 'Request Sent',
    status: 'completed',
  },
  {
    title: 'Professional Accepted',
    status: 'completed',
  },
  {
    title: 'On The Way',
    status: 'active',
  },
  {
    title: 'Service Completed',
    status: 'pending',
  },
]

export default function TrackingPage() {
  return (
    <main
      style={{
        minHeight: '100vh',
        background: '#f5f7fb',
        padding: '24px',
        paddingBottom: '120px',
      }}
    >
      <div style={{ marginBottom: '28px' }}>
        <h1
          style={{
            fontSize: '34px',
            marginTop: 0,
            marginBottom: '8px',
          }}
        >
          Track Request
        </h1>

        <p
          style={{
            color: '#6B7280',
            fontSize: '17px',
            margin: 0,
          }}
        >
          Your professional is on the way.
        </p>
      </div>

      <div
        style={{
          background: 'white',
          borderRadius: '32px',
          padding: '24px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
          marginBottom: '24px',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px',
          }}
        >
          <div>
            <div
              style={{
                fontWeight: 700,
                fontSize: '20px',
                marginBottom: '6px',
              }}
            >
              Daniel Electric
            </div>

            <div
              style={{
                color: '#6B7280',
              }}
            >
              Electrician
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
            ⭐ 4.9
          </div>
        </div>

        <div
          style={{
            background: '#F9FAFB',
            borderRadius: '24px',
            padding: '20px',
          }}
        >
          <div
            style={{
              fontWeight: 700,
              marginBottom: '8px',
            }}
          >
            ETA
          </div>

          <div
            style={{
              fontSize: '32px',
              fontWeight: 700,
              color: '#005BFF',
            }}
          >
            18 min
          </div>
        </div>
      </div>

      <div
        style={{
          background: 'white',
          borderRadius: '32px',
          padding: '24px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
          marginBottom: '24px',
        }}
      >
        <h2
          style={{
            marginTop: 0,
            marginBottom: '24px',
            fontSize: '24px',
          }}
        >
          Request Status
        </h2>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
          }}
        >
          {timeline.map((item) => (
            <div
              key={item.title}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
              }}
            >
              <div
                style={{
                  width: '18px',
                  height: '18px',
                  borderRadius: '999px',
                  background:
                    item.status === 'completed'
                      ? '#005BFF'
                      : item.status === 'active'
                      ? '#60A5FA'
                      : '#D1D5DB',
                }}
              />

              <div
                style={{
                  fontWeight: item.status === 'active' ? 700 : 500,
                  color:
                    item.status === 'pending' ? '#9CA3AF' : '#111827',
                }}
              >
                {item.title}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div
        style={{
          position: 'fixed',
          bottom: '20px',
          left: '20px',
          right: '20px',
          display: 'flex',
          gap: '14px',
        }}
      >
        <button
          style={{
            flex: 1,
            border: 'none',
            background: 'white',
            color: '#111827',
            padding: '18px',
            borderRadius: '18px',
            fontWeight: 700,
            boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
          }}
        >
          📞 Call
        </button>

        <button
          style={{
            flex: 2,
            border: 'none',
            background: '#25D366',
            color: 'white',
            padding: '18px',
            borderRadius: '18px',
            fontWeight: 700,
            fontSize: '16px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
          }}
        >
          WhatsApp
        </button>
      </div>
    </main>
  )
}
