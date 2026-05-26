type CategoryCardProps = {
  icon: string
  title: string
}

export default function CategoryCard({
  icon,
  title,
}: CategoryCardProps) {
  return (
    <div
      style={{
        background: 'white',
        borderRadius: '30px',
        padding: '24px 20px',
        boxShadow: '0 10px 28px rgba(0,0,0,0.05)',
      }}
    >
      <div
        style={{
          width: '62px',
          height: '62px',
          borderRadius: '22px',
          background: '#EEF4FF',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '30px',
          marginBottom: '16px',
        }}
      >
        {icon}
      </div>

      <div
        style={{
          fontWeight: 800,
          fontSize: '17px',
          letterSpacing: '-0.02em',
        }}
      >
        {title}
      </div>
    </div>
  )
}
