import Button from '../ui/Button'

export default function DashboardEmptyState() {
  return (
    <div
      style={{
        background: 'white',
        borderRadius: '36px',
        padding: '44px 28px',
        textAlign: 'center',
        boxShadow: '0 12px 32px rgba(0,0,0,0.05)',
      }}
    >
      <div
        style={{
          width: '94px',
          height: '94px',
          borderRadius: '30px',
          background: '#EEF4FF',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '44px',
          margin: '0 auto 24px',
        }}
      >
        📭
      </div>

      <h2
        style={{
          margin: 0,
          marginBottom: '12px',
          fontSize: '30px',
          fontWeight: 900,
          letterSpacing: '-0.05em',
        }}
      >
        No Active Requests
      </h2>

      <p
        style={{
          color: '#6B7280',
          lineHeight: 1.7,
          fontSize: '16px',
          marginBottom: '28px',
        }}
      >
        New marketplace requests will appear here once customers start booking services.
      </p>

      <Button>
        Refresh Dashboard
      </Button>
    </div>
  )
}
