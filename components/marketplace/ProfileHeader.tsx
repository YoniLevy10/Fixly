interface ProfileHeaderProps {
  name: string
  category: string
  rating: number
}

export default function ProfileHeader({ name, category, rating }: ProfileHeaderProps) {
  return (
    <div style={{ marginBottom: '24px' }}>
      <h1 style={{ fontSize: '32px', marginBottom: '8px' }}>{name}</h1>
      <div style={{ color: '#6B7280' }}>{category}</div>
      <div style={{ marginTop: '8px' }}>⭐ {rating}</div>
    </div>
  )
}
