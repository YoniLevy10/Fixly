import { colors } from '@/shared/design/colors'
import { spacing } from '@/shared/design/spacing'
import { typography } from '@/shared/design/typography'
import { radius } from '@/shared/design/radius'

export const designTokens = {
  colors,
  spacing,
  typography,
  radius,
  shadow: {
    card: '0 10px 30px rgba(0,0,0,0.05)',
    nav: '0 10px 30px rgba(0,0,0,0.08)',
    primary: '0 12px 24px rgba(0,91,255,0.22)',
  },
} as const

export type DesignTokens = typeof designTokens
