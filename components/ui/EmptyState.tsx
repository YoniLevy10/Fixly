type EmptyStateProps = {
  title: string
  description: string
  icon?: string
}

export default function EmptyState({
  title,
  description,
  icon = '📭',
}: EmptyStateProps) {
  return (
    <div
      style={{
        background: 'white',
        borderRadius: '32px',
        padding: '42px 28px',
        textAlign: 'center',
        boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
      }}
    >
      <div
        style={{
          fontSize: '52px',
          marginBottom: '18px',
        }}
      >
        {icon}
      </div>

      <h3
        style={{
          margin: 0,
          fontSize: '24px',
          marginBottom: '10px',
        }}
      >
        {title}
      </h3>

      <p
        style={{
          color: '#6B7280',
          margin: 0,
          lineHeight: 1.7,
          fontSize: '16px',
        }}
      >
        {description}
      </p>
    </div>
  )
}
