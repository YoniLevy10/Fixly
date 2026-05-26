type BadgeProps = {
  label: string
}

export function Badge({ label }: BadgeProps) {
  return (
    <span
      style={{
        background: '#dbeafe',
        color: '#1d4ed8',
        padding: '6px 10px',
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 600,
      }}
    >
      {label}
    </span>
  )
}
