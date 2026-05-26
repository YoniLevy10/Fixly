import { designTokens } from '@/config/design-tokens'

export const typography = {
  display: {
    fontSize: '34px',
    lineHeight: 1.1,
    fontWeight: 800,
    color: designTokens.colors.text,
  },
  heading: {
    fontSize: '20px',
    lineHeight: 1.3,
    fontWeight: 700,
    color: designTokens.colors.text,
  },
  body: {
    fontSize: '16px',
    lineHeight: 1.5,
    fontWeight: 500,
    color: designTokens.colors.text,
  },
  muted: {
    fontSize: '14px',
    lineHeight: 1.4,
    fontWeight: 500,
    color: designTokens.colors.muted,
  },
} as const
