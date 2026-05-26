export default function SectionHeader({
  eyebrow,
  title,
}: {
  eyebrow?: string
  title: string
}) {
  return (
    <div style={{ marginBottom: '28px' }}>
      {eyebrow && (
        <div
          style={{
            color: '#6B7280',
            marginBottom: '10px',
            fontSize: '14px',
            fontWeight: 600,
          }}
        >
          {eyebrow}
        </div>
      )}

      <h1
        style={{
          fontSize: '34px',
          margin: 0,
          lineHeight: 1.1,
        }}
      >
        {title}
      </h1>
    </div>
  )
}
