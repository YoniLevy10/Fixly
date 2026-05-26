import Button from '@/components/ui/Button'

export default function MarketplaceBanner() {
  return (
    <div
      style={{
        background: '#111827',
        borderRadius: '36px',
        padding: '30px',
        color: 'white',
        boxShadow: '0 16px 40px rgba(17,24,39,0.22)',
      }}
    >
      <div
        style={{
          fontSize: '32px',
          fontWeight: 900,
          lineHeight: 1.05,
          letterSpacing: '-0.06em',
          marginBottom: '14px',
        }}
      >
        Need urgent help today?
      </div>

      <div
        style={{
          color: 'rgba(255,255,255,0.75)',
          lineHeight: 1.7,
          fontSize: '16px',
          marginBottom: '24px',
        }}
      >
        Get matched instantly with trusted professionals near your location.
      </div>

      <Button>
        Book Service Now
      </Button>
    </div>
  )
}
