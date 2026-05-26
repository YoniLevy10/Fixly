type StatusBadgeProps = {
  status: 'pending' | 'active' | 'completed'
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const backgrounds = {
    pending: '#F3F4F6',
    active: '#EEF4FF',
    completed: '#DCFCE7',
  }

  const colors = {
    pending: '#6B7280',
    active: '#005BFF',
    completed: '#166534',
  }

  return (
    <div
      style={{
        display: 'inline-flex',
        padding: '10px 14px',
        borderRadius: '999px',
        background: backgrounds[status],
        color: colors[status],
        fontWeight: 700,
        fontSize: '14px',
      }}
    >
      {status}
    </div>
  )
}
