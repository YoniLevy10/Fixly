type SectionHeaderProps = {
  title: string
  action?: string
}

export default function SectionHeader({
  title,
  action,
}: SectionHeaderProps) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '18px',
      }}
    >
      <h2
        style={{
          margin: 0,
          fontSize: '24px',
          fontWeight: 800,
          letterSpacing: '-0.03em',
        }}
      >
        {title}
      </h2>

      {action && (
        <button
          style={{
            border: 'none',
            background: 'transparent',
            color: '#005BFF',
            fontWeight: 700,
            fontSize: '15px',
          }}
        >
          {action}
        </button>
      )}
    </div>
  )
}
