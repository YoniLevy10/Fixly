import type { ReactNode } from 'react'

import MarketplaceSection from '@/components/layout/MarketplaceSection'

type DashboardShellProps = {
  children: ReactNode
}

export default function DashboardShell({
  children,
}: DashboardShellProps) {
  return (
    <div>
      <div
        style={{
          marginBottom: '34px',
        }}
      >
        <div
          style={{
            fontSize: '38px',
            fontWeight: 900,
            letterSpacing: '-0.06em',
            marginBottom: '10px',
          }}
        >
          Dashboard
        </div>

        <div
          style={{
            color: '#6B7280',
            fontSize: '16px',
            lineHeight: 1.7,
          }}
        >
          Manage active marketplace requests and customer activity.
        </div>
      </div>

      <MarketplaceSection title="Overview">
        {children}
      </MarketplaceSection>
    </div>
  )
}
