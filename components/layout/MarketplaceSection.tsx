import type { ReactNode } from 'react'

import SectionHeader from '@/components/ui/SectionHeader'

type MarketplaceSectionProps = {
  title: string
  action?: string
  children: ReactNode
}

export default function MarketplaceSection({
  title,
  action,
  children,
}: MarketplaceSectionProps) {
  return (
    <section
      style={{
        marginBottom: '40px',
      }}
    >
      <SectionHeader
        title={title}
        action={action}
      />

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '18px',
        }}
      >
        {children}
      </div>
    </section>
  )
}
