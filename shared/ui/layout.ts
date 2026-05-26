import { designTokens } from '@/config/design-tokens'

export const pageLayoutStyles = {
  padding: designTokens.spacing.page,
  paddingBottom: designTokens.spacing.bottomNavOffset,
  minHeight: '100vh',
  background: designTokens.colors.background,
}

export const stackStyles = {
  display: 'flex',
  flexDirection: 'column' as const,
  gap: designTokens.spacing.gap,
}
