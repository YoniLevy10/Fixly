export const metadata = {
  title: 'Fixly',
  description: 'Wolt for Professionals',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          padding: 0,
          background: '#f5f7fb',
          fontFamily: '-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif',
        }}
      >
        {children}
      </body>
    </html>
  )
}
