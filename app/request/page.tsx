export default function RequestPage() {
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
          Request Service
        </h1>

        <p
          style={{
            color: '#6B7280',
            fontSize: '17px',
            margin: 0,
          }}
        >
          Describe your issue and send a request.
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
        <div style={{ marginBottom: '20px' }}>
          <label
            style={{
              display: 'block',
              marginBottom: '10px',
              fontWeight: 700,
            }}
          >
            Service Title
          </label>

          <input
            placeholder="Electricity issue"
            style={{
              width: '100%',
              padding: '18px',
              borderRadius: '18px',
              border: '1px solid #E5E7EB',
              boxSizing: 'border-box',
              fontSize: '16px',
            }}
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label
            style={{
              display: 'block',
              marginBottom: '10px',
              fontWeight: 700,
            }}
          >
            Description
          </label>

          <textarea
            placeholder="Describe the issue..."
            rows={5}
            style={{
              width: '100%',
              padding: '18px',
              borderRadius: '18px',
              border: '1px solid #E5E7EB',
              boxSizing: 'border-box',
              fontSize: '16px',
              resize: 'none',
            }}
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label
            style={{
              display: 'block',
              marginBottom: '10px',
              fontWeight: 700,
            }}
          >
            Address
          </label>

          <input
            placeholder="Tel Aviv, Dizengoff 12"
            style={{
              width: '100%',
              padding: '18px',
              borderRadius: '18px',
              border: '1px solid #E5E7EB',
              boxSizing: 'border-box',
              fontSize: '16px',
            }}
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label
            style={{
              display: 'block',
              marginBottom: '10px',
              fontWeight: 700,
            }}
          >
            Preferred Time
          </label>

          <input
            placeholder="Today evening"
            style={{
              width: '100%',
              padding: '18px',
              borderRadius: '18px',
              border: '1px solid #E5E7EB',
              boxSizing: 'border-box',
              fontSize: '16px',
            }}
          />
        </div>

        <div
          style={{
            border: '2px dashed #D1D5DB',
            borderRadius: '24px',
            padding: '32px',
            textAlign: 'center',
            color: '#6B7280',
            fontWeight: 600,
          }}
        >
          📷 Upload Images
        </div>
      </div>

      <div
        style={{
          position: 'fixed',
          bottom: '20px',
          left: '20px',
          right: '20px',
          background: 'white',
          padding: '16px',
          borderRadius: '28px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
        }}
      >
        <button
          style={{
            width: '100%',
            border: 'none',
            background: '#005BFF',
            color: 'white',
            padding: '18px',
            borderRadius: '18px',
            fontSize: '17px',
            fontWeight: 700,
          }}
        >
          Send Request
        </button>
      </div>
    </main>
  )
}
