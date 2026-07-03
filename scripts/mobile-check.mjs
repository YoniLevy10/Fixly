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
function warn(msg) {
  console.warn(`⚠ ${msg}`)
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
  'resources/icon.png',
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

  const pbx = readFileSync(
    join(root, 'ios/App/App.xcodeproj/project.pbxproj'),
    'utf8'
  )
  const config = readFileSync(
    join(root, 'lib/mobile/app-store-config.ts'),
    'utf8'
  )
  const plist = readFileSync(join(root, 'ios/App/App/Info.plist'), 'utf8')
  const privacy = readFileSync(
    join(root, 'ios/App/App/PrivacyInfo.xcprivacy'),
    'utf8'
  )

  if (pbx.includes(`MARKETING_VERSION = ${pkg.version};`)) {
    pass(`iOS MARKETING_VERSION matches package.json (${pkg.version})`)
  } else {
    fail(
      `iOS MARKETING_VERSION mismatch — run npm run mobile:sync-version (expected ${pkg.version})`
    )
  }

  const buildMatch = config.match(/buildNumber:\s*['"]([^'"]+)['"]/)
  const build = buildMatch?.[1]
  if (build && pbx.includes(`CURRENT_PROJECT_VERSION = ${build};`)) {
    pass(`iOS build number ${build}`)
  } else {
    fail('iOS CURRENT_PROJECT_VERSION mismatch — run npm run mobile:sync-version')
  }

  if (pbx.includes('PRODUCT_BUNDLE_IDENTIFIER = com.fixly.app;')) {
    pass('bundle id com.fixly.app')
  } else {
    fail('Unexpected PRODUCT_BUNDLE_IDENTIFIER in Xcode project')
  }

  const plistKeys = [
    'NSCameraUsageDescription',
    'NSPhotoLibraryUsageDescription',
    'NSLocationWhenInUseUsageDescription',
    'ITSAppUsesNonExemptEncryption',
    'CFBundleURLTypes',
  ]
  for (const key of plistKeys) {
    if (plist.includes(key)) pass(`Info.plist ${key}`)
    else fail(`Info.plist missing ${key}`)
  }

  if (plist.includes('<string>fixly</string>')) {
    pass('deep link scheme fixly://')
  } else {
    fail('Info.plist missing fixly URL scheme')
  }

  if (privacy.includes('NSPrivacyCollectedDataTypePreciseLocation')) {
    pass('Privacy manifest declares location')
  } else {
    fail('PrivacyInfo.xcprivacy missing precise location declaration')
  }
} catch {
  fail('Could not read package.json or iOS project files')
}

if (ok) {
  console.log('\nMobile foundation OK. Next: npm run cap:sync:ios && npm run cap:ios (on Mac)')
  process.exit(0)
} else {
  console.error('\nFix issues above before App Store build.')
  process.exit(1)
}
