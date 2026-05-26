export const designTokens = {
  colors: {
    background: '#F5F7FB',
    surface: '#FFFFFF',
    primary: '#005BFF',
    text: '#111827',
    muted: '#6B7280',
    subtle: '#9CA3AF',
    border: '#E5E7EB',
    success: '#15803D',
    warning: '#C2410C',
    danger: '#B91C1C',
  },
  spacing: {
    page: '24px',
    section: '28px',
    card: '20px',
    gap: '16px',
    bottomNavOffset: '120px',
  },
  radius: {
    sm: '14px',
    md: '18px',
    lg: '24px',
    xl: '28px',
    full: '999px',
  },
  shadow: {
    card: '0 10px 30px rgba(0,0,0,0.05)',
    nav: '0 10px 30px rgba(0,0,0,0.08)',
    primary: '0 12px 24px rgba(0,91,255,0.22)',
  },
} as const
