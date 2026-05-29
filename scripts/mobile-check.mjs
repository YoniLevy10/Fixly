#!/usr/bin/env node
/**
 * Validates App Store / Capacitor foundation before opening Xcode.
 */
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
let ok = true

function pass(msg) {
  console.log(`✓ ${msg}`)
}
function fail(msg) {
  console.error(`✗ ${msg}`)
  ok = false
}

const appIcon = join(
  root,
  'ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png'
)
if (existsSync(appIcon)) {
  const stat = readFileSync(appIcon)
  if (stat.length > 5000) pass('iOS App Icon 1024 PNG')
  else fail('iOS App Icon looks too small — run npm run icons:generate')
} else {
  fail('Missing iOS App Icon — run npm run icons:generate')
}

const required = [
  'assets/brand/fixly-icon.svg',
  'capacitor.config.ts',
  'lib/mobile/app-store-config.ts',
  'ios/App/App/Info.plist',
  'ios/App/App/PrivacyInfo.xcprivacy',
  'app/privacy/page.tsx',
  'app/terms/page.tsx',
  'docs/MOBILE_APP_STORE.md',
  'app-store/CHECKLIST.md',
  'app-store/metadata.template.json',
]

for (const f of required) {
  if (existsSync(join(root, f))) pass(f)
  else fail(`Missing: ${f}`)
}

try {
  const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))
  const capDeps = ['@capacitor/core', '@capacitor/ios', '@capacitor/cli']
  for (const d of capDeps) {
    if (pkg.dependencies?.[d] || pkg.devDependencies?.[d]) pass(`dependency ${d}`)
    else fail(`Missing dependency ${d}`)
  }
} catch {
  fail('Could not read package.json')
}

if (!existsSync(join(root, 'resources/icon.png'))) {
  console.warn('⚠ resources/icon.png not found — add 1024×1024 PNG before App Store icons')
}

if (ok) {
  console.log('\nMobile foundation OK. Next: npm run cap:sync:ios && npm run cap:ios (on Mac)')
  process.exit(0)
} else {
  console.error('\nFix issues above before App Store build.')
  process.exit(1)
}
