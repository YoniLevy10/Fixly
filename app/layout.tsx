import './globals.css'

export const metadata = {
  title: 'Fixly | פיקסלי - אנשי מקצוע מומלצים',
  description: 'מצא את איש המקצוע המתאים במהירות ובקלות',
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#1a4b8c',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="he" dir="rtl" className="bg-background">
      <body className="font-sans antialiased text-foreground">
        {children}
      </body>
    </html>
  )
}
