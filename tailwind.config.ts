import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './shared/**/*.{ts,tsx}',
    './styles/**/*.{css}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--color-background)',
        surface: 'var(--color-surface)',
        primary: 'var(--color-primary)',
        text: 'var(--color-text)',
        muted: 'var(--color-muted)',
        subtle: 'var(--color-subtle)',
        border: 'var(--color-border)',
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
        full: 'var(--radius-full)',
      },
      boxShadow: {
        card: 'var(--shadow-card)',
        nav: 'var(--shadow-nav)',
        primary: 'var(--shadow-primary)',
      },
      spacing: {
        page: 'var(--spacing-page)',
        section: 'var(--spacing-section)',
        card: 'var(--spacing-card)',
        gap: 'var(--spacing-gap)',
        'bottom-nav': 'var(--spacing-bottom-nav-offset)',
      },
    },
  },
  plugins: [],
}

export default config
