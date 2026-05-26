type ProfileAboutProps = {
  description: string
}

export default function ProfileAbout({
  description,
}: ProfileAboutProps) {
  return (
    <div
      style={{
        background: 'white',
        borderRadius: '32px',
        padding: '28px',
        boxShadow: '0 12px 30px rgba(0,0,0,0.05)',
      }}
    >
      <div
        style={{
          fontSize: '24px',
          fontWeight: 800,
          marginBottom: '18px',
          letterSpacing: '-0.04em',
        }}
      >
        About
      </div>

      <div
        style={{
          color: '#6B7280',
          lineHeight: 1.9,
          fontSize: '16px',
        }}
      >
        {description}
      </div>
    </div>
  )
}
