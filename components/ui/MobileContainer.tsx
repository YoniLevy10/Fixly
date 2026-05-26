type MobileContainerProps = {
  children: React.ReactNode
}

export default function MobileContainer({
  children,
}: MobileContainerProps) {
  return (
    <main
      style={{
        minHeight: '100vh',
        background: '#F5F7FB',
        padding: '24px',
        paddingTop: 'max(24px, env(safe-area-inset-top))',
        paddingBottom: 'max(120px, env(safe-area-inset-bottom))',
        boxSizing: 'border-box',
      }}
    >
      {children}
    </main>
  )
}
