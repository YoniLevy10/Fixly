import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Fixly — Repairs & Professionals',
    short_name: 'Fixly',
    description: 'Find a home repair professional quickly',
    start_url: '/',
    display: 'standalone',
    background_color: '#fafafa',
    theme_color: '#123563',
    orientation: 'any',
    lang: 'he',
    dir: 'rtl',
    icons: [
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  }
}
