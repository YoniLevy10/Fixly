import type { ReactNode } from 'react'

type AppShellProps = {
  children: ReactNode
  navigation?: ReactNode
  header?: ReactNode
}

export default function AppShell({
  children,
  navigation,
  header,
}: AppShellProps) {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#F5F7FB',
        color: '#111827',
      }}
    >
      {header}

      <div
        style={{
          width: '100%',
          maxWidth: '520px',
          margin: '0 auto',
          padding: '24px',
          paddingTop: 'max(24px, env(safe-area-inset-top))',
          paddingBottom: navigation
            ? 'max(120px, env(safe-area-inset-bottom))'
            : 'max(32px, env(safe-area-inset-bottom))',
          boxSizing: 'border-box',
        }}
      >
        {children}
      </div>

      {navigation}
    </div>
  )
}
