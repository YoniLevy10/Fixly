import Button from '../ui/Button'

export default function RequestSuccessState() {
  return (
    <div
      style={{
        background: 'white',
        borderRadius: '36px',
        padding: '42px 28px',
        textAlign: 'center',
        boxShadow: '0 12px 32px rgba(0,0,0,0.05)',
      }}
    >
      <div
        style={{
          width: '94px',
          height: '94px',
          borderRadius: '30px',
          background: '#DCFCE7',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '46px',
          margin: '0 auto 24px',
        }}
      >
        ✅
      </div>

      <h2
        style={{
          margin: 0,
          fontSize: '32px',
          fontWeight: 900,
          letterSpacing: '-0.05em',
          marginBottom: '14px',
        }}
      >
        Request Sent
      </h2>

      <p
        style={{
          color: '#6B7280',
          lineHeight: 1.7,
          fontSize: '16px',
          marginBottom: '28px',
        }}
      >
        Your request was sent successfully. A professional will contact you soon.
      </p>

      <Button>
        Track Request
      </Button>
    </div>
  )
}
