type CardProps = {
  children: React.ReactNode
}

export default function Card({ children }: CardProps) {
  return (
    <div
      style={{
        background: 'white',
        borderRadius: '28px',
        padding: '24px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
      }}
    >
      {children}
    </div>
  )
}
