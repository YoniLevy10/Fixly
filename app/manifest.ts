import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Fixly — תיקונים ואנשי מקצוע',
    short_name: 'Fixly',
    description: 'מצא איש מקצוע לתיקון הבית במהירות',
    start_url: '/',
    display: 'standalone',
    background_color: '#fafafa',
    theme_color: '#152a4a',
    orientation: 'any',
    lang: 'he',
    dir: 'rtl',
    icons: [
      {
        src: '/icons/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any',
      },
      {
        src: '/icons/icon.svg',
        sizes: '512x512',
        type: 'image/svg+xml',
        purpose: 'maskable',
      },
    ],
  }
}
