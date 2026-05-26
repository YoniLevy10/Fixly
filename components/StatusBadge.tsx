import { RequestStatus } from '@/types'

const statusConfig: Record<RequestStatus, { label: string; background: string; color: string }> = {
  pending: {
    label: 'Pending',
    background: '#FFF7ED',
    color: '#C2410C',
  },
  accepted: {
    label: 'Accepted',
    background: '#EEF4FF',
    color: '#005BFF',
  },
  on_the_way: {
    label: 'On the way',
    background: '#ECFDF5',
    color: '#047857',
  },
  in_progress: {
    label: 'In progress',
    background: '#F5F3FF',
    color: '#6D28D9',
  },
  completed: {
    label: 'Completed',
    background: '#F0FDF4',
    color: '#15803D',
  },
  cancelled: {
    label: 'Cancelled',
    background: '#FEF2F2',
    color: '#B91C1C',
  },
}

export default function StatusBadge({ status }: { status: RequestStatus }) {
  const config = statusConfig[status]

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        borderRadius: '999px',
        padding: '10px 14px',
        background: config.background,
        color: config.color,
        fontWeight: 800,
        fontSize: '14px',
      }}
    >
      {config.label}
    </span>
  )
}
