#!/usr/bin/env node
/**
 * Generates PNG app icons from assets/brand/fixly-icon.svg
 * - iOS App Store (1024)
 * - PWA / web
 * - Capacitor public copy
 */
import { existsSync, mkdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const sourceSvg = join(root, 'assets/brand/fixly-icon.svg')

if (!existsSync(sourceSvg)) {
  console.error('Missing', sourceSvg)
  process.exit(1)
}

const svg = readFileSync(sourceSvg)

const outputs = [
  {
    path: join(
      root,
      'ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png'
    ),
    size: 1024,
    label: 'iOS App Icon (1024)',
  },
  { path: join(root, 'public/icons/icon-512.png'), size: 512, label: 'PWA 512' },
  { path: join(root, 'public/icons/icon-192.png'), size: 192, label: 'PWA 192' },
  { path: join(root, 'public/icons/apple-touch-icon.png'), size: 180, label: 'Apple touch 180' },
  { path: join(root, 'ios/App/App/public/icons/icon-512.png'), size: 512, label: 'Capacitor web 512' },
  { path: join(root, 'resources/icon.png'), size: 1024, label: 'Capacitor resources 1024' },
]

async function writeSplash() {
  const splashDir = join(root, 'ios/App/App/Assets.xcassets/Splash.imageset')
  const logoSize = 520
  const logoPng = await sharp(svg).resize(logoSize, logoSize).png().toBuffer()
  const splash = await sharp({
    create: {
      width: 2732,
      height: 2732,
      channels: 4,
      background: { r: 18, g: 53, b: 99, alpha: 1 },
    },
  })
    .composite([{ input: logoPng, gravity: 'center' }])
    .png()
    .toBuffer()

  for (const name of [
    'splash-2732x2732.png',
    'splash-2732x2732-1.png',
    'splash-2732x2732-2.png',
  ]) {
    await sharp(splash).toFile(join(splashDir, name))
  }
  console.log('✓ iOS Splash (2732, branded)')
}

mkdirSync(join(root, 'public/icons'), { recursive: true })
mkdirSync(join(root, 'ios/App/App/public/icons'), { recursive: true })

for (const { path, size, label } of outputs) {
  mkdirSync(dirname(path), { recursive: true })
  await sharp(svg).resize(size, size).png().toBuffer().then((buf) =>
    sharp(buf).toFile(path)
  )
  console.log(`✓ ${label} → ${path.replace(root, '.')}`)
}

await writeSplash()

console.log('\nDone. Run: npm run cap:sync:ios')
