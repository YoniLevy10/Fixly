import { designTokens } from '@/config/design-tokens'

export const interactionStyles = {
  pressable: {
    transition: 'all 0.2s ease',
    cursor: 'pointer',
  },
  primaryButton: {
    background: designTokens.colors.primary,
    color: '#FFFFFF',
    borderRadius: designTokens.radius.full,
    boxShadow: designTokens.shadow.primary,
  },
  surfaceButton: {
    background: designTokens.colors.surface,
    color: designTokens.colors.text,
    borderRadius: designTokens.radius.full,
    border: `1px solid ${designTokens.colors.border}`,
  },
} as const
