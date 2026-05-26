type CardProps = {
  children: React.ReactNode
}

export function Card({ children }: CardProps) {
  return (
    <div
      style={{
        background: 'white',
        borderRadius: 18,
        padding: 16,
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
      }}
    >
      {children}
    </div>
  )
}
