type PageContainerProps = {
  children: React.ReactNode
}

export function PageContainer({ children }: PageContainerProps) {
  return (
    <div
      style={{
        maxWidth: 480,
        margin: '0 auto',
        padding: 16,
      }}
    >
      {children}
    </div>
  )
}
