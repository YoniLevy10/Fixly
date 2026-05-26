export default function PageContainer({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <main
      style={{
        padding: '24px',
        paddingBottom: '120px',
        minHeight: '100vh',
        background: '#f5f7fb',
      }}
    >
      {children}
    </main>
  )
}
