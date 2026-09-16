const fs = require('fs')
const path = require('path')

try {
  const pkgDir = path.dirname(require.resolve('react-native-webrtc/package.json'))
  const source = path.join(pkgDir, 'src', 'vendor', 'event-target-shim', 'index.d.ts')
  const targetDir = path.join(pkgDir, 'lib', 'typescript', 'vendor', 'event-target-shim')
  const target = path.join(targetDir, 'index.d.ts')

  if (!fs.existsSync(source)) {
    process.exit(0)
  }

  const wanted = fs.readFileSync(source, 'utf8')
  if (fs.existsSync(target) && fs.readFileSync(target, 'utf8') === wanted) {
    process.exit(0)
  }

  fs.mkdirSync(targetDir, { recursive: true })
  fs.writeFileSync(target, wanted)
  console.log('[patch-webrtc-types] restored lib/typescript/vendor/event-target-shim/index.d.ts')
} catch (err) {
  console.warn('[patch-webrtc-types] skipped:', err && err.message ? err.message : err)
}
