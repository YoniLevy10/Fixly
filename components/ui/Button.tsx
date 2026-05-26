type ButtonProps = {
  children: React.ReactNode
  variant?: 'primary' | 'secondary' | 'success'
}

export default function Button({
  children,
  variant = 'primary',
}: ButtonProps) {
  const backgrounds = {
    primary: '#005BFF',
    secondary: '#F3F4F6',
    success: '#25D366',
  }

  const colors = {
    primary: 'white',
    secondary: '#111827',
    success: 'white',
  }

  return (
    <button
      style={{
        width: '100%',
        border: 'none',
        background: backgrounds[variant],
        color: colors[variant],
        padding: '18px',
        borderRadius: '18px',
        fontWeight: 700,
        fontSize: '16px',
      }}
    >
      {children}
    </button>
  )
}
