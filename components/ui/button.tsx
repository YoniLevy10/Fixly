type ButtonProps = {
  children: React.ReactNode
}

export function Button({ children }: ButtonProps) {
  return (
    <button
      style={{
        background: '#2563eb',
        color: 'white',
        border: 'none',
        borderRadius: 12,
        padding: '14px 18px',
        fontWeight: 600,
      }}
    >
      {children}
    </button>
  )
}
