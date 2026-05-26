import type { ReactNode } from 'react'

import BottomNav from '@/components/BottomNav'
import MobileContainer from '@/components/ui/MobileContainer'

type MarketplaceScreenProps = {
  children: ReactNode
  withNavigation?: boolean
}

export default function MarketplaceScreen({
  children,
  withNavigation = true,
}: MarketplaceScreenProps) {
  return (
    <MobileContainer>
      {children}

      {withNavigation && <BottomNav />}
    </MobileContainer>
  )
}
