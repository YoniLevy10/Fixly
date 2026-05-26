import { designTokens } from '@/config/design-tokens'

export const composition = {
  centeredRow: {
    display: 'flex',
    alignItems: 'center',
    gap: designTokens.spacing.gap,
  },
  centeredColumn: {
    display: 'flex',
    flexDirection: 'column' as const,
    justifyContent: 'center',
    gap: designTokens.spacing.gap,
  },
  spaceBetween: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
} as const
