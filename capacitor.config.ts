import type { CapacitorConfig } from '@capacitor/cli'
import { APP_STORE_CONFIG } from './lib/mobile/app-store-config'

/**
 * Native shell loads the deployed Next.js app (Vercel).
 * Local device: CAPACITOR_SERVER_URL=http://YOUR_LAN_IP:3000 npm run cap:sync:ios
 */
const serverUrl = process.env.CAPACITOR_SERVER_URL?.trim()
const isDevServer = Boolean(serverUrl)
const productionUrl =
  process.env.NEXT_PUBLIC_APP_URL?.trim() || 'https://fixly.vercel.app'

const config: CapacitorConfig = {
  appId: APP_STORE_CONFIG.appId,
  appName: APP_STORE_CONFIG.appName,
  webDir: 'public',
  server: isDevServer
    ? {
        url: serverUrl,
        cleartext: serverUrl!.startsWith('http://'),
        androidScheme: 'https',
        allowNavigation: [...APP_STORE_CONFIG.allowedNavigationHosts],
      }
    : {
        url: productionUrl,
        cleartext: false,
        allowNavigation: [...APP_STORE_CONFIG.allowedNavigationHosts],
      },
  ios: {
    contentInset: 'automatic',
    scheme: 'fixly',
    preferredContentMode: 'mobile',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      launchAutoHide: true,
      backgroundColor: '#123563',
      showSpinner: false,
    },
    Keyboard: {
      resize: 'body',
      resizeOnFullScreen: true,
    },
  },
}

export default config
