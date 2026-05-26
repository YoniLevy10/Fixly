type CategoryChipsProps = {
  items: string[]
  active?: string
}

export default function CategoryChips({
  items,
  active,
}: CategoryChipsProps) {
  return (
    <div
      style={{
        display: 'flex',
        gap: '12px',
        overflowX: 'auto',
        paddingBottom: '6px',
      }}
    >
      {items.map((item) => (
        <div
          key={item}
          style={{
            background: active === item ? '#005BFF' : 'white',
            color: active === item ? 'white' : '#111827',
            padding: '13px 18px',
            borderRadius: '999px',
            fontWeight: 800,
            fontSize: '14px',
            whiteSpace: 'nowrap',
            boxShadow:
              active === item
                ? '0 10px 24px rgba(0,91,255,0.22)'
                : '0 8px 22px rgba(0,0,0,0.04)',
          }}
        >
          {item}
        </div>
      ))}
    </div>
  )
}
