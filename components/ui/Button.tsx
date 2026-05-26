type ButtonProps = {
  children: React.ReactNode
  variant?: 'primary' | 'secondary' | 'success' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  fullWidth?: boolean
  disabled?: boolean
}

export default function Button({
  children,
  variant = 'primary',
  size = 'lg',
  fullWidth = true,
  disabled = false,
}: ButtonProps) {
  const backgrounds = {
    primary: '#005BFF',
    secondary: '#F3F4F6',
    success: '#25D366',
    ghost: 'transparent',
    danger: '#FEE2E2',
  }

  const colors = {
    primary: 'white',
    secondary: '#111827',
    success: 'white',
    ghost: '#005BFF',
    danger: '#991B1B',
  }

  const paddings = {
    sm: '12px 14px',
    md: '15px 16px',
    lg: '18px',
  }

  return (
    <button
      disabled={disabled}
      style={{
        width: fullWidth ? '100%' : 'auto',
        minHeight: size === 'sm' ? '44px' : '52px',
        border: 'none',
        background: disabled ? '#E5E7EB' : backgrounds[variant],
        color: disabled ? '#9CA3AF' : colors[variant],
        padding: paddings[size],
        borderRadius: size === 'sm' ? '14px' : '18px',
        fontWeight: 800,
        fontSize: size === 'sm' ? '14px' : '16px',
        letterSpacing: '-0.01em',
        cursor: disabled ? 'not-allowed' : 'pointer',
        boxShadow:
          variant === 'primary' && !disabled
            ? '0 12px 24px rgba(0,91,255,0.22)'
            : 'none',
        transition: 'transform 160ms ease, box-shadow 160ms ease, opacity 160ms ease',
      }}
    >
      {children}
    </button>
  )
}
