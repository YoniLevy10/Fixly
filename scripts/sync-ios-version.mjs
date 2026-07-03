#!/usr/bin/env node
/**
 * Keeps iOS MARKETING_VERSION / build in sync with package.json + app-store-config.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))
const configSrc = readFileSync(
  join(root, 'lib/mobile/app-store-config.ts'),
  'utf8'
)

const version = pkg.version
const buildMatch = configSrc.match(/buildNumber:\s*['"]([^'"]+)['"]/)
const build = buildMatch?.[1] ?? '1'

const pbxPath = join(root, 'ios/App/App.xcodeproj/project.pbxproj')
let pbx = readFileSync(pbxPath, 'utf8')
pbx = pbx.replace(/MARKETING_VERSION = [^;]+;/g, `MARKETING_VERSION = ${version};`)
pbx = pbx.replace(
  /CURRENT_PROJECT_VERSION = [^;]+;/g,
  `CURRENT_PROJECT_VERSION = ${build};`
)
writeFileSync(pbxPath, pbx)

const nextConfig = configSrc.replace(
  /version:\s*['"][^'"]+['"]/,
  `version: '${version}'`
)
if (nextConfig !== configSrc) {
  writeFileSync(join(root, 'lib/mobile/app-store-config.ts'), nextConfig)
}

console.log(`✓ iOS version ${version} (${build}) synced from package.json`)
