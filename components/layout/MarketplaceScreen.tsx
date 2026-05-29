import type { ReactNode } from 'react'

import MobileContainer from '@/components/ui/MobileContainer'

type MarketplaceScreenProps = {
  children: ReactNode
}

/** Navigation is provided by root `AppLayout` */
export default function MarketplaceScreen({ children }: MarketplaceScreenProps) {
  return <MobileContainer>{children}</MobileContainer>
}
