import Button from '../ui/Button'

type StickyCTAProps = {
  label: string
}

export default function StickyCTA({
  label,
}: StickyCTAProps) {
  return (
    <div
      style={{
        position: 'fixed',
        bottom: '18px',
        left: '20px',
        right: '20px',
        background: 'rgba(255,255,255,0.9)',
        backdropFilter: 'blur(24px)',
        borderRadius: '28px',
        padding: '14px',
        boxShadow: '0 14px 34px rgba(0,0,0,0.08)',
      }}
    >
      <Button>
        {label}
      </Button>
    </div>
  )
}
