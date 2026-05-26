type MarketplaceHeroProps = {
  title: string
  subtitle: string
}

export default function MarketplaceHero({
  title,
  subtitle,
}: MarketplaceHeroProps) {
  return (
    <div
      style={{
        background: 'linear-gradient(135deg, #005BFF 0%, #3B82F6 100%)',
        borderRadius: '36px',
        padding: '34px 28px',
        color: 'white',
        marginBottom: '32px',
        boxShadow: '0 18px 42px rgba(0,91,255,0.22)',
      }}
    >
      <div
        style={{
          fontSize: '40px',
          fontWeight: 900,
          lineHeight: 1,
          letterSpacing: '-0.06em',
          marginBottom: '16px',
        }}
      >
        {title}
      </div>

      <div
        style={{
          fontSize: '17px',
          lineHeight: 1.7,
          opacity: 0.92,
          maxWidth: '90%',
        }}
      >
        {subtitle}
      </div>
    </div>
  )
}
